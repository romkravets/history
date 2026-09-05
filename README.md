# History Archive

An Astro-based static photo archive for documenting towns, landmarks, and
local history. Photos and their metadata live in the repository as Markdown
and static assets, so every story is versioned, reviewable, and deployable to
GitHub Pages.

## Features

- Gallery of all photo stories on the home page.
- Dedicated page with a lightbox viewer for every story.
- Markdown content with structured frontmatter.
- Automatic photo-story generation from an incoming folder.
- Git LFS support for large image files.
- Automatic deployment to GitHub Pages after pushing to `main`.
- Optional remote LLM access through the server at `192.168.88.246`.

## Quick Start

Requirements: Node.js `>=22.12.0` and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Astro. Run the project checks with:

```bash
npm run check
npm run build
```

## Project Structure

```text
src/content/photos/*.md     # Photo-story metadata and text
public/photos/*             # Photo assets served by the site
photos-incoming/*           # Folders waiting to be imported
scripts/add-photo-story.mjs # Photo-story import tool
```

## Add a Photo Story

Create a folder with one or more images and a `meta.json` file:

```bash
mkdir -p photos-incoming/my-story
cp photos-incoming/meta.example.json photos-incoming/my-story/meta.json
```

The metadata fields are optional. Missing values receive defaults; `slug`,
`title`, and the date can be generated automatically. Set `decade` explicitly
when the historical period is not the current decade.

Preview the import first:

```bash
npm run photos:add -- --source photos-incoming/my-story --dry-run
```

Import the photos and generate the Markdown entry:

```bash
npm run photos:add -- --source photos-incoming/my-story
```

Use `--force` to regenerate an existing story. The importer places the cover
at `public/photos/<slug>/cover.jpg`, additional images in the same folder,
and creates `src/content/photos/<slug>.md`.

After importing, run:

```bash
npm run check
npm run build
```

Then commit the generated content and assets:

```bash
git add src/content/photos public/photos
git commit -m "Add photo story: my-story"
git push
```

GitHub Actions builds and deploys the site after a push to `main`.

## Git LFS

Use Git LFS for image files:

```bash
git lfs install
git lfs track "*.jpg" "*.jpeg" "*.png" "*.webp" "*.tif" "*.tiff"
git add .gitattributes
```

## Remote LLM Server

The project can use the local models or OpenAI-compatible API on the remote
server. The helper scripts use `.orch.env` for the SSH and runtime settings.

```bash
npm run remote:ssh
npm run remote:llm:start
npm run remote:llm:check
npm run remote:llm:prompt -- "Describe this archival photo"
npm run remote:llm:stop
```

The separate `llm-server-orchestrator` repository can run implementation tasks
against this project in an isolated Git worktree. Each run should be checked
with `npm run check` and `npm run build` before approval.

## Documentation

For the complete Ukrainian instructions, continue with the Ukrainian section
below. The importer also documents the full `meta.json` format in its source
comment and in `photos-incoming/README.md`.

---

## Українська версія

Статичний фотоархів міста й околиць на `Astro + Markdown + GitHub Pages + Git LFS`.

## Що вже є

- галерея на головній сторінці;
- окрема сторінка для кожного фото;
- контент зберігається у git як Markdown;
- автоматичний деплой на GitHub Pages;
- інтеграція з віддаленим локальним LLM-сервером через SSH tunnel.

## Локальний запуск

```bash
npm install
npm run dev
```

## Структура контенту

```text
src/content/photos/*.md     # метадані фото
public/photos/*             # оригінали/оптимізовані фото
```

Приклад frontmatter для одного фото (те, що генерується автоматично скриптом нижче — вручну писати не треба):

```md
---
title: "Вокзал після дощу"
date: 1988-04-12
city: "Тернопіль"
area: "Центр"
decade: "1980-ті"
description: "Вечірнє світло, перони й трамвайний шум."
cover: "/photos/ternopil-station-1988/cover.jpg"
images:
	- "/photos/ternopil-station-1988/1.jpg"
	- "/photos/ternopil-station-1988/2.jpg"
tags: ["вокзал", "місто", "побут"]
---

Коротка історія кадру, джерело або коментар свідка.
```

## Як додати фото в галерею на головній сторінці

Галерея на `/` (файл `src/pages/index.astro`) автоматично показує **всі** записи
з `src/content/photos/`, у зворотньому хронологічному порядку. Щоб додати нове
фото — не редагуй `index.astro` напряму, а додай новий запис у контент, і воно
з'явиться в галереї само.

Рекомендований спосіб — скрипт `scripts/add-photo-story.mjs`, який сам розкладає
фото по потрібних папках і генерує Markdown-запис.

### Крок за кроком

