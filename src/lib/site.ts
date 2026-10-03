import path from "node:path";
import sharp from "sharp";

export const SITE_NAME = "Історичний архів Кременеччини";
export const SITE_TAGLINE =
  "Старі фото Кременця, Тернопільщини та України";
export const AUTHOR = {
  name: "Роман Кравець",
  url: "https://github.com/romkravets",
};

// Кременець — географічний центр архіву.
export const HOME_PLACE = {
  name: "Кременець",
  region: "Тернопільська область",
  regionCode: "UA-61",
  latitude: 50.1031,
  longitude: 25.7258,
};

// Міста архіву, що лежать поза Тернопільщиною. Решта вважаються тернопільськими.
const REGION_OVERRIDES: Record<string, string> = {
  Олесько: "Львівська область",
  Підкамінь: "Львівська область",
  Підгірці: "Львівська область",
  "Західна Україна": "Західна Україна",
};

export function regionOf(city: string): string {
  return REGION_OVERRIDES[city] ?? HOME_PLACE.region;
}

/** Міста, впорядковані за кількістю галерей (Кременець завжди перший). */
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
  return new URL(pathname, site ?? "https://history-kremenets.vercel.app").href;
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
