"""Slår ihop ljud- och bildsignaler till fotbollshändelser."""
from __future__ import annotations

import numpy as np

from .config import Config
from .audio import AudioResult
from .vision import VisionResult

# Katalogen av händelsetyper (används även av gränssnittet).
EVENT_TYPES = [
    ("goal",     "Mål",              "#22c55e"),
    ("assist",   "Assist",           "#4ade80"),
    ("corner",   "Hörna",            "#38bdf8"),
    ("tackle",   "Tackling",         "#f97316"),
    ("chance",   "Målchans",         "#eab308"),
    ("shot",     "Avslut",           "#a3e635"),
    ("save",     "Räddning",         "#34d399"),
    ("foul",     "Foul/Frispark",    "#fb7185"),
    ("offside",  "Offside",          "#c084fc"),
    ("yellow",   "Gult kort",        "#facc15"),
    ("red",      "Rött kort",        "#ef4444"),
    ("whistle",  "Domarpip",         "#94a3b8"),
    ("board",    "Tavlaändring",     "#64748b"),
    ("kickoff",  "Avspark",          "#60a5fa"),
    ("halftime", "Halvtid",          "#60a5fa"),
    ("fulltime", "Fulltid",          "#60a5fa"),
    ("other",    "Övrigt",           "#cbd5e1"),
]
TYPE_LABELS = {k: lab for k, lab, _ in EVENT_TYPES}
TYPE_COLORS = {k: c for k, _, c in EVENT_TYPES}


def _ev(eid, t, type_, label, conf, sources, detail=""):
    return {
        "id": eid, "t": round(float(t), 2), "type": type_, "label": label,
        "conf": round(float(conf), 2), "sources": sources,
        "detail": detail, "auto": True, "user_type": None, "note": "",
    }


def build_events(audio: AudioResult, vision: VisionResult, cfg: Config,
                 duration: float):
    events = []
    eid = 1

    flips = list(vision.bug_flips or [])
    peaks = list(audio.peaks or [])

    def flip_near(t, win):
        best = None
        for f in flips:
            if abs(f.t - t) <= win:
                if best is None or abs(f.t - t) < abs(best.t - t):
                    best = f
        return best

    used_flips = set()

    # --- 1. Publikrushar -> mål / målchans ---
    for p in sorted(peaks, key=lambda x: -x["exc_db"]):
        f = flip_near(p["t"], cfg.bug_roar_window_s)
        if p["goal_like"]:
            if f is not None:
                used_flips.add(id(f))
                events.append(_ev(
                    eid, f.t, "goal",
                    "Mål (tavla + publikrush)", 0.92,
                    ["audio", "board"],
                    f"Tavlebyte vid {f.t:.0f}s och publikrush på {p['exc_db']:.0f} dB "
                    f"med {p['decay_s']:.0f}s avklingning."))
                eid += 1
            else:
                events.append(_ev(
                    eid, p["t"], "goal",
                    "Troligt mål (kraftig publikrush)", 0.62,
                    ["audio"],
                    f"Rush {p['exc_db']:.0f} dB över baslinjen, attack "
                    f"{p['attack_s']:.1f}s, avklingning {p['decay_s']:.0f}s. "
                    "Ingen tavle hittad – kan även vara stor målchans."))
                eid += 1
        elif p["exc_db"] >= cfg.goal_db:
            events.append(_ev(
                eid, p["t"], "chance",
                "Stark publikreaktion (målchans/räddning)", cfg.chance_conf,
                ["audio"],
                f"Rush {p['exc_db']:.0f} dB, avklingning {p['decay_s']:.0f}s."))
            eid += 1
        elif p["exc_db"] >= cfg.roar_thresh_db + 3:
            events.append(_ev(
                eid, p["t"], "other", "Publikreaktion", 0.22,
                ["audio"],
                f"Mindre rush {p['exc_db']:.0f} dB."))
            eid += 1

    # --- 2. Tavlebyten utan mål-rush -> kort eller annat ---
    for f in flips:
        if id(f) in used_flips:
            continue
        if f.color_hint == "red":
            events.append(_ev(eid, f.t, "red",
                              "Rött kort? (tavla + rött)", 0.5,
                              ["board"], "Tavlebyte med rött innehåll."))
        elif f.color_hint == "yellow":
            events.append(_ev(eid, f.t, "yellow",
                              "Gult kort? (tavla + gult)", 0.45,
                              ["board"], "Tavlebyte med gult innehåll."))
        else:
            events.append(_ev(eid, f.t, "board",
                              "Tavlaändring (mål/kort?)", cfg.board_conf,
                              ["board"], "Statisk tävlruta ändrades beständigt."))
        eid += 1

    # --- 3. Domarpipar ---
    for w in audio.whistles or []:
        events.append(_ev(eid, w["t"], "whistle",
                          "Domarpip", cfg.whistle_conf, ["whistle"],
                          f"Pip ~{w['dur_s']:.1f}s, tonspetsighet "
                          f"{w['peakness_db']:.0f} dB över sidband."))
        eid += 1

    events.sort(key=lambda e: e["t"])

    # --- 4. Halvleker (endast långa videor) ---
    halves = []
    if duration >= cfg.half_min_duration_s and len(vision.motion) > 50:
        mot = vision.motion
        thr = np.percentile(mot, 25)
        quiet = mot < thr
        # längsta sammanhängande tysta sträcka nära mitten
        best = None
        i = 0
        n = len(quiet)
        while i < n:
            if quiet[i]:
                j = i
                while j + 1 < n and quiet[j + 1]:
                    j += 1
                dur = (vision.times[j] - vision.times[i])
                mid = (vision.times[i] + vision.times[j]) / 2
                if dur >= cfg.half_min_break_s and 0.30 * duration < mid < 0.70 * duration:
                    if best is None or dur > best[0]:
                        best = (dur, vision.times[i], vision.times[j])
                i = j + 1
            else:
                i += 1
        halves = [
            {"name": "Första halvlek", "t": 0.0},
            {"name": "Andra halvlek", "t": round(best[2], 1)} if best else None,
        ]
        halves = [h for h in halves if h is not None]
        if best:
            ht = round((best[1] + best[2]) / 2, 1)
            events.append(_ev(eid, ht, "halftime", "Halvtid", 0.7,
                              ["motion"], "Lång lågaktivitetsperiod."))
            eid += 1
        events.append(_ev(eid, max(0.0, duration - 2), "fulltime",
                          "Fulltid", 0.6, ["time"], "Slutet av videon."))
        eid += 1
        events.sort(key=lambda e: e["t"])

    return events, halves


def decimate(t, y, max_points):
    """Minskar antal punkter men behåller toppar (max per bucket)."""
    if len(t) <= max_points:
        return t, y
    n = len(t)
    stride = int(np.ceil(n / max_points))
    keep_t, keep_y = [], []
    for s in range(0, n, stride):
        chunk = y[s: s + stride]
        keep_y.append(float(np.max(chunk)))
        keep_t.append(float(t[s]))
    return np.array(keep_t), np.array(keep_y)
