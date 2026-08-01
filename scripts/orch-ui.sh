#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${PROJECT_ROOT}/.orch.env"
source "${SCRIPT_DIR}/orch-config.sh"

load_orch_config

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage:
  npm run orch:ui

Interactive terminal UI to configure and run orchestrator for this repository.
It saves settings into .orch.env and lets you switch local/remote execution mode.
EOF
  exit 0
fi

save_config() {
  cat >"$CONFIG_FILE" <<EOF
# Per-repository orchestrator config
ORCH_MODE=${ORCH_MODE}

# Remote SSH
REMOTE_HOST=${REMOTE_HOST}
REMOTE_USER=${REMOTE_USER}
SSH_PORT=${SSH_PORT}

# Remote paths
REMOTE_PROJECT_DIR=${REMOTE_PROJECT_DIR}
REMOTE_ORCH_DIR=${REMOTE_ORCH_DIR}

# Orchestrator source
ORCH_LOCAL_DIR=${ORCH_LOCAL_DIR}
ORCH_GIT_URL=${ORCH_GIT_URL:-}
EOF
  echo "Saved: $CONFIG_FILE"
}

show_dashboard() {
  clear
  echo "==============================================="
  echo " History Orchestrator UI"
  echo "==============================================="
  echo " Repo: $PROJECT_ROOT"
  echo " Config: $CONFIG_FILE"
  echo ""
  print_orch_config
  echo ""
  echo "Actions:"
  echo "  1) Set mode (local/remote)"
  echo "  2) Configure remote SSH and paths"
  echo "  3) Configure orchestrator source (local dir / git URL)"
  echo "  4) Setup orchestrator on server"
  echo "  5) Test apply-plan via selected mode"
  echo "  6) Run doctor checks"
  echo "  7) Show quick commands"
  echo "  0) Exit"
  echo ""
}

set_mode() {
  read -r -p "Mode [local/remote]: " value
  if [[ "$value" == "local" || "$value" == "remote" ]]; then
    ORCH_MODE="$value"
    save_config
  else
    echo "Invalid mode"
  fi
}

configure_remote() {
  read -r -p "REMOTE_HOST [$REMOTE_HOST]: " input; REMOTE_HOST="${input:-$REMOTE_HOST}"
  read -r -p "REMOTE_USER [$REMOTE_USER]: " input; REMOTE_USER="${input:-$REMOTE_USER}"
  read -r -p "SSH_PORT [$SSH_PORT]: " input; SSH_PORT="${input:-$SSH_PORT}"
  read -r -p "REMOTE_PROJECT_DIR [$REMOTE_PROJECT_DIR]: " input; REMOTE_PROJECT_DIR="${input:-$REMOTE_PROJECT_DIR}"
  read -r -p "REMOTE_ORCH_DIR [$REMOTE_ORCH_DIR]: " input; REMOTE_ORCH_DIR="${input:-$REMOTE_ORCH_DIR}"
  save_config
}

configure_source() {
  read -r -p "ORCH_LOCAL_DIR [$ORCH_LOCAL_DIR]: " input; ORCH_LOCAL_DIR="${input:-$ORCH_LOCAL_DIR}"
  read -r -p "ORCH_GIT_URL [${ORCH_GIT_URL:-empty}]: " input; ORCH_GIT_URL="${input:-${ORCH_GIT_URL:-}}"
  save_config
}

test_apply_plan() {
  "${SCRIPT_DIR}/orch-auto.sh" apply-plan --task "Add one photo story" || true
  echo ""
  read -r -p "Press Enter to continue..." _
}

show_quick_commands() {
  cat <<'EOF'
Quick commands:
  npm run orch:auto -- apply-plan --task "Add one photo story"
  npm run orch:auto -- --output json review-diff --task "Review before publish"
  npm run orch:remote:setup

Switch mode in .orch.env:
  ORCH_MODE=local
  ORCH_MODE=remote
EOF
  echo ""
  read -r -p "Press Enter to continue..." _
}

while true; do
  show_dashboard
  read -r -p "Select action: " action
  case "$action" in
    1) set_mode ;;
    2) configure_remote ;;
    3) configure_source ;;
    4) "${SCRIPT_DIR}/orch-remote-setup.sh" || true; read -r -p "Press Enter to continue..." _ ;;
    5) test_apply_plan ;;
    6) "${SCRIPT_DIR}/orch-doctor.sh" || true; read -r -p "Press Enter to continue..." _ ;;
    7) show_quick_commands ;;
    0) exit 0 ;;
    *) echo "Unknown action"; sleep 1 ;;
  esac
done
