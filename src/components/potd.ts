import { getPhotos } from "../i18n/content";
import type { Lang } from "../i18n/ui";

/** Фото для «Фото дня» мовою сторінки (порядок однаковий для всіх мов). */
export async function photoOfDayPool(lang: Lang) {
  const photos = (await getPhotos(lang)).sort((a, b) => a.id.localeCompare(b.id));
  return photos
    .filter((p) => p.data.location !== false)
    .flatMap((p) => {
      const slug = p.id.replace(/\.md$/, "");
      return [p.data.cover, ...p.data.images]
        .map((src, i) => ({ src, i }))
        .filter(({ src, i }) => i === 0 || p.orig.captions[src])
        .map(({ src, i }) => ({
          s: src,
          c: p.data.captions[src] ?? p.data.title,
          g: slug,
          t: p.data.title,
          d: p.data.decade,
          n: i + 1,
        }));
    });
}
