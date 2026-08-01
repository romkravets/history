#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/orch-config.sh"

load_orch_config

if [[ $# -lt 1 ]]; then
  cat >&2 <<'EOF'
Usage:
  npm run orch:auto -- <llm-orch args>

Mode selection:
  ORCH_MODE=local  -> run on this machine
  ORCH_MODE=remote -> run on server via SSH
EOF
  exit 1
fi

if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  cat <<'EOF'
Usage:
  npm run orch:auto -- <llm-orch args>

Mode selection (from .orch.env):
  ORCH_MODE=local  -> run on this machine
  ORCH_MODE=remote -> run on server via SSH

Examples:
  npm run orch:auto -- apply-plan --task "Add feature"
  npm run orch:auto -- --output json review-diff --task "Review before merge"
EOF
  exit 0
fi

case "$ORCH_MODE" in
  local)
    exec bash "${SCRIPT_DIR}/orch.sh" "$@"
    ;;
  remote)
    exec bash "${SCRIPT_DIR}/orch-remote.sh" "$@"
    ;;
  *)
    echo "[orch:auto] invalid ORCH_MODE=$ORCH_MODE (expected local|remote)" >&2
    exit 1
    ;;
esac
