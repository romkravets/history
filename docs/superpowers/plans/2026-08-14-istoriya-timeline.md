# Сторінка «Історія» (таймлайн) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Додати сторінку `/istoriya/` з хронологією Кременця у вигляді вертикального таймлайну, зібраною з 14 підтверджених джерел, плюс пункт навігації та фільтр за десятиліттям у галереї.

**Architecture:** Нова Astro content collection `history` (одна епоха — один markdown-файл, за зразком наявної `photos`), рендериться сторінкою `src/pages/istoriya.astro` у вигляді вертикального таймлайну (спільні CSS-токени з рештою сайту). Дані про фото/фільтр — чиста client-side логіка без бібліотек.

**Tech Stack:** Astro 7 (content collections, `astro:content`), zod-схеми, ванільний CSS (без препроцесорів/фреймворків), inline `<script>` для фільтра — той самий підхід, що вже використаний для `.scroll-progress` у `Layout.astro`.

## Global Constraints

- Уся мова — українська (`lang="uk"`, весь UI-текст), без англійських рядків окрім службових класів/атрибутів.
- Нових кольорів/шрифтів не додавати — тільки наявні токени з `:root` у `src/styles/global.css` (`--bg, --fg, --accent, --accent-2, --accent-3, --accent-ink, --muted, --dim, --border-c, --stripe`) і шрифти `JetBrains Mono` / `Unbounded`.
- Жодних нових npm-залежностей.
- Джерела — тільки ядро з 14 підтверджених посилань (див. `docs/superpowers/specs/2026-08-14-istoriya-timeline-design.md`); вигадувати факти заборонено — якщо джерело мовчить, текст теж мовчить.
- Після кожного завдання: `npm run check` і `npm run build` мають проходити без помилок.
- Коміт — тільки один раз в кінці, і лише після явного дозволу користувача (не автоматично після кожного завдання).

---

### Task 1: Схема колекції `history`

**Files:**
- Modify: `src/content.config.ts`

**Interfaces:**
- Produces: колекцію `history` зі схемою `{ order: number, era: string, title: string, period: string, summary: string, sources: { title: string; url: string }[] }`, яку споживають Task 2–7 (frontmatter файлів) і Task 8 (сторінка).

- [ ] **Step 1: Додати схему колекції**

Замінити вміст `src/content.config.ts` на:

```ts
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

export const collections = {
  photos,
  history,
};
```

- [ ] **Step 2: Перевірити, що білд не падає на порожній колекції**

Run: `npm run check && npm run build`
Expected: збірка проходить (колекція `history` поки без файлів — Astro `glob()` на порожню директорію не падає, але створи порожню `src/content/history/.gitkeep`, щоб директорія існувала в git до появи першого файлу).

- [ ] **Step 3: Commit-checkpoint (без реального коміту)**

Зміни лишаються в робочому дереві — коміт лише в кінці всього плану, з дозволу користувача.

---

### Task 2: Епоха 1 — «Заснування та ранні згадки»

**Files:**
- Create: `src/content/history/01-zasnuvannya.md`

**Interfaces:**
- Consumes: схему `history` з Task 1.
- Produces: перший запис, який Task 8 читає й рендерить першим (`order: 1`).

- [ ] **Step 1: Дослідити джерела**

Через `WebFetch` прочитати:
- `http://forum.zamki-kreposti.com.ua/topic/585-...` — тема про час появи перших кам'яних укріплень Кременецького замку
- `http://zamki-kreposti.com.ua/ternopolskaya-oblast/gorodicshe-antonovcy/` — городище Антонівці (околиці, раннє поселення)
- `https://zabytki.in.ua/uk/opis/?c=kremenets` — каталог пам'яток (шукати найдавніші датування)
- `http://history.kremenets.net.ua/index.php?option=com_content&view=article&id=58:2012-04-19-18-12-44&catid=34:arheologi&Itemid=34` — стаття про археологію

Виписати перевірювані факти з датами/цитатами й точним джерелом кожного факту.

- [ ] **Step 2: Написати файл**

Створити `src/content/history/01-zasnuvannya.md` з frontmatter, що відповідає схемі Task 1 (`order: 1, era: "zasnuvannya", period:` найдавніший діапазон дат, підтверджений джерелами`, title: "Заснування та ранні згадки"`), `summary` — одне речення, і `sources` — тільки ті URL із кроку 1, які реально дали використаний факт. Тіло — суцільний Markdown-наратив (без вигаданих дат/цифр; де джерела мовчать — писати обережно чи пропускати деталь).

