"""Konfiguration för fotbollsvideoanalys."""
from dataclasses import dataclass, field


@dataclass
class Config:
    # Allmännt
    sample_fps: float = 2.0          # bilder/sekund som analyseras
    resize_w: int = 640              # analysbredd (px)
    max_side: int = 1280             # hoppa över rader med bredare bild? (0 = av)

    # Ljud
    audio_sr: int = 16000            # samplingsfrekvens för ljudanalys
    hop: float = 0.5                 # sekunder per RMS-block
    baseline_s: float = 61.0         # rullande medianbaslinje (sekunder)
    roar_thresh_db: float = 7.0      # dB över baslinje för att räknas som topp
    goal_db: float = 12.0            # dB över baslinje för "målliknande" rush
    goal_min_decay_s: float = 5.0    # långsam avklingning som krävs för mål-rush
    merge_gap_s: float = 8.0         # slå ihop ljudtoppar närmare än så

    # Whistle-detektion (domarpip)
    whistle_lo_hz: float = 2200.0
    whistle_hi_hz: float = 3300.0
    whistle_peakness_db: float = 8.0   # smalband kontra sidband
    whistle_local_db: float = 6.0      # över lokal baslinje för pipbandet
    whistle_min_s: float = 0.35
    whistle_max_s: float = 4.0

    # Score-tavla (score bug)
    bug_cell: int = 16               # rutnätscellstorlek vid resize_w
    bug_strip_h: float = 0.24        # övre del av bilden där tavlan brukar sitta
    bug_strip_w: float = 0.55        # vänster del (de flesta sänder i vänstra hörnet)
    bug_static_rate: float = 0.20    # cell som ändras oftare än detta = klocka/reklam
    bug_flip_diff: float = 1.2       # gråskillnad (medel) mellan fönstermedelbilder
    bug_flip_frac: float = 0.005     # andel pixlar som ändrats kraftigt (>30)
    bug_static_motion: float = 3.0   # max rörelse i rutan (0-255) för statiskt
    bug_window_s: float = 2.5        # jämförelsefönster före/efter flip
    bug_max_width: int = 340         # max bredd på tavla (px vid resize_w)
    bug_roar_window_s: float = 35.0  # tavleflip + rush inom detta = mål

    # Halvleksdetektering
    half_min_duration_s: float = 1500.0   # hitta halvtid endast för långa matcher
    half_min_break_s: float = 120.0       # minsta längd på avbrott

    # Fusion
    board_conf: float = 0.35
    whistle_conf: float = 0.40
    chance_conf: float = 0.30

    # Rapport
    curve_points: int = 3000         # max punkter per kurva i JSON
