"""Rendery vlastného 3D modelu pre web: data/_3d/web → web/src/assets/3d + web/src/data/rendery.json.

Skupiny (podľa data/blender, priečinky v data/_3d/web):
  rady/<id radu>       záber A (celé potrubie) na karty, katalóg, menu, výber, hľadanie, náhľady na zdieľanie
  hlavy/<id radu>      záber C (čelný pohľad na rez) do hlavy stránky radu a systému
  varianty/<obj. č.>   záber C ku každej dimenzii (živé kóty prepnú obraz)
  hero/<meno>          záber C vo veľkom rozlíšení do hero domova
  rodina/<meno>        rodina systémov vedľa seba
  makra/<meno>         štvorcové makrá vrstiev do líp

Postup pre každý render: kontaktný tieň (<meno>-tien.png) sa vloží pod výrobok, obrázok sa oreže na výrobok
a tieň s okrajom, zmenší a uloží ako WebP s priehľadnosťou (zdroj pre Obraz.astro, ten robí AVIF a WebP).
Do rendery.json idú pomer strán a body pre kóty v percentách orezaného obrázka:
  plast  bod na okraji čela plášťa vľavo hore (štítok nad ním), rura  spodok čela najnižšej rúry,
  ohyb   spodná hrana tela kúsok od jeho ľavého konca (z priehľadnosti samotného výrobku, bez tieňa).
Mapa piktogramov (rad-duo-kurenie.png → id radu) dovolí nahradiť render Watts tam, kde stránka pozná
len piktogram (kategória, systém).

Spustenie: C:/Users/krist/nastroje/web/.venv/Scripts/python.exe -I data/rendery_web.py [skupiny…]
"""
import json
import math
import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
ZDROJ = REPO / 'data' / '_3d' / 'web'
CIEL = REPO / 'web' / 'src' / 'assets' / '3d'
DATA = REPO / 'web' / 'src' / 'data'
SIRKA = {'rady': 1400, 'hlavy': 1800, 'varianty': 1400, 'hero': 2600, 'rodina': 2400, 'makra': 1200}
OKRAJ = 0.025
UHOL_PLAST = 112.0  # stupne od vodorovnej osi proti smeru hodinových ručičiek: okraj čela vľavo hore

skupiny = sys.argv[1:] or list(SIRKA)
vystup_cesta = DATA / 'rendery.json'
vystup = json.loads(vystup_cesta.read_text(encoding='utf-8')) if vystup_cesta.exists() else {}


def bbox_alfa(im, prah=4):
    return im.getchannel('A').point(lambda v: 255 if v > prah else 0).getbbox()


def body_kot(body, objekt, ramec, w_crop, h_crop):
    """Body plast, rura a ohyb v % orezaného obrázka (ramec = x0, y0 v pôvodnom renderi)."""
    x0, y0 = ramec

    def pct(x, y):
        return [round((x - x0) / w_crop * 100, 2), round((y - y0) / h_crop * 100, 2)]

    out = {}
    cx, cy = body['plast_celo_stred']
    okraj = body.get('plast_okraj') or []
    if okraj:
        def odchylka(p):
            u = math.degrees(math.atan2(-(p[1] - cy), p[0] - cx)) % 360
            return abs(u - UHOL_PLAST)
        out['plast'] = pct(*min(okraj, key=odchylka))
    rury = [r for r in body.get('rury', []) if r.get('druh') != 'kabel'] or body.get('rury', [])
    if rury:
        dolna = max(rury, key=lambda r: r['stred'][1])
        out['rura'] = pct(*max(dolna['okraj'], key=lambda q: q[1]))
    # ohyb: spodná hrana tela 10 % šírky obrázka napravo od jeho ľavého konca
    a = objekt.getchannel('A')
    bb = a.point(lambda v: 255 if v > 128 else 0).getbbox()
    if bb:
        x = min(bb[2] - 1, bb[0] + int(0.10 * objekt.width))
        stlpec = a.crop((x, 0, x + 1, objekt.height)).point(lambda v: 255 if v > 128 else 0).getbbox()
        if stlpec:
            out['ohyb'] = pct(x, stlpec[3] - 1)
    return out


