"""Predikcia pozornosti na stránkach webu (ako Attention Insight), lokálne a zadarmo (Juraj 22. 10. 2026).

Model odhadne, kam sa ľudia pozrú v prvých sekundách po otvorení stránky: teplotná mapa, mapa
hmly (viditeľné je len to, čo dostane väčšinu pozornosti), poradie prvých pohľadov a podiel
pozornosti na prvkoch (logo, nadpis, tlačidlo, obraz, kóty …). Je to odhad modelu natrénovaného
na sledovaní očí, nie meranie na našich zákazníkoch: dobre ukáže, čo vyčnieva a čo zaniká,
neukáže, či text presvedčí.

Spustenie (web musí bežať, napr. npm run build a npm run preview v priečinku web):

    C:\\Users\\krist\\nastroje\\web\\.venv\\Scripts\\python.exe data/pozornost.py
    ... data/pozornost.py --base http://127.0.0.1:4321 --stranky / /referencie/ --zariadenia mobil
    ... data/pozornost.py --variant "Väčšie tlačidlo" "main .btn-yellow{font-size:19px!important}"
        (porovná dnešný stav s úpravou; CSS ide len do snímky, web sa nemení)

Výstup: data/_pozornost/<dátum a čas>/index.html (otvoriť v prehliadači), obrázky vedľa neho
a suhrn.json s číslami. Priečinok data/_* sa do gitu nedáva.
"""
import argparse
import datetime as dt
import html
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
VYSTUP = ROOT / 'data' / '_pozornost'
# Váhy modelu, predpoklady polohy a overenie (data/pozornost_priprava.py), mimo repozitára.
MODELY = Path(r'C:\Users\krist\nastroje\web\modely')

STRANKY = ['/', '/potrubia/', '/potrubia/vykurovanie/', '/potrubia/vykurovanie/microflex-duo-6-bar/', '/spojky/',
           '/spojky/t-kus-z-bronzu/', '/referencie/', '/pre-firmy/', '/vyber/', '/na-stiahnutie/']
# Prvá obrazovka: to, čo človek vidí pred prvým posunom. Model pracuje v CSS pixeloch (asi 30 px
# na stupeň zorného uhla pri bežnej vzdialenosti od monitora aj telefónu), snímka pre oči je 2x.
ZARIADENIA = {'desktop': dict(width=1440, height=900, mobile=False, mierka=0.8, predpoklad='web'),
              'mobil': dict(width=390, height=844, mobile=True, mierka=1.0, predpoklad='mobil')}
# Oblasti záujmu: názov → CSS selektory (zjednotenie viditeľných prvkov v prvej obrazovke).
OBLASTI = {
    'Logo': ['.brand'],
    'Menu': ['.nav', '.menu-btn'],
    'Hľadanie': ['header .search'],
    'Horný pás s kontaktom': ['.topbar'],
    'Nadpis H1': ['main h1'],
    'Úvodný text': ['main .lead', 'main h1 + p'],
    'Hlavné tlačidlo': ['main .btn-yellow'],
    'Ďalšie odkazy v hlave': ['main .hero-odkaz', 'main .hlava-akcie .odkaz', 'main .btn:not(.btn-yellow)'],
    'Hlavný obraz': ['main .hero-img', 'main .hs-obraz img', 'main .hlava-obraz img', 'main .scena-img'],
    'Kóty na obraze': ['main [data-koty] .stitok', 'main .popisy .stitok'],
    'Drobčeky': ['main nav[aria-label] ol', '.drobceky'],
}


# ---------------------------------------------------------------- model

