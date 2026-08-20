# Сюди кидай фото перед додаванням в архів

Ця папка — "вхідна зона", вона в `.gitignore` і ніколи не потрапить в git сама по собі.

## Як додати одну історію

1. Створи тут підпапку, наприклад `photos-incoming/lviv-market-1995/`
2. Поклади в неї фото (`.jpg`, `.jpeg`, `.png`, `.webp`) — скільки завгодно
3. Скопіюй `meta.example.json` → `meta.json` в ту саму підпапку, заповни поля
4. Запусти:
   ```
   npm run photos:add -- --source photos-incoming/lviv-market-1995 --dry-run
   ```
   Перевір план у виводі. Якщо все ок — прибери `--dry-run` і запусти ще раз.

## Як додати багато історій одразу (пакетно)

Створи декілька підпапок (кожна — своя історія, свій `meta.json`) прямо тут,
і вкажи в `--source` саму `photos-incoming/` — скрипт сам знайде кожну підпапку
з `meta.json` і обробить усі за один раз:

```
npm run photos:add -- --source photos-incoming --dry-run
npm run photos:add -- --source photos-incoming
```

Після успішного додавання результат лежить у `src/content/photos/*.md`
та `public/photos/<slug>/` — вхідну підпапку в `photos-incoming/` можна видалити.

Повний опис полів `meta.json` — у коментарі на початку
`scripts/add-photo-story.mjs`.
