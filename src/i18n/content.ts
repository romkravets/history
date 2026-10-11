/**
 * Контент потрібною мовою: українські записи + польські переклади з колекцій *-pl.
 * data — уже перекладені поля (назва міста теж), orig — українські дані без змін
 * (за ними рахуються епохи, краї, області), body — запис, який рендерити як текст.
 */
import { getCollection, type CollectionEntry } from "astro:content";
import { cityName, type Lang } from "./ui";

const slugOf = (id: string) => id.replace(/\.md$/, "");

async function plMap<C extends "photosPl" | "historyPl" | "peoplePl" | "libraryPl" | "routesPl">(name: C) {
  const entries = await getCollection(name);
  return new Map(entries.map((e) => [slugOf(e.id), e]));
}

type Photo = CollectionEntry<"photos">;
export type LPhoto = {
  id: string;
  data: Photo["data"];
  orig: Photo["data"];
  body: Photo | CollectionEntry<"photosPl">;
};

export async function getPhotos(lang: Lang): Promise<LPhoto[]> {
  const photos = await getCollection("photos");
  const pl = lang === "pl" ? await plMap("photosPl") : new Map();
  return photos.map((p) => {
    const tr = pl.get(slugOf(p.id));
    const d = p.data;
    if (lang === "uk") return { id: p.id, data: d, orig: d, body: p };
    const t = tr?.data;
    return {
      id: p.id,
      orig: d,
      body: tr ?? p,
      data: {
        ...d,
        city: cityName(d.city, lang),
        title: t?.title ?? d.title,
        area: t?.area ?? d.area,
        decade: t?.decade ?? d.decade,
        description: t?.description ?? d.description,
        tags: t?.tags ?? d.tags,
        captions: { ...d.captions, ...(t?.captions ?? {}) },
        comparisons: d.comparisons.map((c, i) => ({ ...c, caption: t?.comparisons?.[i]?.caption ?? c.caption })),
      },
    };
  });
}

type History = CollectionEntry<"history">;
export type LHistory = { id: string; data: History["data"]; body: History | CollectionEntry<"historyPl"> };
export async function getHistory(lang: Lang): Promise<LHistory[]> {
  const items = await getCollection("history");
  const pl = lang === "pl" ? await plMap("historyPl") : new Map();
  return items.map((h) => {
    const tr = pl.get(slugOf(h.id));
    const t = tr?.data;
    return {
      id: h.id,
      body: tr ?? h,
      data: t
        ? { ...h.data, title: t.title, period: t.period ?? h.data.period, summary: t.summary ?? h.data.summary }
        : h.data,
    };
  });
}

type Person = CollectionEntry<"people">;
export type LPerson = { id: string; data: Person["data"]; body: Person | CollectionEntry<"peoplePl"> };
export async function getPeople(lang: Lang): Promise<LPerson[]> {
  const items = await getCollection("people");
  const pl = lang === "pl" ? await plMap("peoplePl") : new Map();
  return items.map((p) => {
    const tr = pl.get(slugOf(p.id));
    const t = tr?.data;
    const d = p.data;
    return {
      id: p.id,
      body: tr ?? p,
      data: t
        ? {
            ...d,
            name: t.name,
            role: t.role ?? d.role,
            connection: t.connection ?? d.connection,
            born: t.born ?? d.born,
            died: t.died ?? d.died,
            bornPlace: t.bornPlace ?? d.bornPlace,
            diedPlace: t.diedPlace ?? d.diedPlace,
            places: d.places.map((c) => cityName(c, lang)),
          }
        : d,
    };
  });
}

type Book = CollectionEntry<"library">;
export type LBook = { id: string; data: Book["data"] & { titleTranslation?: string } };
export async function getLibrary(lang: Lang): Promise<LBook[]> {
  const items = await getCollection("library");
  const pl = lang === "pl" ? await plMap("libraryPl") : new Map();
  return items.map((b) => {
    const t = pl.get(slugOf(b.id))?.data;
    return {
      id: b.id,
      data: t ? { ...b.data, description: t.description ?? b.data.description, titleTranslation: t.titleTranslation } : b.data,
    };
  });
}

type Route = CollectionEntry<"routes">;
export type LRoute = { id: string; data: Route["data"]; body: Route | CollectionEntry<"routesPl"> };
export async function getRoutes(lang: Lang): Promise<LRoute[]> {
  const items = await getCollection("routes");
  const pl = lang === "pl" ? await plMap("routesPl") : new Map();
  return items.map((r) => {
    const tr = pl.get(slugOf(r.id));
    const t = tr?.data;
    const d = r.data;
    return {
      id: r.id,
      body: tr ?? r,
      data: t
        ? {
            ...d,
            title: t.title,
            description: t.description ?? d.description,
            duration: t.duration ?? d.duration,
            stops: d.stops.map((s, i) => {
              const ts = t.stops?.[i];
              return {
                ...s,
                title: ts?.title ?? s.title,
                text: ts?.text ?? s.text,
                photoCaption: ts?.photoCaption ?? s.photoCaption,
                compare: s.compare && { ...s.compare, caption: ts?.compareCaption ?? s.compare.caption },
              };
            }),
          }
        : d,
    };
  });
}