- [ ] **Step 3: Перевірити схему**

Run: `npm run check`
Expected: 0 помилок типів/схеми для нового файлу.

---

### Task 3: Епоха 2 — «Литовська доба»

**Files:**
- Create: `src/content/history/02-lytovska-doba.md`

**Interfaces:**
- Consumes: схему `history` з Task 1.
- Produces: другий запис (`order: 2`).

- [ ] **Step 1: Дослідити джерела**

`WebFetch`:
- `https://uk.wikipedia.org/wiki/Тадеуш_Єжи_Стецький` — контекст про історика Волині, чиї праці охоплюють цей період
- `http://forum.zamki-kreposti.com.ua/topic/585-...` (повторно, для деталей саме литовського періоду замку)
- `http://dir.icm.edu.pl/pl/?find_in=fulltext&volume_id=1&find_text=Krzemieniec&search_volume=all` — польський цифровий архів
- `https://zabytki.in.ua/uk/opis/?c=kremenets`

- [ ] **Step 2: Написати файл**

`order: 2, era: "lytovska-doba", period: "XIV–XVI ст.", title: "Литовська доба"`. Тіло — про належність до Великого князівства Литовського, найраніші згадки замку саме в цей період (якщо джерела підтверджують), без вигадування точних дат, яких немає в джерелах.

- [ ] **Step 3: Перевірити схему**

Run: `npm run check`
Expected: 0 помилок.

---

### Task 4: Епоха 3 — «Річ Посполита»

**Files:**
- Create: `src/content/history/03-rich-pospolyta.md`

**Interfaces:**
- Consumes: схему `history` з Task 1.
- Produces: третій запис (`order: 3`).

- [ ] **Step 1: Дослідити джерела**

`WebFetch`:
- `http://history.kremenets.net.ua/index.php?option=com_content&view=section&layout=blog&id=5&Itemid=30` — розділ блогу історії
- `https://uk.wikipedia.org/wiki/Тадеуш_Єжи_Стецький` (праця «Wołyń» охоплює цей період)
- `https://fbc.pionier.net.pl/search#...` — «Ілюстрований провідник по Волині»
- `http://kremdiaz.com/pamiatky-istorii-ta-kultury/kremenetski-nekropoli` — некрополі (датування)

- [ ] **Step 2: Написати файл**

`order: 3, era: "rich-pospolyta", period: "XVI–XVIII ст.", title: "Річ Посполита"`. Тіло — про статус міста, ключові будівлі/події цього періоду, підтверджені джерелами.

- [ ] **Step 3: Перевірити схему**

Run: `npm run check`
Expected: 0 помилок.

---

### Task 5: Епоха 4 — «Австрійська й Російська влада»

**Files:**
- Create: `src/content/history/04-avstro-rosiyska-vlada.md`

**Interfaces:**
- Consumes: схему `history` з Task 1.
- Produces: четвертий запис (`order: 4`).

- [ ] **Step 1: Дослідити джерела**

`WebFetch`:
- `https://commons.wikimedia.org/wiki/Category:Botanical_Garden_in_Kremenets` — ботанічний сад при Кременецькому ліцеї (типово для цього періоду)
- `http://irp.te.ua/vijs-kovy-j-tsvy-ntar-kalanty-r-u-krementsi/` — військовий цвинтар калантарів
- `http://irp.te.ua/kozats-ky-j-p-yatny-ts-ky-j-tsvy-ntar-u-krementsi/` — козацько-п'ятницький цвинтар
- `http://kremenec.at.ua/publ/` — місцеві публікації

- [ ] **Step 2: Написати файл**

`order: 4, era: "avstro-rosiyska-vlada", period: "XIX ст.", title: "Австрійська й Російська влада"`. Тіло — про Кременецький ліцей і сад, зміну адміністративного підпорядкування, підтверджену джерелами.

- [ ] **Step 3: Перевірити схему**

Run: `npm run check`
Expected: 0 помилок.

---

### Task 6: Епоха 5 — «XX століття»

**Files:**
- Create: `src/content/history/05-xx-stolittya.md`

**Interfaces:**
- Consumes: схему `history` з Task 1.
- Produces: п'ятий запис (`order: 5`).

- [ ] **Step 1: Дослідити джерела**

