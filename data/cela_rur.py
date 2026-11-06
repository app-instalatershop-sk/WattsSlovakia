"""Čelá rúr: kruhový výrez prierezu z renderu celého potrubia (web/src/assets/3d/rady) pre katalóg na domove.

Na čele je vidieť plášť, penu a nosné rúry, takže farba jadra ukáže médium bez ikony: žltá vykurovanie,
biela pitná voda, čierna s modrým pásikom COOL (Juraj 5. 11. 2026, verzia G2). Čelo sa nájde podľa peny:
tmavosivé neprifarbené pixely v pravej časti renderu (HSV s < 0,16 a 0,18 < v < 0,55), ich obdĺžnik je
vnútro plášťa. Polomer výrezu je 1,16 násobok, aby bol vidieť aj okraj plášťa, a stred je o 0,16 polomeru
vpravo, lebo nosné rúry vyčnievajú z čela doprava.

Spustenie (Pillow je v používateľských balíkoch systémového Pythonu, preto -P a nie -I):
    C:/Python314/python -P data/cela_rur.py
Výstup: web/src/assets/3d/cela/<id radu>.webp, 320 × 320 px s priehľadným okolím.
"""
import colorsys
import pathlib
import sys

from PIL import Image

KOREN = pathlib.Path(__file__).resolve().parent.parent
VSTUP = KOREN / 'web' / 'src' / 'assets' / '3d' / 'rady'
VYSTUP = KOREN / 'web' / 'src' / 'assets' / '3d' / 'cela'
VELKOST = 320


def celo(cesta: pathlib.Path) -> Image.Image:
    im = Image.open(cesta).convert('RGBA')
    sirka, vyska = im.size
    px = im.load()
    xs, ys = [], []
    for y in range(0, vyska, 2):
        for x in range(int(sirka * 0.45), sirka, 2):
            r, g, b, a = px[x, y]
            if a < 250:
                continue
            _, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.16 and 0.18 < v < 0.55:
                xs.append(x)
                ys.append(y)
    if len(xs) < 200:
        raise SystemExit(f'{cesta.name}: na renderi sa nenašla pena čela')
    xs.sort()
    ys.sort()
    q = len(xs) // 200  # okrajové pixely (odlesky, šum) nerátať
    x0, x1, y0, y1 = xs[q], xs[-q - 1], ys[q], ys[-q - 1]
    polomer = max(x1 - x0, y1 - y0) / 2 * 1.16
    sx = (x0 + x1) / 2 + 0.16 * polomer
    sy = (y0 + y1) / 2 + 0.02 * polomer
    # Rezerva okolo obrázka, keby výrez siahal za jeho okraj.
    okraj = int(polomer)
    plocha = Image.new('RGBA', (sirka + 2 * okraj, vyska + 2 * okraj), (0, 0, 0, 0))
    plocha.paste(im, (okraj, okraj))
    box = tuple(int(round(c)) + okraj for c in (sx - polomer, sy - polomer, sx + polomer, sy + polomer))
    return plocha.crop(box).resize((VELKOST, VELKOST), Image.LANCZOS)


def main() -> None:
    sys.stdout.reconfigure(encoding='utf-8')  # konzola Windows by inak „č“ vypísala ako otáznik
    VYSTUP.mkdir(parents=True, exist_ok=True)
    subory = sorted(VSTUP.glob('*.webp'))
    if not subory:
        sys.exit(f'chýbajú rendery v {VSTUP}')
    for cesta in subory:
        celo(cesta).save(VYSTUP / cesta.name, 'WEBP', quality=90, method=6)
        print('čelo', cesta.stem)


if __name__ == '__main__':
    main()
