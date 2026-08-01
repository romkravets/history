#!/usr/bin/env bash
set -euo pipefail

LLM_LOCAL_HOST="${LLM_LOCAL_HOST:-127.0.0.1}"
LLM_LOCAL_PORT="${LLM_LOCAL_PORT:-11434}"
BASE_URL="http://${LLM_LOCAL_HOST}:${LLM_LOCAL_PORT}"
MODEL="${LLM_MODEL:-gpt-oss:20b}"
SYSTEM_PROMPT="${LLM_SYSTEM_PROMPT:-}"

show_usage() {
  cat >&2 <<'EOF'
Usage:
  npm run remote:llm:prompt -- "your prompt"
  npm run remote:llm:prompt -- --file path/to/prompt.txt
  npm run remote:llm:prompt -- "analyze code" --context-file CLAUDE.md
  npm run remote:llm:prompt -- --file prompts/task.txt --context-file src/pages/index.astro

Optional env:
  LLM_MODEL, LLM_SYSTEM_PROMPT, LLM_LOCAL_HOST, LLM_LOCAL_PORT
EOF
}

if [[ "$#" -eq 0 ]]; then
  show_usage
  exit 1
fi

PROMPT_FILE=""
CONTEXT_FILES=()
PROMPT_ARGS=()

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --file)
      shift
      if [[ "$#" -eq 0 ]]; then
        echo "[prompt] missing value for --file" >&2
        exit 1
      fi
      PROMPT_FILE="$1"
      ;;
    --context-file)
      shift
      if [[ "$#" -eq 0 ]]; then
        echo "[prompt] missing value for --context-file" >&2
        exit 1
      fi
      CONTEXT_FILES+=("$1")
      ;;
    --help|-h)
      show_usage
      exit 0
      ;;
    *)
      PROMPT_ARGS+=("$1")
      ;;
  esac
  shift
done

if [[ -n "$PROMPT_FILE" ]] && [[ "${#PROMPT_ARGS[@]}" -gt 0 ]]; then
  echo "[prompt] use either inline prompt or --file, not both" >&2
  exit 1
fi

if [[ -n "$PROMPT_FILE" ]]; then
  if [[ ! -f "$PROMPT_FILE" ]]; then
    echo "[prompt] file not found: $PROMPT_FILE" >&2
    exit 1
  fi
  PROMPT="$(cat "$PROMPT_FILE")"
else
  if [[ "${#PROMPT_ARGS[@]}" -eq 0 ]]; then
    show_usage
    exit 1
  fi
  PROMPT="${PROMPT_ARGS[*]}"
fi

if [[ -z "${PROMPT// }" ]]; then
  echo "[prompt] prompt is empty" >&2
  exit 1
fi

if [[ "${#CONTEXT_FILES[@]}" -gt 0 ]]; then
  context_blob=""
  for file in "${CONTEXT_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
      echo "[prompt] context file not found: $file" >&2
      exit 1
    fi
    context_blob+=$'\n\n--- FILE: '
    context_blob+="$file"
    context_blob+=$' ---\n'
    context_blob+="$(cat "$file")"
  done

  PROMPT+=$'\n\nUse the following file context for analysis:\n'
  PROMPT+="$context_blob"
fi

payload="$({
  node -e '
const prompt = process.argv[1];
const model = process.argv[2];
const systemPrompt = process.argv[3] || "";
const body = {
  model,
  prompt,
  stream: false,
};
if (systemPrompt) body.system = systemPrompt;
process.stdout.write(JSON.stringify(body));
' "$PROMPT" "$MODEL" "$SYSTEM_PROMPT"
})"

raw_response="$(curl -fsS "${BASE_URL}/api/generate" \
  -H "Content-Type: application/json" \
  -d "$payload")"

node -e '
let data;
try {
  data = JSON.parse(process.argv[1]);
} catch {
  process.stdout.write(process.argv[1]);
  process.exit(0);
}
if (data && typeof data.response === "string") {
  process.stdout.write(data.response.trim() + "\n");
  process.exit(0);
}
process.stdout.write(JSON.stringify(data, null, 2) + "\n");
' "$raw_response"