`WebFetch`:
- `http://irp.te.ua/vijs-kovy-j-tsvy-ntar-kalanty-r-u-krementsi/` (події XX ст., якщо є)
- `http://history.kremenets.net.ua/index.php?option=com_content&view=section&layout=blog&id=5&Itemid=30`
- `http://teren.in.ua/2017/09/25/kremenets-z-vysoty-ptashynogo-polotu-nejmovirnyj-fotoreportazh/` (контекст забудови/руйнувань, якщо згадано)

- [ ] **Step 2: Написати файл**

`order: 5, era: "xx-stolittya", period: "XX ст.", title: "XX століття"`. Тіло — про війни, зміну кордонів/влади, підтверджені джерелами; без узагальнень без опори на текст джерела.

- [ ] **Step 3: Перевірити схему**

Run: `npm run check`
Expected: 0 помилок.

---

### Task 7: Епоха 6 — «Сьогодення»

**Files:**
- Create: `src/content/history/06-sohodennya.md`

**Interfaces:**
- Consumes: схему `history` з Task 1.
- Produces: шостий, останній запис (`order: 6`).

- [ ] **Step 1: Дослідити джерела**

`WebFetch`:
- `http://teren.in.ua/2017/09/25/kremenets-z-vysoty-ptashynogo-polotu-nejmovirnyj-fotoreportazh/`
- `http://kolokray.com/uk/f/gora-unias.html` — гора Уніяс (околиці, сучасний стан)
- `https://zabytki.in.ua/uk/opis/?c=kremenets` (сучасний охоронний статус пам'яток)

- [ ] **Step 2: Написати файл**

`order: 6, era: "sohodennya", period: "XXI ст.", title: "Сьогодення"`. Тіло — про теперішній стан міста й пам'яток.

- [ ] **Step 3: Перевірити схему та повний білд усіх 6 епох**

Run: `npm run check && npm run build`
Expected: 0 помилок, `dist/` містить згенеровані сторінки без падінь на колекції `history`.

---

### Task 8: Сторінка `/istoriya/`

**Files:**
- Create: `src/pages/istoriya.astro`

**Interfaces:**
- Consumes: колекцію `history` (Task 1–7): `{ order, era, title, period, summary, sources }` + rendered `Content`.
- Produces: маршрут `/istoriya/`, який Task 10 лінкує з навігації.

- [ ] **Step 1: Написати сторінку**

```astro
---
import { getCollection, render } from "astro:content";
import Layout from "../layouts/Layout.astro";

const eras = (await getCollection("history")).sort(
	(a, b) => a.data.order - b.data.order,
);

const rendered = await Promise.all(
	eras.map(async (entry) => ({
		entry,
		Content: (await render(entry)).Content,
	})),
);
---

<Layout
	title="Історія Міста · Історичний Архів"
	description="Хронологія Кременця за перевіреними джерелами — від перших згадок до сьогодення."
>
	<section class="shell">
		<div class="hero-page">
			<p class="eyebrow">▸ TIMELINE / UA</p>
			<h1>ІСТОРІЯ<br /><span>МІСТА</span></h1>
			<p class="lead">
				Хронологія Кременця, зібрана з архівних і краєзнавчих джерел — від
				перших згадок до сьогодення.
			</p>
		</div>
	</section>

	<nav class="era-nav shell" aria-label="Навігація епохами">
		{rendered.map(({ entry }) => (
			<a href={`#${entry.data.era}`}>{entry.data.period}</a>
		))}
	</nav>

	<section class="shell timeline">
		{rendered.map(({ entry, Content }) => (
			<article class="timeline-era" id={entry.data.era}>
				<div class="timeline-node" aria-hidden="true"></div>
				<div class="timeline-body">
					<p class="era-period">{entry.data.period}</p>
					<h2>{entry.data.title}</h2>
					<p class="lead">{entry.data.summary}</p>
					<div class="story">
						<Content />
					</div>
					{entry.data.sources.length > 0 && (
						<div class="era-sources">
							<p class="meta">ДЖЕРЕЛА</p>
							<ul>
								{entry.data.sources.map((s) => (
									<li>
										<a href={s.url} target="_blank" rel="noopener noreferrer">
											{s.title}
										</a>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			</article>
		))}
	</section>
</Layout>
```

- [ ] **Step 2: Перевірити типи й білд**

Run: `npm run check && npm run build`
Expected: 0 помилок; `dist/istoriya/index.html` створено.

---

### Task 9: CSS таймлайну

**Files:**
- Modify: `src/styles/global.css` (додати в кінець файлу)

**Interfaces:**
- Consumes: наявні токени `:root` (Task 9 нічого не додає в `:root`).
- Produces: класи `.hero-page`, `.era-nav`, `.timeline`, `.timeline-era`, `.timeline-node`, `.timeline-body`, `.era-period`, `.era-sources`, які використовує розмітка з Task 8.

- [ ] **Step 1: Додати стилі**

```css
.hero-page {
  border: 1px solid var(--border-c);
  margin-top: 12px;
  padding: clamp(16px, 2.4vw, 30px);
}

.hero-page h1 {
  margin: 12px 0 0;
  font-family: "Unbounded", sans-serif;
  text-transform: uppercase;
  font-size: clamp(2.2rem, 6vw, 5.5rem);
  line-height: 0.9;
  letter-spacing: -0.05em;
  font-weight: 900;
  overflow-wrap: break-word;
}

.hero-page h1 span {
  color: var(--accent-3);
}

.era-nav {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  position: sticky;
  top: 53px;
  z-index: 15;
  padding-top: 10px;
  padding-bottom: 10px;
  background: rgba(26, 20, 17, 0.92);
  backdrop-filter: blur(6px);
}

.era-nav a {
  padding: 8px 12px;
  border: 1px solid var(--border-c);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  transition: 0.1s;
}

.era-nav a:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}

.timeline {
  margin-top: 10px;
  position: relative;
  padding-left: 28px;
  border-left: 2px solid var(--border-c);
}

.timeline-era {
  position: relative;
  padding-left: 24px;
  padding-bottom: 40px;
}

.timeline-era:last-child {
  padding-bottom: 4px;
}

.timeline-node {
  position: absolute;
  left: -35px;
  top: 4px;
  width: 11px;
  height: 11px;
  background: var(--accent);
  border: 2px solid var(--bg);
  box-shadow: 0 0 0 2px var(--accent);
}

.era-period {
  display: inline-block;
  margin: 0 0 8px;
  padding: 4px 10px;
  background: var(--stripe);
  border: 1px solid var(--border-c);
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.timeline-era h2 {
  margin: 0 0 8px;
  font-family: "Unbounded", sans-serif;
  text-transform: uppercase;
  font-size: clamp(1.5rem, 3.4vw, 2.6rem);
  line-height: 1;
  letter-spacing: -0.03em;
}

.era-sources {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border-c);
}

.era-sources ul {
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
}

.era-sources a {
  font-size: 11px;
  color: var(--muted);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.era-sources a:hover {
  color: var(--accent-3);
}

@media (max-width: 720px) {
  .timeline {
    padding-left: 18px;
  }

  .timeline-era {
    padding-left: 16px;
  }

  .timeline-node {
    left: -24px;
  }

  .era-nav {
    top: 0;
  }
}
```

- [ ] **Step 2: Перевірити візуально й білдом**

Run: `npm run dev` → відкрити `http://localhost:4321/istoriya/`, перевірити на вузькому (`≤720px`, DevTools) і широкому вьюпорті, що лінія й вузли не з'їжджають, текст не вилазить за межі.
Run: `npm run build`
Expected: 0 помилок.

---

### Task 10: Пункт навігації «ІСТОРІЯ»

**Files:**
- Modify: `src/layouts/Layout.astro:43-45`

**Interfaces:**
- Consumes: маршрут `/istoriya/` з Task 8.

- [ ] **Step 1: Додати посилання в `.top-nav`**

Поточний код (`src/layouts/Layout.astro:43-45`):

```astro
			<nav class="top-nav" aria-label="Головна навігація">
				<a href="/">[01] ГАЛЕРЕЯ</a>
			</nav>
```

Замінити на:

```astro
			<nav class="top-nav" aria-label="Головна навігація">
				<a href="/">[01] ГАЛЕРЕЯ</a>
				<a href="/istoriya/">[02] ІСТОРІЯ</a>
			</nav>
```

- [ ] **Step 2: Перевірити білд**

Run: `npm run build`
Expected: 0 помилок; посилання веде на існуючий маршрут з Task 8.

---

### Task 11: Фільтр за десятиліттям у галереї

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/styles/global.css` (додати в кінець)

**Interfaces:**
- Consumes: `photos` (уже є в `index.astro`), поле `photo.data.decade`.
- Produces: клієнтську фільтрацію карток `#gallery .card` за `data-decade`.

- [ ] **Step 1: Порахувати унікальні десятиліття**

У `src/pages/index.astro`, одразу під наявним рядком `const decadeCount = new Set(photos.map((p) => p.data.decade)).size;` додати:

```astro
const decades = [...new Set(photos.map((p) => p.data.decade))].sort();
```

- [ ] **Step 2: Додати розмітку чіпсів і атрибут `data-decade` на картки**

Перед `<section id="gallery" ...>` додати:

```astro
	<div class="shell decade-filter" role="group" aria-label="Фільтр за десятиліттям">
		<button type="button" class="active" data-decade="all">ВСІ</button>
		{decades.map((decade) => (
			<button type="button" data-decade={decade}>{decade}</button>
		))}
	</div>
```

У циклі карток замінити відкриваючий тег:

```astro
			<a class="card" href={`/photos/${toSlug(photo.id)}/`}>
```

на:

```astro
			<a class="card" data-decade={photo.data.decade} href={`/photos/${toSlug(photo.id)}/`}>
```

- [ ] **Step 3: Додати inline-скрипт фільтрації**

Перед закриваючим `</Layout>` в `index.astro` додати:

```astro
	<script is:inline>
		(() => {
			const chips = document.querySelectorAll(".decade-filter button");
			const cards = document.querySelectorAll("#gallery .card");
			chips.forEach((chip) => {
				chip.addEventListener("click", () => {
					chips.forEach((c) => c.classList.remove("active"));
					chip.classList.add("active");
					const decade = chip.dataset.decade;
					cards.forEach((card) => {
						const show = decade === "all" || card.dataset.decade === decade;
						card.classList.toggle("is-hidden", !show);
					});
				});
			});
		})();
	</script>
```

- [ ] **Step 4: Додати стилі чіпсів**

У `src/styles/global.css` додати в кінець:

```css
.decade-filter {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.decade-filter button {
  border: 1px solid var(--border-c);
  background: transparent;
  color: var(--fg);
  font-family: inherit;
  padding: 9px 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: 0.1s;
}

.decade-filter button:hover {
  background: var(--fg);
  color: var(--bg);
}

.decade-filter button.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}

.card.is-hidden {
  display: none;
}
```

- [ ] **Step 5: Перевірити вручну й білдом**

Run: `npm run dev` → відкрити `/`, клікнути кілька чіпсів, переконатись що картки ховаються/показуються коректно і кнопка «ВСІ» повертає всі.
Run: `npm run build`
Expected: 0 помилок.

---

### Task 12: Фінальна перевірка всього циклу

**Files:** немає нових — тільки валідація.

- [ ] **Step 1: Повний чек і білд**

Run: `npm run check && npm run build`
Expected: 0 помилок типів, білд завершується, `dist/` містить `index.html`, `istoriya/index.html`, усі `photos/*/index.html`.

- [ ] **Step 2: Перевірити діфф**

Run: `git status --short && git diff --stat`
Expected: змінені/нові файли відповідають рівно списку з Task 1–11, нічого зайвого.

- [ ] **Step 3: Показати користувачу підсумок і чекати дозволу на коміт**

Коміт НЕ робити автоматично — дочекатись явного «так, комітьте» від користувача, за поточним правилом сесії.

---

## Self-Review Notes

- **Spec coverage:** контент-модель (Task 1–7), сторінка/таймлайн (Task 8–9), навігація (Task 10), фільтр галереї (Task 11) — усі пункти дизайн-спеки покриті. Другорядні джерела свідомо не включені в жодне завдання (відповідає рішенню «почни з ядра»).
- **Placeholders:** для Task 2–7 сам текст статей не може бути написаний заздалегідь у плані — це дослідницький контент, що залежить від реального читання джерел через `WebFetch` під час виконання. Це не технічний placeholder (не "TODO: додати логіку"), а притаманна властивість контентних завдань; кожне завдання натомість має точний список джерел, точну схему frontmatter і критерій прийняття (`npm run check` проходить, `sources` посилаються тільки на реально прочитані джерела).
- **Type consistency:** схема `history` (Task 1) використовується ідентично в Task 8 (`entry.data.order/era/title/period/summary/sources`) і в frontmatter Task 2–7.
