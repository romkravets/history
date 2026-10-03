// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/site.config.ts";

const runtime = /** @type {any} */ (globalThis);
const env = /** @type {Record<string, string | undefined>} */ (
  runtime.process?.env ?? {}
);

// Адреса сайту для canonical, sitemap, og:url: змінна SITE_URL або url із src/site.config.ts
const site = env.SITE_URL ?? SITE.url;
const base = env.PUBLIC_BASE_PATH ?? "/";

// https://astro.build/config
export default defineConfig({
  site,
  base,
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/404"),
    }),
  ],
});
