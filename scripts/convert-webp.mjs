#!/usr/bin/env node
/**
 * Переводить фото архіву у WebP і оновлює шляхи в контенті.
 *
 *   npm run photos:webp -- --dry-run     # лише порахувати економію
 *   npm run photos:webp                  # конвертувати все в public/photos
 *   npm run photos:webp -- --slug kremenets-churches   # одну галерею
 *
 * - довга сторона ≤ 1600 px (галереї з картами — ≤ 2400 px, див. LARGE);
 * - якість 75, EXIF-поворот застосовується;
 * - оригінал (.jpg/.jpeg/.png) видаляється, у src/content/**.md шлях
 *   /photos/<slug>/<n>.jpg → /photos/<slug>/<n>.webp (обкладинки, фото, підписи, портрети).
 * Повторний запуск безпечний: уже сконвертовані файли пропускаються.
 */
import { readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PHOTOS = path.join(ROOT, "public/photos");
const CONTENT = path.join(ROOT, "src/content");
const LARGE = new Set(["old-maps-volhynia", "castles-reconstructions"]); // карти й реконструкції — дрібні деталі
const EXT = /\.(jpe?g|png)$/i;

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry-run");
const only = argv.includes("--slug") ? argv[argv.indexOf("--slug") + 1] : null;

const dirs = readdirSync(PHOTOS).filter(
  (d) => statSync(path.join(PHOTOS, d)).isDirectory() && (!only || d === only),
);

let before = 0;
let after = 0;
let count = 0;
const renamed = new Map(); // "/photos/slug/1.jpg" -> "/photos/slug/1.webp"

for (const dir of dirs) {
  const max = LARGE.has(dir) ? 2400 : 1600;
  for (const file of readdirSync(path.join(PHOTOS, dir))) {
    if (!EXT.test(file)) continue;
    const src = path.join(PHOTOS, dir, file);
    const name = file.replace(EXT, ".webp");
    const out = path.join(PHOTOS, dir, name);
    const size = statSync(src).size;
    const buf = await sharp(src)
      .rotate()
      .resize(max, max, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75, effort: 5 })
      .toBuffer();
    before += size;
    after += buf.length;
    count += 1;
    renamed.set(`/photos/${dir}/${file}`, `/photos/${dir}/${name}`);
    if (!DRY) {
      writeFileSync(out, buf);
      unlinkSync(src);
    }
  }
  process.stdout.write(".");
}

// оновити посилання в контенті
let filesChanged = 0;
const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = path.join(d, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".md") ? [p] : [];
  });
for (const md of walk(CONTENT)) {
  const text = readFileSync(md, "utf8");
  const next = text.replace(/\/photos\/[^"'\s)]+\.(?:jpe?g|png)/gi, (m) => renamed.get(m) ?? m);
  if (next !== text) {
    filesChanged += 1;
    if (!DRY) writeFileSync(md, next, "utf8");
  }
}

const mb = (b) => (b / 1048576).toFixed(1);
console.log(
  `\n${DRY ? "(dry-run) " : ""}${count} фото: ${mb(before)} МБ → ${mb(after)} МБ ` +
    `(−${before ? Math.round((1 - after / before) * 100) : 0}%); оновлено файлів контенту: ${filesChanged}`,
);