def spracuj(skupina):
    zdroj = ZDROJ / skupina
    if not zdroj.is_dir():
        print(f'{skupina}: chýba {zdroj}, preskakujem')
        return
    ciel = CIEL / skupina
    ciel.mkdir(parents=True, exist_ok=True)
    zaznamy = {}
    for png in sorted(zdroj.glob('*.png')):
        if png.stem.endswith(('-tien', '-cisty', '-na-bielom', '-maska')):
            continue
        meno = png.stem
        objekt = Image.open(png).convert('RGBA')
        tien_cesta = png.with_name(meno + '-tien.png')
        spolu = Image.alpha_composite(Image.open(tien_cesta).convert('RGBA'), objekt) if tien_cesta.exists() else objekt
        if skupina == 'makra':
            x0, y0, x1, y1 = 0, 0, spolu.width, spolu.height
        else:
            bb = bbox_alfa(spolu)
            m = round(OKRAJ * max(bb[2] - bb[0], bb[3] - bb[1]))
            x0, y0 = max(0, bb[0] - m), max(0, bb[1] - m)
            x1, y1 = min(spolu.width, bb[2] + m), min(spolu.height, bb[3] + m)
        orez = spolu.crop((x0, y0, x1, y1))
        w = min(SIRKA[skupina], orez.width)
        h = round(orez.height * w / orez.width)
        mala = orez.resize((w, h), Image.LANCZOS)
        if skupina == 'makra':
            mala.convert('RGB').save(ciel / f'{meno}.webp', 'WEBP', quality=90, method=6)
        else:
            mala.save(ciel / f'{meno}.webp', 'WEBP', quality=92, alpha_quality=100, method=6, exact=True)
        if skupina in ('hlavy', 'hero', 'varianty'):
            # Maska odlesku: len výrobok bez tieňa (pás svetla nemá prejsť po podlahe), malá a stačí hrubá.
            mw = min(1000, w)
            maska = Image.new('RGBA', objekt.size, (255, 255, 255, 0))
            maska.putalpha(objekt.getchannel('A'))
            maska.crop((x0, y0, x1, y1)).resize((mw, round(h * mw / w)), Image.LANCZOS).save(ciel / f'{meno}-maska.webp', 'WEBP', quality=60, alpha_quality=70, method=6)
        zaznam = {'pomer': round(orez.width / orez.height, 4)}
        j = png.with_suffix('.json')
        if j.exists() and skupina != 'makra':
            meta = json.loads(j.read_text(encoding='utf-8'))
            zaznam.update({k: meta[k] for k in ('rad', 'obj_cislo') if k in meta})
            body = meta.get('body_px', {})
            body = body.get(png.name) or (next(iter(body.values())) if body else None)
            if isinstance(body, dict) and 'plast_celo_stred' in body:
                zaznam.update(body_kot(body, objekt, (x0, y0), x1 - x0, y1 - y0))
            elif isinstance(body, dict) and 'rury' in body and skupina == 'rodina':
                zaznam['potrubia'] = body['rury']
        zaznamy[meno] = zaznam
        print(f'{skupina}/{meno}: {w} × {h} px, {(ciel / (meno + ".webp")).stat().st_size / 1024:.0f} kB')
    vystup[skupina] = zaznamy


for s in skupiny:
    spracuj(s)

# Piktogram Watts → rad s 3D renderom (prvý rad s tým piktogramom podľa poradia).
rady = json.loads((DATA / 'rady.json').read_text(encoding='utf-8'))
mapa = {}
for r in sorted(rady, key=lambda r: r.get('poradie', 0)):
    if r.get('piktogram') and not r.get('je_skupina') and r['piktogram'] not in mapa and r['id'] in vystup.get('rady', {}):
        mapa[r['piktogram']] = r['id']
vystup['piktogramy'] = mapa
vystup_cesta.write_text(json.dumps(vystup, ensure_ascii=False, indent=1), encoding='utf-8')
print('rendery.json:', {k: len(v) for k, v in vystup.items()})