1. Створи підпапку в `photos-incoming/`, наприклад:

   ```bash
   mkdir -p photos-incoming/lviv-market-1995
   ```

2. Поклади туди фото (`.jpg`, `.jpeg`, `.png`, `.webp` — скільки завгодно штук).

3. Скопіюй туди шаблон опису і заповни його:

   ```bash
   cp photos-incoming/meta.example.json photos-incoming/lviv-market-1995/meta.json
   ```

   Обов'язкові поля: `slug` (латиницею, унікальний), `title`, `date`
   (`YYYY-MM-DD`), `city`, `decade`, `description`. Необов'язкові: `area`,
   `story`, `tags`, `cover` (яке саме фото зробити обкладинкою — інакше
   візьме перше за іменем файлу).

4. Перевір план, нічого поки не змінюючи:

   ```bash
   npm run photos:add -- --source photos-incoming/lviv-market-1995 --dry-run
   ```

5. Якщо все виглядає правильно — застосуй по-справжньому:

   ```bash
   npm run photos:add -- --source photos-incoming/lviv-market-1995
   ```

6. Перевір результат локально:

   ```bash
   npm run dev
   ```

   Нове фото має з'явитись першим у галереї на `/` (сортування за датою).

7. Закомить і запуш:

   ```bash
   git add src/content/photos public/photos
   git commit -m "Додати фото-історію: lviv-market-1995"
   git push
   ```

   Після push у `main` GitHub Actions сам збере й задеплоїть сайт
   (`.github/workflows/deploy-pages.yml`).

### Додати декілька фото-історій за раз

Створи декілька підпапок (кожна зі своїм `meta.json`) просто в
`photos-incoming/` і вкажи в `--source` саму цю папку — скрипт знайде й
обробить кожну підпапку окремо, продовжуючи навіть якщо одна з них містить
помилку (звітує окремо по кожній):

```bash
npm run photos:add -- --source photos-incoming --dry-run
npm run photos:add -- --source photos-incoming
```

Повний опис формату `meta.json` і всіх прапорців скрипта — в коментарі на
початку `scripts/add-photo-story.mjs`, і в `photos-incoming/README.md`.

## Git LFS для фото

1. Встановити LFS один раз:

```bash
git lfs install
```

2. Ініціалізувати трекінг (якщо ще не зроблено):

```bash
git lfs track "*.jpg" "*.jpeg" "*.png" "*.webp" "*.tif" "*.tiff"
git add .gitattributes
```

## Публікація на GitHub Pages

Workflow знаходиться у `.github/workflows/deploy-pages.yml`.

Після push у `main`:

- сайт збирається командою `npm run build`;
- артефакт публікується на Pages;
- base path автоматично підлаштовується під ім'я репозиторію.

## Віддалений LLM-сервер для розробки (192.168.88.246)

Сервер можна використовувати як dev-ресурс для локальних моделей (Ollama або OpenAI-compatible API), а не як хостинг архіву.

### 1) Відкрити SSH shell

```bash
npm run remote:ssh
```

### 2) Підняти SSH tunnel до LLM API

Швидкий варіант (background + health-check однією командою):

```bash
npm run remote:llm:start
```

Зупинити tunnel:

```bash
npm run remote:llm:stop
```

Ручний режим (утримує поточний термінал відкритим):

```bash
npm run remote:llm:tunnel
```

За замовчуванням це прокидає:

- `localhost:11434` (твій Mac) -> `127.0.0.1:11434` (сервер)

Можна перевизначити порти:

```bash
LLM_LOCAL_PORT=11435 LLM_REMOTE_PORT=11434 npm run remote:llm:tunnel
```

### 3) Перевірити endpoint

```bash
npm run remote:llm:check
```

### 4) Надіслати промпт прямо з термінала

```bash
npm run remote:llm:prompt -- "Сформуй короткий опис архівного фото вокзалу 1988 року українською мовою"
```

Або з файлу (зручно для довгих інструкцій):

```bash
npm run remote:llm:prompt -- --file prompts/archive-story.txt
```

Аналіз конкретного локального файлу (файл передається в prompt як контекст):

```bash
npm run remote:llm:prompt -- "Проаналізуй цей файл і дай список ризиків" --context-file CLAUDE.md
```

Кілька файлів одразу:

```bash
npm run remote:llm:prompt -- "Порівняй інструкції" --context-file CLAUDE.md --context-file AGENTS.md
```

Опційно можна змінити модель і system prompt:

```bash
LLM_MODEL=qwen2.5-coder:7b LLM_SYSTEM_PROMPT="Ти лаконічний редактор архіву" npm run remote:llm:prompt -- "Створи title і 5 tags для фото"
```

