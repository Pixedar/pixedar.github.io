#!/usr/bin/env bash
set -euo pipefail

export DISPLAY="${DISPLAY:-:99}"
export PORT="${PORT:-7860}"
export VNC_GEOMETRY="${VNC_GEOMETRY:-1440x900x24}"
export MINDVIS_ARGS="${MINDVIS_ARGS:-}"

cd /app/mindVisualizer

rm -f "/tmp/.X${DISPLAY#:}-lock"

Xvfb "${DISPLAY}" -screen 0 "${VNC_GEOMETRY}" -ac +extension GLX +render -noreset \
  >/tmp/xvfb.log 2>&1 &

sleep 3

python /app/mindVisualizer/app.py --host 0.0.0.0 --port "${PORT}" ${MINDVIS_ARGS}
