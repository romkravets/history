#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

# Non-interactive SSH shells may miss Node runtime in PATH.
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
fi
export PATH="$HOME/.local/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo "[autopilot] node not found in PATH. Install Node.js or load nvm for this user." >&2
  exit 1
fi

TASK=""
EXTRA=""
MAX_STEPS=8
RUN_VALIDATE=1

usage() {
  cat <<'EOF'
Usage:
  npm run orch:autopilot -- --task "Your task" [options]

Options:
  --task <text>          Required. Main task description.
  --extra <text>         Optional. Additional constraints/context.
  --max-steps <number>   Optional. Max plan steps to execute (default: 8).
  --skip-validate        Optional. Skip npm run check and npm run build.
  -h, --help             Show this help.

What it does:
  1) Generates plan via apply-plan (JSON)
  2) Extracts todo titles
  3) Executes run-task for each step sequentially
  4) Runs check/build (unless --skip-validate)
  5) Runs final review-diff
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task)
      TASK="${2:-}"
      shift 2
      ;;
    --extra)
      EXTRA="${2:-}"
      shift 2
      ;;
    --max-steps)
      MAX_STEPS="${2:-}"
      shift 2
      ;;
    --skip-validate)
      RUN_VALIDATE=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$TASK" ]]; then
  echo "Error: --task is required" >&2
  usage
  exit 1
fi

if ! [[ "$MAX_STEPS" =~ ^[0-9]+$ ]] || [[ "$MAX_STEPS" -lt 1 ]]; then
  echo "Error: --max-steps must be a positive integer" >&2
  exit 1
fi

LOG_DIR="${PROJECT_ROOT}/.orch-logs"
mkdir -p "$LOG_DIR"
TS="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${LOG_DIR}/autopilot-${TS}.log"

echo "[autopilot] task: $TASK"
echo "[autopilot] max steps: $MAX_STEPS"
echo "[autopilot] log: $LOG_FILE"

apply_cmd=("${SCRIPT_DIR}/orch-auto.sh" --output json apply-plan --task "$TASK")
if [[ -n "$EXTRA" ]]; then
  apply_cmd+=(--extra "$EXTRA")
fi

echo "[autopilot] generating plan..."
plan_json="$(${apply_cmd[@]})"
printf '%s\n' "$plan_json" >>"$LOG_FILE"

titles_text="$({
  printf '%s\n' "$plan_json" | node -e '
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8");
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error("[autopilot] failed to parse apply-plan JSON");
  process.exit(2);
}
const list = Array.isArray(data.todoList) ? data.todoList : [];
for (const item of list) {
  if (item && typeof item.title === "string" && item.title.trim()) {
    process.stdout.write(item.title.trim() + "\n");
  }
}
'
})"

plan_titles=()
while IFS= read -r line; do
  if [[ -n "$line" ]]; then
    plan_titles+=("$line")
  fi
done <<< "$titles_text"

if [[ "${#plan_titles[@]}" -eq 0 ]]; then
  echo "[autopilot] no todo items found in plan" >&2
  exit 1
fi

if [[ "${#plan_titles[@]}" -gt "$MAX_STEPS" ]]; then
  plan_titles=("${plan_titles[@]:0:$MAX_STEPS}")
fi

total="${#plan_titles[@]}"
step=0

for title in "${plan_titles[@]}"; do
  step=$((step + 1))
  step_task="${TASK}. Step ${step}/${total}: ${title}"

  echo "[autopilot] step ${step}/${total}: ${title}"
  run_cmd=("${SCRIPT_DIR}/orch-auto.sh" run-task --task "$step_task")
  if [[ -n "$EXTRA" ]]; then
    run_cmd+=(--extra "$EXTRA")
  fi

  {
    echo "\n===== STEP ${step}/${total}: ${title} ====="
    "${run_cmd[@]}"
  } | tee -a "$LOG_FILE"
done

if [[ "$RUN_VALIDATE" -eq 1 ]]; then
  echo "[autopilot] running project validation (check + build)..."
  {
    echo "\n===== VALIDATION: npm run check ====="
    cd "$PROJECT_ROOT"
    npm run check
    echo "\n===== VALIDATION: npm run build ====="
    npm run build
  } | tee -a "$LOG_FILE"
fi

echo "[autopilot] running final diff review..."
{
  echo "\n===== FINAL REVIEW ====="
  "${SCRIPT_DIR}/orch-auto.sh" review-diff --task "Final review for task: ${TASK}"
} | tee -a "$LOG_FILE"

echo "[autopilot] done"
echo "[autopilot] full log: $LOG_FILE"
