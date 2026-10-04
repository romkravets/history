#!/usr/bin/env node
/**
 * Дописує фото в кінець НАЯВНОЇ галереї (photos:add уміє лише створювати нові).
 *
 * Використання:
 *   node scripts/append-photos.mjs --slug kremenets-churches --source ./папка [--dry-run]
 *   node scripts/append-photos.mjs --slug kremenets-churches --list files.json [--dry-run]
 *
 * --source  додати всі зображення з папки (за алфавітом), без підписів
 * --list    JSON-масив [{ "file": "/шлях/до/фото.jpg", "caption": "Підпис" }, ...]
 *           — так додаються вибрані фото з різних місць і з підписами
 * --max     найбільша сторона в пікселях (типово 1600; для карт — 2000–2400)
 *
 * Фото зберігаються як WebP (якість 75); більші за --max — зменшуються.
 * Нумерація продовжує наявну (якщо в галереї є 1..27, нові стануть 28, 29, …).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const args = { max: 1600, dryRun: false };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--slug") args.slug = argv[++i];
  else if (a === "--source") args.source = argv[++i];
  else if (a === "--list") args.list = argv[++i];
  else if (a === "--max") args.max = Number(argv[++i]);
  else if (a === "--dry-run") args.dryRun = true;
}
if (!args.slug || (!args.source && !args.list)) {
  console.error("Використання: --slug <галерея> (--source <папка> | --list <files.json>) [--max 1600] [--dry-run]");
  process.exit(1);
}

const mdPath = path.join(ROOT, "src/content/photos", `${args.slug}.md`);
const pubDir = path.join(ROOT, "public/photos", args.slug);
if (!existsSync(mdPath)) {
  console.error(`Галерею не знайдено: ${mdPath}`);
  process.exit(1);
}

const items = args.list
  ? JSON.parse(readFileSync(args.list, "utf8"))
  : readdirSync(args.source)
      .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((f) => ({ file: path.join(args.source, f), caption: "" }));

const md = readFileSync(mdPath, "utf8");
const fmEnd = md.indexOf("\n---", 4);
const lines = md.slice(0, fmEnd).split("\n");
const body = md.slice(fmEnd);

const re = new RegExp(`^  - "/photos/${args.slug}/(\\d+)\\.\\w+"$`);
const nums = lines.map((l) => l.match(re)?.[1]).filter(Boolean).map(Number);
let n = nums.length ? Math.max(...nums) : 0;
let lastImg = lines.reduce((acc, l, i) => (re.test(l) ? i : acc), -1);
if (lastImg < 0) {
  // галерея без додаткових фото: замінюємо "images: []" на список
  const i = lines.findIndex((l) => l.startsWith("images:"));
  lines[i] = "images:";
  lastImg = i;
}

const yaml = (s) => String(s).replace(/"/g, '\\"');
const newImgs = [];
const newCaps = [];
for (const { file, caption } of items) {
  n += 1;
  const meta = await sharp(file).metadata();
  const big = Math.max(meta.width ?? 0, meta.height ?? 0) > args.max;
  const name = `${n}.webp`;
  const pub = `/photos/${args.slug}/${name}`;
  console.log(`  ${path.basename(file)} → ${pub}${big ? ` (зменшено до ${args.max}px)` : ""}${caption ? `  «${caption}»` : ""}`);
  if (!args.dryRun) {
    await sharp(file)
      .rotate()
      .resize(args.max, args.max, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75, effort: 5 })
      .toFile(path.join(pubDir, name));
  }
  newImgs.push(`  - "${pub}"`);
  if (caption) newCaps.push(`  "${pub}": "${yaml(caption)}"`);
}

lines.splice(lastImg + 1, 0, ...newImgs);
if (newCaps.length) {
  const tagsAt = lines.findIndex((l) => l.startsWith("tags:"));
  const insertAt = tagsAt >= 0 ? tagsAt : lines.length;
  if (lines.some((l) => l === "captions:")) lines.splice(insertAt, 0, ...newCaps);
  else lines.splice(insertAt, 0, "captions:", ...newCaps);
}

if (args.dryRun) console.log(`\n(dry-run) Було б додано ${items.length} фото в ${args.slug}`);
else {
  writeFileSync(mdPath, lines.join("\n") + body, "utf8");
  console.log(`\nДодано ${items.length} фото в ${args.slug}`);
}
