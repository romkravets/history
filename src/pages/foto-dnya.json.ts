import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

// Пул для «Фото дня»: обкладинки й підписані фото всіх галерей, прив'язаних до місця.
// Вибір на конкретну дату робить браузер (див. PhotoOfDay.astro), тож фото
// змінюється щодня без нового деплою.
export const GET: APIRoute = async () => {
  const photos = (await getCollection("photos")).sort((a, b) => a.id.localeCompare(b.id));
  const pool = photos
    .filter((p) => p.data.location !== false)
    .flatMap((p) => {
      const slug = p.id.replace(/\.md$/, "");
      const all = [p.data.cover, ...p.data.images];
      return all
        .map((src, i) => ({ src, i }))
        .filter(({ src, i }) => i === 0 || p.data.captions[src])
        .map(({ src, i }) => ({
          s: src,
          c: p.data.captions[src] ?? p.data.title,
          g: slug,
          t: p.data.title,
          d: p.data.decade,
          n: i + 1,
        }));
    });
  return new Response(JSON.stringify(pool), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
