// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const runtime = /** @type {any} */ (globalThis);
const env = /** @type {Record<string, string | undefined>} */ (
  runtime.process?.env ?? {}
);

// Продакшн-адреса сайту (Vercel). Використовується для canonical, sitemap, og:url.
const site = env.SITE_URL ?? "https://history-kremenets.vercel.app";
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