class Model:
    """DeepGaze IIE (Linardos, Kümmerer, Press, Bethge 2021): na verejnom benchmarku MIT/Tübingen presnejší
    ako Attention Insight (AUC 0,883 proti 0,864); presnejší DeepGaze MSDB je na notebook priťažký.
    Učený na fotkách, preto stredovú mapu nahrádza predpoklad polohy z webových a mobilných obrazoviek UEyes."""

    def __init__(self):
        from collections import OrderedDict

        import torch
        import torchvision
        import deepgaze_pytorch.features.shapenet as sn
        from deepgaze_pytorch import DeepGazeIIE
        from deepgaze_pytorch.features.efficientnet import EfficientNet
        # Kostry sietí sa postavia bez sťahovania, ich váhy sú už v deepgaze2e.pth (ušetrí ~0,5 GB).
        sn.load_model = lambda meno: torch.nn.Sequential(OrderedDict(module=torchvision.models.resnet50()))
        EfficientNet.from_pretrained = classmethod(lambda cls, meno, **k: cls.from_name(meno))
        hub = torch.hub.load
        torch.hub.load = lambda repo, meno, *a, **k: getattr(torchvision.models, meno)()
        try:
            model = DeepGazeIIE(pretrained=False)
        finally:
            torch.hub.load = hub
        model.load_state_dict(torch.load(MODELY / 'deepgaze2e.pth', map_location='cpu', weights_only=True))
        self.model, self.torch = model.eval(), torch

    def log_hustota(self, img: Image.Image, log_predpoklad: np.ndarray) -> np.ndarray:
        """Log hustota pravdepodobnosti pohľadu na každý pixel (súčet hustoty = 1)."""
        x = self.torch.from_numpy(np.asarray(img.convert('RGB'), dtype=np.float32).transpose(2, 0, 1).copy())[None]
        cb = self.torch.from_numpy(log_predpoklad.astype(np.float32))[None]
        with self.torch.inference_mode():
            return self.model(x, cb)[0, 0].numpy().astype(np.float64)


