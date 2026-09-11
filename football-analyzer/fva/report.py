"""Genererar den fristående HTML-rapporten (report.html)."""
from __future__ import annotations

import json
from pathlib import Path

from . import webtpl


def write_report(out_path: Path, report: dict) -> Path:
    out_path = Path(out_path)
    payload = json.dumps(report, ensure_ascii=False).replace("</", "<\\/")
    html = (webtpl.INDEX_TMPL_HEAD
            + webtpl.REPORT_BODY.replace("__JSON__", payload)
            + webtpl.INDEX_TMPL_TAIL)
    out_path.write_text(html, encoding="utf-8")
    return out_path
