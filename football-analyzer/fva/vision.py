"""Bildanalys med OpenCV:

 * Planmask (grön färg) + rörelseenergi per tidsblock -> aktivitetskurva.
 * Score-tavla ("score bug"): hittar den statiga överläggsrutan i bildens
   övre del och detekterar sällsynta, beständiga förändringar (= målväxling,
   kort m.m.) utan OCR.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import cv2
import numpy as np

from .config import Config


@dataclass
class BugFlip:
    t: float
    diff: float          # färgskillnad 0-255
    color_hint: str      # "", "red", "yellow" (kortindikator)


@dataclass
class VisionResult:
    times: np.ndarray = field(default_factory=lambda: np.array([]))
    motion: np.ndarray = field(default_factory=lambda: np.array([]))
    pitch_ratio: np.ndarray = field(default_factory=lambda: np.array([]))
    bug_box: tuple | None = None          # (x, y, w, h) i full upplösning
    bug_flips: list = field(default_factory=list)
    frames_seen: int = 0


def _green_mask(hsv):
    return cv2.inRange(hsv, (35, 50, 40), (95, 255, 255)) > 0


def analyze_video(video_path, cfg: Config, progress=None,
                  max_seconds: float = 0.0) -> VisionResult:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Kunde inte öppna videon: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    step = max(1, int(round(fps / cfg.sample_fps)))

    scale = cfg.resize_w / max(1, W)
    sh = max(1, int(H * scale))

    res = VisionResult()
    times, motion, pratio = [], [], []

    cell = cfg.bug_cell
    gw = int(cfg.resize_w * cfg.bug_strip_w) // cell
    gh = int(sh * cfg.bug_strip_h) // cell
    prev_gray = None       # föregående samplade helbild (grå)
    cell_changes = np.zeros((gh, gw), dtype=np.float64)
    col_edge = np.zeros(gw * cell, dtype=np.float64)  # kantenergi per kolumn
    cell_seen = 0

    n_seen = 0
    frame_i = 0
    while True:
        if not cap.grab():
            break
        t = frame_i / fps
        if max_seconds and t > max_seconds:
            break
        if frame_i % step == 0:
            ok, frame = cap.retrieve()
            if not ok:
                break
            small = cv2.resize(frame, (cfg.resize_w, sh),
                               interpolation=cv2.INTER_AREA)
            hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
            gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY).astype(np.float32)
            mask = _green_mask(hsv)
            pr = float(mask.mean()) / 255.0

            if prev_gray is not None:
                diff = cv2.absdiff(gray, prev_gray)
                region = mask if pr > 0.10 else None
                m = float(diff[region].mean()) if region is not None else float(diff.mean())
            else:
                m = 0.0
            prev_gray = gray

            times.append(t)
            motion.append(min(255.0, m * 4.0))
            pratio.append(pr)

            # ---- tavla-cellförändringar (jämför strip med föregående sample) ----
            if prev_gray is not None and gw > 2 and gh > 1:
                strip = gray[: gh * cell, : gw * cell]
                prev_strip = prev_gray[: gh * cell, : gw * cell]
                d = cv2.absdiff(strip, prev_strip)
                changed = d > 26
                ch = changed.reshape(gh, cell, gw, cell).mean(axis=(1, 3)) > 0.28
                cell_changes += ch
                # kantenergi per kolumn (text = många kanter)
                sob = cv2.Sobel(strip, cv2.CV_32F, 1, 1, ksize=3)
                col_edge += np.abs(sob).mean(axis=0)
                cell_seen += 1

            n_seen += 1
            res.frames_seen = n_seen
            if progress and n_seen % 60 == 0:
                frac = frame_i / total if total else 0
                progress(frac, f"Analyserar bildrutor… {t:.0f}s")

        frame_i += 1
    cap.release()

    res.times = np.array(times)
    res.motion = np.array(motion)
    res.pitch_ratio = np.array(pratio)

    # ---- välj tavleruta utifrån statiska celler ----
    if cell_seen >= 30 and gw > 2 and gh > 1:
        rate = cell_changes / max(1, cell_seen)
        static = rate < cfg.bug_static_rate
        n, labels, stats, _ = cv2.connectedComponentsWithStats(
            static.astype(np.uint8), connectivity=4)
        best = None
        for lbl in range(1, n):
            x, y, w, h, area = stats[lbl]
            if area < 3:
                continue
            bw, bh = w * cell, h * cell
            if bh < 14 or bw < 36:
                continue
            if best is None or area > best[0]:
                best = (area, x * cell, y * cell, bw, bh)
        if best:
            _, bx, by, bw, bh = best
            bh = min(bh, 90)
            if bw > cfg.bug_max_width:
                # Översized statisk ruta (t.ex. helt statisk topp i en enkel
                # demo): hitta tätt fönster med hög kantdensitet (= text).
                target_w = max(60, min(cfg.bug_max_width,
                                       int(cfg.resize_w * 0.24)))
                win_e = np.convolve(col_edge, np.ones(target_w), "valid")
                if len(win_e):
                    bx = int(np.argmax(win_e))
                bw = target_w
            else:
                bw = min(bw, cfg.bug_max_width)
            res.bug_box = (int(bx), int(by), int(bw), int(bh))
            res.bug_flips = _detect_flips(video_path, res.bug_box, cfg, fps,
                                          progress=progress)

    return res


def _detect_flips(video_path, box, cfg: Config, fps: float, progress=None):
    """Pass 2: läs endast tavlerutan och hitta beständiga förändringar.

    Metod: jämför medelbilden av rutan från fönstret före mot fönstret efter.
    En ändring av målsiffran visas även om bara några hundra pixlar ändrats,
    medan rörlig bakgrund (reklam, publika, repliker) filtreras bort dels av
    kravet på låg rörelse (std) i båda fönstren, dels av att bakgrunden
    medelatas bort.
    """
    x, y, w, h = box
    cap = cv2.VideoCapture(str(video_path))
    fps = cap.get(cv2.CAP_PROP_FPS) or fps
    step = max(1, int(round(fps / cfg.sample_fps)))

    RW, RH = 128, 32      # analyserar rutan nedskalad
    ts, imgs, mots = [], [], []
    prev_g = None
    frame_i = 0
    while True:
        if not cap.grab():
            break
        if frame_i % step == 0:
            ok, frame = cap.retrieve()
            if not ok:
                break
            roi = frame[y: y + h, x: x + w]
            if roi.size == 0:
                frame_i += 1
                continue
            g = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            g = cv2.resize(g, (RW, RH), interpolation=cv2.INTER_AREA)
            mot = float(cv2.absdiff(g, prev_g).mean()) if prev_g is not None else 0.0
            prev_g = g
            ts.append(frame_i / fps)
            imgs.append(g)
            mots.append(mot)
            if progress and len(ts) % 400 == 0:
                progress(None, f"Söker tavelförändringar… {ts[-1]:.0f}s")
        frame_i += 1
    cap.release()

    n = len(ts)
    if n < 20:
        return []
    mots = np.array(mots)

    half = max(2, int(cfg.bug_window_s / (step / fps)))
    guard = max(1, half // 5)

    flips = []
    i = half
    while i < n - half:
        A = np.mean(np.stack(imgs[i - half: i - guard]), axis=0)
        B = np.mean(np.stack(imgs[i + guard: i + half]), axis=0)
        static = (mots[i - half: i - guard].mean() <= cfg.bug_static_motion and
                  mots[i + guard: i + half].mean() <= cfg.bug_static_motion)
        if static:
            dimg = np.abs(A - B)
            d = float(dimg.mean())
            frac = float((dimg > 30).mean())
            if d >= cfg.bug_flip_diff and frac >= cfg.bug_flip_frac:
                flips.append({"t": float(ts[i]), "diff": d})
                i += half           # hoppa förbi samma övergång
                continue
        i += 1

    # slå ihop flippers närmare än 4 s
    merged: list[BugFlip] = []
    for f in flips:
        if merged and f["t"] - merged[-1].t < 4.0:
            if f["diff"] > merged[-1].diff:
                merged[-1].diff = f["diff"]
            continue
        merged.append(BugFlip(f["t"], f["diff"], ""))

    return _classify_flip_colors(video_path, box, merged, cfg, fps)


def _classify_flip_colors(video_path, box, flips, cfg: Config, fps):
    """Kolla om rutan efter flippen innehåller mycket rött/gult (kort)."""
    x, y, w, h = box
    cap = cv2.VideoCapture(str(video_path))
    fps = cap.get(cv2.CAP_PROP_FPS) or fps
    for f in flips:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int((f.t + 1.5) * fps))
        ok, frame = cap.read()
        if not ok:
            continue
        roi = frame[y: y + h, x: x + w]
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        red = (cv2.inRange(hsv, (0, 90, 90), (8, 255, 255)) |
               cv2.inRange(hsv, (170, 90, 90), (180, 255, 255))).mean() / 255
        yellow = cv2.inRange(hsv, (20, 90, 90), (35, 255, 255)).mean() / 255
        if red > 0.06:
            f.color_hint = "red"
        elif yellow > 0.06:
            f.color_hint = "yellow"
    cap.release()
    return flips
