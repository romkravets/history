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

Or use reusable orchestrator commands from this repo root:

```bash
npm run orch -- apply-plan --task "Add one photo story"
npm run orch -- --output json review-diff --task "Review before publish"
npm run orch -- --output json run-task --task "Release sanity checklist"
npm run orch:auto -- apply-plan --task "Add one photo story"
npm run orch:ui
```

Remote execution from Mac (actual execution on server resources):

```bash
ORCH_GIT_URL=git@github.com:<org>/llm-orchestrator.git npm run orch:remote:setup
npm run orch:remote -- apply-plan --task "Add one photo story"
npm run orch:remote -- --output json review-diff --task "Review before publish"
```

Useful remote env overrides:

```bash
REMOTE_HOST=192.168.88.246
REMOTE_USER=adminr
REMOTE_PROJECT_DIR=/var/www/history-archive
REMOTE_ORCH_DIR=/opt/llm-orchestrator
```

Hermes -> Ollama fallback is enabled by default. To disable it for a run:

```bash
npm run orch -- --no-fallback-to-ollama run-task --task "test"
```

5. Optional publish to local web server (only when needed):

```bash
REMOTE_HOST=192.168.88.246 REMOTE_USER=adminr REMOTE_PATH=/var/www/history-archive npm run sync:local
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