Після цього агенти/скрипти можуть звертатись до локального URL:

- `http://127.0.0.1:11434/api/tags` (Ollama)
- або `http://127.0.0.1:11434/v1/models` (OpenAI-compatible)

## Опційно: синк архіву на локальний веб-сервер

Скрипт: `scripts/sync-to-local.sh`

```bash
REMOTE_HOST=192.168.88.246 REMOTE_USER=adminr REMOTE_PATH=/var/www/history-archive npm run sync:local
```

Скрипт робить:

1. `npm run build`
2. `rsync dist/` на твій сервер по SSH

Вимоги:

- сервер має приймати SSH доступ;
- встановлений `rsync` на Mac і сервері;
- бажано SSH ключ без пароля для автоматизації.

## Агентний workflow (Copilot/Claude/інший агент)

Рекомендований цикл:

1. Кладеш фото в `photos-incoming/<назва>/` разом із заповненим `meta.json`
   (шаблон: `photos-incoming/meta.example.json`)
2. Просиш агента виконати `npm run photos:add -- --source photos-incoming/<назва>`
   (скрипт `scripts/add-photo-story.mjs` сам розкладає фото і генерує
   Markdown у `src/content/photos/...` — детально в розділі
   ["Як додати фото в галерею"](#як-додати-фото-в-галерею-на-головній-сторінці) вище)
3. Агент запускає `npm run check` і `npm run build`
4. Коміт у git
5. Автодеплой на Pages або `npm run sync:local` для локального стенду

## Orchestrator: керування з Mac, виконання на сервері

Ти можеш керувати командами з Mac (Copilot або Claude Code), але виконувати їх на сервері, щоб використовувати серверні CPU/RAM/моделі.

### Швидкий старт за 1 хвилину

1. Відкрий UI-майстер:

npm run orch:ui

2. У меню:

- 2. вкажи SSH і шляхи на сервері
- 3. вкажи джерело orchestrator:
  - або ORCH_GIT_URL (git URL),
  - або ORCH_LOCAL_DIR (локальна папка, яку синкнемо на сервер)
- 4. Setup orchestrator on server
- 1. Set mode = remote

3. Запускай через єдину команду:

npm run orch:auto -- apply-plan --task "Add one photo story"

Якщо щось не працює, запусти діагностику:

npm run orch:doctor

Де зберігаються налаштування цього репозиторію:

- файл [history/.orch.env.example](history/.orch.env.example) як шаблон
- твій реальний файл [history/.orch.env](history/.orch.env) (ігнорується git)

### Локальне виконання (на Mac)

```bash
npm run orch -- apply-plan --task "Add one photo story"
```

### Remote виконання (команда з Mac -> виконується на сервері)

1. Підготувати orchestrator на сервері:

ORCH_GIT_URL=git@github.com:<org>/llm-orchestrator.git npm run orch:remote:setup

Або без git URL (через sync локальної папки orchestrator):

ORCH_LOCAL_DIR=/Users/romkravets/Documents/GitHub/llm-orchestrator npm run orch:remote:setup

2. Запускати команди remote:

npm run orch:remote -- apply-plan --task "Add one photo story"
npm run orch:remote -- --output json review-diff --task "Review before publish"

### Важливі env-перемінні для remote

- `REMOTE_HOST` (default `192.168.88.246`)
- `REMOTE_USER` (default `hermes-agent`)
- `SSH_PORT` (default `22`)
- `REMOTE_PROJECT_DIR` (default `/home/hermes-agent/projects/history`)
- `REMOTE_ORCH_DIR` (default `/home/hermes-agent/projects/llm-orchestrator`)

Приклад з перевизначенням шляху проекту на сервері:

REMOTE_PROJECT_DIR=/home/hermes-agent/projects/history npm run orch:remote -- run-task --task "Release checklist"

### Вибір інструмента керування

- Copilot у VS Code: запускаєш ті ж `npm run orch:*` команди у терміналі.
- Claude Code: запускаєш ті ж `npm run orch:*` команди у Claude Code terminal.

Тобто точка керування однакова, відрізняється лише клієнт, а виконання може бути local або remote за вибором.

## Детальна інструкція: команда за командою

Нижче інструкція саме під поточний стан сервера:

- SSH працює
- на сервері ще немає Node.js
- repo history ще не клоновано

### Етап 0. Один раз на Mac

1. Переконайся, що ти в repo history:

cd /Users/romkravets/Documents/GitHub/history

2. Переконайся, що оркестратор є локально:

ls /Users/romkravets/Documents/GitHub/llm-orchestrator

3. Перевір локальні налаштування:

npm run orch:doctor

Якщо хочеш підключити цей самий orchestrator до іншого репозиторію, просто скопіюй ті самі `scripts/orch*.sh`, `package.json`-скрипти та свій `.orch.env`, а потім зміни `REMOTE_PROJECT_DIR` / `ORCH_CONFIG_FILE` під новий repo.

### Етап 1. Підготувати сервер (Node.js + папка проекту)

1. Підключись до сервера:

npm run remote:ssh

2. Встанови Node.js через nvm (без sudo):

export NVM_DIR="$HOME/.nvm"
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source "$HOME/.nvm/nvm.sh"
nvm install --lts
nvm alias default lts/*
node -v
npm -v

3. Якщо `history` вже клонований на сервері, просто перейди в його папку.
   Якщо ні — клонуй його один раз у будь-який зручний шлях.

   Приклад для вже існуючого clone:

cd /home/hermes-agent/projects/history

4. Постав залежності history на сервері:

npm install

Примітка: якщо repo вже існує, цей крок лише оновить залежності.
Якщо git URL приватний, переконайся, що ssh-ключі на сервері мають доступ.

### Етап 2. Підготувати orchestrator на сервері

Варіант A (рекомендовано, якщо `llm-orchestrator` вже є на Mac і сервері потрібна копія): sync з Mac

cd /Users/romkravets/Documents/GitHub/history
ORCH_LOCAL_DIR=/Users/romkravets/Documents/GitHub/llm-orchestrator npm run orch:remote:setup

Варіант B: git clone / pull на сервері за `ORCH_GIT_URL`

cd /Users/romkravets/Documents/GitHub/history
ORCH_GIT_URL=git@github.com:<org>/llm-orchestrator.git npm run orch:remote:setup

### Етап 3. Увімкнути remote-режим у цьому repo

1. Відкрий UI:

npm run orch:ui

2. Далі:

- 1. Set mode = remote
- 2. Перевір REMOTE_HOST і REMOTE_PROJECT_DIR
- 4. Setup orchestrator on server (запускай, якщо треба оновити orchestrator на сервері)
- 6. Run doctor checks

3. Перевір діагностику:

npm run orch:doctor

Очікувано має бути ok для ssh, remote project dir, remote orchestrator dir.

Якщо `history` вже клонований на сервері, то головне правило таке:

1. У `.orch.env` вистав `REMOTE_PROJECT_DIR` на реальний шлях цього клонованого repo, наприклад `/home/hermes-agent/projects/history`.
2. Не роби окремий clone крок, якщо папка вже існує.
3. Запускай `npm run orch:auto ...` або `npm run orch:remote ...`.

### Етап 4. Щоденна робота (одна точка входу)

Всі команди запускай через auto:

npm run orch:auto -- apply-plan --task "Add one photo story"
npm run orch:auto -- --output json review-diff --task "Review before publish"
npm run orch:auto -- run-task --task "Release checklist"

### Етап 5. Коли потрібен локальний режим

1. Перемкни mode у UI (1 -> local), або зміни .orch.env:

ORCH_MODE=local

2. Запускай ті самі команди:

npm run orch:auto -- apply-plan --task "Add one photo story"

## Схема роботи всієї збірки

1. Керування:

- Copilot terminal або Claude Code terminal на Mac

2. Диспетчер режиму:

- scripts/orch-auto.sh читає .orch.env
- ORCH_MODE=local -> scripts/orch.sh
- ORCH_MODE=remote -> scripts/orch-remote.sh

3. Виконання:

- local: llm-orchestrator працює на Mac
- remote: llm-orchestrator запускається на сервері по SSH

4. Модельний шар:

- provider hermes або ollama
- fallback hermes -> ollama при помилці hermes

5. Результати:

- текстовий режим для людини
- json режим для CI/автоматизації

## Як використовувати в CI

Приклад логіки:

1. На CI runner (або self-hosted) викликаєш remote-режим.
2. Береш --output json.
3. Парсиш поле ok/fallbackUsed/response.
4. Фейлиш pipeline, якщо знайдено critical issue за твоїм правилом.

Практичний шаблон:

npm run orch:auto -- --output json review-diff --task "Pre-merge review"

## Що покращити далі

1. Додати команду orch:remote:bootstrap:

- автоінсталяція nvm/node
- auto clone history
- auto setup orchestrator

2. Додати output strict-schema для review-diff:

- findings масив з severity/code/file/line
- простий парсинг у CI

3. Додати профілі .orch.env для кількох repo:

- .orch.history.env
- .orch.seo-anal.env
- перемикач через ORCH_CONFIG_FILE

4. Додати remote health command:

- перевірка node/hermes/ollama
- latency та короткий smoke prompt

5. Додати locking для remote setup:

- щоб одночасні запуски не ламали install/build
