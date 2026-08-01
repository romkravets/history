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
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = {
  photos,
};
