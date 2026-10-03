import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE, SITE_NAME, SITE_TAGLINE, citiesByWeight } from "../lib/site";

// llms.txt — короткий опис сайту для ШІ-асистентів (https://llmstxt.org).
export const GET: APIRoute = async ({ site }) => {
  const url = (p: string) => new URL(p, site).href;
  const photos = (await getCollection("photos")).sort((a, b) =>
    a.data.city.localeCompare(b.data.city, "uk") ||
    a.data.title.localeCompare(b.data.title, "uk"),
  );
  const eras = (await getCollection("history")).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const people = (await getCollection("people")).sort((a, b) => a.data.name.localeCompare(b.data.name, "uk"));
  const library = await getCollection("library");
  const cities = citiesByWeight(photos.map((p) => p.data.city));

  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_TAGLINE}. Цифровий архів старих фотографій, листівок і малюнків історичних міст, сіл і пам'яток: ${cities.join(", ")}. Кожна галерея має місце, період, опис і теги. Мова сайту — українська.`,
    "",
    "Дати здебільшого орієнтовні: вказано десятиліття або період.",
    "",
    "## Галереї",
    "",
    ...photos.map(
      (p) =>
        `- [${p.data.title}](${url(`/photos/${p.id.replace(/\.md$/, "")}/`)}): ${p.data.city}${p.data.area ? `, ${p.data.area}` : ""}; ${p.data.decade}. ${p.data.description}`,
    ),
    "",
    `## Історія ${SITE.home.genitive}`,
    "",
    ...eras.map(
      (e) =>
        `- [${e.data.period} — ${e.data.title}](${url(`/istoriya/#${e.data.era}`)}): ${e.data.summary}`,
    ),
    "",
    ...(people.length
      ? [
          "## Відомі люди",
          "",
          ...people.map(
            (p) => `- [${p.data.name}](${url(`/lyudy/${p.id.replace(/\.md$/, "")}/`)}): ${p.data.role}. ${p.data.connection}`,
          ),
          "",
        ]
      : []),
    ...(library.length
      ? [
          "## Бібліотека краєзнавства",
          "",
          `Список книг, статей і ресурсів: ${url("/biblioteka/")}`,
          "",
          ...library.map(
            (b) =>
              `- ${b.data.title}${b.data.author ? ` — ${b.data.author}` : ""}${b.data.year ? ` (${b.data.year})` : ""} [${b.data.type}]${b.data.url ? `: ${b.data.url}` : ""}`,
          ),
          "",
        ]
      : []),
    "## Про проєкт",
    "",
    `- [Про архів](${url("/about/")}): автор, джерела та як збирається архів`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
