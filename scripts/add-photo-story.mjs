#!/usr/bin/env node
/**
 * Додає одну або декілька фото-історій в архів з готової папки(ок) з фото.
 *
 * Формат папки-джерела однієї історії:
 *   my-photos/lviv-market-1995/
 *     meta.json
 *     cover.jpg          (або будь-яка інша назва — вкажи в meta.json -> cover)
 *     photo2.jpg
 *     photo3.jpg
 *
 * meta.json (усі поля необов'язкові; якщо їх немає, значення візьмуться з назви папки або з поточної дати):
 *   {
 *     "slug": "lviv-market-square-1995",     (латиницею, унікальний)
 *     "title": "Ринок у неділю",
 *     "date": "1995-06-01",                  (YYYY-MM-DD)
 *     "city": "Львів",
 *     "area": "Площа Ринок",                 (необов'язково)
 *     "decade": "1990-ті",
 *     "description": "Короткий опис для картки в галереї",
 *     "story": "Довший текст під фото (необов'язково, інакше візьме description)",
 *     "tags": ["ринок", "львів"],            (необов'язково)
 *     "cover": "photo2.jpg",                 (необов'язково, інакше перший файл за іменем)
 *     "captions": { "photo2.jpg": "Ратуша" } (необов'язково: підписи окремих фото — для alt, лайтбокса і SEO)
 *   }
 *
 * Використання:
 *   node scripts/add-photo-story.mjs --source ./my-photos/lviv-market-1995
 *   node scripts/add-photo-story.mjs --source ./my-photos            # пакетно: кожна підпапка = історія
 *   node scripts/add-photo-story.mjs --source ./my-photos --dry-run  # показати план, нічого не чіпати
 *   node scripts/add-photo-story.mjs --source ./my-photos --force    # перезаписати, якщо slug вже існує
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PHOTOS_CONTENT_DIR = path.join(ROOT, "src/content/photos");
const PHOTOS_PUBLIC_DIR = path.join(ROOT, "public/photos");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
function parseArgs(argv) {
  const args = { dryRun: false, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--source") args.source = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--force") args.force = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`Використання:
  node scripts/add-photo-story.mjs --source <папка> [--dry-run] [--force]

  <папка> — або одна історія (містить meta.json напряму),
            або батько багатьох історій (кожна підпапка — окрема історія з власним meta.json).

Детальний формат meta.json дивись у коментарі на початку файлу скрипта.`);
}

function isImageFile(name) {
  return IMAGE_EXT.has(path.extname(name).toLowerCase());
}

function isStoryFolder(dir) {
  return existsSync(path.join(dir, "meta.json"));
}

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fallbackSlug(input) {
  const slug = slugify(input);
  if (slug) return slug;

  let hash = 0;
  for (const char of String(input))
    hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  return `photo-story-${hash.toString(36)}`;
}

function isBlank(value) {
  return value == null || String(value).trim() === "";
}

function withDefaults(meta, folderName) {
  const today = new Date().toISOString().slice(0, 10);
  const date = isBlank(meta.date) ? today : String(meta.date).trim();
  const year = String(date).slice(0, 4);
  return {
    ...meta,
    slug: isBlank(meta.slug)
      ? fallbackSlug(folderName)
      : String(meta.slug).trim(),
    title: isBlank(meta.title) ? folderName : String(meta.title).trim(),
    date,
    city: isBlank(meta.city) ? "" : String(meta.city).trim(),
    decade: isBlank(meta.decade)
      ? /^\d{4}$/.test(year)
        ? `${year.slice(0, 3)}0-ті`
        : ""
      : String(meta.decade).trim(),
    description: isBlank(meta.description)
      ? ""
      : String(meta.description).trim(),
  };
}

function validateMeta(meta, folderName) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(meta.date))) {
    throw new Error(
      `[${folderName}] поле "date" має бути у форматі YYYY-MM-DD, отримано: "${meta.date}"`,
    );
  }
  const cleanSlug = slugify(meta.slug);
  if (cleanSlug !== meta.slug) {
    throw new Error(
      `[${folderName}] "slug" має містити тільки латинські літери, цифри й дефіси (напр. "lviv-market-square-1995"), отримано: "${meta.slug}"`,
    );
  }
}

function processStoryFolder(dir, { dryRun, force }) {
  const folderName = path.basename(dir);
  const metaPath = path.join(dir, "meta.json");
  let meta;
  try {
    meta = JSON.parse(readFileSync(metaPath, "utf8"));
  } catch (err) {
    throw new Error(
      `[${folderName}] не вдалось прочитати/розпарсити meta.json: ${err.message}`,
    );
  }

  meta = withDefaults(meta, folderName);
  validateMeta(meta, folderName);

  const images = readdirSync(dir)
    .filter(isImageFile)
    .sort((a, b) => a.localeCompare(b));
  if (images.length === 0) {
    throw new Error(
      `[${folderName}] у папці немає жодного фото (.jpg/.jpeg/.png/.webp)`,
    );
  }

  let coverFile = meta.cover;
  if (coverFile) {
    if (!images.includes(coverFile)) {
      throw new Error(
        `[${folderName}] meta.cover вказує на "${coverFile}", але такого файлу немає в папці`,
      );
    }
  } else {
    coverFile = images[0];
  }
  const restFiles = images.filter((f) => f !== coverFile);

  const slug = meta.slug;
  const publicDir = path.join(PHOTOS_PUBLIC_DIR, slug);
  const contentPath = path.join(PHOTOS_CONTENT_DIR, `${slug}.md`);

  if (!force && (existsSync(publicDir) || existsSync(contentPath))) {
    throw new Error(
      `[${folderName}] slug "${slug}" вже існує (${existsSync(contentPath) ? contentPath : publicDir}). Додай --force, щоб перезаписати, або зміни slug.`,
    );
  }

  const coverExt = path.extname(coverFile).toLowerCase();
  const coverDest = `cover${coverExt}`;
  const restDest = restFiles.map(
    (f, i) => `${i + 1}${path.extname(f).toLowerCase()}`,
  );

  const publicCoverPath = `/photos/${slug}/${coverDest}`;
  const publicImagePaths = restDest.map((d) => `/photos/${slug}/${d}`);

  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  // meta.captions: { "<файл у папці>": "підпис" } → captions за публічними шляхами
  const sourceToPublic = new Map([
    [coverFile, publicCoverPath],
    ...restFiles.map((f, i) => [f, publicImagePaths[i]]),
  ]);
  const captions = Object.entries(meta.captions ?? {})
    .filter(([file, text]) => sourceToPublic.has(file) && !isBlank(text))
    .map(([file, text]) => [sourceToPublic.get(file), String(text).trim()]);
  const story = (meta.story ?? meta.description ?? "").trim();

  const yamlEscape = (s) => String(s).replace(/"/g, '\\"');
  const frontmatterLines = [
    "---",
    `title: "${yamlEscape(meta.title)}"`,
    `date: ${meta.date}`,
    `city: "${yamlEscape(meta.city)}"`,
    ...(meta.area ? [`area: "${yamlEscape(meta.area)}"`] : []),
    `decade: "${yamlEscape(meta.decade)}"`,
    `description: "${yamlEscape(meta.description)}"`,
    `cover: "${publicCoverPath}"`,
    ...(publicImagePaths.length > 0
      ? ["images:", ...publicImagePaths.map((p) => `  - "${p}"`)]
      : ["images: []"]),
    ...(captions.length > 0
      ? [
          "captions:",
          ...captions.map(([p, t]) => `  "${p}": "${yamlEscape(t)}"`),
        ]
      : []),
    "tags:",
    ...tags.map((t) => `  - "${yamlEscape(t)}"`),
    "---",
    "",
    story,
    "",
  ];
  const fileContent = frontmatterLines.join("\n");

  console.log(`\n[${folderName}] → slug "${slug}"`);
  console.log(`  cover:  ${coverFile}  →  public/photos/${slug}/${coverDest}`);
  restFiles.forEach((f, i) =>
    console.log(
      `  фото ${i + 1}: ${f}  →  public/photos/${slug}/${restDest[i]}`,
    ),
  );
  console.log(`  запис:  src/content/photos/${slug}.md`);

  if (dryRun) {
    console.log("  (dry-run, нічого не записано)");
    return { slug, dryRun: true };
  }

  mkdirSync(publicDir, { recursive: true });
  copyFileSync(path.join(dir, coverFile), path.join(publicDir, coverDest));
  restFiles.forEach((f, i) =>
    copyFileSync(path.join(dir, f), path.join(publicDir, restDest[i])),
  );
  writeFileSync(contentPath, fileContent, "utf8");

  return { slug, dryRun: false };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.source) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const source = path.resolve(args.source);
  if (!existsSync(source) || !statSync(source).isDirectory()) {
    console.error(`Помилка: папка не знайдена: ${source}`);
    process.exit(1);
  }

  const storyFolders = isStoryFolder(source)
    ? [source]
    : readdirSync(source)
        .map((name) => path.join(source, name))
        .filter((p) => statSync(p).isDirectory() && isStoryFolder(p));

  if (storyFolders.length === 0) {
    console.error(
      `Помилка: у "${source}" не знайдено meta.json ані напряму, ані в підпапках.\nПеревір формат — дивись коментар на початку скрипта.`,
    );
    process.exit(1);
  }

  console.log(
    `Знайдено історій: ${storyFolders.length}${args.dryRun ? " (dry-run)" : ""}`,
  );

  const ok = [];
  const failed = [];
  for (const dir of storyFolders) {
    try {
      ok.push(processStoryFolder(dir, args));
    } catch (err) {
      failed.push({ dir, message: err.message });
      console.error(`\n✗ ${err.message}`);
    }
  }

  console.log(
    `\n— Готово: ${ok.length} успішно, ${failed.length} з помилками —`,
  );
  if (!args.dryRun && ok.length > 0) {
    console.log(
      `\nДалі: перевір результат (npm run dev), тоді:\n  git add src/content/photos public/photos\n  git commit -m "Додати фото-історії: ${ok.map((o) => o.slug).join(", ")}"\n  git push`,
    );
  }
  if (failed.length > 0) process.exit(1);
}

main();
