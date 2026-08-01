# History Archive

Статичний фотоархів міста й околиць на `Astro + Markdown + GitHub Pages + Git LFS`.

## Що вже є

- галерея на головній сторінці;
- окрема сторінка для кожного фото;
- контент зберігається у git як Markdown;
- автоматичний деплой на GitHub Pages;
- синхронізація з локальним сервером через `rsync`.

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

Приклад frontmatter для одного фото:

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

## Синк на локальний сервер 192.168.88.246

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

1. Додаєш фото у `public/photos/...`
2. Просиш агента згенерувати Markdown у `src/content/photos/...`
3. Агент запускає `npm run check` і `npm run build`
4. Коміт у git
5. Автодеплой на Pages або `npm run sync:local` для локального стенду