def rozmaz(p: np.ndarray, sigma_px: float) -> np.ndarray:
    """Gaussovské rozmazanie hustoty (súčet ostane 1). Veľký polomer sa počíta na mape zmenšenej 4x,
    výsledok je hladký, takže rozdiel nevidno a je to rádovo rýchlejšie."""
    from scipy.ndimage import gaussian_filter
    if sigma_px <= 0:
        return p
    if sigma_px < 32:
        q = gaussian_filter(p, sigma_px, mode='nearest')
    else:
        h, w = p.shape
        male = np.asarray(Image.fromarray(p.astype(np.float32), mode='F').resize((max(1, w // 4), max(1, h // 4)), Image.BOX))
        male = gaussian_filter(male, sigma_px / 4, mode='nearest')
        q = np.asarray(Image.fromarray(male.astype(np.float32), mode='F').resize((w, h), Image.BILINEAR), dtype=np.float64)
        q = np.clip(q, 0, None)
    return q / q.sum()


def zmes(log_obsah: np.ndarray, log_poloha: np.ndarray, alfa: float, sigma_px: float = 0.0) -> np.ndarray:
    """Výsledná log hustota: α · DeepGaze (pri sigma_px > 0 rozmazaný) + (1 − α) · predpoklad polohy.
    Pomer a rozmazanie sú nastavené na obrazovkách UEyes (data/pozornost_priprava.py, kalibracia.json)."""
    return np.log(alfa * rozmaz(np.exp(log_obsah), sigma_px) + (1 - alfa) * np.exp(log_poloha))


def na_rozmer(log_mapa: np.ndarray, h: int, w: int) -> np.ndarray:
    """Predpoklad polohy (log hustota v normalizovaných súradniciach) na rozmer obrázka, znova normalizovaný."""
    from scipy.ndimage import zoom
    from scipy.special import logsumexp
    m = zoom(log_mapa, (h / log_mapa.shape[0], w / log_mapa.shape[1]), order=1, mode='nearest')
    return m - logsumexp(m)


# ---------------------------------------------------------------- snímky a oblasti

def snimky(base: str, stranky: list[str], zariadenia: list[str], ciel: Path,
           varianty: list[tuple[str, str | None]] = (('Dnes', None),)) -> list[dict]:
    """Prvá obrazovka každej stránky a zariadenia; pri variante sa do stránky vloží CSS (web sa nemení)."""
    from playwright.sync_api import sync_playwright
    vysledky = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel='chrome')
        for meno in zariadenia:
            z = ZARIADENIA[meno]
            ctx = browser.new_context(viewport={'width': z['width'], 'height': z['height']}, device_scale_factor=2,
                                      is_mobile=z['mobile'], has_touch=z['mobile'], reduced_motion='reduce', locale='sk-SK')
            page = ctx.new_page()
            for s, (variant, css) in ((s, v) for s in stranky for v in varianty):
                page.goto(base.rstrip('/') + s, wait_until='load')
                if css:
                    page.add_style_tag(content=css)
                page.evaluate('document.fonts.ready')
                page.wait_for_timeout(700)
                kluc = f"{meno}-{s.strip('/').replace('/', '_') or 'domov'}"
                if css:
                    kluc += '-' + ''.join(c if c.isalnum() else '_' for c in variant.lower())
                cesta = ciel / f'{kluc}.png'
                page.screenshot(path=str(cesta))
                oblasti = page.evaluate('''(oblasti) => {
                  const vw = innerWidth, vh = innerHeight, out = {};
                  for (const [nazov, sel] of Object.entries(oblasti)) {
                    const rects = [];
                    for (const s of sel) for (const el of document.querySelectorAll(s)) {
                      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
                      if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
                      const x0 = Math.max(0, r.left), y0 = Math.max(0, r.top), x1 = Math.min(vw, r.right), y1 = Math.min(vh, r.bottom);
                      if (x1 - x0 > 1 && y1 - y0 > 1) rects.push([x0, y0, x1, y1]);
                    }
                    if (rects.length) out[nazov] = rects;
                  }
                  return out;
                }''', OBLASTI)
                vysledky.append({'kluc': kluc, 'zariadenie': meno, 'stranka': s, 'variant': variant, 'snimka': cesta.name,
                                 'oblasti': oblasti, 'sirka': z['width'], 'vyska': z['height']})
                print('snímka', kluc, flush=True)
            ctx.close()
        browser.close()
    return vysledky


# ---------------------------------------------------------------- metriky

def prve_pohlady(hustota: np.ndarray, pocet: int = 5, sigma_px: float = 70) -> list[tuple[int, int]]:
    """Približné poradie prvých pohľadov: najsilnejšie miesto, potom útlm okolia (oko sa na to
    isté miesto hneď nevracia) a ďalšie. Nie je to model sledu pohľadov, len poradie maxím."""
    h = hustota.copy()
    yy, xx = np.mgrid[0:h.shape[0], 0:h.shape[1]]
    body = []
    for _ in range(pocet):
        y, x = np.unravel_index(np.argmax(h), h.shape)
        body.append((int(x), int(y)))
        h *= 1 - np.exp(-((xx - x) ** 2 + (yy - y) ** 2) / (2 * sigma_px ** 2))
    return body


def metriky(hustota: np.ndarray, oblasti: dict) -> dict:
    p = hustota / hustota.sum()
    zoradene = np.sort(p.ravel())[::-1]
    # Sústredenie: aký podiel pozornosti padne na najsilnejších 10 % obrazovky (pri rovnomernom pozeraní 10 %,
    # čím viac, tým jasnejšie ťažisko). Prehľadnosť z entropie mapy sa neosvedčila, vychádzala všade 4 až 5.
    sustredenie = float(zoradene[:max(1, p.size // 10)].sum())
    tab = {}
    for nazov, rects in oblasti.items():
        m = np.zeros_like(p, dtype=bool)
        for x0, y0, x1, y1 in rects:
            m[int(y0):int(math.ceil(y1)), int(x0):int(math.ceil(x1))] = True
        podiel, cast = float(p[m].sum()), float(m.mean())
        tab[nazov] = {'pozornost': podiel, 'plocha': cast, 'nasobok': podiel / cast if cast else 0}
    return {'sustredenie': sustredenie, 'oblasti': tab}


# ---------------------------------------------------------------- obrázky

def farby_turbo(x: np.ndarray) -> np.ndarray:
    """Paleta Turbo (Google) ako polynóm, hodnoty 0–1 → RGB 0–255."""
    x = np.clip(x, 0, 1)[..., None]
    k = np.array([[0.13572138, 4.61539260, -42.66032258, 132.13108234, -152.94239396, 59.28637943],
                  [0.09140261, 2.19418839, 4.84296658, -14.18503333, 4.27729857, 2.82956604],
                  [0.10667330, 12.64194608, -60.58204836, 110.36276771, -89.90310912, 27.34824973]])
    rgb = sum(k[:, i] * x ** i for i in range(6))
    return (np.clip(rgb, 0, 1) * 255).astype(np.uint8)


def mapa_tepla(snimka: Image.Image, hustota: np.ndarray) -> Image.Image:
    h = hustota / hustota.max()
    h_img = Image.fromarray((h * 255).astype(np.uint8)).resize(snimka.size, Image.BILINEAR)
    h = np.asarray(h_img, dtype=np.float32) / 255
    farba = Image.fromarray(farby_turbo(h))
    alfa = Image.fromarray((np.clip(h * 1.6, 0, 1) ** 0.8 * 170).astype(np.uint8))
    base = snimka.convert('RGB')
    base = Image.blend(base, Image.new('RGB', base.size, (20, 26, 40)), 0.25)
    base.paste(farba, (0, 0), alfa)
    return base


def mapa_hmly(snimka: Image.Image, hustota: np.ndarray, podiel: float = 0.6) -> Image.Image:
    """Viditeľné ostane len najmenšie územie, ktoré zachytí `podiel` pozornosti; zvyšok zahalí hmla."""
    p = hustota / hustota.sum()
    prah = np.sort(p.ravel())[::-1][np.searchsorted(np.cumsum(np.sort(p.ravel())[::-1]), podiel)]
    maska = Image.fromarray(((p >= prah) * 255).astype(np.uint8)).resize(snimka.size, Image.BILINEAR)
    maska = maska.filter(ImageFilter.GaussianBlur(max(snimka.size) / 120))
    hmla = Image.blend(snimka.convert('RGB').filter(ImageFilter.GaussianBlur(6)), Image.new('RGB', snimka.size, (232, 236, 242)), 0.72)
    return Image.composite(snimka.convert('RGB'), hmla, maska)


def body_pohladov(snimka: Image.Image, body: list[tuple[int, int]], mierka: float) -> Image.Image:
    im = snimka.convert('RGB').copy()
    d = ImageDraw.Draw(im)
    r = int(17 * mierka / 2 + 8)
    try:
        font = ImageFont.truetype('arialbd.ttf', int(r * 1.1))
    except OSError:
        font = ImageFont.load_default()
    for i, (x, y) in enumerate(body, 1):
        x, y = x * mierka, y * mierka
        d.ellipse([x - r, y - r, x + r, y + r], fill=(242, 196, 0), outline=(11, 27, 51), width=max(2, r // 6))
        d.text((x, y), str(i), fill=(11, 27, 51), font=font, anchor='mm')
    return im


# ---------------------------------------------------------------- správa

def percent(x: float) -> str:
    """Pod 10 % s jedným desatinným miestom (rozdiely variantov sú často desatiny), inak celé percentá."""
    return f'{100 * x:.0f} %' if x >= 0.1 else f'{100 * x:.1f} %'.replace('.', ',')


def porovnanie(polozky: list[dict]) -> str:
    """Pri variantoch: pre každú stránku a zariadenie podiel pozornosti na prvkoch vo variantoch vedľa seba."""
    varianty = list(dict.fromkeys(p['variant'] for p in polozky))
    if len(varianty) < 2:
        return ''
    bloky = []
    for (s, z) in dict.fromkeys((p['stranka'], p['zariadenie']) for p in polozky):
        sk = {p['variant']: p for p in polozky if p['stranka'] == s and p['zariadenie'] == z}
        prvky = list(dict.fromkeys(n for p in sk.values() for n in p['m']['oblasti']))
        zaklad = sk.get(varianty[0])

        def bunka(v: str, n: str) -> str:
            o = sk[v]['m']['oblasti'].get(n) if v in sk else None
            if not o:
                return '<td>–</td>'
            txt = percent(o['pozornost'])
            if zaklad and v != varianty[0] and n in zaklad['m']['oblasti']:
                d = round(100 * (o['pozornost'] - zaklad['m']['oblasti'][n]['pozornost']), 1) + 0.0  # bez „-0,0“
                txt += f' <small>({d:+.1f})</small>'.replace('.', ',')
            return f'<td>{txt}</td>'
        riadky = ''.join(f'<tr><td>{html.escape(n)}</td>{"".join(bunka(v, n) for v in varianty)}</tr>' for n in prvky)
        bloky.append(f'<h3>{html.escape(s)} <span>{z}</span></h3><table><thead><tr><th>Prvok</th>'
                     f'{"".join(f"<th>{html.escape(v)}</th>" for v in varianty)}</tr></thead><tbody>{riadky}</tbody></table>')
    return ('<section><h2>Porovnanie variantov</h2><p class="cisla">Podiel pozornosti v prvej obrazovke; v zátvorke '
            f'zmena oproti variantu „{html.escape(varianty[0])}“ v percentuálnych bodoch.</p>' + ''.join(bloky) + '</section>')


def sprava(polozky: list[dict], ciel: Path, model_popis: str, base: str):
    def figura(subor: str, popis: str) -> str:
        return f'<figure><a href="{subor}"><img src="{subor}" alt="{html.escape(popis)}" loading="lazy"></a><figcaption>{popis}</figcaption></figure>'

    prehlad = ''.join(
        f'<tr><td><a href="#{p["kluc"]}">{html.escape(p["stranka"])}</a></td><td>{p["zariadenie"]}</td><td>{html.escape(p["variant"])}</td>'
        f'<td>{percent(p["m"]["sustredenie"])}</td>'
        f'<td>{html.escape(max(p["m"]["oblasti"].items(), key=lambda o: o[1]["pozornost"])[0]) if p["m"]["oblasti"] else "–"}</td>'
        f'<td>{percent(p["m"]["oblasti"].get("Hlavné tlačidlo", {}).get("pozornost", 0)) if "Hlavné tlačidlo" in p["m"]["oblasti"] else "nie je v prvej obrazovke"}</td></tr>'
        for p in polozky)
    sekcie = []
    for p in polozky:
        riadky = ''.join(
            f'<tr><td>{html.escape(n)}</td><td>{percent(o["pozornost"])}</td><td>{percent(o["plocha"])}</td><td>{o["nasobok"]:.1f}×</td></tr>'.replace('.', ',')
            for n, o in sorted(p['m']['oblasti'].items(), key=lambda o: -o[1]['pozornost']))
        sekcie.append(f'''
<section id="{p['kluc']}" class="{p['zariadenie']}">
  <h2>{html.escape(p['stranka'])} <span>{p['zariadenie']} {p['sirka']} × {p['vyska']}, variant {html.escape(p['variant'])}</span></h2>
  <p class="cisla">Na najsilnejších 10 % obrazovky padne <b>{percent(p['m']['sustredenie'])}</b> pozornosti (pri rovnomernom pozeraní by to bolo 10 %).</p>
  <div class="mapy">{figura(p['obr_body'], 'Prvé pohľady (poradie maxím)')}{figura(p['obr_teplo'], 'Teplotná mapa')}{figura(p['obr_hmla'], 'Mapa hmly: 60 % pozornosti')}</div>
  <table><thead><tr><th>Prvok v prvej obrazovke</th><th>Pozornosť</th><th>Plocha</th><th>Násobok</th></tr></thead><tbody>{riadky}</tbody></table>
</section>''')
    doc = f'''<!doctype html>
<html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pozornosť: Microflex {dt.date.today():%d. %m. %Y}</title>
<style>
  :root {{ --ink: #0b1b33; --soft: #4a5568; --blue: #005db9; --line: #d9e1ec; }}
  body {{ margin: 0; background: #f4f6f9; color: var(--ink); font: 16px/1.5 "Segoe UI", system-ui, sans-serif; }}
  main {{ max-width: 1400px; margin: 0 auto; padding: 32px 20px 80px; }}
  h1 {{ font-size: 30px; margin: 0 0 8px; }}
  h2 {{ font-size: 21px; margin: 0 0 4px; }} h2 span, h3 span {{ font-weight: 400; color: var(--soft); font-size: 15px; margin-left: 8px; }}
  h3 {{ font-size: 17px; margin: 22px 0 0; }} small {{ color: var(--soft); }}
  .uvod {{ max-width: 70ch; color: var(--soft); }}
  section {{ background: #fff; border-radius: 14px; padding: 22px; margin-top: 28px; box-shadow: 0 1px 0 rgb(10 42 94 / .06), 0 18px 40px -30px rgb(10 42 94 / .5); }}
  .cisla {{ margin: 0 0 14px; color: var(--soft); }} .cisla b {{ color: var(--ink); }}
  .mapy {{ display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }}
  .mobil .mapy {{ grid-template-columns: repeat(3, minmax(0, 300px)); }}
  figure {{ margin: 0; }} figure img {{ display: block; width: 100%; height: auto; border-radius: 8px; border: 1px solid var(--line); }}
  figcaption {{ font-size: 14px; color: var(--soft); margin-top: 6px; }}
  table {{ border-collapse: collapse; margin-top: 18px; min-width: min(100%, 560px); font-variant-numeric: tabular-nums; }}
  th, td {{ text-align: left; padding: 6px 14px 6px 0; border-bottom: 1px solid var(--line); }}
  th {{ font-size: 14px; color: var(--soft); font-weight: 600; }}
  td:not(:first-child), th:not(:first-child) {{ text-align: right; }}
  a {{ color: var(--blue); }}
  @media (max-width: 800px) {{ .mapy, .mobil .mapy {{ grid-template-columns: minmax(0, 1fr); }} }}
</style></head><body><main>
<h1>Kam sa ľudia pozrú ako prvé</h1>
<p class="uvod">Odhad modelu {html.escape(model_popis)} pre prvú obrazovku každej stránky ({html.escape(base)}). Model je natrénovaný
na sledovaní očí pri voľnom pozeraní; ukáže, čo vyčnieva a čo zaniká, nie či text presvedčí. Text (nadpisy, logo, tlačidlá) priťahuje
model silnejšie ako veľké obrázky. <b>Násobok</b> hovorí, koľkokrát viac pozornosti prvok dostane, než by zodpovedalo jeho ploche
(1× = priemer). <b>Sústredenie</b> je podiel pozornosti na najsilnejších 10 % obrazovky: čím vyšší, tým jasnejšie ťažisko.
Poradie pohľadov je poradie najsilnejších miest, nie meraný sled očí.</p>
<table><thead><tr><th>Stránka</th><th>Zariadenie</th><th>Variant</th><th>Sústredenie</th><th>Najsilnejší prvok</th><th>Hlavné tlačidlo</th></tr></thead><tbody>{prehlad}</tbody></table>
{porovnanie(polozky)}
{''.join(sekcie)}
</main></body></html>'''
    (ciel / 'index.html').write_text(doc, encoding='utf-8')


# ---------------------------------------------------------------- beh

def main():
    ap = argparse.ArgumentParser(description='Predikcia pozornosti na stránkach webu (pozri popis v hlavičke súboru).')
    ap.add_argument('--base', default='http://127.0.0.1:4321', help='adresa bežiaceho webu')
    ap.add_argument('--stranky', nargs='*', default=STRANKY)
    ap.add_argument('--zariadenia', nargs='*', default=list(ZARIADENIA), choices=list(ZARIADENIA))
    ap.add_argument('--variant', nargs=2, action='append', default=[], metavar=('NÁZOV', 'CSS'),
                    help='porovnať s úpravou bez zmeny webu, napr. --variant "Svetlý horný pás" ".topbar{background:#eef3f9}"')
    args = ap.parse_args()
    ciel = VYSTUP / dt.datetime.now().strftime('%Y-%m-%d-%H%M')
    ciel.mkdir(parents=True, exist_ok=True)
    polozky = snimky(args.base, args.stranky, args.zariadenia, ciel, [('Dnes', None), *map(tuple, args.variant)])
    model = Model()
    predpoklady = {k: np.load(MODELY / f'predpoklad_{k}.npy') for k in ('web', 'mobil')}
    kal_subor = MODELY / 'kalibracia.json'
    kalib = json.loads(kal_subor.read_text(encoding='utf-8')) if kal_subor.exists() else {}
    for p in polozky:
        z = ZARIADENIA[p['zariadenie']]
        snimka = Image.open(ciel / p['snimka']).convert('RGB')
        W, H = round(p['sirka'] * z['mierka']), round(p['vyska'] * z['mierka'])
        poloha = na_rozmer(predpoklady[z['predpoklad']], H, W)
        k = kalib.get(z['predpoklad'], {'alfa': 1.0, 'sigma_px': 0})
        hustota = np.exp(zmes(model.log_hustota(snimka.resize((W, H), Image.LANCZOS), poloha), poloha, k['alfa'], k['sigma_px']))
        oblasti = {n: [[c * z['mierka'] for c in r] for r in rects] for n, rects in p['oblasti'].items()}
        p['m'] = metriky(hustota, oblasti)
        body = prve_pohlady(hustota, 5, sigma_px=70 * z['mierka'])
        # Desktop stačí v CSS pixeloch, mobil ostane 2x (je úzky, inak by bol nečitateľný).
        vystup = snimka if p['zariadenie'] == 'mobil' else snimka.resize((p['sirka'], p['vyska']), Image.LANCZOS)
        k_vystup = vystup.width / W
        for kluc, obr in (('obr_body', body_pohladov(vystup, body, k_vystup)), ('obr_teplo', mapa_tepla(vystup, hustota)),
                          ('obr_hmla', mapa_hmly(vystup, hustota))):
            meno = f"{p['kluc']}-{kluc[4:]}.jpg"
            obr.save(ciel / meno, quality=84)
            p[kluc] = meno
        (ciel / p['snimka']).unlink()
        p['body'] = [[round(x / z['mierka']), round(y / z['mierka'])] for x, y in body]  # v CSS pixeloch
        print(p['kluc'], 'sústredenie', round(100 * p['m']['sustredenie']), {n: round(100 * o['pozornost'], 1) for n, o in p['m']['oblasti'].items()}, flush=True)
    overenie = MODELY / 'overenie.json'
    popis = 'DeepGaze IIE s predpokladom polohy z UEyes'
    if overenie.exists():
        o = json.loads(overenie.read_text(encoding='utf-8'))
        w = o['web']['priemer']
        popis += (f" (overené na {o['web']['obrazoviek']} webových stránkach UEyes, ktoré do nastavenia nevstúpili: NSS {w['zmes']['NSS']:.2f},"
                  f" AUC {w['zmes']['AUC']:.3f}; samotná poloha bez obsahu NSS {w['len_predpoklad']['NSS']:.2f},"
                  f" AUC {w['len_predpoklad']['AUC']:.3f})").replace('.', ',')
    sprava(polozky, ciel, popis, args.base)
    (ciel / 'suhrn.json').write_text(json.dumps([{k: v for k, v in p.items() if not k.startswith('obr_')} for p in polozky],
                                                 ensure_ascii=False, indent=1), encoding='utf-8')
    print('správa:', ciel / 'index.html')


if __name__ == '__main__':
    main()
