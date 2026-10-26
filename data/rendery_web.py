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
import os
import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
ZDROJ = Path(os.environ.get('MFX_3D_ZDROJ', REPO / 'data' / '_3d' / 'web'))
CIEL = REPO / 'web' / 'src' / 'assets' / '3d'
DATA = REPO / 'web' / 'src' / 'data'
SIRKA = {'rady': 1400, 'hlavy': 1800, 'varianty': 1400, 'hero': 2600, 'rodina': 2400, 'makra': 1200}
OKRAJ = 0.025
# Kde merať spodnú hranu tela pre kótu polomeru ohybu (podiel šírky obrázka od ľavého konca výrobku).
# Hero má rez vľavo a telo ide doprava za okraj: bod v strede tela, aby štítok vpravo od neho
# nevyšiel z obrazovky na mobile ani pri 1 024 px.
OHYB_X = {'hero': 0.6}
# Skupiny, ktorých výrobok vybieha za pravý okraj (hero): vpravo sa neorezáva a neodsadzuje.
BEZ_OREZU_VPRAVO = {'hero'}
# Čelné zábery hláv a variantov majú spoločný rámec (zjednotenie obrysov všetkých): pri výbere dimenzie
# sa obraz prelína na mieste a mení sa len vnútro rezu, nie poloha ani veľkosť plášťa.
SPOLOCNY_RAMEC = ('hlavy', 'varianty')
UHOL_PLAST = 112.0  # stupne od vodorovnej osi proti smeru hodinových ručičiek: okraj čela vľavo hore
# Čelný záber (hlavy, varianty): štítky kót ležia v prázdnom mieste okolo výrobku, nikdy na plášti (Juraj
# 23. 9.). Bod ohybu je na spodnej hrane tela v 30 % šírky (štítok visí doľava pod telo, kde je už prázdno)
# a čiara k rúre je taká dlhá, aby štítok rúry visel pod spodkom rezu (lr v % šírky, ako dĺžky kót).
CELNY = ('hlavy', 'varianty')
OHYB_CELNY = 0.30

skupiny = sys.argv[1:] or list(SIRKA)
vystup_cesta = DATA / 'rendery.json'
vystup = json.loads(vystup_cesta.read_text(encoding='utf-8')) if vystup_cesta.exists() else {}


def bbox_alfa(im, prah=4):
    return im.getchannel('A').point(lambda v: 255 if v > prah else 0).getbbox()


def body_kot(body, objekt, ramec, w_crop, h_crop, ohyb_x=0.10):
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
    # ohyb: spodná hrana tela kúsok napravo od ľavého konca výrobku (hero: ďalej vpravo na tele)
    a = objekt.getchannel('A')
    bb = a.point(lambda v: 255 if v > 128 else 0).getbbox()
    if bb:
        x = min(bb[2] - 1, bb[0] + int(ohyb_x * objekt.width))
        stlpec = a.crop((x, 0, x + 1, objekt.height)).point(lambda v: 255 if v > 128 else 0).getbbox()
        if stlpec:
            out['ohyb'] = pct(x, stlpec[3] - 1)
    return out


def koty_celne(objekt, ramec, zaznam):
    """Bod ohybu na spodnej hrane tela a dĺžka čiary k rúre (lr) na čelnom zábere, z priehľadnosti výrobku."""
    a = objekt.getchannel('A').crop(ramec).point(lambda v: 255 if v > 128 else 0)
    w, h = a.size
    out = {}
    xo = int(OHYB_CELNY * w)
    stlpec = a.crop((xo, 0, xo + 1, h)).getbbox()
    if stlpec:
        out['ohyb'] = [round(xo / w * 100, 2), round((stlpec[3] - 1) / h * 100, 2)]
    spodok = (a.getbbox()[3] - 1) / h * 100          # najnižší bod výrobku: spodok čela plášťa
    if 'rura' in zaznam:
        # zvislá vzdialenosť v % výšky prepočítaná na % šírky (dĺžky čiar kót sú v cqw)
        out['lr'] = round(max(5.0, (spodok + 1.5 - zaznam['rura'][1]) / zaznam['pomer']), 2)
    return out


def renderove_png(zdroj):
    return [p for p in sorted(zdroj.glob('*.png')) if not p.stem.endswith(('-tien', '-cisty', '-na-bielom', '-maska'))]


