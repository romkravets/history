#!/usr/bin/env bash
set -euo pipefail

load_orch_config() {
  local project_root
  project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
  local config_file="${ORCH_CONFIG_FILE:-${project_root}/.orch.env}"

  if [[ -f "$config_file" ]]; then
    # shellcheck disable=SC1090
    source "$config_file"
  fi

  export ORCH_MODE="${ORCH_MODE:-local}"
  export REMOTE_HOST="${REMOTE_HOST:-192.168.88.246}"
  export REMOTE_USER="${REMOTE_USER:-adminr}"
  export SSH_PORT="${SSH_PORT:-22}"
  export REMOTE_PROJECT_DIR="${REMOTE_PROJECT_DIR:-/var/www/history-archive}"
  export REMOTE_ORCH_DIR="${REMOTE_ORCH_DIR:-/opt/llm-orchestrator}"
  export ORCH_LOCAL_DIR="${ORCH_LOCAL_DIR:-/Users/romkravets/Documents/GitHub/llm-orchestrator}"

  # Optional:
  # ORCH_GIT_URL for server-side clone/pull mode
  # LLM_ORCH_PROVIDER, LLM_ORCH_MODEL, LLM_ORCH_OLLAMA_URL, etc.
}

print_orch_config() {
  cat <<EOF
ORCH_MODE=${ORCH_MODE}
REMOTE_HOST=${REMOTE_HOST}
REMOTE_USER=${REMOTE_USER}
SSH_PORT=${SSH_PORT}
REMOTE_PROJECT_DIR=${REMOTE_PROJECT_DIR}
REMOTE_ORCH_DIR=${REMOTE_ORCH_DIR}
ORCH_LOCAL_DIR=${ORCH_LOCAL_DIR}
ORCH_GIT_URL=${ORCH_GIT_URL:-}
EOF
}
