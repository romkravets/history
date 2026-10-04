#!/usr/bin/env node
/**
 * Налаштування шаблону під нове місто / регіон.
 *
 *   npm run template:init                 # покроково запитає все в терміналі
 *   npm run template:init -- --clean      # ще й прибере кременецький контент, залишивши приклади
 *   npm run template:init -- --dry-run    # показати, що буде записано, нічого не змінюючи
 *
 * Відповіді можна передати прапорцями (для автоматизації), напр.:
 *   npm run template:init -- --city "Бережани" --genitive "Бережан" --instrumental "Бережанами" \
 *     --region-genitive "Бережанщини" --oblast "Тернопільська" --url https://berezhany-archive.vercel.app \
 *     --author "Ім'я" --author-url https://github.com/you --yes
 *
 * Що робить:
 *   1. Записує src/site.config.ts (назва, місто, відмінки, область, адреса, автор, тексти банера).
 *   2. Знаходить координати міста через OpenStreetMap (Nominatim).
 *   3. З --clean: видаляє галереї, фото, історію, людей і бібліотеку Кременця
 *      й додає по одному прикладу кожного типу, щоб сайт одразу збирався.
 */
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ISO 3166-2:UA — коди областей для геоміток
const OBLASTS = {
  Вінницька: "UA-05", Волинська: "UA-07", Дніпропетровська: "UA-12", Донецька: "UA-14",
  Житомирська: "UA-18", Закарпатська: "UA-21", Запорізька: "UA-23", "Івано-Франківська": "UA-26",
  Київська: "UA-32", Кіровоградська: "UA-35", Луганська: "UA-09", Львівська: "UA-46",
  Миколаївська: "UA-48", Одеська: "UA-51", Полтавська: "UA-53", Рівненська: "UA-56",
  Сумська: "UA-59", Тернопільська: "UA-61", Харківська: "UA-63", Херсонська: "UA-65",
  Хмельницька: "UA-68", Черкаська: "UA-71", Чернівецька: "UA-77", Чернігівська: "UA-74",
  "Автономна Республіка Крим": "UA-43", Київ: "UA-30", Севастополь: "UA-40",
};

// ---------- аргументи ----------
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const DRY = flag("dry-run");
const CLEAN = flag("clean");
const YES = flag("yes");

const rl = createInterface({ input: stdin, output: stdout });
async function ask(question, fallback, flagName) {
  const fromFlag = flagName && opt(flagName);
  if (fromFlag) return fromFlag;
  if (YES && fallback !== undefined) return fallback;
  const answer = (await rl.question(`${question}${fallback ? ` [${fallback}]` : ""}: `)).trim();
  return answer || fallback || "";
}

// ---------- геокодування ----------
async function geocode(city, oblast) {
  const q = `${city}, ${oblast} область, Україна`;
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q, format: "json", limit: "1", countrycodes: "ua" })}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "history-archive-template/1.0 (template:init)" } });
    const [hit] = await res.json();
    return hit ? { lat: Number(Number(hit.lat).toFixed(4)), lng: Number(Number(hit.lon).toFixed(4)), label: hit.display_name } : null;
  } catch {
    return null;
  }
}

// ---------- запис конфігурації ----------
const q = (s) => JSON.stringify(s);
function configFile(c) {
  return `/**
 * Налаштування архіву: назва, місто, регіон і тексти, що згадують місце.
 * Згенеровано командою \`npm run template:init\` — можна редагувати вручну.
 */
export const SITE = {
  name: ${q(c.name)},
  tagline: ${q(c.tagline)},
  url: ${q(c.url)},
  author: {
    name: ${q(c.author)},
    url: ${q(c.authorUrl)},
    github: ${q(c.authorUrl.includes("github.com") ? c.authorUrl : "")},
    linkedin: "",
  },

  home: {
    name: ${q(c.city)},
    genitive: ${q(c.genitive)},
    instrumental: ${q(c.instrumental)},
    regionGenitive: ${q(c.regionGenitive)},
    oblast: ${q(`${c.oblast} область`)},
    oblastCode: ${q(c.oblastCode)},
    latitude: ${c.lat},
    longitude: ${c.lng},
  },

  /** Міста архіву з іншої області: { "Львів": "Львівська область" }. */
  regionOverrides: {} as Record<string, string>,

  texts: {
    coverage: ${q(c.coverage)},
    heroTitle: [${q(`${c.city} і край`)}, "через", "фотоархів"] as [string, string, string],
    heroEyebrow: "Цифрова пам'ять краю",
    aboutGeography: ${q(`насамперед ${c.city} і ${c.regionNominative || "околиці"}`)},
  },
};
`;
}

// ---------- приклади контенту для --clean ----------
async function placeholderJpeg(file, label) {
  const sharp = (await import("sharp")).default;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000">
    <rect width="100%" height="100%" fill="#2b211c"/>
    <rect x="80" y="80" width="1440" height="840" fill="none" stroke="#e0805f" stroke-width="6" stroke-dasharray="24 16"/>
    <circle cx="800" cy="440" r="120" fill="none" stroke="#b3a898" stroke-width="10"/>
    <rect x="620" y="600" width="360" height="24" fill="#b3a898"/>
    <text x="800" y="720" font-family="sans-serif" font-size="44" fill="#ddd3c4" text-anchor="middle">${label}</text>
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toFile(file);
}

function wipe(dir, keep = () => false) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) if (!keep(f)) rmSync(path.join(dir, f), { recursive: true, force: true });
}

