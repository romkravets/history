/**
 * Мови сайту: українська (основна, адреси без префікса) і польська (/pl/…).
 * Тут — рядки інтерфейсу, назви міст і країв, плюралізація й дати.
 * Тексти галерей, історії, людей і т. д. лежать у src/content/<колекція>-pl/.
 */
import { SITE } from "../site.config";

export const LANGS = ["uk", "pl"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_META: Record<Lang, { label: string; name: string; locale: string; og: string }> = {
  uk: { label: "UA", name: "Українська", locale: "uk-UA", og: "uk_UA" },
  pl: { label: "PL", name: "Polski", locale: "pl-PL", og: "pl_PL" },
};

/** Мова сторінки за адресою: /pl/… — польська, решта — українська. */
export function langFromPath(pathname: string): Lang {
  return /^\/pl(\/|$)/.test(pathname) ? "pl" : "uk";
}

/** Адреса сторінки потрібною мовою: lp("pl", "/karta/") → "/pl/karta/". */
export function lp(lang: Lang, path: string): string {
  if (lang === "uk") return path;
  return path === "/" ? "/pl/" : `/pl${path}`;
}

/** Та сама сторінка іншою мовою. */
export function switchLang(pathname: string, to: Lang): string {
  const bare = pathname.replace(/^\/pl(?=\/|$)/, "") || "/";
  return lp(to, bare);
}

/** getStaticPaths для сторінок без slug: корінь і /pl/. */
export function langPaths() {
  return LANGS.map((lang) => ({ params: { lang: lang === "uk" ? undefined : lang }, props: { lang } }));
}

export function langParam(lang: Lang) {
  return lang === "uk" ? undefined : lang;
}

/** 1 галерея / 2 галереї / 5 галерей; 1 galeria / 2 galerie / 5 galerii. */
export function plural(lang: Lang, n: number, [one, few, many]: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (lang === "pl") {
    if (n === 1) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** Польські назви міст і сіл архіву (ключ — українська назва з поля city). */
const CITY_PL: Record<string, string> = {
  Кременець: "Krzemieniec",
  Луцьк: "Łuck",
  Тернопіль: "Tarnopol",
  Дубно: "Dubno",
  Острог: "Ostróg",
  Броди: "Brody",
  Збараж: "Zbaraż",
  Вишнівець: "Wiśniowiec",
  Почаїв: "Poczajów",
  Підгірці: "Podhorce",
  Олесько: "Olesko",
  Підкамінь: "Podkamień",
  Олика: "Ołyka",
  Клевань: "Klewań",
  Корець: "Korzec",
  Радивилів: "Radziwiłłów",
  Тараканів: "Tarakanów",
  Шумськ: "Szumsk",
  Білокриниця: "Białokrynica",
  Бережці: "Bereżce",
  Дунаїв: "Dunajów",
  Лідихів: "Lidychów",
  Ридомиль: "Rydomyl",
  "Старий Олексинець": "Stary Oleksiniec",
  Вірля: "Wirla",
  Рівне: "Równe",
  Львів: "Lwów",
  Золочів: "Złoczów",
  Буськ: "Busk",
  Бережани: "Brzeżany",
  Теребовля: "Trembowla",
  Чортків: "Czortków",
  Бучач: "Buczacz",
  "Кам'янець-Подільський": "Kamieniec Podolski",
  "Західна Україна": "Zachodnia Ukraina",
};
const CITY_UK = Object.fromEntries(Object.entries(CITY_PL).map(([uk, pl]) => [pl, uk]));

export function cityName(city: string, lang: Lang): string {
  return lang === "pl" ? (CITY_PL[city] ?? city) : city;
}

/** Українська назва міста з будь-якої мовної версії (для країв, областей, карти). */
export function cityKey(city: string): string {
  return CITY_UK[city] ?? city;
}

const LAND_PL: Record<string, string> = { volyn: "Wołyń", podillia: "Podole", halychyna: "Galicja" };
export function landName(key: string, ukLabel: string, lang: Lang): string {
  return lang === "pl" ? (LAND_PL[key] ?? ukLabel) : ukLabel;
}

const ERA_PL: Record<string, string> = {
  early: "Przed XIX w.",
  "19c": "XIX w.",
  "1900s": "Początek XX w.",
  interwar: "Dwudziestolecie",
  soviet: "Lata 1940–1990",
  modern: "Zdjęcia współczesne",
};
export function eraName(key: string, ukLabel: string, lang: Lang): string {
  return lang === "pl" ? (ERA_PL[key] ?? ukLabel) : ukLabel;
}

const LIB_TYPE_PL: Record<string, string> = {
  книга: "książka",
  стаття: "artykuł",
  "художній твір": "literatura piękna",
  "архів/збірка": "archiwum/zbiór",
  сайт: "strona",
  відео: "wideo",
};
export function libraryType(type: string, lang: Lang): string {
  return lang === "pl" ? (LIB_TYPE_PL[type] ?? type) : type;
}

const MONTHS: Record<Lang, [string[], string[]]> = {
  uk: [
    ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"],
    ["січень", "лютий", "березень", "квітень", "травень", "червень", "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"],
  ],
  pl: [
    ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"],
    ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"],
  ],
};
/** «1809-09-04» → «4 вересня 1809» / «4 września 1809», «1992-05» → «травень 1992», інше — як є. */
export function humanDate(d: string | undefined, lang: Lang = "uk"): string {
  if (!d) return "";
  const [gen, nom] = MONTHS[lang];
  let m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${Number(m[3])} ${gen[Number(m[2]) - 1]} ${m[1]}`;
  m = d.match(/^(\d{4})-(\d{2})$/);
  if (m) return `${nom[Number(m[2]) - 1]} ${m[1]}`;
  return d;
}

const uk = {
  // українські тексти про географію — з src/site.config.ts (налаштування шаблону)
  siteName: SITE.name,
  tagline: SITE.tagline,
  brand: "ФОТОАРХІВ",
  coverage: SITE.texts.coverage,
  heroTitle: SITE.texts.heroTitle as string[],
  heroEyebrow: SITE.texts.heroEyebrow,
  aboutGeography: SITE.texts.aboutGeography,
  defaultDescription: (coverage: string) =>
    `Цифровий архів старих фотографій і листівок ${coverage}: дати, описи та історія місць.`,
  nav: {
    gallery: "Галерея",
    map: "Карта",
    routes: "Маршрути",
    people: "Люди",
    library: "Бібліотека",
    history: "Історія",
    about: "Про архів",
  },
  menuOpen: "Відкрити меню",
  menuClose: "Закрити меню",
  mainNav: "Головна навігація",
  langSwitch: "Мова сайту",
  footerAbout: "Фото, листівки, карти, люди й історія краю — з джерелами.",
  footerSections: "Розділи",
  footerAuthor: "Автор",
  footerRights: "Фото належать їхнім авторам",
  toTop: "Повернутися нагору",
  authorName: "Роман Кравець",
  country: "Україна",
  // головна
  home: {
    andOthers: "та інші",
    description: (coverage: string, cities: string, n: number, word: string) =>
      `Старі фотографії й листівки ${coverage}: ${cities}. ${n} ${word} з датами, описами та історією місць.`,
    galleryForms: ["галерея", "галереї", "галерей"] as [string, string, string],
    lead: (coverage: string, cities: string) => `Старі фото й листівки ${coverage}: ${cities}. Дати, місця, свідчення.`,
    openGallery: "Відкрити галерею ↓",
    mapLink: "Карта фото →",
    aboutLink: "Про архів →",
    statGalleries: "Галерей",
    statPhotos: "Фото",
    statPlaces: "Міст і сіл",
    statEras: "Епох",
    videoBy: "відео",
    videoPause: "Зупинити відео",
    videoPlay: "Відтворити відео",
    aboutArchive: "Про архів",
    thenNow: "Тоді й тепер",
    dragSlider: "— потягніть повзунок",
    allComparisons: "Усі порівняння →",
    routeLink: "Маршрути краєм →",
    ticker: ["АРХІВ · КРАЙ · ПАМ'ЯТЬ", "СТРІЧКА АКТИВНА"],
    landFilter: "Фільтр за краєм",
    allLands: "Усі краї",
    eraFilter: "Фільтр за епохою",
    all: "Усі",
    galleryLabel: "Галерея світлин",
    photosInGallery: (n: number) => `${n} фото в галереї`,
    photoForms: ["фото", "фото", "фото"] as [string, string, string],
    open: "ВІДКРИТИ →",
  },
  // фото дня
  potd: {
    title: "Фото дня",
    text: "Щодня — інше фото з архіву. Заходьте завтра або підпишіться, щоб не пропустити.",
    openPhoto: "Відкрити фото →",
    wholeGallery: "Уся галерея",
    share: "Поділитися:",
  },
  // галерея
  gallery: {
    photoN: (i: number, n: number) => `фото ${i} з ${n}`,
    kindRe: /фото|світлин|листівк|знімк|реконструкц|малюнк|гравюр|карт/i,
    modernRe: /сучасн/i,
    kindModern: " — фото",
    kindOld: " — старі фото",
    breadcrumbHome: "Галерея",
    allGalleries: "← Усі галереї",
    prev: "Попередня",
    next: "Наступна",
    prevGallery: "Попередня галерея",
    nextGallery: "Наступна галерея",
    onMap: "◉ На карті",
    feedbackQ: "Впізнали місце чи людей? Маєте старі фото цього місця?",
    feedbackWrite: "Знаєте, що на фото? Напишіть →",
    feedbackSend: "Надіслати своє фото",
    feedbackPhoto: "Знаєте, що на цьому фото?",
    share: "Поділитися:",
    shareNative: "Поділитися…",
    shareIn: (name: string) => `Поділитися в ${name}`,
    copyLink: "Копіювати посилання",
    copied: "Скопійовано ✓",
    thenNow: "Тоді й тепер",
    dragSlider: "— потягніть повзунок",
    morePhotos: "Додаткові фотографії",
    relatedPeople: "Люди, пов'язані з цією галереєю",
    otherGalleries: "Інші галереї",
    lightbox: "Перегляд фото",
    close: "Закрити",
    prevPhoto: "Попереднє фото",
    nextPhoto: "Наступне фото",
    photoLabel: "Фото",
  },
  related: {
    title: "Схожі галереї",
    back: "Прокрутити назад",
    forward: "Прокрутити вперед",
    sharedTopic: "Спільна тема",
    samePlace: "Те саме місце",
    near: "Поруч",
    samePeriod: "Той самий період",
    samePeople: "Ті самі люди",
    also: "Теж",
    m: "м",
    km: "км",
  },
  ba: { before: "Тоді", after: "Тепер", compare: "Порівняти", left: "ліворуч", right: "праворуч" },
  // карта
  map: {
    title: "Карта: де зроблені фото",
    description: (n: number, places: number, coverage: string) =>
      `Інтерактивна карта архіву: ${n} галерей у ${places} місцях: ${coverage}. Натисніть на точку, щоб побачити фото й перейти до галереї.`,
    eyebrow: "▸ ГЕОГРАФІЯ АРХІВУ",
    h1: ["КАРТА", "ФОТО"],
    lead: (n: number, places: number) =>
      `${n} галерей у ${places} місцях. Натисніть на точку, щоб побачити обкладинку й перейти до галереї. Цифра в колі — скільки галерей зібрано поруч; наблизьте карту або натисніть, щоб розгорнути.`,
    landLabel: "Край на карті",
    region: "Карта галерей",
    exact: "точне місце",
    approx: "приблизне: загальні види міста або місце не вдалося визначити точно",
    offMap: (n: number) => ` · ще ${n} галереї (старі карти, реконструкції) не прив'язані до одного місця`,
    popupApprox: " · місце приблизне",
    popupOpen: " — відкрити галерею →",
  },
  // історія
  history: {
    title: (g: string) => `Історія ${g}: хронологія від заснування до сьогодення`,
    description: (g: string, titles: string) => `Хронологія ${g} за перевіреними джерелами: ${titles}.`,
    eyebrow: "▸ ХРОНОЛОГІЯ",
    h1: "ІСТОРІЯ",
    homeGenitive: "КРЕМЕНЦЯ",
    lead: (g: string) =>
      `Хронологія ${g}, зібрана з архівних і краєзнавчих джерел — від перших згадок до сьогодення. Де джерела мовчать, мовчить і текст.`,
    nav: "Навігація епохами",
    sources: "ДЖЕРЕЛА",
  },
  // люди
  people: {
    title: "Відомі люди краю",
    description: (names: string) =>
      `Відомі люди, пов'язані з Кременцем і краєм: ${names} та інші — біографії, джерела, фото й література.`,
    listName: "Відомі люди",
    eyebrow: "▸ ЛЮДИ КРАЮ",
    h1: ["ВІДОМІ", "ЛЮДИ"],
    lead: "Поети, науковці, фотографи, власники замків і меценати — ті, хто народився тут, жив, працював або залишив слід в історії краю. Кожна біографія — з джерелами.",
    list: "Список людей",
    all: "← Усі люди",
    breadcrumb: "Люди",
    born: "Народ.",
    died: "Пом.",
    places: "Місця",
    photos: "Фото в архіві",
    books: "Література",
    sources: "Джерела",
  },
  // бібліотека
  library: {
    title: "Бібліотека краєзнавства: книги, статті й ресурси",
    description:
      "Книги, статті, художні твори, архіви й сайти про історію Кременця й Західної України — з посиланнями, де читати.",
    listName: "Бібліотека краєзнавства",
    eyebrow: "▸ ДЖЕРЕЛА Й ЧИТАННЯ",
    h1: ["БІБЛІОТЕКА", "КРАЄЗНАВСТВА"],
    lead: "Книги, наукові статті, художні твори, архіви й сайти про історію Кременця і краю — з посиланнями, де їх прочитати. На ці джерела спираються описи галерей і біографії.",
    typeFilter: "Тип матеріалу",
    all: "Усе",
    items: "Матеріали",
    openSite: "Відкрити сайт",
    read: "Де читати",
  },
  // маршрути
  routes: {
    title: "Маршрути: пішки старим містом і автомобілем замками краю",
    description:
      "Пішохідна прогулянка старим Кременцем і автомобільні маршрути замками, палацами й монастирями Волині, Поділля й Галичини — зі старими фото на кожній зупинці.",
    eyebrow: "▸ ПРОГУЛЯНКИ Й ПОДОРОЖІ",
    h1: ["МАРШРУТИ", "КРАЄМ"],
    lead: "Пройдіться старим містом або вирушайте автомобілем від замку до замку з фотоархівом у телефоні: на кожній зупинці — старе фото того самого місця.",
    modeWalk: "пішки",
    modeDrive: "автомобілем",
    stopForms: ["зупинка", "зупинки", "зупинок"] as [string, string, string],
    openRoute: "ВІДКРИТИ МАРШРУТ →",
    all: "← Усі маршрути",
    route: "Маршрут",
    gmaps: "Відкрити в Google Maps ↗",
    firstStop: "До першої зупинки ↓",
    mapLabel: "Карта маршруту",
    approx: "точка приблизна",
    galleryPrefix: "Галерея",
    pointOnMap: "Точка на карті ↗",
  },
  about: {
    title: "Про архів",
    description: (coverage: string) =>
      `Про цифровий фотоархів ${coverage}: звідки фото, хто автор, як збирається і публікується архів.`,
  },
  notFound: {
    title: "Сторінку не знайдено",
  },
};

export type UI = typeof uk;

const pl: UI = {
  siteName: "Historyczne archiwum fotografii Zachodniej Ukrainy",
  tagline: "Dawne zdjęcia Wołynia, Podola i Galicji",
  brand: "FOTOARCHIWUM",
  coverage: "Wołynia, Podola i Galicji — od Krzemieńca po Łuck, Ostróg i Brody",
  heroTitle: ["Zachodnia Ukraina", "w", "fotoarchiwum"],
  heroEyebrow: "Cyfrowa pamięć regionu",
  aboutGeography:
    "Wołyń, Podole i Galicja: Krzemieniec i ziemia krzemieniecka (od których archiwum się zaczęło), Dubno, Ostróg, Łuck, Brody, Zbaraż, Tarnopol oraz inne miasta i wsie",
  defaultDescription: (coverage: string) =>
    `Cyfrowe archiwum dawnych fotografii i pocztówek ${coverage}: daty, opisy i historia miejsc.`,
  nav: {
    gallery: "Galeria",
    map: "Mapa",
    routes: "Trasy",
    people: "Ludzie",
    library: "Biblioteka",
    history: "Historia",
    about: "O archiwum",
  },
  menuOpen: "Otwórz menu",
  menuClose: "Zamknij menu",
  mainNav: "Nawigacja główna",
  langSwitch: "Język strony",
  footerAbout: "Zdjęcia, pocztówki, mapy, ludzie i historia regionu — ze źródłami.",
  footerSections: "Działy",
  footerAuthor: "Autor",
  footerRights: "Zdjęcia należą do ich autorów",
  toTop: "Wróć na górę",
  authorName: "Roman Kravets",
  country: "Ukraina",
  home: {
    andOthers: "i inne",
    description: (coverage: string, cities: string, n: number, word: string) =>
      `Dawne fotografie i pocztówki ${coverage}: ${cities}. ${n} ${word} z datami, opisami i historią miejsc.`,
    galleryForms: ["galeria", "galerie", "galerii"],
    lead: (coverage: string, cities: string) => `Dawne zdjęcia i pocztówki ${coverage}: ${cities}. Daty, miejsca, świadectwa.`,
    openGallery: "Otwórz galerię ↓",
    mapLink: "Mapa zdjęć →",
    aboutLink: "O archiwum →",
    statGalleries: "Galerii",
    statPhotos: "Zdjęć",
    statPlaces: "Miast i wsi",
    statEras: "Epok",
    videoBy: "wideo",
    videoPause: "Zatrzymaj wideo",
    videoPlay: "Odtwórz wideo",
    aboutArchive: "O archiwum",
    thenNow: "Dawniej i dziś",
    dragSlider: "— przesuń suwak",
    allComparisons: "Wszystkie porównania →",
    routeLink: "Trasy po regionie →",
    ticker: ["ARCHIWUM · REGION · PAMIĘĆ", "TAŚMA AKTYWNA"],
    landFilter: "Filtr według regionu",
    allLands: "Wszystkie regiony",
    eraFilter: "Filtr według epoki",
    all: "Wszystkie",
    galleryLabel: "Galeria fotografii",
    photosInGallery: (n: number) => `Zdjęcia w galerii: ${n}`,
    photoForms: ["zdjęcie", "zdjęcia", "zdjęć"],
    open: "OTWÓRZ →",
  },
  potd: {
    title: "Zdjęcie dnia",
    text: "Codziennie inne zdjęcie z archiwum. Zajrzyj jutro albo zasubskrybuj, żeby niczego nie przegapić.",
    openPhoto: "Otwórz zdjęcie →",
    wholeGallery: "Cała galeria",
    share: "Udostępnij:",
  },
  gallery: {
    photoN: (i: number, n: number) => `zdjęcie ${i} z ${n}`,
    kindRe: /zdję|fotograf|pocztów|ujęci|rekonstrukc|rysun|rycin|grafik|map/i,
    modernRe: /współczes/i,
    kindModern: " — zdjęcia",
    kindOld: " — dawne zdjęcia",
    breadcrumbHome: "Galeria",
    allGalleries: "← Wszystkie galerie",
    prev: "Poprzednia",
    next: "Następna",
    prevGallery: "Poprzednia galeria",
    nextGallery: "Następna galeria",
    onMap: "◉ Na mapie",
    feedbackQ: "Rozpoznajesz miejsce lub ludzi? Masz stare zdjęcia tego miejsca?",
    feedbackWrite: "Wiesz, co jest na zdjęciu? Napisz →",
    feedbackSend: "Wyślij swoje zdjęcie",
    feedbackPhoto: "Wiesz, co jest na tym zdjęciu?",
    share: "Udostępnij:",
    shareNative: "Udostępnij…",
    shareIn: (name: string) => `Udostępnij w ${name}`,
    copyLink: "Kopiuj link",
    copied: "Skopiowano ✓",
    thenNow: "Dawniej i dziś",
    dragSlider: "— przesuń suwak",
    morePhotos: "Pozostałe zdjęcia",
    relatedPeople: "Osoby związane z tą galerią",
    otherGalleries: "Inne galerie",
    lightbox: "Podgląd zdjęcia",
    close: "Zamknij",
    prevPhoto: "Poprzednie zdjęcie",
    nextPhoto: "Następne zdjęcie",
    photoLabel: "Zdjęcie",
  },
  related: {
    title: "Podobne galerie",
    back: "Przewiń wstecz",
    forward: "Przewiń dalej",
    sharedTopic: "Wspólny temat",
    samePlace: "To samo miejsce",
    near: "W pobliżu",
    samePeriod: "Ten sam okres",
    samePeople: "Te same osoby",
    also: "Także",
    m: "m",
    km: "km",
  },
  ba: { before: "Dawniej", after: "Dziś", compare: "Porównaj", left: "po lewej", right: "po prawej" },
  map: {
    title: "Mapa: gdzie zrobiono zdjęcia",
    description: (n: number, places: number, coverage: string) =>
      `Interaktywna mapa archiwum: ${n} galerii w ${places} miejscach: ${coverage}. Kliknij punkt, aby zobaczyć zdjęcia i przejść do galerii.`,
    eyebrow: "▸ GEOGRAFIA ARCHIWUM",
    h1: ["MAPA", "ZDJĘĆ"],
    lead: (n: number, places: number) =>
      `${n} galerii w ${places} miejscach. Kliknij punkt, aby zobaczyć okładkę i przejść do galerii. Liczba w kółku oznacza, ile galerii jest w pobliżu; przybliż mapę lub kliknij, aby je rozwinąć.`,
    landLabel: "Region na mapie",
    region: "Mapa galerii",
    exact: "dokładne miejsce",
    approx: "przybliżone: ogólne widoki miasta lub miejsca nie udało się ustalić dokładnie",
    offMap: (n: number) => ` · galerie bez jednego miejsca (stare mapy, rekonstrukcje): ${n}`,
    popupApprox: " · miejsce przybliżone",
    popupOpen: " — otwórz galerię →",
  },
  history: {
    title: (g: string) => `Historia ${g}: kronika od założenia do dziś`,
    description: (g: string, titles: string) => `Kronika ${g} oparta na sprawdzonych źródłach: ${titles}.`,
    eyebrow: "▸ KRONIKA",
    h1: "HISTORIA",
    homeGenitive: "KRZEMIEŃCA",
    lead: (g: string) =>
      `Kronika ${g} zebrana ze źródeł archiwalnych i krajoznawczych — od pierwszych wzmianek do dziś. Gdzie milczą źródła, milczy i tekst.`,
    nav: "Nawigacja po epokach",
    sources: "ŹRÓDŁA",
  },
  people: {
    title: "Znane postacie regionu",
    description: (names: string) =>
      `Znane postacie związane z Krzemieńcem i regionem: ${names} i inni — biografie, źródła, zdjęcia i literatura.`,
    listName: "Znane postacie",
    eyebrow: "▸ LUDZIE REGIONU",
    h1: ["ZNANE", "POSTACIE"],
    lead: "Poeci, uczeni, fotografowie, właściciele zamków i mecenasi — ci, którzy się tu urodzili, żyli, pracowali lub zostawili ślad w historii regionu. Każda biografia ze źródłami.",
    list: "Lista osób",
    all: "← Wszystkie osoby",
    breadcrumb: "Ludzie",
    born: "Ur.",
    died: "Zm.",
    places: "Miejsca",
    photos: "Zdjęcia w archiwum",
    books: "Literatura",
    sources: "Źródła",
  },
  library: {
    title: "Biblioteka krajoznawcza: książki, artykuły i zasoby",
    description:
      "Książki, artykuły, literatura piękna, archiwa i strony o historii Krzemieńca i Zachodniej Ukrainy — z linkami, gdzie je czytać.",
    listName: "Biblioteka krajoznawcza",
    eyebrow: "▸ ŹRÓDŁA I LEKTURY",
    h1: ["BIBLIOTEKA", "KRAJOZNAWCZA"],
    lead: "Książki, artykuły naukowe, literatura piękna, archiwa i strony o historii Krzemieńca i regionu — z linkami, gdzie je przeczytać. Na tych źródłach opierają się opisy galerii i biografie.",
    typeFilter: "Rodzaj materiału",
    all: "Wszystko",
    items: "Materiały",
    openSite: "Otwórz stronę",
    read: "Gdzie czytać",
  },
  routes: {
    title: "Trasy: pieszo po starym mieście i samochodem szlakiem zamków",
    description:
      "Piesza wycieczka po starym Krzemieńcu i trasy samochodowe szlakiem zamków, pałaców i klasztorów Wołynia, Podola i Galicji — z dawnymi zdjęciami na każdym przystanku.",
    eyebrow: "▸ SPACERY I PODRÓŻE",
    h1: ["TRASY", "PO REGIONIE"],
    lead: "Przejdź się po starym mieście albo wyrusz samochodem od zamku do zamku z fotoarchiwum w telefonie: na każdym przystanku czeka dawne zdjęcie tego samego miejsca.",
    modeWalk: "pieszo",
    modeDrive: "samochodem",
    stopForms: ["przystanek", "przystanki", "przystanków"],
    openRoute: "OTWÓRZ TRASĘ →",
    all: "← Wszystkie trasy",
    route: "Trasa",
    gmaps: "Otwórz w Google Maps ↗",
    firstStop: "Do pierwszego przystanku ↓",
    mapLabel: "Mapa trasy",
    approx: "punkt przybliżony",
    galleryPrefix: "Galeria",
    pointOnMap: "Punkt na mapie ↗",
  },
  about: {
    title: "O archiwum",
    description: (coverage: string) =>
      `O cyfrowym archiwum fotografii ${coverage}: skąd pochodzą zdjęcia, kto jest autorem, jak archiwum jest gromadzone i publikowane.`,
  },
  notFound: {
    title: "Nie znaleziono strony",
  },
};

export const UI_TEXT: Record<Lang, UI> = { uk, pl };
export const t = (lang: Lang): UI => UI_TEXT[lang];
