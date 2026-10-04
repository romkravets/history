import type { CollectionEntry } from "astro:content";
import { erasOf } from "./site";

type Photo = CollectionEntry<"photos">;
type Person = CollectionEntry<"people">;

export interface Related {
  photo: Photo;
  slug: string;
  score: number;
  /** Коротко, чому схожа: «Поруч · 300 м», «Спільна тема: Бона». */
  reason: string;
}

const slugOf = (p: { id: string }) => p.id.replace(/\.md$/, "");
const norm = (t: string) => t.trim().toLowerCase();

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const fmtDistance = (km: number) =>
  km < 1
    ? `${Math.max(50, Math.round((km * 1000) / 50) * 50)} м`
    : `${km.toFixed(km < 10 ? 1 : 0).replace(".", ",")} км`;

// теги, що описують тип, а не тему — рахуються в балах, але не показуються як причина
const GENERIC = new Set(["старі фото", "сучасні фото", "листівки", "історія", "архітектура"]);

/**
 * Схожі галереї: бали за спільні теги (рідкісні важать більше — IDF), близькість
 * на карті, спільні епохи й пов'язаних людей. Повертає найкращі, від найсхожішої.
 */
export function relatedGalleries(current: Photo, all: Photo[], people: Person[], limit = 10): Related[] {
  const N = all.length;
  // скільки галерей має кожен тег → вага log(N/df)
  const df = new Map<string, number>();
  for (const p of all) for (const t of new Set(p.data.tags.map(norm))) df.set(t, (df.get(t) ?? 0) + 1);
  const idf = (t: string) => Math.log(N / (df.get(t) ?? N));

  const peopleOf = (slug: string) => new Set(people.filter((pp) => pp.data.galleries.includes(slug)).map(slugOf));
  const curSlug = slugOf(current);
  const curTags = new Set(current.data.tags.map(norm));
  const curEras = new Set(erasOf(current.data.decade));
  const curPeople = peopleOf(curSlug);
  const curLoc = current.data.location || null;

  const out: Related[] = [];
  for (const p of all) {
    const slug = slugOf(p);
    if (slug === curSlug) continue;
    let score = 0;
    const reasons: [number, string][] = [];

    // теги
    const shared = p.data.tags.filter((t) => curTags.has(norm(t)));
    const tagScore = shared.reduce((s, t) => s + idf(norm(t)), 0);
    score += tagScore;
    const best = shared.filter((t) => !GENERIC.has(norm(t))).sort((a, b) => idf(norm(b)) - idf(norm(a)))[0];
    if (best && idf(norm(best)) > 1.2) reasons.push([idf(norm(best)), `Спільна тема: ${best}`]);

    // місце
    const loc = p.data.location || null;
    if (curLoc && loc) {
      const km = distanceKm(curLoc, loc);
      const exact = !curLoc.approximate && !loc.approximate;
      const geo = km < 0.05 ? 3 : km < 0.6 ? 2.2 : km < 3 ? 1.2 : km < 30 ? 0.5 : 0;
      score += geo;
      if (exact && km < 0.05) reasons.push([3.2, "Те саме місце"]);
      else if (exact && km < 3) reasons.push([2.4, `Поруч · ${fmtDistance(km)}`]);
      else if (p.data.city !== current.data.city && km < 60) reasons.push([1, `${p.data.city} · ${fmtDistance(km)}`]);
    } else if (p.data.city === current.data.city) score += 0.5;

    // епохи
    const eras = erasOf(p.data.decade).filter((e) => curEras.has(e));
    score += eras.length * 0.9;
    // «сучасні фото» — не причина схожості; для старих фото показуємо період
    if (eras.some((e) => e !== "modern")) reasons.push([0.8, `Той самий період: ${p.data.decade}`]);

    // люди
    const sharedPeople = [...peopleOf(slug)].filter((x) => curPeople.has(x));
    score += sharedPeople.length * 2;
    if (sharedPeople.length) reasons.push([2.5, "Ті самі люди"]);

    if (score <= 0) continue;
    reasons.sort((a, b) => b[0] - a[0]);
    out.push({ photo: p, slug, score, reason: reasons[0]?.[1] ?? `Теж ${p.data.city}` });
  }
  return out.sort((a, b) => b.score - a.score || b.photo.data.date.getTime() - a.photo.data.date.getTime()).slice(0, limit);
}