async function clean(c) {
  const content = path.join(ROOT, "src/content");
  wipe(path.join(content, "photos"));
  wipe(path.join(content, "history"));
  wipe(path.join(content, "people"));
  wipe(path.join(content, "library"));
  wipe(path.join(ROOT, "public/photos"), (f) => f === "banner.png");

  const dir = path.join(ROOT, "public/photos/example-gallery");
  mkdirSync(dir, { recursive: true });
  await placeholderJpeg(path.join(dir, "cover.jpg"), "Обкладинка галереї");
  await placeholderJpeg(path.join(dir, "1.jpg"), "Фото 2");

  writeFileSync(
    path.join(content, "photos/example-gallery.md"),
    `---
title: "Приклад галереї: центр міста"
date: ${new Date().toISOString().slice(0, 10)}
city: ${q(c.city)}
area: "Центр міста"
decade: "сучасні фото"
description: "Це приклад. Замініть фото й текст або видаліть файл, коли додасте власні галереї."
location:
  lat: ${c.lat}
  lng: ${c.lng}
  approximate: true
cover: "/photos/example-gallery/cover.jpg"
images:
  - "/photos/example-gallery/1.jpg"
captions:
  "/photos/example-gallery/cover.jpg": "Підпис до обкладинки"
tags:
  - ${q(c.city)}
  - "приклад"
---

Довший текст галереї. Розділ \`## Джерела\` з посиланнями — бажано наприкінці.
`,
  );
  writeFileSync(
    path.join(content, "history/01-pochatok.md"),
    `---
order: 1
era: "pochatok"
title: "Перші згадки"
period: "До XIV ст."
summary: "Одне-два речення про цю епоху."
sources: []
---

Текст епохи з історії ${c.genitive}. Додайте інші епохи окремими файлами (02-…, 03-…).
`,
  );
  writeFileSync(
    path.join(content, "people/example-person.md"),
    `---
name: "Ім'я Прізвище"
born: "1900"
died: "1980"
role: "приклад"
connection: "Одне речення: чим людина пов'язана з краєм."
places:
  - ${q(c.city)}
galleries:
  - "example-gallery"
sources: []
---

Біографія — кілька абзаців з посиланнями на джерела.
`,
  );
  writeFileSync(
    path.join(content, "library/example-book.md"),
    `---
title: "Назва книги про ${c.city}"
author: "Автор"
year: "2000"
type: "книга"
description: "Одне-два речення: про що книга й чим корисна."
people:
  - "example-person"
---
`,
  );
}

// ---------- основне ----------
console.log("\nНалаштування архіву під нове місто. Enter — прийняти значення в [дужках].\n");
const city = await ask("Головне місто чи село (називний відмінок)", undefined, "city");
if (!city) {
  console.error("Потрібна назва міста.");
  process.exit(1);
}
const genitive = await ask(`Родовий відмінок («історія …»)`, undefined, "genitive");
const instrumental = await ask(`Орудний відмінок («пов'язані з …»)`, undefined, "instrumental");
const regionNominative = await ask("Назва краю (напр. «Бережанщина»), можна пропустити", "", "region");
const regionGenitive = await ask("Край у родовому відмінку («сіл …»)", regionNominative ? undefined : genitive, "region-genitive");
let oblast = await ask(`Область (${Object.keys(OBLASTS).slice(0, 4).join(", ")}…)`, "Тернопільська", "oblast");
oblast = oblast.replace(/\s*область$/i, "");
const oblastCode = OBLASTS[oblast];
if (!oblastCode) console.warn(`  ! Невідома область «${oblast}» — код geo.region залишиться порожнім, виправте вручну.`);

const name = await ask("Назва сайту", `Історичний архів ${regionGenitive || genitive}`, "name");
const coverage = `${genitive}${regionGenitive && regionGenitive !== genitive ? `, ${regionGenitive}` : ""} та інших куточків України`;
const tagline = await ask("Короткий опис для пошуку", `Старі фото ${genitive} та краю`, "tagline");
const url = await ask("Адреса сайту", "https://my-archive.vercel.app", "url");
const author = await ask("Автор (ваше ім'я)", "", "author");
const authorUrl = await ask("Посилання на автора (GitHub, сайт)", "", "author-url");

process.stdout.write("\nШукаю координати в OpenStreetMap… ");
let geo = await geocode(city, oblast);
if (geo) console.log(`${geo.lat}, ${geo.lng}\n  (${geo.label})`);
else {
  console.log("не знайдено.");
  const raw = await ask("Введіть координати вручну «широта, довгота»", "50.45, 30.52", "coords");
  const [lat, lng] = raw.split(",").map((x) => Number(x.trim()));
  geo = { lat, lng };
}
rl.close();

const c = { name, tagline, url, author, authorUrl, city, genitive, instrumental, regionGenitive, regionNominative, oblast, oblastCode: oblastCode ?? "", lat: geo.lat, lng: geo.lng, coverage };
const out = configFile(c);

if (DRY) {
  console.log("\n--- src/site.config.ts (dry-run) ---\n" + out);
  if (CLEAN) console.log("(dry-run) --clean видалив би контент Кременця й додав приклади.");
  process.exit(0);
}

writeFileSync(path.join(ROOT, "src/site.config.ts"), out, "utf8");
console.log("\n✓ Записано src/site.config.ts");
if (CLEAN) {
  await clean(c);
  console.log("✓ Контент Кременця прибрано, додано приклади: галерея, епоха історії, людина, книга");
}

console.log(`
Далі:
  1. npm run dev — перегляньте сайт.
  2. Замініть відео банера: public/video/banner.mp4, banner.webm, banner-poster.jpg.
  3. Перевірте тексти сторінки «Про архів» (src/pages/about.astro) і файли CLAUDE.md / AGENTS.md.
  4. Додавайте фото: README → «Робота з ШІ покроково».
  5. Опублікуйте: docs/new-archive.md → «Публікація».
`);
