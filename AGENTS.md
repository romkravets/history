## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Agent Workflow For This Repository

The main task in this repo: the user gives a path to a raw photo folder
(usually Google Drive, often with subfolders, duplicates and junk) and asks to
add it to the archive. Full human-facing description: README → «Робота з ШІ
покроково». Follow these rules:

1. **Audit first.** `.venv/bin/python scripts/audit-photos.py "<folder>" --out audit-out`
   (create `.venv` from `scripts/requirements.txt` if missing). It compares every
   image, including subfolders, against `public/photos` by perceptual hash, lists
   in-folder duplicates and renders `audit-out/sheet_N.jpg` thumbnail sheets of
   NEW images. Distance ≤ 10 = already in archive; 11–14 = check visually.
2. **Look at the sheets** (Read the images). Identify places; drop junk (memes,
   web screenshots, icons, puzzles, unrelated towns), tiny images (≤ 300 px) and
   in-folder duplicates (keep the larger one). Compare borderline pairs side by side.
3. **Sort by theme.** Append to existing galleries with
   `npm run photos:append -- --slug <slug> --list list.json` (supports captions),
   create new ones with `npm run photos:add -- --source photos-incoming/<slug>`
   and a `meta.json` (see `scripts/add-photo-story.mjs` header). Images > 1600 px
   are downscaled automatically (maps: `--max 2400`).
4. **Texts.** Ukrainian. Title, description, `decade`, tags, per-photo `captions`,
   `location` (coordinates from OpenStreetMap/Nominatim; `approximate: true` if not
   exact; `location: false` for galleries not tied to one place). Do not invent
   facts: research, cite sources in a `## Джерела` section, mark uncertain things
   as approximate or leave them out. Read `.docx`/`.pdf` from the folder if present.
5. **Authored photos** (watermarks, named series) — only with the author's
   permission, which the user must confirm; credit the author in title/description.
6. **Validate:** `npm run check` (0 errors) and `npm run build`.
7. **Report** to the user: what was added where, what was skipped and why, what
   you are unsure about. **Do not commit or push** — the user does that.
   Remind that every push redeploys all photos on Vercel (storage limits), so
   batching several imports into one push is better.

For a new city/archive based on this template see README → «Як запустити
шаблон для свого архіву» (settings live in `src/lib/site.ts`).

Optional: remote LLM development server (details in `docs/remote-llm.md`):

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

### Recommended for real changes: history-agent (LangGraph)

For actually writing content (not just plans/analysis), prefer
[`llm-server-orchestrator`](https://github.com/romkravets/llm-server-orchestrator)
over `execute-task` below. It's a real tool-calling agent (explores the repo,
writes files, runs `check`/`build`, self-corrects if validation fails —
not a single-shot generation), running for free against the server's local
`gpt-oss:20b` via Ollama, deployed at
`/home/hermes-agent/projects/history-agent` on the server.

```bash
ssh hermes-agent@192.168.88.246
cd /home/hermes-agent/projects/history-agent
uv run python cli.py "Add a new photo story for <city>"
```

**Dev cycle, not just codegen:** before you ever see it, the change goes
through three distinct roles, each a different model so none of them
reviews its own work:

```
Implementer (gpt-oss:20b)   — explores, writes files, runs check/build
     ↓
Reviewer    (deepseek-r1:14b) — critiques the diff: bugs, regressions, schema issues
     ↓
Security    (qwen2.5-coder:7b) — scans the diff for security-relevant issues only
     ↓
You                          — final approval, in the terminal
```

The terminal prints all three reports plus the real `git diff` (ground
truth — shown even if a model's self-report comes back empty), then asks
`Схвалити? [y/N]:`. `y` commits, merges into `main`, pushes to GitHub, and
removes the worktree — nothing else to run afterward. Anything else
discards the worktree and branch, no leftovers.

After approving, the same **dev-server-doesn't-auto-refresh** gotcha
applies (see below) — restart it to see the change on `localhost:4321`.

To update the agent itself: edit it in
`/Users/romkravets/Documents/GitHub/history-agent` on the Mac, commit/push,
then `rsync` the changed files to
`hermes-agent@192.168.88.246:/home/hermes-agent/projects/history-agent/`
(no build step — it's plain Python, `uv sync` only needed if dependencies
in `pyproject.toml` changed).

### Real file changes via the JS orchestrator (execute-task)

Older path, still works, single-shot generation instead of an iterative
agent loop. Unlike every command above (which only return text —
plans/analysis/review), `execute-task` actually writes files. It generates
full file contents, writes them into an isolated git worktree on the server
(never touches `main` directly), and runs `npm run check`/`build` there for
real.

```bash
npm run orch:auto -- --output json execute-task \
  --task "Add a new photo story for <city>" \
  --pattern "src/content/photos/*.md"
```

`--pattern` is optional — include it when the model needs to see existing
files (e.g. to follow the same frontmatter shape) rather than just create
something new from scratch.

The JSON output includes `promptMeta.worktree` (absolute path on the server)
and `promptMeta.branch`. **Nothing is committed automatically.** Review and
merge it yourself, over SSH on the server (see cheat sheet below).

### Server-side review/merge cheat sheet

The server's default shell is restricted (`rbash`) — `cd` only works inside
`bash -lc "..."`. One-liner from the Mac (no need to open an interactive SSH
session):

```bash
ssh hermes-agent@192.168.88.246 'bash -lc "cd /home/hermes-agent/projects/history/.orch-worktrees/<id> && git status && git diff"'
```

If you're already inside an SSH session on the server (prompt shows
`hermes-agent@llmserver`), drop the outer `ssh` — just run the `bash -lc "..."`
part directly.

Once you've reviewed the diff and are happy with it, land it — commit, merge
into `main`, push to GitHub, and remove the worktree, all in one command **run
from the Mac** (no manual SSH needed for this part):

```bash
npm run orch:auto -- --output json land-task --id <id> --message "Describe the change"
```

- `--id` is the worktree id from `execute-task`'s output (the number in
  `.orch-worktrees/<id>`).
- `--message` is only needed if the worktree has uncommitted changes (it
  always will, right after `execute-task`).
- Push is on by default; add `--no-push` to merge locally on the server
  without publishing to GitHub yet.
- Add `--keep-worktree` to leave the worktree in place instead of removing it.

If you'd rather do each step by hand (e.g. to amend the commit first), the
manual equivalent is:

```bash
bash -lc "
cd /home/hermes-agent/projects/history/.orch-worktrees/<id>
git add -A
git commit -m 'Describe the change'
cd /home/hermes-agent/projects/history
git merge orch/<id> --no-edit
git push origin main
git worktree remove .orch-worktrees/<id>
"
```

`git commit` alone does **not** make the change visible anywhere, and merging
into the server's local `main` does **not** publish it to GitHub — each step
only does what it says. Skipping `git push` (either via `--no-push` or by
hand) means the change stays on the server only, invisible on GitHub and on
any other clone until someone pushes it.

**Known gotcha:** Astro's content-collection watcher does not always notice
files that appear via `git merge` (as opposed to a direct edit). If the new
content doesn't show up on `localhost:4321` after merging, restart the dev
server to force a fresh sync:

```bash
ssh hermes-agent@192.168.88.246 'bash -lc "
source \$HOME/.nvm/nvm.sh >/dev/null 2>&1 || true
export PATH=\$HOME/.local/bin:\$PATH
cd /home/hermes-agent/projects/history
astro dev stop
npm run dev -- --background
"'
```

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
