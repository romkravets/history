import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro:schema";

const photos = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/photos" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    city: z.string(),
    area: z.string().optional(),
    decade: z.string(),
    description: z.string(),
    cover: z.string(),
    images: z.array(z.string()).default([]),
    // Точка на карті; false — галерея не прив'язана до одного місця (карти, реконструкції)
    location: z
      .union([
        z.literal(false),
        z.object({
          lat: z.number(),
          lng: z.number(),
          approximate: z.boolean().default(false),
        }),
      ])
      .optional(),
    // Пари «тоді й тепер» для повзунка порівняння (шляхи з images/cover)
    comparisons: z
      .array(z.object({ before: z.string(), after: z.string(), caption: z.string() }))
      .default([]),
    // Підписи окремих фото: { "/photos/<slug>/3.jpg": "Церква Анни Праведної" }
    captions: z.record(z.string(), z.string()).default({}),
    tags: z.array(z.string()).default([]),
  }),
});

const history = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/history" }),
  schema: z.object({
    order: z.number(),
    era: z.string(),
    title: z.string(),
    period: z.string(),
    summary: z.string(),
    sources: z
      .array(
        z.object({
          title: z.string(),
          url: z.string(),
        }),
      )
      .default([]),
  }),
});

const source = z.object({ title: z.string(), url: z.string() });

// Відомі люди краю: одна людина = один Markdown-файл, текст файлу — біографія.
const people = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/people" }),
  schema: z.object({
    name: z.string(),
    /** Ім'я мовою оригіналу (для іноземців): «Juliusz Słowacki». */
    nameOriginal: z.string().optional(),
    born: z.string().optional(),
    died: z.string().optional(),
    bornPlace: z.string().optional(),
    diedPlace: z.string().optional(),
    /** Коротко: «поет», «фотограф», «засновник Ліцею». */
    role: z.string(),
    /** Одне речення: чим людина пов'язана з краєм. */
    connection: z.string(),
    /** Шлях до портрета в public/ (необов'язково). */
    portrait: z.string().optional(),
    places: z.array(z.string()).default([]),
    /** Галереї архіву, пов'язані з людиною (slug). */
    galleries: z.array(z.string()).default([]),
    sources: z.array(source).default([]),
    tags: z.array(z.string()).default([]),
    /** Порядок у списку (менше — вище); без нього — за алфавітом. */
    order: z.number().optional(),
  }),
});

// Бібліотека краєзнавства: книги, статті, твори, архіви, сайти, відео.
export const LIBRARY_TYPES = ["книга", "стаття", "художній твір", "архів/збірка", "сайт", "відео"] as const;
const library = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/library" }),
  schema: z.object({
    title: z.string(),
    author: z.string().optional(),
    year: z.string().optional(),
    type: z.enum(LIBRARY_TYPES),
    description: z.string(),
    /** Де читати / дивитися. */
    url: z.string().optional(),
    language: z.string().optional(),
    /** Пов'язані люди (slug із content/people). */
    people: z.array(z.string()).default([]),
    /** Пов'язані галереї (slug). */
    galleries: z.array(z.string()).default([]),
  }),
});

// Пішохідні маршрути: зупинки з координатами, фото й порівняннями «тоді й тепер».
const routes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/routes" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** Орієнтовна тривалість і довжина: «1,5 км · 1–1,5 год». */
    duration: z.string(),
    cover: z.string(),
    stops: z.array(
      z.object({
        title: z.string(),
        lat: z.number(),
        lng: z.number(),
        /** Точка орієнтовна (місце зйомки старого фото відоме неточно). */
        approximate: z.boolean().default(false),
        text: z.string(),
        photo: z.string().optional(),
        photoCaption: z.string().optional(),
        compare: z.object({ before: z.string(), after: z.string(), caption: z.string() }).optional(),
        gallery: z.string().optional(),
        person: z.string().optional(),
      }),
    ),
  }),
});

export const collections = {
  photos,
  history,
  people,
  library,
  routes,
};
