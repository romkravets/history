import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import path from "node:path";
import sharp from "sharp";
import { OG_HEIGHT, OG_WIDTH } from "../../lib/site";

// Банер для прев'ю в соцмережах: обкладинка галереї, обрізана до 1200×630
// (формат, який Facebook, Telegram, Viber і X показують без власного обрізання).
export const getStaticPaths: GetStaticPaths = async () => {
  const photos = await getCollection("photos");
  return photos.map((p) => ({
    params: { slug: p.id.replace(/\.md$/, "") },
    props: { cover: p.data.cover },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const file = path.join(process.cwd(), "public", decodeURI(props.cover as string));
  const jpeg = await sharp(file)
    .rotate()
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: sharp.strategy.attention })
    .flatten({ background: "#1a1411" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg" } });
};
