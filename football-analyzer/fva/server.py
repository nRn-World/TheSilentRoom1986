"""Lokal webbserver för analysen (stdlib, inga extra beroenden).

 * POST /api/analyze   {url} | {sample:"demo"} | multipart-fil
 * GET  /api/job/<id>            -> status/progress
 * GET  /api/job/<id>/report.json|report.html|thumb.jpg|video
 * POST /api/job/<id>/annotations {events:[...]}  -> sparar din granskning
"""
from __future__ import annotations

import json
import re
import threading
import traceback
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from .config import Config
from .report import write_report

BASE = Path(__file__).resolve().parent.parent
STATIC = BASE / "static"
SAMPLES = BASE / "samples"

JOBS: dict[str, dict] = {}
LOCK = threading.Lock()


def _job_dir(job_id: str) -> Path:
    return BASE / "jobs" / job_id


def _save_meta(job_id: str):
    with LOCK:
        j = JOBS.get(job_id)
        if j:
            (j["dir"] / "meta.json").write_text(
                json.dumps(j["meta"], ensure_ascii=False), encoding="utf-8")


def _progress(job_id: str):
    def cb(pct, msg):
        with LOCK:
            j = JOBS.get(job_id)
            if j:
                j["meta"].update(pct=round(pct, 3), msg=msg, status="running")
        _save_meta(job_id)
    return cb


def _run_job(job_id: str, source: dict, cfg: Config, max_seconds: float):
    from .pipeline import analyze_source
    try:
        with LOCK:
            JOBS[job_id]["meta"].update(status="running", pct=0.01, msg="Startar…")
        analyze_source(source, _job_dir(job_id), cfg=cfg,
                       progress=_progress(job_id), max_seconds=max_seconds)
        with LOCK:
            JOBS[job_id]["meta"].update(status="done", pct=1.0, msg="Klar!")
    except Exception as e:
        traceback.print_exc()
        with LOCK:
            JOBS[job_id]["meta"].update(
                status="error", error=str(e), msg="Fel")
    _save_meta(job_id)


def _start_job(source: dict, cfg: Config | None = None,
               max_seconds: float = 0.0) -> str:
    job_id = uuid.uuid4().hex[:10]
    jdir = _job_dir(job_id)
    jdir.mkdir(parents=True, exist_ok=True)
    meta = {"status": "queued", "pct": 0, "msg": "I kö…", "error": None,
            "kind": source["kind"]}
    with LOCK:
        JOBS[job_id] = {"dir": jdir, "meta": meta}
    _save_meta(job_id)
    t = threading.Thread(target=_run_job,
                         args=(job_id, source, cfg or Config(), max_seconds),
                         daemon=True)
    t.start()
    return job_id


