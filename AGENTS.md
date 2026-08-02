## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Agent Workflow For This Repository

When assisting with this archive project:

1. Add image files under `public/photos/<slug>/`.
2. Create one markdown card per photo story in `src/content/photos/*.md`.
3. Validate with `npm run check` and `npm run build`.
4. For remote LLM development server, use:

```bash
npm run remote:ssh
npm run remote:llm:start
npm run remote:llm:stop
npm run remote:llm:tunnel
npm run remote:llm:check
npm run remote:llm:prompt -- "text prompt"
npm run remote:llm:prompt -- --file prompts/task.txt
npm run remote:llm:prompt -- "analyze file" --context-file CLAUDE.md
```

Or use reusable orchestrator commands from this repo root. All commands below
read connection settings (`REMOTE_HOST`, `REMOTE_USER`, model, etc.) from
`.orch.env` in the repo root — nothing needs to be passed on the command line
for normal use.

### Health check (run this first if something seems broken)

```bash
npm run orch:doctor
```

Checks SSH reachability and that both the project and orchestrator exist on
the remote server.

### One-shot agent tasks

`orch:auto` reads `ORCH_MODE` from `.orch.env` (`local` runs on this Mac,
`remote` runs on the server over SSH — currently `remote`).

```bash
# Generate a step-by-step implementation plan (JSON todoList)
npm run orch:auto -- apply-plan --task "Add one photo story"

# Review the current git diff before committing/publishing
npm run orch:auto -- --output json review-diff --task "Review before publish"

# Free-form instruction, no code changes required
npm run orch:auto -- run-task --task "Release sanity checklist"

# Analyze a set of files by glob pattern
npm run orch:auto -- analyze-project --pattern "src/**/*.astro" --task "Find accessibility issues"

# Analyze a single file
npm run orch:auto -- analyze-file --file src/content.config.ts --task "Check Zod schema for edge cases"
```

### Autonomous multi-step agent run (autopilot)

This is the closest thing to "let an agent do the work": it plans, executes
each step in order, runs `npm run check && npm run build`, then does a final
review — all in one command, on the server.

```bash
npm run orch:autopilot -- --task "Add a new photo story for <city>" --max-steps 8
```

Logs are written to `.orch-logs/autopilot-<timestamp>.log`. Add
`--skip-validate` to skip the check/build step, or `--extra "..."` for extra
constraints.

### Higher-quality answers: Mixture-of-Agents (MoA) consensus

For analysis/review tasks where accuracy matters more than speed, query a
panel of models and let one of them synthesize the best answer (discards
weak/hallucinated claims automatically):

```bash
npm run orch:auto -- --moa review-diff --task "Review before publish"
npm run orch:auto -- --moa analyze-project --pattern "src/**/*.ts" --task "..."
```

Default panel: `tencent/hy3:free`, `poolside/laguna-s-2.1:free`,
`inclusionai/ling-3.0-flash:free` (all free, cloud, zero GPU load on the
server). Override the panel per call, mixing cloud and the server's local
Ollama models (prefix `ollama:`):

```bash
npm run orch:auto -- --moa \
  --moa-panel "tencent/hy3:free,poolside/laguna-s-2.1:free,ollama:deepseek-r1:14b" \
  run-task --task "..."
```

### After changing llm-orchestrator itself

If you edit `llm-orchestrator` source, rebuild locally and sync it to the
server before the changes take effect remotely:

```bash
cd /path/to/llm-orchestrator && npm run build
cd - && npm run orch:remote:setup
```

### Provider/model overrides

Hermes -> Ollama fallback is enabled by default. To disable it for a run:

```bash
npm run orch -- --no-fallback-to-ollama run-task --task "test"
```

Force a specific provider/model for one call:

```bash
npm run orch:auto -- --provider ollama --model deepseek-r1:14b run-task --task "..."
```

5. Optional publish to local web server (only when needed). Real connection
   defaults live in `scripts/sync-to-local.sh`; override via env vars if
   needed:

```bash
REMOTE_HOST=<server-ip> REMOTE_USER=<user> REMOTE_PATH=<path> npm run sync:local
```

Never store secrets in repository files. Use environment variables for any credentials.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
