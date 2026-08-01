#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-192.168.88.246}"
REMOTE_USER="${REMOTE_USER:-adminr}"
SSH_PORT="${SSH_PORT:-22}"

echo "[remote] opening shell to ${REMOTE_USER}@${REMOTE_HOST}:${SSH_PORT}"
exec ssh -p "${SSH_PORT}" "${REMOTE_USER}@${REMOTE_HOST}"
