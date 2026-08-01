#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-192.168.88.246}"
REMOTE_USER="${REMOTE_USER:-adminr}"
SSH_PORT="${SSH_PORT:-22}"
LLM_LOCAL_PORT="${LLM_LOCAL_PORT:-11434}"
LLM_REMOTE_PORT="${LLM_REMOTE_PORT:-11434}"
LLM_REMOTE_BIND="${LLM_REMOTE_BIND:-127.0.0.1}"
WAIT_SECONDS="${WAIT_SECONDS:-10}"
PID_FILE="${PID_FILE:-.remote-llm-tunnel.pid}"
LOG_FILE="${LOG_FILE:-.remote-llm-tunnel.log}"

if [[ -f "$PID_FILE" ]]; then
  old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
    echo "[start] tunnel already running (pid=$old_pid)"
    echo "[start] stop with: npm run remote:llm:stop"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

echo "[start] creating background tunnel"
nohup ssh -N -p "$SSH_PORT" -L "${LLM_LOCAL_PORT}:${LLM_REMOTE_BIND}:${LLM_REMOTE_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" >"$LOG_FILE" 2>&1 &
new_pid="$!"
echo "$new_pid" >"$PID_FILE"

BASE_URL="http://127.0.0.1:${LLM_LOCAL_PORT}"
health_ok=0
for ((i = 1; i <= WAIT_SECONDS; i++)); do
  if curl -fsS "$BASE_URL/api/tags" >/dev/null 2>&1 || curl -fsS "$BASE_URL/v1/models" >/dev/null 2>&1; then
    health_ok=1
    break
  fi
  sleep 1
done

if [[ "$health_ok" -ne 1 ]]; then
  echo "[start] tunnel started (pid=$new_pid), but health-check did not pass in ${WAIT_SECONDS}s"
  echo "[start] check logs: tail -n 80 $LOG_FILE"
  echo "[start] you can still test manually: npm run remote:llm:check"
  exit 1
fi

echo "[start] tunnel ready (pid=$new_pid)"
echo "[start] endpoint: $BASE_URL"
echo "[start] stop with: npm run remote:llm:stop"
