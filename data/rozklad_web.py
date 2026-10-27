"""Rozložený rez pre web: sekvencia snímok z Blendera → WebP s priehľadnosťou + body vrstiev.

Vstup: data/_3d/final/rozlozeny/rozlozeny-NNN.png (render), -tien.png (kontaktný tieň) a rozlozeny.json
(body_px pre každú snímku). Tieň sa vloží pod výrobok, všetky snímky sa orežú na spoločný rámec
(zjednotenie obrysov s okrajom) a uložia v dvoch šírkach do web/public/3d/<meno>/<sirka>/NNN.webp.
Body pre štítky vrstiev (plášť, izolácia, nosná rúra) idú v percentách orezaného rámca do
web/src/data/<meno>.json. Komponent components/Rozklad.astro ich kreslí na <canvas> podľa rolovania.

Formáty: všetky snímky AVIF (asi tretina WebP); posledná snímka aj WebP ako statický obraz pre
prehliadač bez AVIF (ten pohyb nedostane, uvidí rozložený rez s kótami).

Spustenie (Pillow s AVIF a WebP, venv nastrojov):
  C:/Users/krist/nastroje/web/.venv/Scripts/python.exe -I data/rozklad_web.py [--meno rozklad-duo-v1]
"""
import argparse
import json
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
p = argparse.ArgumentParser()
p.add_argument('--vstup', default=str(REPO / 'data/_3d/final/rozlozeny'))
p.add_argument('--meno', default='rozklad-duo-v1')
p.add_argument('--sirky', default='1200,800')
p.add_argument('--kvalita', type=int, default=72)
p.add_argument('--krok', type=int, default=1, help='každá n-tá snímka (1 = všetky)')
a = p.parse_args()

vstup = Path(a.vstup)
meta = json.loads((vstup / 'rozlozeny.json').read_text(encoding='utf-8'))
snimky = sorted(f for f in vstup.glob('rozlozeny-[0-9][0-9][0-9].png'))[:: a.krok]
W, H = meta['rozlisenie']

# Spoločný rámec: zjednotenie obrysov výrobku a tieňa zo všetkých snímok + 3 % okraj.
x0 = y0 = 10 ** 9
x1 = y1 = 0
for f in snimky:
    for g in (f, f.with_name(f.stem + '-tien.png')):
        if not g.exists():
            continue
        bb = Image.open(g).getchannel('A').point(lambda v: 255 if v > 6 else 0).getbbox()
        if bb:
            x0, y0, x1, y1 = min(x0, bb[0]), min(y0, bb[1]), max(x1, bb[2]), max(y1, bb[3])
m = round(0.03 * (x1 - x0))
x0, y0, x1, y1 = max(0, x0 - m), max(0, y0 - m), min(W, x1 + m), min(H, y1 + m)
cw, ch = x1 - x0, y1 - y0
print(f'rámec {x0},{y0} – {x1},{y1} ({cw} × {ch} px), snímok {len(snimky)}')

sirky = [int(s) for s in a.sirky.split(',')]
cieľ = REPO / 'web' / 'public' / '3d' / a.meno
FORMATY = {'avif': dict(format='AVIF', quality=max(30, a.kvalita - 20), speed=6), 'webp': dict(format='WEBP', quality=a.kvalita, method=4)}
velkosti = {(s, f): 0 for s in sirky for f in FORMATY}
for i, f in enumerate(snimky):
    obr = Image.open(f).convert('RGBA')
    tien_f = f.with_name(f.stem + '-tien.png')
    if tien_f.exists():
        spolu = Image.alpha_composite(Image.open(tien_f).convert('RGBA'), obr)
    else:
        spolu = obr
    spolu = spolu.crop((x0, y0, x1, y1))
    for s in sirky:
        mala = spolu.resize((s, round(ch * s / cw)), Image.LANCZOS)
        for pripona, nast in FORMATY.items():
            if pripona == 'webp' and i != len(snimky) - 1:
                continue
            out = cieľ / str(s) / f'{i:03d}.{pripona}'
            out.parent.mkdir(parents=True, exist_ok=True)
            mala.save(out, **nast)
            velkosti[(s, pripona)] += out.stat().st_size

# Body vrstiev v percentách orezaného rámca: plášť = horný okraj čela plášťa, rúra = spodok čela dolnej
# rúry, izolácia = horný okraj čela peny (pena stojí; elipsa plášťa zo snímky 0 zmenšená na polomer peny).
def pct(x, y):
    return [round((x - x0) / cw * 100, 2), round((y - y0) / ch * 100, 2)]

body = meta['body_px']
k0 = body[snimky[0].name]
cx, cy = k0['plast_celo_stred']
top0 = min(k0['plast_okraj'], key=lambda q: q[1])
pomer_peny = 1 - 2 * 0.075 - 2 * 0.012  # hrúbka plášťa 0,075 D a zapustenie peny (data/blender/potrubie.py, PLAST)
pena = pct(cx + (top0[0] - cx) * pomer_peny, cy + (top0[1] - cy) * pomer_peny)
snimky_body = []
for f in snimky:
    k = body[f.name]
    top = min(k['plast_okraj'], key=lambda q: q[1])
    # Nosná rúra, nie chránička ani kábel (HP, COOL s káblom), ako v data/rendery_web.py.
    nosne = [r for r in k['rury'] if r.get('druh') not in ('kabel', 'chranicka')] or k['rury']
    dolna = max(nosne, key=lambda r: r['stred'][1])
    spodok = max(dolna['okraj'], key=lambda q: q[1])
    snimky_body.append({'plast': pct(*top), 'pena': pena, 'rura': pct(*spodok)})

vystup = {
    'meno': a.meno, 'snimok': len(snimky), 'pomer': round(cw / ch, 4), 'sirky': sirky,
    'cesta': f'/3d/{a.meno}/', 'rad': meta['rad'], 'obj_cislo': meta['obj_cislo'], 'body': snimky_body,
}
(REPO / 'web' / 'src' / 'data' / f'{a.meno}.json').write_text(json.dumps(vystup, ensure_ascii=False), encoding='utf-8')
for (s, f), b in velkosti.items():
    print(f'{s} px {f}: spolu {b / 1024:.0f} kB')
