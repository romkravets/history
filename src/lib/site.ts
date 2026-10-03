import path from "node:path";
import sharp from "sharp";
import { SITE } from "../site.config";

// Налаштування архіву живуть у src/site.config.ts; тут — похідні значення й утиліти.
export { SITE };
export const SITE_NAME = SITE.name;
export const SITE_TAGLINE = SITE.tagline;
export const AUTHOR = SITE.author;
export const HOME_PLACE = {
  name: SITE.home.name,
  region: SITE.home.oblast,
  regionCode: SITE.home.oblastCode,
  latitude: SITE.home.latitude,
  longitude: SITE.home.longitude,
};
const REGION_OVERRIDES = SITE.regionOverrides;

export function regionOf(city: string): string {
  return REGION_OVERRIDES[city] ?? HOME_PLACE.region;
}

/** Міста, впорядковані за кількістю галерей (головне місто завжди перше). */
export function citiesByWeight(cities: string[]): string[] {
  const counts = new Map<string, number>();
  for (const c of cities) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.entries()]
    .sort(
      (a, b) =>
        Number(b[0] === HOME_PLACE.name) - Number(a[0] === HOME_PLACE.name) ||
        b[1] - a[1] ||
        a[0].localeCompare(b[0], "uk"),
    )
    .map(([c]) => c);
}

/** Чи згадано місто в тексті з урахуванням відмінків (Кременець → Кременця). */
export function mentionsCity(text: string, city: string): boolean {
  const lower = text.toLowerCase();
  // кожне слово назви за основою: «Західна Україна» → «західн», «україн»
  return city
    .toLowerCase()
    .split(/\s+/)
    .every((w) => lower.includes(w.slice(0, Math.max(4, w.length - 3))));
}

/** 1 галерея, 2 галереї, 5 галерей. */
export function pluralUk(n: number, [one, few, many]: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function absoluteUrl(pathname: string, site: URL | undefined): string {
  return new URL(pathname, site ?? SITE.url).href;
}

const sizeCache = new Map<string, { width: number; height: number } | null>();

/** Розміри фото з public/ — для width/height у <img> (без стрибків верстки). */
export async function imageSize(publicPath: string) {
  if (sizeCache.has(publicPath)) return sizeCache.get(publicPath) ?? undefined;
  let size: { width: number; height: number } | null = null;
  try {
    const meta = await sharp(
      path.join(process.cwd(), "public", decodeURI(publicPath)),
    ).metadata();
    if (meta.width && meta.height) {
      const rotated = (meta.orientation ?? 1) >= 5;
      size = rotated
        ? { width: meta.height, height: meta.width }
        : { width: meta.width, height: meta.height };
    }
  } catch {
    size = null;
  }
  sizeCache.set(publicPath, size);
  return size ?? undefined;
}

/** Укрупнені епохи для фільтра на головній (галерея може належати до кількох). */
export const ERAS = [
  { key: "early", label: "До XIX ст." },
  { key: "19c", label: "XIX ст." },
  { key: "1900s", label: "Початок XX ст." },
  { key: "interwar", label: "Міжвоєнний час" },
  { key: "soviet", label: "1940–1990-ті" },
  { key: "modern", label: "Сучасні фото" },
] as const;

export type EraKey = (typeof ERAS)[number]["key"];

export function erasOf(decade: string): EraKey[] {
  // римські числа бувають і латиницею, і кирилицею (Х), тож зводимо до латиниці
  const d = decade.toLowerCase().replace(/х(?=[xхiіv\s.]|$)/g, "x").replace(/(?<=x)х/g, "x");
  const eras = new Set<EraKey>();
  if (/\bx(iv|v|vi|vii|viii)\b/.test(d)) eras.add("early");
  if (/\bxix\b|18\d\d/.test(d)) eras.add("19c");
  if (/початок xx|перша половина xx|до 1918|19[01]\d|\bxx\s*ст|xix\s*[—–-]\s*(початок\s*)?xx/.test(d))
    eras.add("1900s");
  if (/міжвоєн|19[23]\d/.test(d)) eras.add("interwar");
  if (/19[4-9]\d/.test(d)) eras.add("soviet");
  if (/сучасн|20[012]\d|різні роки/.test(d)) eras.add("modern");
  return eras.size ? [...eras] : ["modern"];
}

/** Розмір банера для прев'ю в соцмережах (src/pages/og/[slug].jpg.ts). */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** «1809 — 1849» з довільних рядків дат (беремо рік, якщо дата повна). */
export function lifeYears(born?: string, died?: string): string {
  const y = (d?: string) => d?.match(/\d{3,4}(?!.*\d{3,4})/)?.[0] ?? d ?? "";
  if (!born && !died) return "";
  return `${y(born) || "?"} — ${died ? y(died) : ""}`.trim();
}

/** Ініціали для портрета-заглушки: «Юліуш Словацький» → «ЮС». */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

const MONTHS = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
const MONTHS_NOM = ["січень", "лютий", "березень", "квітень", "травень", "червень", "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"];
/** «1809-09-04» → «4 вересня 1809», «1992-05» → «травень 1992», інше — як є. */
export function humanDate(d?: string): string {
  if (!d) return "";
  let m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  m = d.match(/^(\d{4})-(\d{2})$/);
  if (m) return `${MONTHS_NOM[Number(m[2]) - 1]} ${m[1]}`;
  return d;
}
