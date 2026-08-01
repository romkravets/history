#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-192.168.88.246}"
REMOTE_USER="${REMOTE_USER:-adminr}"
SSH_PORT="${SSH_PORT:-22}"
LLM_LOCAL_PORT="${LLM_LOCAL_PORT:-11434}"
LLM_REMOTE_PORT="${LLM_REMOTE_PORT:-11434}"
LLM_REMOTE_BIND="${LLM_REMOTE_BIND:-127.0.0.1}"

cat <<EOF
[tunnel] ${REMOTE_USER}@${REMOTE_HOST}:${SSH_PORT}
[tunnel] localhost:${LLM_LOCAL_PORT} -> ${LLM_REMOTE_BIND}:${LLM_REMOTE_PORT}
[tunnel] keep this terminal open while using local LLM API
EOF

exec ssh -N -p "${SSH_PORT}" -L "${LLM_LOCAL_PORT}:${LLM_REMOTE_BIND}:${LLM_REMOTE_PORT}" "${REMOTE_USER}@${REMOTE_HOST}"
