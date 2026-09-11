"""Hjälpfunktioner runt ffmpeg (binären kommer från imageio-ffmpeg)."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path


def ffmpeg_exe() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "Hittar ingen ffmpeg. Installera med: pip install imageio-ffmpeg"
        ) from e


def probe(path: str | Path) -> dict:
    """Returnerar {duration, width, height, fps, has_audio}."""
    cmd = [ffmpeg_exe(), "-hide_banner", "-nostats", "-i", str(path),
           "-f", "null", "-"]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    err = proc.stderr

    info = {"duration": 0.0, "width": 0, "height": 0, "fps": 0.0,
            "has_audio": False}
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.?\d*)", err)
    if m:
        info["duration"] = (int(m.group(1)) * 3600 + int(m.group(2)) * 60
                            + float(m.group(3)))
    v = re.search(r"Video: .*?, (\d+)x(\d+)", err)
    if v:
        info["width"], info["height"] = int(v.group(1)), int(v.group(2))
    f = re.search(r"([\d.]+) fps", err)
    if f:
        info["fps"] = float(f.group(1))
    info["has_audio"] = "Audio:" in err
    return info


def extract_audio_wav(video: str | Path, out_wav: str | Path,
                      sr: int = 16000) -> Path:
    """Extraherar mono 16-bit PCM-ljud för analys."""
    out_wav = Path(out_wav)
    cmd = [ffmpeg_exe(), "-y", "-hide_banner", "-nostats", "-loglevel",
           "error", "-i", str(video), "-vn", "-ac", "1", "-ar", str(sr),
           "-c:a", "pcm_s16le", str(out_wav)]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0 or not out_wav.exists():
        raise RuntimeError(f"Kunde inte extrahera ljud: {proc.stderr[-400:]}")
    return out_wav


def read_wav(path: str | Path):
    """Läser 16-bit PCM wav -> (samples float32 [-1..1], sr)."""
    import wave
    import numpy as np

    with wave.open(str(path), "rb") as w:
        sr = w.getframerate()
        n = w.getnframes()
        raw = w.readframes(n)
        assert w.getsampwidth() == 2, "förväntade 16-bit wav"
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    return x, sr


# --------------------------------------------------------------------------
# Syntetisk demomatch (kända händelser – för test och demo)
# --------------------------------------------------------------------------
def _font(size: int):
    from PIL import ImageFont
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        try:
            return ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size)
        except Exception:
            return ImageFont.load_default()


def _bug_png(path: Path, text: str, card: str | None = None):
    from PIL import Image, ImageDraw
    img = Image.new("RGBA", (300, 60), (8, 10, 18, 255))
    d = ImageDraw.Draw(img)
    d.text((14, 14), text, fill=(255, 255, 255, 255), font=_font(28))
    if card == "yellow":
        d.rectangle((12, 8, 44, 52), fill=(250, 220, 40, 255))
        d.text((54, 14), text, fill=(255, 255, 255, 255), font=_font(28))
    img.save(path)


def _ball_png(path: Path):
    from PIL import Image, ImageDraw
    img = Image.new("RGBA", (26, 26), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((2, 2, 24, 24), fill=(255, 255, 255, 255))
    img.save(path)


def make_sample_video(out_path: str | Path, duration: float = 80.0) -> Path:
    """Skapar en syntetisk demomatch med kända händelser.

    Ground truth: pip t=6 · MÅL t=20 (tavla 0-0 -> 1-0, rush ~10 s) ·
    pip t=32 · MÅL t=52 (1-0 -> 2-0, rush ~10 s) · fulltidspip t=72.
    """
    out_path = Path(out_path)
    ff = ffmpeg_exe()
    d = float(duration)

    tmp = out_path.parent
    tmp.mkdir(parents=True, exist_ok=True)
    bug0, bug1, bugy, bug2, ball = (tmp / "bug0.png", tmp / "bug1.png",
                                    tmp / "bugy.png", tmp / "bug2.png",
                                    tmp / "ball.png")
    _bug_png(bug0, "IFK 0 - 0 GBG")
    _bug_png(bug1, "IFK 1 - 0 GBG")
    _bug_png(bugy, "IFK 1 - 0 GBG", card="yellow")
    _bug_png(bug2, "IFK 2 - 0 GBG")
    _ball_png(ball)

    # Ljud: brunt brus (publik) + volymkuvar för målrushar + pips.
    roar1 = "0.05+gte(t\\,20)*2.5*exp(-max(t-20\\,0)/6)"
    roar2 = "0.05+gte(t\\,52)*2.5*exp(-max(t-52\\,0)/6)"
    crowd = (f"anoisesrc=color=brown:sample_rate=44100:amplitude=1:duration={d},"
             f"volume='max({roar1}\\,{roar2})':eval=frame")
    pips = [
        f"sine=frequency=2400:duration=0.7:sample_rate=44100,adelay=6000,apad=whole_dur={int(d)+1}",
        f"sine=frequency=2400:duration=0.5:sample_rate=44100,adelay=32000,apad=whole_dur={int(d)+1}",
        f"sine=frequency=2400:duration=0.9:sample_rate=44100,adelay=72000,apad=whole_dur={int(d)+1}",
    ]

    lines = ",".join([
        "drawbox=x=60:y=90:w=840:h=400:color=white@0.8:width=3",
        "drawbox=x=480:y=90:w=420:h=400:color=white@0.8:width=3",
        "drawbox=x=60:y=290:w=840:h=2:color=white@0.8:width=2",
        "drawbox=x=60:y=200:w=90:h=180:color=white@0.8:width=3",
        "drawbox=x=810:y=200:w=90:h=180:color=white@0.8:width=3",
    ])

    fc = (
        f"color=c=0x1d7a34:s=960x540:rate=25:d={d},{lines}[pitch];"
        f"[pitch][4:v]overlay=16:14:enable='between(t,0,20)'[a];"
        f"[a][5:v]overlay=16:14:enable='between(t,20,35)'[b];"
        f"[b][6:v]overlay=16:14:enable='between(t,35,52)'[c];"
        f"[c][7:v]overlay=16:14:enable='gte(t,52)'[e];"
        f"[e][8:v]overlay=x='150+mod(t*90\\,700)':y='380+120*sin(t*1.7)'[vout];"
        f"[0:a][1:a][2:a][3:a]amix=inputs=4:duration=first:normalize=0[aout]"
    )

    cmd = [
        ff, "-y", "-hide_banner", "-nostats", "-loglevel", "error",
        "-f", "lavfi", "-i", crowd,
        "-f", "lavfi", "-i", pips[0],
        "-f", "lavfi", "-i", pips[1],
        "-f", "lavfi", "-i", pips[2],
        "-i", str(bug0), "-i", str(bug1), "-i", str(bugy), "-i", str(bug2),
        "-i", str(ball),
        "-filter_complex", fc,
        "-map", "[vout]", "-map", "[aout]",
        "-t", str(d), "-c:v", "libx264", "-preset", "veryfast", "-crf", "28",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k",
        str(out_path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    for p in (bug0, bug1, bugy, bug2, ball):
        p.unlink(missing_ok=True)
    if proc.returncode != 0 or not out_path.exists():
        raise RuntimeError(f"Kunde inte skapa demovideo: {proc.stderr[-500:]}")
    return out_path
