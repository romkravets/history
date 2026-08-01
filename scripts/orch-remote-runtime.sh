#!/usr/bin/env bash
set -euo pipefail

ensure_remote_node() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    return 0
  fi

  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

  if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
    echo "[orch:remote] node/npm missing, installing nvm into $NVM_DIR" >&2
    mkdir -p "$NVM_DIR"
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash >/dev/null
  fi

  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"

  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "[orch:remote] installing LTS Node via nvm" >&2
    nvm install --lts >/dev/null
    nvm alias default lts/* >/dev/null
  fi

  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm use --lts >/dev/null 2>&1 || true

  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "[orch:remote] failed to prepare node/npm. Check network access and nvm installation." >&2
    exit 1
  fi
}
