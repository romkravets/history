#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/orch-config.sh"

load_orch_config

if [[ $# -lt 1 ]]; then
  echo "Usage: npm run orch -- <llm-orch args>" >&2
  echo "Example: npm run orch -- apply-plan --task \"Add photo story\"" >&2
  exit 1
fi

if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  cat <<'EOF'
Usage:
  npm run orch -- <llm-orch args>

Runs llm-orchestrator locally on this Mac.
Config file (optional): .orch.env
EOF
  exit 0
fi

TARGET_CWD="$PWD"

if command -v llm-orch >/dev/null 2>&1; then
  exec llm-orch --cwd "$TARGET_CWD" "$@"
fi

ORCH_DIR="${LLM_ORCH_DIR:-/Users/romkravets/Documents/GitHub/llm-orchestrator}"

if [[ ! -d "$ORCH_DIR" ]]; then
  echo "llm-orchestrator not found at $ORCH_DIR" >&2
  echo "Set LLM_ORCH_DIR or run npm link in orchestrator repo." >&2
  exit 1
fi

cd "$ORCH_DIR"

if [[ ! -d node_modules ]]; then
  npm install >/dev/null
fi

exec npm run dev -- --cwd "$TARGET_CWD" "$@"
