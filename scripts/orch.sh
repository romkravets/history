#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/orch-config.sh"

load_orch_config

# Non-interactive SSH shells often miss Node toolchain PATH.
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
fi
export PATH="$HOME/.local/bin:$PATH"

if [[ $# -lt 1 ]]; then
  echo "Usage: npm run orch -- <llm-orch args>" >&2
  echo "Example: npm run orch -- apply-plan --task \"Add feature\"" >&2
  exit 1
fi

if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  cat <<'EOF'
Usage:
  npm run orch -- <llm-orch args>

Runs llm-orchestrator locally on this machine.
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

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found in PATH. Ensure Node.js is installed for this user." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  npm install >/dev/null
fi

exec npm run --silent dev -- --cwd "$TARGET_CWD" "$@"