def spolocny_ramec():
    """Zjednotenie obrysov (výrobok aj tieň) všetkých čelných záberov hláv a variantov s okrajom.

    V jednotkách šírky obrázka: hlavy sú 2000 px, varianty 1600 px, kamera aj pomer strán sú rovnaké
    (data/blender: --ramec jednotny), takže ten istý výrez v pomere k šírke sedí na oba."""
    x0 = y0 = float('inf')
    x1 = y1 = 0.0
    pomer = None
    for sk in SPOLOCNY_RAMEC:
        for png in renderove_png(ZDROJ / sk) if (ZDROJ / sk).is_dir() else []:
            objekt = Image.open(png).convert('RGBA')
            w, h = objekt.size
            pomer = pomer or h / w
            if abs(h / w - pomer) > 0.002:
                print(f'POZOR: {png.name} má iný pomer strán {w} × {h}, spoločný rámec nesedí')
            tien = png.with_name(png.stem + '-tien.png')
            spolu = Image.alpha_composite(Image.open(tien).convert('RGBA'), objekt) if tien.exists() else objekt
            bb = bbox_alfa(spolu)
            x0, y0, x1, y1 = min(x0, bb[0] / w), min(y0, bb[1] / w), max(x1, bb[2] / w), max(y1, bb[3] / w)
    if pomer is None:
        return None
    m = OKRAJ * max(x1 - x0, y1 - y0)
    return max(0.0, x0 - m), max(0.0, y0 - m), min(1.0, x1 + m), min(pomer, y1 + m)


RAMEC = None


def spracuj(skupina):
    global RAMEC
    zdroj = ZDROJ / skupina
    if not zdroj.is_dir():
        print(f'{skupina}: chýba {zdroj}, preskakujem')
        return
    ciel = CIEL / skupina
    ciel.mkdir(parents=True, exist_ok=True)
    zaznamy = {}
    if skupina in SPOLOCNY_RAMEC and RAMEC is None:
        RAMEC = spolocny_ramec()
        print('spoločný rámec hláv a variantov (v šírkach obrázka):', RAMEC and tuple(round(v, 4) for v in RAMEC))
    for png in renderove_png(zdroj):
        meno = png.stem
        objekt = Image.open(png).convert('RGBA')
        tien_cesta = png.with_name(meno + '-tien.png')
        spolu = Image.alpha_composite(Image.open(tien_cesta).convert('RGBA'), objekt) if tien_cesta.exists() else objekt
        if skupina == 'makra':
            x0, y0, x1, y1 = 0, 0, spolu.width, spolu.height
        elif skupina in SPOLOCNY_RAMEC and RAMEC:
            x0, y0, x1, y1 = (round(v * objekt.width) for v in RAMEC)
            x1, y1 = min(x1, objekt.width), min(y1, objekt.height)
        else:
            bb = bbox_alfa(spolu)
            m = round(OKRAJ * max(bb[2] - bb[0], bb[3] - bb[1]))
            x0, y0 = max(0, bb[0] - m), max(0, bb[1] - m)
            x1, y1 = min(spolu.width, bb[2] + m), min(spolu.height, bb[3] + m)
            if skupina in BEZ_OREZU_VPRAVO:
                x1 = spolu.width
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
                zaznam.update(body_kot(body, objekt, (x0, y0), x1 - x0, y1 - y0, OHYB_X.get(skupina, 0.10)))
                # Stred čela plášťa (sústredné kružnice v hero) a polomer čela v % šírky obrázka
                cx, cy = body['plast_celo_stred']
                zaznam['stred'] = [round((cx - x0) / (x1 - x0) * 100, 2), round((cy - y0) / (y1 - y0) * 100, 2)]
                okraj = body.get('plast_okraj') or []
                if okraj:
                    zaznam['polomer'] = round(max(abs(p[0] - cx) for p in okraj) / (x1 - x0) * 100, 2)
                if skupina in CELNY:
                    zaznam.update(koty_celne(objekt, (x0, y0, x1, y1), zaznam))
            elif isinstance(body, dict) and 'rury' in body and skupina == 'rodina':
                zaznam['potrubia'] = body['rury']
        zaznamy[meno] = zaznam
        print(f'{skupina}/{meno}: {w} × {h} px, {(ciel / (meno + ".webp")).stat().st_size / 1024:.0f} kB')
    vystup[skupina] = zaznamy


for s in skupiny:
    spracuj(s)
for s in SIRKA:
    vystup.setdefault(s, {})

# Piktogram Watts → rad s 3D renderom (prvý rad s tým piktogramom podľa poradia).
rady = json.loads((DATA / 'rady.json').read_text(encoding='utf-8'))
mapa = {}
for r in sorted(rady, key=lambda r: r.get('poradie', 0)):
    if r.get('piktogram') and not r.get('je_skupina') and r['piktogram'] not in mapa and r['id'] in vystup.get('rady', {}):
        mapa[r['piktogram']] = r['id']
vystup['piktogramy'] = mapa
vystup_cesta.write_text(json.dumps(vystup, ensure_ascii=False, indent=1), encoding='utf-8')
print('rendery.json:', {k: len(v) for k, v in vystup.items()})
