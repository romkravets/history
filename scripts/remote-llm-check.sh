#!/usr/bin/env bash
set -euo pipefail

LLM_LOCAL_HOST="${LLM_LOCAL_HOST:-127.0.0.1}"
LLM_LOCAL_PORT="${LLM_LOCAL_PORT:-11434}"
BASE_URL="http://${LLM_LOCAL_HOST}:${LLM_LOCAL_PORT}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

echo "[check] probing ${BASE_URL}"

if curl -fsS "${BASE_URL}/api/tags" >/dev/null 2>&1; then
  echo "[check] detected Ollama-compatible endpoint"
  curl -fsS "${BASE_URL}/api/tags"
  exit 0
fi

if curl -fsS "${BASE_URL}/v1/models" >/dev/null 2>&1; then
  echo "[check] detected OpenAI-compatible endpoint"
  curl -fsS "${BASE_URL}/v1/models"
  exit 0
fi

echo "[check] no known LLM endpoint found at ${BASE_URL}" >&2
echo "[check] start tunnel: npm run remote:llm:tunnel" >&2
exit 1
