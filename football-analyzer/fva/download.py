"""Nedladdning av YouTube-videor via yt-dlp."""
from __future__ import annotations

from pathlib import Path


def download_youtube(url: str, out_dir: str | Path, progress=None) -> dict:
    """Laddar ner video (max 720p, mp4-först). Returnerar {path, title, id}."""
    import yt_dlp

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    state = {"pct": 0.0, "msg": ""}

    def hook(d):
        if d.get("status") == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            done = d.get("downloaded_bytes") or 0
            pct = done / total * 100 if total else 0
            speed = d.get("_speed_str", "").strip() or ""
            if progress:
                progress(pct / 100 * 0.4, f"Laddar ner video… {pct:.0f}% {speed}")
        elif d.get("status") == "finished":
            if progress:
                progress(0.42, "Nedladdning klar, förbereder…")

    opts = {
        "format": "bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720][ext=mp4]/bv*[height<=720]+ba/b[height<=720]/b",
        "outtmpl": str(out_dir / "video.%(ext)s"),
        "merge_output_format": "mp4",
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "retries": 3,
        "socket_timeout": 20,
        "progress_hooks": [hook],
        "concurrent_fragment_downloads": 4,
    }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
    except Exception as e:
        raise RuntimeError(
            "Kunde inte ladda ner YouTube-videon. Vanliga orsaker: servens "
            "IP är blockerad av YouTube, videon är privat/ålders begränsad, "
            "eller nätverket saknar åtkomst. Prova att ladda upp en fil i "
            "stället eller köra programmet på din egen dator.\n\n"
            f"Tekniskt fel: {e}"
        ) from e

    path = None
    if info.get("requested_downloads"):
        path = info["requested_downloads"][0].get("filepath")
    if not path:
        # fallback: hitta video.* i out_dir
        for p in sorted(out_dir.glob("video.*")):
            if p.suffix.lower() in (".mp4", ".mkv", ".webm", ".mov", ".m4v"):
                path = str(p)
                break
    if not path:
        raise RuntimeError("Nedladdningen klarade sig inte – ingen fil hittades.")

    return {
        "path": path,
        "title": info.get("title") or url,
        "id": info.get("id") or "",
        "webpage_url": info.get("webpage_url") or url,
        "duration": float(info.get("duration") or 0),
    }
