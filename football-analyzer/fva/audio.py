"""Ljudanalys: hittar publikrushar (mål/målchans) och domarpip.

Metod:
 1. RMS-nivå per 0,5 s -> dB-skala.
 2. Rullande median (ca 1 minut) = "basläget" i arenan.
 3. Sammanhängande segment över tröskeln = EN händelse vardera (peaknivå,
    attack- och avklingningstid beräknas). Snabb attack + hög topp + långsam
    avklingning => målliknande rush.
 4. Domarpip: energi i 2,2-3,3 kHz jämfört med sidbanden 1,3-1,9 kHz och
    3,8-4,6 kHz ("tonspetsighet"). Pip är smalbandigt; brus och rush är inte.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy import ndimage
from scipy.signal import butter, sosfiltfilt

from .config import Config
from . import fftools


@dataclass
class AudioResult:
    times: np.ndarray        # tid (s) per block
    db: np.ndarray           # dB-nivå per block
    baseline: np.ndarray     # baslinje-dB
    exc: np.ndarray          # dB över baslinje
    peaks: list[dict]        # publiktoppar
    whistles: list[dict]     # domarpipar


def _segments(exc, thr, hop, merge_gap_s: float, min_len_s: float):
    over = exc > thr
    segs = []
    i = 0
    n = len(over)
    while i < n:
        if over[i]:
            j = i
            while j + 1 < n and over[j + 1]:
                j += 1
            segs.append([i, j])
            i = j + 1
        else:
            i += 1
    if not segs:
        return []
    gap = max(1, int(merge_gap_s / hop))
    merged = [segs[0]]
    for s in segs[1:]:
        if s[0] - merged[-1][1] <= gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [s for s in merged if (s[1] - s[0] + 1) * hop >= min_len_s]


def _band_db(x, hop, lo, hi, sr):
    sos = butter(4, [lo, hi], btype="band", fs=sr, output="sos")
    xf = sosfiltfilt(sos, x)
    n_blocks = len(x) // hop
    rms = np.sqrt((xf[: n_blocks * hop].reshape(n_blocks, hop) ** 2)
                  .mean(axis=1))
    return 20.0 * np.log10(rms + 1e-9)


def analyze(wav_path, cfg: Config) -> AudioResult:
    x, sr = fftools.read_wav(wav_path)
    hop = max(1, int(sr * cfg.hop))
    n_blocks = len(x) // hop
    empty = AudioResult(np.array([]), np.array([]), np.array([]),
                        np.array([]), [], [])
    if n_blocks < 8:
        return empty

    xb = x[: n_blocks * hop].reshape(n_blocks, hop)
    rms = np.sqrt((xb ** 2).mean(axis=1))
    db = 20.0 * np.log10(rms + 1e-9)

    win = int(cfg.baseline_s / cfg.hop) | 1
    baseline = ndimage.median_filter(db, size=win, mode="nearest")
    exc = db - baseline

    times = np.arange(n_blocks) * cfg.hop

    # --- Whistle: tonspetsighet mot sidband + lokal höjning ---
    c_db = _band_db(x, hop, cfg.whistle_lo_hz, cfg.whistle_hi_hz, sr)
    s1 = _band_db(x, hop, 1300.0, 1900.0, sr)
    s2 = _band_db(x, hop, 3800.0, 4600.0, sr)
    side_db = np.maximum(s1, s2)
    peakness = c_db - side_db
    c_base = ndimage.median_filter(c_db, size=win, mode="nearest")
    loud = c_db - c_base

    whistles = []
    wseg = _segments(peakness, cfg.whistle_peakness_db, cfg.hop,
                     merge_gap_s=1.0, min_len_s=cfg.whistle_min_s)
    for a, b in wseg:
        dur = (b - a + 1) * cfg.hop
        if dur > cfg.whistle_max_s:
            continue
        mid = int(np.argmax(loud[a: b + 1])) + a
        if loud[mid] < cfg.whistle_local_db:
            continue
        whistles.append({
            "t": float(times[mid]),
            "t0": float(times[a]),
            "t1": float(times[b]),
            "dur_s": float(dur),
            "peakness_db": float(peakness[a: b + 1].max()),
        })

    # --- Publikrush-segment ---
    peaks = []
    segs = _segments(exc, cfg.roar_thresh_db, cfg.hop,
                     merge_gap_s=cfg.merge_gap_s, min_len_s=1.0)
    for a, b in segs:
        i_max = int(np.argmax(exc[a: b + 1])) + a
        max_exc = float(exc[i_max])
        # topp-tid = första tillfället nivån är inom 3 dB från max
        # (undviker att brusviggor långt ut i svansen blir "toppen")
        i = a
        while i < i_max and exc[i] < max_exc - 3.0:
            i += 1
        # attack: gå bakåt från toppen tills exc < 2 dB (max 6 s)
        s = i
        while s > 0 and exc[s - 1] > 2.0 and i - s < int(6.0 / cfg.hop):
            s -= 1
        attack_s = (i - s) * cfg.hop
        # avklingning: gå framåt tills exc < 2 dB (max 40 s)
        e = i
        lim = min(n_blocks - 1, i + int(40.0 / cfg.hop))
        while e < lim and exc[e + 1] > 2.0:
            e += 1
        decay_s = (e - i) * cfg.hop

        # pip i segmentet? -> hoppa över, pipet blir egen händelse
        is_whistle = any(abs(w["t"] - times[i]) <= 1.5 for w in whistles)
        if is_whistle:
            continue

        goal_like = (
            max_exc >= cfg.goal_db
            and decay_s >= cfg.goal_min_decay_s
            and attack_s <= 4.0
        )
        peaks.append({
            "t": float(times[i]),
            "onset_t": float(times[s]),
            "end_t": float(times[e]),
            "exc_db": max_exc,
            "attack_s": float(attack_s),
            "decay_s": float(decay_s),
            "goal_like": bool(goal_like),
        })

    return AudioResult(times=times, db=db, baseline=baseline, exc=exc,
                       peaks=peaks, whistles=whistles)
