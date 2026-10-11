import type { APIRoute } from "astro";
import { photoOfDayPool } from "../../components/potd";
import { langPaths, type Lang } from "../../i18n/ui";

// Пул для «Фото дня»: обкладинки й підписані фото всіх галерей, прив'язаних до місця.
// Вибір на конкретну дату робить браузер (див. PhotoOfDay.astro), тож фото
// змінюється щодня без нового деплою. /foto-dnya.json — українською, /pl/foto-dnya.json — польською.
export const getStaticPaths = langPaths;

export const GET: APIRoute = async ({ props }) => {
  const pool = await photoOfDayPool(props.lang as Lang);
  return new Response(JSON.stringify(pool), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
