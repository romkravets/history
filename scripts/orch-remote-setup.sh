#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/orch-config.sh"

load_orch_config

REMOTE_HOST="${REMOTE_HOST:-192.168.88.246}"
REMOTE_USER="${REMOTE_USER:-hermes-agent}"
SSH_PORT="${SSH_PORT:-22}"
REMOTE_ORCH_DIR="${REMOTE_ORCH_DIR:-/home/hermes-agent/projects/llm-orchestrator}"
ORCH_GIT_URL="${ORCH_GIT_URL:-}"
ORCH_LOCAL_DIR="${ORCH_LOCAL_DIR:-/Users/romkravets/Documents/GitHub/llm-orchestrator}"

# Preferred: ORCH_GIT_URL with a real Git remote URL.
# Fallback: sync from ORCH_LOCAL_DIR on this Mac using rsync over SSH.

echo "[orch:remote:setup] host=${REMOTE_USER}@${REMOTE_HOST}:${SSH_PORT}" >&2
echo "[orch:remote:setup] target=${REMOTE_ORCH_DIR}" >&2
if [[ -n "$ORCH_GIT_URL" ]]; then
  echo "[orch:remote:setup] source=git (${ORCH_GIT_URL})" >&2
else
  echo "[orch:remote:setup] source=local-sync (${ORCH_LOCAL_DIR})" >&2
fi

echo "[orch:remote:setup] provisioning orchestrator on server..." >&2

if [[ -n "$ORCH_GIT_URL" ]]; then
  remote_command="bash -lc 'source \$HOME/.nvm/nvm.sh >/dev/null 2>&1 || true; mkdir -p $(printf '%q' "$(dirname "$REMOTE_ORCH_DIR")"); if [[ -d $(printf '%q' "$REMOTE_ORCH_DIR")/.git ]]; then cd $(printf '%q' "$REMOTE_ORCH_DIR") && git pull --ff-only; else git clone $(printf '%q' "$ORCH_GIT_URL") $(printf '%q' "$REMOTE_ORCH_DIR") && cd $(printf '%q' "$REMOTE_ORCH_DIR"); fi; npm install && npm run build; echo [orch:remote:setup] ready: $(printf '%q' "$REMOTE_ORCH_DIR")'"
  ssh -p "${SSH_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "$remote_command"
  exit 0
fi

if [[ ! -d "$ORCH_LOCAL_DIR" ]]; then
  echo "[orch:remote:setup] local orchestrator not found: $ORCH_LOCAL_DIR" >&2
  echo "[orch:remote:setup] set ORCH_LOCAL_DIR or ORCH_GIT_URL in .orch.env" >&2
  exit 1
fi

ssh -p "${SSH_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p $(printf '%q' "$REMOTE_ORCH_DIR")"

rsync -az --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude .git \
  -e "ssh -p ${SSH_PORT}" \
  "${ORCH_LOCAL_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_ORCH_DIR}/"

remote_command="bash -lc 'source \$HOME/.nvm/nvm.sh >/dev/null 2>&1 || true; cd $(printf '%q' "$REMOTE_ORCH_DIR") && npm install && npm run build; echo [orch:remote:setup] ready: $(printf '%q' "$REMOTE_ORCH_DIR")'"
ssh -p "${SSH_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "$remote_command"
