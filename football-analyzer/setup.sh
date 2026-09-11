#!/usr/bin/env bash
# Installerar FotbollsVideoAnalys i en virtuell miljö (.venv).
set -euo pipefail
cd "$(dirname "$0")"
python3 -m venv .venv
.venv/bin/pip install --upgrade pip >/dev/null
.venv/bin/pip install -r requirements.txt
echo "✅ Klart! Kör sedan:"
echo "   .venv/bin/python -m fva serve --port 8000"
echo "   .venv/bin/python -m fva analyze <youtube-url-eller-fil>"