def _demo_source() -> dict:
    SAMPLES.mkdir(exist_ok=True)
    demo = SAMPLES / "demo.mp4"
    if not demo.exists():
        from .fftools import make_sample_video
        make_sample_video(demo)
    return {"kind": "sample", "path": str(demo)}


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        print("[http]", self.address_string(), fmt % args)

    # ---------- helpers ----------
    def _send(self, code: int, body: bytes, ctype: str,
              extra: dict | None = None):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        try:
            self.wfile.write(body)
        except BrokenPipeError:
            pass

    def _json(self, obj, code: int = 200):
        self._send(code, json.dumps(obj, ensure_ascii=False).encode(),
                   "application/json; charset=utf-8")

    def _file(self, path: Path, ctype: str, download_name: str | None = None):
        if not path.exists():
            return self._json({"error": "finns inte"}, 404)
        data = path.read_bytes()
        extra = {}
        if download_name:
            extra["Content-Disposition"] = \
                f'attachment; filename="{download_name}"'
        self._send(200, data, ctype, extra)

    def _body(self) -> bytes:
        n = int(self.headers.get("Content-Length") or 0)
        cap = 800 * 1024 * 1024
        if n > cap:
            raise RuntimeError("För stor fil (max ~800 MB)")
        buf = bytearray()
        while len(buf) < n:
            chunk = self.rfile.read(min(1 << 20, n - len(buf)))
            if not chunk:
                break
            buf.extend(chunk)
        return bytes(buf)

    def _parse_multipart(self, body: bytes) -> dict:
        """Minimal multipart-parser. Returnerar {field: path|str}."""
        ctype = self.headers.get("Content-Type", "")
        m = re.search(r'boundary="?([^";]+)"?', ctype)
        if not m:
            raise RuntimeError("Ogiltig multipart")
        bnd = ("--" + m.group(1)).encode()
        out = {}
        for part in body.split(bnd):
            part = part.strip(b"\r\n")
            if not part or part == b"--":
                continue
            if b"\r\n\r\n" not in part:
                continue
            head, payload = part.split(b"\r\n\r\n", 1)
            headers = head.decode("utf-8", "replace")
            fn = re.search(r'filename="([^"]*)"', headers)
            name = re.search(r'name="([^"]*)"', headers)
            if fn and name:
                ext = Path(fn.group(1)).suffix.lower() or ".mp4"
                dest = _job_dir("uploads")
                dest.mkdir(parents=True, exist_ok=True)
                p = dest / (uuid.uuid4().hex[:8] + ext)
                p.write_bytes(payload)
                out[name.group(1)] = str(p)
            elif name:
                out[name.group(1)] = payload.decode("utf-8", "replace")
        return out

    def _stream_video(self, jdir: Path, report: dict):
        vpath = Path(report.get("video_path") or "")
        if not vpath.exists():
            return self._json({"error": "videofil saknas"}, 404)
        size = vpath.stat().st_size
        rng = self.headers.get("Range")
        start, end = 0, size - 1
        code = 200
        if rng:
            m = re.match(r"bytes=(\d*)-(\d*)", rng)
            if m:
                if m.group(1):
                    start = int(m.group(1))
                if m.group(2):
                    end = min(int(m.group(2)), size - 1)
                code = 206
        length = end - start + 1
        self.send_response(code)
        self.send_header("Content-Type", "video/mp4")
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(length))
        if code == 206:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.end_headers()
        with open(vpath, "rb") as f:
            f.seek(start)
            remaining = length
            while remaining > 0:
                chunk = f.read(min(1 << 18, remaining))
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except BrokenPipeError:
                    return
                remaining -= len(chunk)

    def _load_report(self, job_id: str) -> dict | None:
        p = _job_dir(job_id) / "report.json"
        if not p.exists():
            return None
        return json.loads(p.read_text(encoding="utf-8"))

    # ---------- GET ----------
    def do_GET(self):
        try:
            path = self.path.split("?")[0]
            if path in ("/", "/index.html"):
                return self._file(STATIC / "index.html", "text/html; charset=utf-8")
            if path.startswith("/static/"):
                name = Path(path).name
                return self._file(STATIC / name, "text/plain; charset=utf-8")

            m = re.match(r"^/api/job/([0-9a-f]+)/?$", path)
            if m:
                jid = m.group(1)
                with LOCK:
                    j = JOBS.get(jid)
                    if j:
                        return self._json(j["meta"])
                p = _job_dir(jid) / "meta.json"
                if p.exists():
                    return self._json(json.loads(p.read_text(encoding="utf-8")))
                return self._json({"error": "okänt jobb"}, 404)

            m = re.match(r"^/api/job/([0-9a-f]+)/(report\.json|report\.html|thumb\.jpg|video)$", path)
            if m:
                jid, what = m.group(1), m.group(2)
                jdir = _job_dir(jid)
                if what == "report.json":
                    r = self._load_report(jid)
                    return (self._json(r) if r
                            else self._json({"error": "ingen rapport ännu"}, 404))
                if what == "report.html":
                    return self._file(jdir / "report.html", "text/html; charset=utf-8")
                if what == "thumb.jpg":
                    return self._file(jdir / "thumb.jpg", "image/jpeg")
                if what == "video":
                    rep = self._load_report(jid)
                    if not rep:
                        return self._json({"error": "ingen rapport ännu"}, 404)
                    return self._stream_video(jdir, rep)
            return self._json({"error": "hittades inte"}, 404)
        except Exception as e:
            traceback.print_exc()
            return self._json({"error": str(e)}, 500)

    # ---------- POST ----------
    def do_POST(self):
        try:
            path = self.path.split("?")[0]
            if path == "/api/analyze":
                body = self._body()
                ctype = self.headers.get("Content-Type", "")
                max_seconds = float(self.headers.get("X-Max-Seconds") or 0)
                if "multipart/form-data" in ctype:
                    fields = self._parse_multipart(body)
                    if "file" not in fields:
                        return self._json({"error": "ingen fil mottagen"}, 400)
                    src = {"kind": "file", "path": fields["file"]}
                    return self._json({"job_id": _start_job(src, max_seconds=max_seconds)})
                data = json.loads(body or b"{}")
                if data.get("url"):
                    src = {"kind": "youtube", "url": data["url"].strip()}
                    return self._json({"job_id": _start_job(src, max_seconds=max_seconds)})
                if data.get("sample"):
                    return self._json({"job_id": _start_job(_demo_source(), max_seconds=max_seconds)})
                return self._json({"error": "ange url, sample eller fil"}, 400)

            m = re.match(r"^/api/job/([0-9a-f]+)/annotations$", path)
            if m:
                jid = m.group(1)
                data = json.loads(self._body() or b"{}")
                events = data.get("events")
                if events is None:
                    return self._json({"ok": False, "error": "events saknas"}, 400)
                rep = self._load_report(jid)
                if rep is None:
                    return self._json({"ok": False, "error": "ingen rapport"}, 404)
                rep["events"] = events
                jdir = _job_dir(jid)
                (jdir / "report.json").write_text(
                    json.dumps(rep, ensure_ascii=False, indent=1), encoding="utf-8")
                write_report(jdir / "report.html", rep)
                return self._json({"ok": True})
            return self._json({"error": "hittades inte"}, 404)
        except Exception as e:
            traceback.print_exc()
            return self._json({"error": str(e)}, 500)


def serve(host: str = "0.0.0.0", port: int = 8000):
    from .webtpl import write_static
    write_static(STATIC)
    (_job_dir("uploads")).mkdir(parents=True, exist_ok=True)
    srv = ThreadingHTTPServer((host, port), Handler)
    srv.daemon_threads = True
    print(f"⚽ FotbollsVideoAnalys servern: http://{host}:{port}")
    srv.serve_forever()
