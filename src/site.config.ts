/**
 * Налаштування архіву: назва, місто, регіон і тексти, що згадують місце.
 *
 * Це єдиний файл, який треба змінити, щоб розгорнути шаблон для іншого міста
 * чи регіону. Найпростіше — командою `npm run template:init`, яка заповнить
 * його за вас (див. docs/new-archive.md).
 */
export const SITE = {
  /** Назва сайту — у шапці, <title>, соцмережах. */
  name: "Історичний фотоархів Західної України",
  /** Коротко, про що архів (заголовок головної в пошуку). */
  tagline: "Старі фото Волині, Поділля й Галичини",
  /** Типова адреса сайту; на Vercel можна перевизначити змінною SITE_URL. */
  url: "https://history-kremenets.vercel.app",
  author: {
    name: "Роман Кравець",
    url: "https://github.com/romkravets",
    /** Посилання в підвалі сайту (порожній рядок — не показувати). */
    github: "https://github.com/romkravets",
    linkedin: "https://www.linkedin.com/in/romkravets/",
  },

  /** Головне місто архіву — центр карти, гео-мітки, schema.org. */
  home: {
    name: "Кременець",
    /** Родовий відмінок: «історія Кременця». */
    genitive: "Кременця",
    /** Орудний відмінок: «пов'язані з Кременцем». */
    instrumental: "Кременцем",
    /** Край навколо міста у родовому відмінку: «сіл Кременеччини». */
    regionGenitive: "Західної України",
    /** Область (для адрес у schema.org). */
    oblast: "Тернопільська область",
    /** ISO 3166-2 код області (геомітка geo.region). */
    oblastCode: "UA-61",
    latitude: 50.1031,
    longitude: 25.7258,
  },

  /** Міста архіву з іншої області. Решта вважаються з `home.oblast`. */
  regionOverrides: {
    Олесько: "Львівська область",
    Підкамінь: "Львівська область",
    Підгірці: "Львівська область",
    Золочів: "Львівська область",
    Буськ: "Львівська область",
    Львів: "Львівська область",
    Броди: "Львівська область",
    Дубно: "Рівненська область",
    Тараканів: "Рівненська область",
    Радивилів: "Рівненська область",
    Острог: "Рівненська область",
    Клевань: "Рівненська область",
    Корець: "Рівненська область",
    Рівне: "Рівненська область",
    Луцьк: "Волинська область",
    Олика: "Волинська область",
    "Західна Україна": "Західна Україна",
  } as Record<string, string>,

  /**
   * Історико-етнографічні краї: фільтр «Край» на головній і на карті.
   * Межі країв умовні; місто, якого тут немає, потрапляє в `defaultLand`.
   */
  lands: [
    { key: "volyn", label: "Волинь", cities: ["Кременець", "Вишнівець", "Почаїв", "Білокриниця", "Бережці", "Дунаїв", "Вірля", "Лідихів", "Великі Бережці", "Лішня", "Стіжок", "Ридомиль", "Шумськ", "Старий Олексинець", "Дубно", "Тараканів", "Радивилів", "Острог", "Луцьк", "Рівне", "Олика", "Клевань", "Корець"] },
    { key: "podillia", label: "Поділля", cities: ["Тернопіль", "Збараж", "Теребовля", "Чортків", "Бучач", "Кам'янець-Подільський"] },
    { key: "halychyna", label: "Галичина", cities: ["Броди", "Олесько", "Підгірці", "Підкамінь", "Золочів", "Буськ", "Львів", "Бережани"] },
  ],
  defaultLand: "volyn",

  /**
   * Відгуки відвідувачів через Google Form: «Знаєте, що на фото?» і «Надіслати своє фото».
   * formUrl — посилання на форму (…/viewform); fields — id полів «entry.123…» для
   * автозаповнення назви галереї, номера фото й адреси сторінки. Порожній formUrl — кнопок немає.
   * Як налаштувати: docs/feedback-form.md
   */
  // ВИМКНЕНО (жовтень 2026): форма відгуків поки не потрібна. Код кнопок лишається
  // в src/pages/photos/[slug].astro — щоб увімкнути, впишіть formUrl і fields.
  feedback: {
    formUrl: "",
    fields: { gallery: "", photo: "", url: "" },
  },

  /** Тексти, що описують географію архіву. */
  texts: {
    /** «Старі фото й листівки <coverage>: …» — опис головної, мета-опис. */
    coverage: "Волині, Поділля й Галичини — від Кременця до Луцька, Острога й Бродів",
    /** Великий заголовок банера: перший рядок, акцентне слово, другий рядок. */
    heroTitle: ["Західна Україна", "через", "фотоархів"] as [string, string, string],
    heroEyebrow: "Цифрова пам'ять краю",
    /** Географія для сторінки «Про архів». */
    aboutGeography:
      "Волинь, Поділля й Галичина: Кременець і Кременеччина (звідки архів починався), Дубно, Острог, Луцьк, Броди, Збараж, Тернопіль та інші міста й села",
  },

  /**
   * Відео для банера на головній: при кожному відкритті показується одне випадкове.
   * Файли — у public/video. Для чужих відео вкажіть автора й ліцензію (credit) і сторінку джерела (source).
   */
  banners: [
    { place: "Кременець", placePl: "Krzemieniec", src: "/video/banner", poster: "/video/banner-poster.jpg" },
    {
      place: "Почаївська лавра",
      placePl: "Ławra Poczajowska",
      src: "/video/banner-pochaiv",
      poster: "/video/banner-pochaiv-poster.jpg",
      credit: "Олексій Бухало, CC BY-SA 4.0",
      creditPl: "Ołeksij Buchało, CC BY-SA 4.0",
      source: "https://commons.wikimedia.org/wiki/File:Почаївська_Лавра_взимку.webm",
    },
    {
      place: "Олеський замок",
      placePl: "Zamek w Olesku",
      src: "/video/banner-olesko",
      poster: "/video/banner-olesko-poster.jpg",
      credit: "Drone Grand Tour, CC BY 3.0",
      source: "https://commons.wikimedia.org/wiki/File:Drone_Grand_Tour_-_Olesko_Castle._Ukraine.webm",
    },
    {
      place: "Підгорецький замок",
      placePl: "Zamek w Podhorcach",
      src: "/video/banner-pidhirtsi",
      poster: "/video/banner-pidhirtsi-poster.jpg",
      credit: "Drone Grand Tour, CC BY 3.0",
      source: "https://commons.wikimedia.org/wiki/File:Drone_Grand_Tour_-_Pidhirtsi_Castle_Western_Ukraine.webm",
    },
  ] as { place: string; placePl?: string; src: string; poster: string; credit?: string; creditPl?: string; source?: string }[],
};
