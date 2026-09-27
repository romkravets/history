#!/usr/bin/env node

import { execFileSync } from "node:child_process";
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
const DEFAULT_OUTPUT = path.join(ROOT, "photos-incoming");
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const DESCRIPTION_NAMES = new Set([
  "description.txt",
  "description.md",
  "опис.txt",
  "опис.md",
]);

function parseArgs(argv) {
  const args = { dryRun: false, force: false, output: DEFAULT_OUTPUT };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--source") args.source = argv[++i];
    else if (value === "--output") args.output = argv[++i];
    else if (value === "--dry-run") args.dryRun = true;
    else if (value === "--force") args.force = true;
    else if (value === "--help" || value === "-h") args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`Використання:
  npm run photos:prepare -- --source "<папка Google Drive>" [--dry-run]

Опції:
  --output <папка>  папка призначення (типово photos-incoming)
  --force           перезаписати вже підготовлені папки
  --dry-run         тільки показати план

Опис може бути у description.txt, description.md, опис.txt, опис.md або .docx.`);
}

function isImage(name) {
  return IMAGE_EXT.has(path.extname(name).toLowerCase());
}

function transliterate(value) {
  const table = {
    а: "a",
    б: "b",
    в: "v",
    г: "h",
    ґ: "g",
    д: "d",
    е: "e",
    є: "ye",
    ж: "zh",
    з: "z",
    и: "y",
    і: "i",
    ї: "yi",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ь: "",
    ю: "yu",
    я: "ya",
    ы: "y",
    э: "e",
    ё: "yo",
    ъ: "",
  };
  return String(value)
    .toLowerCase()
    .split("")
    .map((char) => table[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function readDescription(dir) {
  const files = readdirSync(dir);
  const textFile = files.find((name) =>
    DESCRIPTION_NAMES.has(name.toLowerCase()),
  );
  if (textFile) return readFileSync(path.join(dir, textFile), "utf8").trim();
  const docx = files.find(
    (name) => path.extname(name).toLowerCase() === ".docx",
  );
  if (docx) {
    return execFileSync(
      "textutil",
      ["-convert", "txt", "-stdout", path.join(dir, docx)],
      {
        encoding: "utf8",
      },
    ).trim();
  }
  return "";
}

function firstParagraph(text) {
  return (
    text
      .split(/\n\s*\n/)[0]
      .replace(/\s+/g, " ")
      .trim() || "Фотоісторія з архіву."
  );
}

function makeMeta(dir, description) {
  const folderName = path.basename(dir);
  const year =
    folderName.match(/(?:18|19|20)\d{2}/)?.[0] ??
    new Date().getFullYear().toString();
  const city =
    folderName
      .replace(year, "")
      .replace(/[-_(),]+/g, " ")
      .trim() || folderName;
  return {
    slug: transliterate(folderName) || `photo-story-${Date.now()}`,
    title: folderName,
    date: `${year}-01-01`,
    city,
    decade: `${year.slice(0, 3)}0-ті`,
    description: firstParagraph(description),
    story: description || firstParagraph(description),
    tags: city ? [city] : [],
    cover: "",
  };
}

function prepareStory(dir, output, args) {
  const folderName = path.basename(dir);
  const images = readdirSync(dir)
    .filter(isImage)
    .sort((a, b) => a.localeCompare(b));
  if (images.length === 0) throw new Error(`[${folderName}] фото не знайдені`);
  const description = readDescription(dir);
  const metaPath = path.join(dir, "meta.json");
  const meta = existsSync(metaPath)
    ? JSON.parse(readFileSync(metaPath, "utf8"))
    : makeMeta(dir, description);
  const destination = path.join(
    output,
    meta.slug || makeMeta(dir, description).slug,
  );
  if (existsSync(destination) && !args.force)
    throw new Error(
      `[${folderName}] ${destination} вже існує; використай --force`,
    );
  console.log(`[${folderName}] → ${destination} (${images.length} фото)`);
  if (args.dryRun) return;
  mkdirSync(destination, { recursive: true });
  images.forEach((image) =>
    copyFileSync(path.join(dir, image), path.join(destination, image)),
  );
  writeFileSync(
    path.join(destination, "meta.json"),
    `${JSON.stringify(meta, null, 2)}\n`,
    "utf8",
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.source) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }
  const source = path.resolve(args.source);
  if (!existsSync(source) || !statSync(source).isDirectory())
    throw new Error(`Папка не знайдена або недоступна: ${source}`);
  const folders = readdirSync(source)
    .map((name) => path.join(source, name))
    .filter(
      (entry) =>
        statSync(entry).isDirectory() && readdirSync(entry).some(isImage),
    );
  mkdirSync(args.output, { recursive: true });
  (folders.length > 0 ? folders : [source]).forEach((dir) =>
    prepareStory(dir, args.output, args),
  );
}

try {
  main();
} catch (error) {
  console.error(`Помилка: ${error.message}`);
  process.exit(1);
}
