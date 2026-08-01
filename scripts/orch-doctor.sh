#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/orch-config.sh"

load_orch_config

echo "=== Orchestrator Doctor ==="
echo "mode: ${ORCH_MODE}"
echo "host: ${REMOTE_USER}@${REMOTE_HOST}:${SSH_PORT}"
echo "remote project: ${REMOTE_PROJECT_DIR}"
echo "remote orchestrator: ${REMOTE_ORCH_DIR}"
echo ""

echo "[1/4] local orchestrator dir"
if [[ -d "$ORCH_LOCAL_DIR" ]]; then
  echo "ok: $ORCH_LOCAL_DIR"
else
  echo "fail: local orchestrator not found: $ORCH_LOCAL_DIR"
fi

echo ""
echo "[2/4] ssh connection"
if ssh -p "$SSH_PORT" -o BatchMode=yes -o ConnectTimeout=5 "${REMOTE_USER}@${REMOTE_HOST}" "echo ok" >/dev/null 2>&1; then
  echo "ok: ssh reachable"
else
  echo "fail: ssh connection failed"
fi

echo ""
echo "[3/4] remote project dir"
if ssh -p "$SSH_PORT" "${REMOTE_USER}@${REMOTE_HOST}" "test -d '$REMOTE_PROJECT_DIR'" >/dev/null 2>&1; then
  echo "ok: exists"
else
  echo "fail: missing remote project dir"
  echo "hint: set REMOTE_PROJECT_DIR in .orch.env"
fi

echo ""
echo "[4/4] remote orchestrator dir"
if ssh -p "$SSH_PORT" "${REMOTE_USER}@${REMOTE_HOST}" "test -d '$REMOTE_ORCH_DIR'" >/dev/null 2>&1; then
  echo "ok: exists"
else
  echo "fail: missing remote orchestrator dir"
  echo "hint: run npm run orch:remote:setup"
fi

echo ""
echo "Suggested next steps:"
echo "1) npm run orch:ui"
echo "2) fix REMOTE_PROJECT_DIR"
echo "3) npm run orch:remote:setup"
echo "4) npm run orch:auto -- apply-plan --task \"Add one photo story\""
