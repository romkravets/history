import path from "node:path";
import sharp from "sharp";

export const SITE_NAME = "Історичний архів Кременеччини";
export const SITE_TAGLINE =
  "Старі фото Кременця, Кременеччини та Тернопільщини";
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
  const stem = city.toLowerCase().slice(0, Math.max(4, city.length - 3));
  return text.toLowerCase().includes(stem);
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
