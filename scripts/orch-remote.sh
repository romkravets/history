#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/orch-config.sh"

load_orch_config

REMOTE_HOST="${REMOTE_HOST:-192.168.88.246}"
REMOTE_USER="${REMOTE_USER:-adminr}"
SSH_PORT="${SSH_PORT:-22}"
REMOTE_PROJECT_DIR="${REMOTE_PROJECT_DIR:-/var/www/history-archive}"
REMOTE_ORCH_DIR="${REMOTE_ORCH_DIR:-/opt/llm-orchestrator}"

if [[ $# -lt 1 ]]; then
  echo "Usage: npm run orch:remote -- <llm-orch args>" >&2
  echo "Example: npm run orch:remote -- apply-plan --task \"Add one photo story\"" >&2
  exit 1
fi

if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  cat <<'EOF'
Usage:
  npm run orch:remote -- <llm-orch args>

Examples:
  npm run orch:remote -- apply-plan --task "Add one photo story"
  npm run orch:remote -- --output json review-diff --task "Review before publish"

Env overrides:
  REMOTE_HOST, REMOTE_USER, SSH_PORT, REMOTE_PROJECT_DIR, REMOTE_ORCH_DIR
EOF
  exit 0
fi

echo "[orch:remote] host=${REMOTE_USER}@${REMOTE_HOST}:${SSH_PORT}" >&2
echo "[orch:remote] project=${REMOTE_PROJECT_DIR}" >&2
echo "[orch:remote] orchestrator=${REMOTE_ORCH_DIR}" >&2

ssh -p "${SSH_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" bash -s -- \
  "${REMOTE_PROJECT_DIR}" \
  "${REMOTE_ORCH_DIR}" \
  "$@" <<'EOF'
set -euo pipefail

remote_project_dir="$1"
remote_orch_dir="$2"
shift 2

if [[ ! -d "$remote_project_dir" ]]; then
  echo "[orch:remote] project dir not found: $remote_project_dir" >&2
  exit 1
fi

if [[ ! -d "$remote_orch_dir" ]]; then
  echo "[orch:remote] orchestrator dir not found: $remote_orch_dir" >&2
  echo "[orch:remote] run: npm run orch:remote:setup" >&2
  exit 1
fi

cd "$remote_orch_dir"

if [[ ! -d node_modules ]]; then
  npm install >/dev/null
fi

if [[ ! -f dist/cli.js ]]; then
  npm run build >/dev/null
fi

exec node dist/cli.js --cwd "$remote_project_dir" "$@"
EOF
