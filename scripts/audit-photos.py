#!/usr/bin/env python3
"""
Аудит папки з фото перед додаванням в архів.

Для кожного зображення (включно з підпапками) рахує перцептивний хеш (pHash)
і шукає найближче фото в public/photos — так знаходяться копії навіть іншого
розміру, з іншою обрізкою чи стисненням. Також шукає дублі всередині самої папки
і будує аркуші мініатюр, щоб переглянути нові фото очима (або показати ШІ).

Використання:
  python3 scripts/audit-photos.py "<папка>" [--out audit-out] [--threshold 10]

Результат у --out:
  audit.json      — по кожному файлу: шлях, розмір, відстань до найближчого фото архіву
  sheet_N.jpg     — мініатюри НОВИХ фото з номерами (номер = індекс у audit.json)

Відстань pHash: 0–6 — та сама картинка; 7–10 — майже напевно копія (перевірте очима);
11–14 — сумнівно; >14 — нове фото.

Залежності: pip install pillow imagehash numpy
"""
import argparse, glob, itertools, json, os, sys, unicodedata
from collections import Counter

try:
    import imagehash, numpy as np
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("Встановіть залежності: pip install pillow imagehash numpy")

Image.MAX_IMAGE_PIXELS = None
EXT = (".jpg", ".jpeg", ".png", ".webp")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
N = lambda s: unicodedata.normalize("NFC", s)  # macOS зберігає назви в NFD


def phash(path):
    im = Image.open(path)
    im.draft("RGB", (512, 512))  # швидше для великих JPEG
    return imagehash.phash(im), im.size


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("--out", default="audit-out")
    ap.add_argument("--threshold", type=int, default=10)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)

    print("Індексую архів…", file=sys.stderr)
    arch, hashes = [], []
    for p in glob.glob(os.path.join(ROOT, "public/photos/**/*"), recursive=True):
        if p.lower().endswith(EXT):
            try:
                hashes.append(phash(p)[0].hash.flatten()); arch.append(os.path.relpath(p, ROOT))
            except Exception:
                pass
    A = np.array(hashes)

    res = []
    files = sorted(p for p in glob.glob(os.path.join(a.source, "**/*"), recursive=True) if p.lower().endswith(EXT))
    print(f"Перевіряю {len(files)} файлів…", file=sys.stderr)
    for p in files:
        rel = N(os.path.relpath(p, a.source))
        try:
            h, size = phash(p)
        except Exception as e:
            res.append({"rel": rel, "path": p, "error": str(e)}); continue
        d = (A != h.hash.flatten()).sum(1) if len(A) else np.array([64])
        k = int(d.argmin())
        res.append({"i": len(res), "rel": rel, "path": p, "size": list(size), "hash": str(h),
                    "dist": int(d[k]), "match": arch[k] if len(arch) else None})
    json.dump(res, open(os.path.join(a.out, "audit.json"), "w"), ensure_ascii=False, indent=1)

    ok = [r for r in res if "error" not in r]
    folder = lambda r: "/".join(r["rel"].split("/")[:-1]) or "(корінь)"
    tot, inarch = Counter(map(folder, ok)), Counter(folder(r) for r in ok if r["dist"] <= a.threshold)
    print(f"\n{'всього':>6} | {'в архіві':>8} | {'нові':>5} | папка")
    for f, n in sorted(tot.items()):
        print(f"{n:6} | {inarch[f]:8} | {n - inarch[f]:5} | {f}")
    for r in res:
        if "error" in r: print("ПОМИЛКА:", r["rel"], r["error"])

    new = [r for r in ok if r["dist"] > a.threshold]
    print("\nДублі всередині папки (індекси):")
    for x, y in itertools.combinations(new, 2):
        if imagehash.hex_to_hash(x["hash"]) - imagehash.hex_to_hash(y["hash"]) <= a.threshold:
            print(f"  {x['i']} ≈ {y['i']}   {x['rel']}  |  {y['rel']}")

    W, cols = 240, 8
    for part in range(0, len(new), 56):
        chunk = new[part:part + 56]
        rows = (len(chunk) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * W, rows * (W * 3 // 4 + 16)), "white")
        dr = ImageDraw.Draw(sheet)
        for j, r in enumerate(chunk):
            im = Image.open(r["path"]); im.draft("RGB", (W, W)); im = im.convert("RGB")
            im.thumbnail((W - 6, W * 3 // 4))
            x, y = (j % cols) * W, (j // cols) * (W * 3 // 4 + 16)
            sheet.paste(im, (x, y)); dr.text((x, y + W * 3 // 4 + 2), f"{r['i']}:{r['dist']}", fill="red")
        sheet.save(os.path.join(a.out, f"sheet_{part // 56}.jpg"), quality=80)
    print(f"\nНових фото: {len(new)}. Аркуші мініатюр і audit.json — у {a.out}/")


if __name__ == "__main__":
    main()
