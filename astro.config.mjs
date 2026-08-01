// @ts-check
import { defineConfig } from "astro/config";

const runtime = /** @type {any} */ (globalThis);
const env = /** @type {Record<string, string | undefined>} */ (
  runtime.process?.env ?? {}
);

const site = env.SITE_URL ?? "https://romkravets.github.io";
const pagesBase = env.PUBLIC_BASE_PATH ?? "/history";
const base = env.CI === "true" ? pagesBase : "/";

// https://astro.build/config
export default defineConfig({
  site,
  base,
});
