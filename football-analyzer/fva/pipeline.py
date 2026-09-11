"""Pipeline: källa -> ljud + bild -> händelser -> rapport (JSON/HTML)."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from .config import Config
from . import fftools, audio as audio_mod, vision as vision_mod, fusion
from .report import write_report


def analyze_source(source: dict, job_dir: str | Path, cfg: Config | None = None,
                   progress=None, max_seconds: float = 0.0) -> dict:
    """Kör hela analysen. source: {kind: youtube|file, url|path, ...}.

    Returnerar rapportdata (samma som report.json).
    """
    cfg = cfg or Config()
    job_dir = Path(job_dir)
    work = job_dir / "work"
    work.mkdir(parents=True, exist_ok=True)

    def prog(pct, msg):
        if progress:
            progress(pct, msg)

    video_path = None
    src_meta = {"kind": source["kind"]}

    # 1. Skaffa videon
    if source["kind"] == "youtube":
        prog(0.02, "Startar nedladdning från YouTube…")
        info = _download(source["url"], work, prog)
        video_path = info["path"]
        src_meta.update({"url": info["webpage_url"], "title": info["title"],
                         "video_id": info["id"]})
    else:
        video_path = source["path"]
        src_meta["title"] = Path(video_path).stem
        src_meta["filename"] = Path(video_path).name
        prog(0.05, f"Använder lokal fil: {Path(video_path).name}")

    # 2. Undersök videon
    prog(0.46, "Läser videoinformation…")
    vinfo = fftools.probe(video_path)
    if vinfo["duration"] <= 0:
        raise RuntimeError("Kunde inte läsa videolängd – filen kan vara skadad.")
    if not vinfo["has_audio"]:
        raise RuntimeError("Videon har inget ljudspår – ljudanalysen behöver det.")

    # 3. Ljudanalys
    prog(0.50, "Extraherar ljud…")
    wav = work / "audio.wav"
    fftools.extract_audio_wav(video_path, wav, sr=cfg.audio_sr)
    prog(0.55, "Analyserar ljud (publikrushar, pip)…")
    ares = audio_mod.analyze(wav, cfg)

    # 4. Bildanalys
    prog(0.62, "Analyserar bildrutor (plan, rörelse, tavla)…")
    vres = vision_mod.analyze_video(
        video_path, cfg,
        progress=lambda frac, msg: prog(0.62 + 0.30 * (frac or 0), msg),
        max_seconds=max_seconds)

    # 5. Fusion
    prog(0.94, "Kombinerar signaler till händelser…")
    events, halves = fusion.build_events(ares, vres, cfg, vinfo["duration"])

    # 6. Kurvor för rapporten
    t_db, db = fusion.decimate(ares.times, ares.db, cfg.curve_points)
    _, base = fusion.decimate(ares.times, ares.baseline, cfg.curve_points)
    t_m, motion = fusion.decimate(vres.times, vres.motion, cfg.curve_points)

    report = {
        "version": 1,
        "created": datetime.now(timezone.utc).isoformat(),
        "source": src_meta,
        "video": {
            "duration": round(vinfo["duration"], 2),
            "width": vinfo["width"], "height": vinfo["height"],
            "fps": vinfo["fps"],
        },
        "settings": {
            "sample_fps": cfg.sample_fps,
            "hop_s": cfg.hop,
            "note": "Automatisk detektion: mål (publikrush + tavla), "
                    "målchanser, domarpip, kortkandidater, halvtid. "
                    "Assist/hörna/tackling märker du upp manuellt i gränssnittet.",
        },
        "detectors": {
            "audio": True,
            "board_found": vres.bug_box is not None,
            "bug_box": list(vres.bug_box) if vres.bug_box else None,
            "n_audio_peaks": len(ares.peaks),
            "n_whistles": len(ares.whistles),
            "n_board_flips": len(vres.bug_flips),
        },
        "halves": halves,
        "events": events,
        "curves": {
            "t_db": [round(x, 2) for x in t_db],
            "db": [round(float(x), 1) for x in db],
            "baseline": [round(float(x), 1) for x in base],
            "t_motion": [round(x, 2) for x in t_m],
            "motion": [round(float(x), 1) for x in motion],
        },
        "video_path": str(Path(video_path).resolve()),
    }

    prog(0.97, "Skriver rapport…")
    (job_dir / "report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    write_report(job_dir / "report.html", report)

    # liten thumbnail som läses in i rapporten
    try:
        _thumbnail(video_path, job_dir / "thumb.jpg", vinfo)
    except Exception:
        pass

    prog(1.0, "Klar!")
    return report


def _download(url, work: Path, prog):
    from .download import download_youtube
    last = {"p": 0.0}

    def hook(pct, msg):
        last["p"] = pct
        prog(0.02 + pct * 0.42, msg)

    return download_youtube(url, work, progress=hook)


def _thumbnail(video_path, out: Path, vinfo):
    import cv2
    cap = cv2.VideoCapture(str(video_path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    cap.set(cv2.CAP_PROP_POS_FRAMES, min(int(fps * 3),
                                         int(vinfo["duration"] * fps) - 1))
    ok, frame = cap.read()
    cap.release()
    if ok:
        import cv2 as _c
        _c.imwrite(str(out), frame, [_c.IMWRITE_JPEG_QUALITY, 70])
