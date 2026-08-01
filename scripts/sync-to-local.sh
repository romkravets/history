#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-192.168.88.246}"
REMOTE_USER="${REMOTE_USER:-adminr}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/history-archive}"
SSH_PORT="${SSH_PORT:-22}"

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required but not found. Install rsync first." >&2
  exit 1
fi

echo "[sync] building static site"
npm run build

echo "[sync] sending dist/ to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
rsync -avz --delete -e "ssh -p ${SSH_PORT}" dist/ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

echo "[sync] done"
