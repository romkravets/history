#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/orch-config.sh"

load_orch_config

REMOTE_HOST="${REMOTE_HOST:-192.168.88.246}"
REMOTE_USER="${REMOTE_USER:-hermes-agent}"
SSH_PORT="${SSH_PORT:-22}"
REMOTE_PROJECT_DIR="${REMOTE_PROJECT_DIR:-/home/hermes-agent/projects/history}"
REMOTE_ORCH_DIR="${REMOTE_ORCH_DIR:-/home/hermes-agent/projects/llm-orchestrator}"

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

quoted_orch_dir=$(printf '%q' "$REMOTE_ORCH_DIR")
quoted_project_dir=$(printf '%q' "$REMOTE_PROJECT_DIR")
quoted_args=()
for arg in "$@"; do
  quoted_args+=("$(printf '%q' "$arg")")
done

remote_command="bash -lc 'source \$HOME/.nvm/nvm.sh >/dev/null 2>&1 || true; cd ${quoted_orch_dir} && exec node dist/cli.js --cwd ${quoted_project_dir} ${quoted_args[*]}'"

ssh -p "${SSH_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "$remote_command"
