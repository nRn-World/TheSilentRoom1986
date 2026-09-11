"""CLI: python -m fva analyze <url|fil> | serve | demo"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .config import Config
from .fusion import TYPE_LABELS


def _fmt_t(s: float) -> str:
    s = int(round(s))
    return f"{s // 60}:{s % 60:02d}"


def cmd_analyze(args):
    from .pipeline import analyze_source

    cfg = Config()
    if args.fps:
        cfg.sample_fps = args.fps
    try:
        return _run_analyze(args, cfg, analyze_source)
    except KeyboardInterrupt:
        print("\nAvbruten.", file=sys.stderr)
        return 130
    except Exception as e:
        print(f"\n⚠️  {e}", file=sys.stderr)
        return 1


def _run_analyze(args, cfg, analyze_source):
    from .fusion import TYPE_LABELS  # noqa: F401 (används i utskrift nedan)

    target = args.source
    if target.startswith(("http://", "https://")):
        source = {"kind": "youtube", "url": target}
    else:
        p = Path(target).expanduser().resolve()
        if not p.exists():
            print(f"Filen finns inte: {p}", file=sys.stderr)
            return 2
        source = {"kind": "file", "path": str(p)}

    out = Path(args.out) if args.out else Path(f"analys-{Path(target).stem[:40]}")
    out.mkdir(parents=True, exist_ok=True)

    last = {"p": -1}

    def prog(pct, msg):
        step = int(pct * 100)
        if step != last["p"]:
            last["p"] = step
            print(f"\r[{step:3d}%] {msg[:70]:<70}", end="", flush=True)
            if step >= 100:
                print()

    report = analyze_source(source, out, cfg=cfg, progress=prog,
                            max_seconds=args.limit)
    v = report["video"]
    print(f"\n🎬 {report['source'].get('title', '')}")
    print(f"   Längd {v['duration']:.0f}s · {v['width']}×{v['height']}"
          f" · tavla hittad: {report['detectors']['board_found']}")
    print(f"\n   Detekterade händelser ({len(report['events'])}):")
    for e in report["events"]:
        bar = "█" * int(e["conf"] * 10)
        print(f"   {_fmt_t(e['t']):>7}  {TYPE_LABELS.get(e['type'], e['type']):<22}"
              f" {bar:<10} {e['conf']:.0%}")
    print(f"\n📁 Rapport: {out/'report.html'}")
    print(f"            {out/'report.json'}")
    print("   Öppna HTML-rapporten i webbläsaren för granskning/markering "
          "(assist, hörnor, tacklingar märker du upp manuellt där).")
    return 0


def cmd_serve(args):
    from .server import serve
    serve(host=args.host, port=args.port)
    return 0


def cmd_demo(args):
    from .fftools import make_sample_video
    out = Path(args.out)
    print(f"Skapar demomatch: {out}")
    make_sample_video(out)
    print(f"Klar: {out}")
    print("Kör sedan: python -m fva analyze " + str(out))
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(
        prog="fva",
        description="⚽ FotbollsVideoAnalys – händelsedetektering i "
                    "fotbollsvideor (mål, målchanser, pip, kort + manuell "
                    "märkning av assist/hörnor/tacklingar).")
    sub = ap.add_subparsers(dest="cmd")

    a = sub.add_parser("analyze", help="analysera YouTube-URL eller videofil")
    a.add_argument("source", help="YouTube-URL eller sökväg till videofil")
    a.add_argument("-o", "--out", help="utmatningsmapp")
    a.add_argument("--fps", type=float, default=None,
                   help="bildrutor/sekund som analyseras (standard 2)")
    a.add_argument("--limit", type=float, default=0,
                   help="analysera endast de första N sekunderna (test)")
    a.set_defaults(fn=cmd_analyze)

    s = sub.add_parser("serve", help="starta webbgränssnittet")
    s.add_argument("--host", default="0.0.0.0")
    s.add_argument("--port", type=int, default=8000)
    s.set_defaults(fn=cmd_serve)

    d = sub.add_parser("demo", help="skapa syntetisk demomatch")
    d.add_argument("--out", default="samples/demo.mp4")
    d.set_defaults(fn=cmd_demo)

    args = ap.parse_args(argv)
    if not args.cmd:
        return cmd_serve(argparse.Namespace(host="0.0.0.0", port=8000))
    return args.fn(args)


if __name__ == "__main__":
    raise SystemExit(main())
