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

escaped_remote_args=("$(printf '%q' "$REMOTE_ORCH_DIR")" "$(printf '%q' "$REMOTE_PROJECT_DIR")")
for arg in "$@"; do
  escaped_remote_args+=("$(printf '%q' "$arg")")
done

ssh_remote_cmd="bash -s -- ${escaped_remote_args[*]}"

ssh -p "${SSH_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "$ssh_remote_cmd" <<'REMOTE_SCRIPT'
set -euo pipefail

source "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
export PATH="$HOME/.local/bin:$PATH"

orch_dir="$1"
project_dir="$2"
shift 2

cd "$orch_dir"
exec node dist/cli.js --cwd "$project_dir" "$@"
REMOTE_SCRIPT
