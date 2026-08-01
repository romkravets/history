#!/usr/bin/env bash
set -euo pipefail

PID_FILE="${PID_FILE:-.remote-llm-tunnel.pid}"

if [[ ! -f "$PID_FILE" ]]; then
  echo "[stop] pid file not found, nothing to stop"
  exit 0
fi

pid="$(cat "$PID_FILE" 2>/dev/null || true)"
if [[ -z "$pid" ]]; then
  echo "[stop] invalid pid file"
  rm -f "$PID_FILE"
  exit 0
fi

if kill -0 "$pid" 2>/dev/null; then
  kill "$pid"
  echo "[stop] stopped tunnel pid=$pid"
else
  echo "[stop] process pid=$pid is not running"
fi

rm -f "$PID_FILE"
