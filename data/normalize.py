"""Normalizuje katalóg Watts (data/microflex-watts-sk.json) do čistých dát pre web (web/src/data/*.json)
a skopíruje k nim obrázky z podklady/watts do web/src/assets.

Použitie:  python data/normalize.py
Výstup:    web/src/data/kategorie.json, rady.json, varianty.json, produkty.json
           web/src/assets/rady/*.{jpg,png}, web/src/assets/piktogramy/*.png
           data/nazvy-radov.md (návrh slovenských názvov na schválenie)

Pravidlá: čísla ako čísla, jednotky v názve poľa, cyrilské „х“ opravené, každý záznam má zdroj_url.
"""
import io
import json
import os
import re
import shutil
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from produkty_texty import PRODUKTY, SKUPINY, ciste_tabulky  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'data', 'microflex-watts-sk.json')
OUT = os.path.join(ROOT, 'web', 'src', 'data')
ASSETS = os.path.join(ROOT, 'web', 'src', 'assets')
PODKLADY = os.path.join(ROOT, 'podklady', 'watts')
WATTS = 'https://www.watts.eu'
BASE = '/sk/products/eu/microflex-pre-insulated-piping'

# --- ručné mapovanie: watts slug -> naše hodnoty -------------------------------------------------

KATEGORIE = {
    'pipes-for-heating': dict(slug='vykurovanie', nazov='Predizolované potrubia pre vykurovanie', kratky_nazov='Vykurovanie',
        typ='potrubie', piktogram='rad-duo-kurenie.png', poradie=1,
        popis='Ohybné potrubie na rozvod tepla medzi budovami alebo od kotolne, kotla na biomasu či tepelného čerpadla k domu. UNO vedie jednu rúru, DUO má prívod a spiatočku v jednom plášti.'),
    'pipes-for-sanitary': dict(slug='sanita', nazov='Predizolované potrubia pre teplú a studenú vodu', kratky_nazov='Teplá a studená voda',
        typ='potrubie', piktogram='rad-duo-sanita.png', poradie=2,
        popis='Pitná voda medzi budovami a k vzdialeným odberom, 10 bar. UNO, DUO a PRIMO DUO v sanitárnom vyhotovení.'),
    'central-heating-and-sanitary': dict(slug='vykurovanie-a-sanita', nazov='Vykurovanie a sanita v jednom plášti', kratky_nazov='Vykurovanie a sanita',
        typ='potrubie', piktogram='rad-quadro.png', poradie=3,
        popis='Štyri rúry v jednom plášti: prívod a spiatočka vykurovania, teplá voda a cirkulácia. Rad QUADRO pre vedľajšiu budovu s vlastným vykurovaním aj teplou vodou.'),
    'cold-cold-drinking-water': dict(slug='studena-a-chladena-voda', nazov='Predizolované potrubia pre studenú a chladenú vodu', kratky_nazov='Studená a chladená voda',
        typ='potrubie', piktogram='rad-cool-uno.png', poradie=4,
        popis='Chladená a studená pitná voda, odpadová voda. COOL, COOL s vyhrievacím káblom a COOL DUO.'),
    'heating-pumps': dict(slug='tepelne-cerpadla', nazov='Predizolované potrubia pre tepelné čerpadlá', kratky_nazov='Tepelné čerpadlá',
        typ='potrubie', piktogram='rad-hp-tepelne-cerpadlo.png', poradie=5,
        popis='Prepojenie vonkajšej jednotky tepelného čerpadla s domom v jednom plášti, prívod aj spiatočka. Rad Microflex HP.'),
    'couplings': dict(slug='spojky', nazov='Spojky', kratky_nazov='Spojky', typ='spojky', piktogram=None, poradie=6,
        popis='PE-X spojky, kolená, T-kusy a závitové pripojenia pre vykurovanie, COOL aj sanitu.'),
    'accessories': dict(slug='prislusenstvo', nazov='Príslušenstvo pre Microflex', kratky_nazov='Príslušenstvo', typ='prislusenstvo', piktogram=None, poradie=7,
        popis='Koncovky, izolačné sady, prestupy stenou, opravné a výstražné pásky, revízne šachty.'),
}

RADY = {
    '1-microflex-uno-6-bar': dict(slug='microflex-uno-6-bar', nazov='Microflex UNO, vykurovanie 6 bar', medium='vykurovacia voda', tlak_bar=6, pocet_rur=1, piktogram='rad-uno-kurenie.png',
        kratky_popis='Jedna rúra PE-Xa v plášti. Prívod alebo spiatočka, teplá voda k vzdialenému odberu.'),
    '2-microflex-duo-6-bar': dict(slug='microflex-duo-6-bar', nazov='Microflex DUO, vykurovanie 6 bar', medium='vykurovacia voda', tlak_bar=6, pocet_rur=2, piktogram='rad-duo-kurenie.png',
        kratky_popis='Prívod a spiatočka v jednom plášti. Najčastejšia voľba pre prípojku domu alebo tepelného čerpadla aj pre rozvod tepla z jednej kotolne do viacerých budov.'),
    '2-single-microflex-uno-primo-6-bar': dict(slug='microflex-uno-primo-6-bar', nazov='Microflex UNO PRIMO, vykurovanie 6 bar', medium='vykurovacia voda', tlak_bar=6, pocet_rur=1, piktogram='rad-uno-kurenie.png',
        kratky_popis='Jedna rúra s ešte ohybnejším plášťom pre trasy s mnohými zmenami smeru.'),
    '3-microflex-primo-duo-6-bar': dict(slug='microflex-primo-duo-6-bar', nazov='Microflex PRIMO DUO, vykurovanie 6 bar', medium='vykurovacia voda', tlak_bar=6, pocet_rur=2, piktogram='rad-duo-kurenie.png',
        kratky_popis='Dve rúry v ohybnejšom plášti PRIMO. Pre stiesnené výkopy a krátke prípojky.'),
    '1-microflex-uno-10-bar': dict(slug='microflex-uno-10-bar', nazov='Microflex UNO, sanita 10 bar', medium='pitná voda', tlak_bar=10, pocet_rur=1, piktogram='rad-uno-sanita.png',
        kratky_popis='Jedna rúra na pitnú vodu, 10 bar. Teplá alebo studená voda k vzdialenému odberu.'),
    '2-microflex-duo-10-bar': dict(slug='microflex-duo-10-bar', nazov='Microflex DUO, sanita 10 bar', medium='pitná voda', tlak_bar=10, pocet_rur=2, piktogram='rad-duo-sanita.png',
        kratky_popis='Teplá a studená pitná voda v jednom plášti, 10 bar.'),
    '3-microflex-primo-duo-s-10-bar': dict(slug='microflex-primo-duo-10-bar', nazov='Microflex PRIMO DUO, sanita 10 bar', medium='pitná voda', tlak_bar=10, pocet_rur=2, piktogram='rad-duo-sanita.png',
        kratky_popis='Dve rúry na pitnú vodu v ohybnejšom plášti PRIMO.'),
    '4-microflex-quadro': dict(slug='microflex-quadro', nazov='Microflex QUADRO, vykurovanie a sanita', medium='vykurovacia a pitná voda', tlak_bar=None, tlak_text='6 / 10 bar', pocet_rur=4, piktogram='rad-quadro.png',
        kratky_popis='Štyri rúry v jednom plášti: prívod a spiatočka vykurovania, teplá voda a cirkulácia. Jeden výkop pre všetko.'),
    '1-pipe-system-microflex-cool': dict(slug='microflex-cool', nazov='Microflex COOL', medium='studená a chladená voda', tlak_bar=16, pocet_rur=1, piktogram='rad-cool-uno.png',
        kratky_popis='Jedna rúra PE na studenú pitnú vodu, chladenú vodu a odpadovú vodu.'),
    '2-pipe-system-microflex-cool-ht': dict(slug='microflex-cool-s-vyhrievacim-kablom', nazov='Microflex COOL s vyhrievacím káblom', medium='studená a chladená voda', tlak_bar=16, pocet_rur=1, piktogram='rad-cool-vyhrievaci-kabel.png',
        kratky_popis='COOL so samoregulačným vyhrievacím káblom proti zamrznutiu pri malej hĺbke uloženia.'),
    'microflex-cool-duo': dict(slug='microflex-cool-duo', nazov='Microflex COOL DUO', medium='studená a chladená voda', tlak_bar=16, pocet_rur=2, piktogram='rad-cool-duo.png',
        kratky_popis='Dve rúry PE na studenú a chladenú vodu v jednom plášti.'),
    'microflex-hp': dict(slug='microflex-hp', nazov='Microflex HP, tepelné čerpadlá', medium='vykurovacia alebo chladiaca voda', tlak_bar=6, pocet_rur=2, piktogram='rad-hp-tepelne-cerpadlo.png',
        kratky_popis='Prívod a spiatočka k vonkajšej jednotke tepelného čerpadla v jednom plášti, s chráničkami na napájací a ovládací kábel.'),
    'pe-x-couplings-for-heating-and-cool-pipes': dict(slug='pe-x-spojky-vykurovanie-a-cool', nazov='Spojky PE-X pre vykurovanie a COOL'),
    'pe-x-couplings-for-sanitary-pipes': dict(slug='pe-x-spojky-sanita', nazov='Spojky PE-X pre sanitu'),
    'accessories': dict(slug='prislusenstvo-spojok', nazov='Príslušenstvo pre spojky PE-X'),
    'caps-and-reduction-kits': dict(slug='koncovky-a-redukcie', nazov='Koncovky a redukčné sady'),
    'pipe-insulation-sets': dict(slug='izolacne-sady', nazov='Izolačné sady'),
    'repair-and-warning-tapes': dict(slug='opravne-a-vystrazne-pasky', nazov='Opravné a výstražné pásky'),
    'wall-feed-throughs': dict(slug='prestupy-stenou', nazov='Prestupy stenou'),
}

# --- čeština: naše názvy (model radu sa nemení), dlhé popisy berieme z watts.eu/cz (data/_cz.json) ---

KATEGORIE_CS = {
    'pipes-for-heating': dict(slug='vytapeni', nazov='Předizolované potrubí pro vytápění', kratky_nazov='Vytápění',
        popis='Ohebné potrubí pro rozvod tepla mezi budovami nebo od kotelny, kotle na biomasu či tepelného čerpadla k domu. UNO vede jednu trubku, DUO má přívod a zpátečku v jednom plášti.'),
    'pipes-for-sanitary': dict(slug='sanita', nazov='Předizolované potrubí pro teplou a studenou vodu', kratky_nazov='Teplá a studená voda',
        popis='Pitná voda mezi budovami a ke vzdáleným odběrům, 10 bar. UNO, DUO a PRIMO DUO v sanitárním provedení.'),
    'central-heating-and-sanitary': dict(slug='vytapeni-a-sanita', nazov='Vytápění a sanita v jednom plášti', kratky_nazov='Vytápění a sanita',
        popis='Čtyři trubky v jednom plášti: přívod a zpátečka vytápění, teplá voda a cirkulace. Řada QUADRO pro vedlejší budovu s vlastním vytápěním i teplou vodou.'),
    'cold-cold-drinking-water': dict(slug='studena-a-chlazena-voda', nazov='Předizolované potrubí pro studenou a chlazenou vodu', kratky_nazov='Studená a chlazená voda',
        popis='Chlazená a studená pitná voda, odpadní voda. COOL, COOL s topným kabelem a COOL DUO.'),
    'heating-pumps': dict(slug='tepelna-cerpadla', nazov='Předizolované potrubí pro tepelná čerpadla', kratky_nazov='Tepelná čerpadla',
        popis='Propojení venkovní jednotky tepelného čerpadla s domem v jednom plášti, přívod i zpátečka. Řada Microflex HP.'),
    'couplings': dict(slug='spojky', nazov='Spojky', kratky_nazov='Spojky',
        popis='PE-X spojky, kolena, T-kusy a závitová připojení pro vytápění, COOL i sanitu.'),
    'accessories': dict(slug='prislusenstvi', nazov='Příslušenství pro Microflex', kratky_nazov='Příslušenství',
        popis='Koncovky, izolační sady, prostupy stěnou, opravné a výstražné pásky, revizní šachty.'),
}

RADY_CS = {
    '1-microflex-uno-6-bar': dict(nazov='Microflex UNO, vytápění 6 bar', medium='topná voda', kratky_popis='Jedna trubka PE-Xa v plášti. Přívod nebo zpátečka, teplá voda ke vzdálenému odběru.'),
    '2-microflex-duo-6-bar': dict(nazov='Microflex DUO, vytápění 6 bar', medium='topná voda', kratky_popis='Přívod a zpátečka v jednom plášti. Nejčastější volba pro přípojku domu nebo tepelného čerpadla i pro rozvod tepla z jedné kotelny do více budov.'),
    '2-single-microflex-uno-primo-6-bar': dict(nazov='Microflex UNO PRIMO, vytápění 6 bar', medium='topná voda', kratky_popis='Jedna trubka s ještě ohebnějším pláštěm pro trasy s mnoha změnami směru.'),
    '3-microflex-primo-duo-6-bar': dict(nazov='Microflex PRIMO DUO, vytápění 6 bar', medium='topná voda', kratky_popis='Dvě trubky v ohebnějším plášti PRIMO. Pro stísněné výkopy a krátké přípojky.'),
    '1-microflex-uno-10-bar': dict(nazov='Microflex UNO, sanita 10 bar', medium='pitná voda', kratky_popis='Jedna trubka na pitnou vodu, 10 bar. Teplá nebo studená voda ke vzdálenému odběru.'),
    '2-microflex-duo-10-bar': dict(nazov='Microflex DUO, sanita 10 bar', medium='pitná voda', kratky_popis='Teplá a studená pitná voda v jednom plášti, 10 bar.'),
    '3-microflex-primo-duo-s-10-bar': dict(nazov='Microflex PRIMO DUO, sanita 10 bar', medium='pitná voda', kratky_popis='Dvě trubky na pitnou vodu v ohebnějším plášti PRIMO.'),
    '4-microflex-quadro': dict(nazov='Microflex QUADRO, vytápění a sanita', medium='topná a pitná voda', kratky_popis='Čtyři trubky v jednom plášti: přívod a zpátečka vytápění, teplá voda a cirkulace. Jeden výkop pro všechno.'),
    '1-pipe-system-microflex-cool': dict(nazov='Microflex COOL', medium='studená a chlazená voda', kratky_popis='Jedna trubka PE na studenou pitnou vodu, chlazenou vodu a odpadní vodu.'),
    '2-pipe-system-microflex-cool-ht': dict(nazov='Microflex COOL s topným kabelem', medium='studená a chlazená voda', kratky_popis='COOL se samoregulačním topným kabelem proti zamrznutí při malé hloubce uložení.'),
    'microflex-cool-duo': dict(nazov='Microflex COOL DUO', medium='studená a chlazená voda', kratky_popis='Dvě trubky PE na studenou a chlazenou vodu v jednom plášti.'),
    'microflex-hp': dict(nazov='Microflex HP, tepelná čerpadla', medium='topná nebo chladicí voda', kratky_popis='Přívod a zpátečka k venkovní jednotce tepelného čerpadla v jednom plášti, s chráničkami na napájecí a ovládací kabel.'),
    'pe-x-couplings-for-heating-and-cool-pipes': dict(nazov='Spojky PE-X pro vytápění a COOL'),
    'pe-x-couplings-for-sanitary-pipes': dict(nazov='Spojky PE-X pro sanitu'),
    'accessories': dict(nazov='Příslušenství pro spojky PE-X'),
    'caps-and-reduction-kits': dict(nazov='Koncovky a redukční sady'),
    'pipe-insulation-sets': dict(nazov='Izolační sady'),
    'repair-and-warning-tapes': dict(nazov='Opravné a výstražné pásky'),
    'wall-feed-throughs': dict(nazov='Prostupy stěnou'),
}


def nacitaj_cz():
    """Texty z watts.eu/cz (data/_cz.json) podľa slovenského href."""
    p = os.path.join(ROOT, 'data', '_cz.json')
    if not os.path.exists(p):
        return {}, {}, {}
    raw = json.load(io.open(p, encoding='utf-8'))
    d = json.loads(raw) if isinstance(raw, str) else raw
    sk = lambda h: h.replace('/cz/', '/sk/')
    kat = {sk(h): v for h, v in d.get('categories', {}).items()}
    ser = {sk(h): v for h, v in d.get('series', {}).items()}
    prod = {sk(h): v for h, v in d.get('products', {}).items()}
    return kat, ser, prod


def popis_cz(rec):
    paras = (rec or {}).get('popis') or []
    text = ' '.join(paras).strip()
    text = re.sub(r'\.(?=[A-ZÁ-Ž])', '. ', text)  # chýbajúce medzery za bodkou v texte výrobcu
    return text or None


# --- pomocné ------------------------------------------------------------------------------------

def slugify(s):
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s).strip('-').lower()
    return re.sub(r'-{2,}', '-', s)


def last(href):
    return href.rstrip('/').split('/')[-1]


def num(s):
    """'0,68' -> 0.68; '75' -> 75; inak None"""
    if s is None:
        return None
    t = str(s).strip().replace(' ', '').replace(' ', '').replace(',', '.')
    if re.fullmatch(r'-?\d+(\.\d+)?', t):
        return int(t) if re.fullmatch(r'-?\d+', t) else float(t)
    return None


def rura(s):
    """'25 х 2,3' -> {'d': 25, 's': 2.3}"""
    t = str(s).replace('х', 'x').replace('×', 'x').replace('X', 'x')
    m = re.fullmatch(r'\s*(\d+(?:[,\.]\d+)?)\s*x\s*(\d+(?:[,\.]\d+)?)\s*', t)
    return {'d': num(m.group(1)), 's': num(m.group(2))} if m else None


def kotuc(s):
    """'1,90 / 0,30' -> {'d': 1.9, 'sirka': 0.3}"""
    m = re.match(r'\s*([\d,\.]+)\s*/\s*([\d,\.]+)', str(s))
    return {'d': num(m.group(1)), 'sirka': num(m.group(2))} if m else None


def typ_suboru(text, href):
    t = (text + ' ' + href).lower()
    if 'dwg' in t:
        return 'DWG'
    if 'dxf' in t:
        return 'DXF'
    if 'epd' in t or 'deklarácia' in t:
        return 'EPD'
    return 'PDF'


def jazyk_suboru(text):
    t = text.lower()
    if 'katalóg' in t or 'slovensk' in t:
        return 'sk'
    if 'brochure' in t or 'declaration' in t or 'heating and cooling' in t:
        return 'en'
    return None


def subory(rec):
    out = []
    sec = (rec.get('sections') or {}).get('Stiahnuť') or {}
    for l in sec.get('links', []):
        h = l['h'] if l['h'].startswith('http') else WATTS + l['h']
        nazov = l['t']
        nazov = re.sub(r'^Microflex \| (DWG|DXF) \| ', r'Výkres \1: ', nazov)
        nazov = nazov.replace('Brochure | Pre-insulated flexible pipes Microflex', 'Brožúra Predizolované ohybné potrubia Microflex (EN)')
        nazov = nazov.replace('Declaration of Conformity | Pre-insulated pipe Microflex', 'Vyhlásenie o zhode, predizolované potrubie Microflex (EN)')
        nazov = nazov.replace('Microflex - Katalóg', 'Katalóg Microflex (SK)')
        out.append({'nazov': nazov, 'typ': typ_suboru(l['t'], h), 'jazyk': jazyk_suboru(l['t']), 'url': h})
    return out


def popis(rec):
    sec = (rec.get('sections') or {}).get('Popis') or {}
    paras = sec.get('paras') or []
    text = ' '.join(paras).strip()
    # opravy strojového prekladu, ktoré vieme urobiť bezpečne
    text = text.replace('.Obzvlášť', '. Obzvlášť').replace('.Transportná', '. Transportná')
    return text or None


FOTKA_NAHRADA = {  # rady bez vlastnej fotky u výrobcu použijú fotku príbuzného radu
    '3-microflex-primo-duo-6-bar': '2-microflex-duo-6-bar',
    'accessories': 'pe-x-couplings-for-heating-and-cool-pipes',
    'pipe-insulation-sets': 'caps-and-reduction-kits',
}


def fotka_pre(watts_slug, our_slug):
    """Skopíruje najlepšiu fotku radu do web/src/assets/rady a vráti jej názov.
    Prednosť má upravená verzia s priehľadným pozadím v podklady/upravene/rady/<náš slug>.png."""
    upravena = os.path.join(ROOT, 'podklady', 'upravene', 'rady', our_slug + '.png')
    if os.path.exists(upravena):
        dst = os.path.join(ASSETS, 'rady', our_slug + '.png')
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile(upravena, dst)
        for ext in ('.jpg', '.jpeg'):  # stará verzia s bielym pozadím nech nezostane vedľa
            s = os.path.join(ASSETS, 'rady', our_slug + ext)
            if os.path.exists(s):
                os.remove(s)
        return our_slug + '.png'
    kandidati = [f'rad-{watts_slug}-hlavna.jpg', f'rad-{watts_slug}-hlavna.png', f'rad-{watts_slug}.jpg', f'rad-{watts_slug}.png']
    n = FOTKA_NAHRADA.get(watts_slug)
    if n:
        kandidati += [f'rad-{n}-hlavna.jpg', f'rad-{n}-hlavna.png', f'rad-{n}.jpg', f'rad-{n}.png']
    for k in kandidati:
        src = os.path.join(PODKLADY, 'fotky-rady', k)
        if os.path.exists(src):
            ext = os.path.splitext(k)[1]
            dst = os.path.join(ASSETS, 'rady', our_slug + ext)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copyfile(src, dst)
            return our_slug + ext
    return None


# Hlavičky tabuliek sú na watts.eu miešané (angličtina, holandčina, slovenčina); poradie vzorov je dôležité.
HEAD_MAP = [
    (re.compile(r'^(art\.?\s*no\.?|kód|výrobné číslo|obj\. číslo)$', re.I), 'obj_cislo'),
    (re.compile(r'PE-?X|PE d ?out|pressure pipe|pipe PEX', re.I), 'rura'),
    (re.compile(r'outside casing|out\. housing|buitenmantel|casing|pláš|vonkajší obal', re.I), 'plast_mm'),
    (re.compile(r'váha|weight|hmotn', re.I), 'hmotnost_kg_m'),
    (re.compile(r'^insulation$|^izolácia$', re.I), 'izolacia'),
    (re.compile(r'bend|polomer|ohyb', re.I), 'polomer_ohybu_m'),
    (re.compile(r'coil|kotúč', re.I), 'kotuc'),
    (re.compile(r'^PN$', re.I), 'tlak_bar'),
    (re.compile(r'^DN$', re.I), 'dn'),
]
KOD = re.compile(r'^[A-Z][A-Z0-9\-/]{3,}$')


def parse_variants(rec, rad_id):
    tables = rec.get('tables') or []
    if not tables or not tables[0].get('rows'):
        return []
    head = tables[0]['head']
    cols = []
    for h in head:
        key = None
        for rx, k in HEAD_MAP:
            if rx.search(h.strip()):
                key = k
                break
        cols.append(key)
    bend_cm = any(re.search(r'\bcm\b', h) for h, k in zip(head, cols) if k == 'polomer_ohybu_m')
    out = []
    for r in tables[0]['rows']:
        if len(r) <= 1:
            continue  # medzititulky v tabuľke (napr. „heating cables 10 W / m“)
        raw = dict(zip(head, r))
        v = {'rad': rad_id, 'poradie': len(out) + 1, 'raw': raw}
        for key, val in zip(cols, r):
            if key == 'obj_cislo':
                v['obj_cislo'] = val.strip()
            elif key == 'plast_mm':
                v['plast_mm'] = num(val)
            elif key == 'rura':
                parsed = rura(val)
                if parsed:
                    v['rura'] = parsed
                else:
                    v['rura_text'] = val.strip()  # QUADRO a DUO 10 bar majú viac rúr v jednej bunke
            elif key == 'hmotnost_kg_m':
                v['hmotnost_kg_m'] = num(val)
            elif key == 'izolacia':
                v['izolacia'] = 'zosilnena' if val.strip().lower().startswith('adv') else 'standard'
            elif key == 'polomer_ohybu_m':
                n = num(val)
                # hlavička „cm“, ale hodnoty ako 0,3 sú už v metroch (nezrovnalosť na watts.eu)
                v['polomer_ohybu_m'] = (n / 100 if (n is not None and bend_cm and n >= 5) else n)
            elif key == 'kotuc':
                v['kotuc'] = kotuc(val)
            elif key == 'tlak_bar':
                v['tlak_bar'] = num(val)
            elif key == 'dn':
                v['dn'] = val.strip()
        if not v.get('obj_cislo') or not KOD.match(v['obj_cislo']):
            continue
        v['id'] = v['obj_cislo']
        v['eshop_url'] = 'https://www.instalatershop.sk/vyhledavani/?string=' + v['obj_cislo']
        out.append(v)
    return out


# --- tabuľky z katalógu PDF: rady bez tabuľky na watts.eu (PRIMO) a prenášaný výkon v kW ---
KATALOG = os.path.join(ROOT, 'podklady', 'watts', 'Microflex-katalog-SK.pdf')
KAT_RIADOK = re.compile(r'(M[A-Z]?\d{4,7}\s?[A-Z]{0,2})\s*\|\s*([\dx, ]+?)\s*\|\s*(\d+(?:-\d+)?)\s*\|\s*(\d{2,3})\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|\s*(?:~(\d+))?')
# strana katalógu -> náš slug radu, ktorému tabuľka na watts.eu chýba (None = len výkon a DN pre existujúce riadky)
KAT_STRANY = {8: None, 9: 'microflex-uno-primo-6-bar', 10: None, 11: 'microflex-primo-duo-6-bar', 14: 'microflex-primo-duo-10-bar'}


def katalog_riadky():
    """{strana: [(kód, rúra, DN, plášť, hmotnosť, polomer, kW)]} z PDF katalógu (PyMuPDF)."""
    import fitz
    d = fitz.open(KATALOG)
    out = {}
    for n in KAT_STRANY:
        t = ' | '.join(l.strip() for l in d[n - 1].get_text().split('\n') if l.strip())
        out[n] = [tuple(x.strip() for x in r) for r in KAT_RIADOK.findall(t)]
    return out


def variant_z_katalogu(rad_id, poradie, r, strana):
    kod, rura_s, dn, plast, hm, pol, kw = r
    kod = kod.replace(' ', '')
    v = {'rad': rad_id, 'poradie': poradie, 'obj_cislo': kod, 'id': kod,
         'raw': {'Kód': kod, 'PEX-a vonk. rozmer (mm)': rura_s, 'DN': dn, 'Vonkajšie opláštenie (mm)': plast,
                 'Hmotnosť (kg/m)': hm, 'Polomer ohybu (m)': pol, 'Emisie tepla (kW)': kw},
         'plast_mm': num(plast), 'hmotnost_kg_m': num(hm), 'polomer_ohybu_m': num(pol), 'dn': dn,
         'izolacia': 'standard', 'zdroj_strana': strana,
         'eshop_url': 'https://www.instalatershop.sk/vyhledavani/?string=' + kod}
    casti = re.findall(r'(\d)\s*x\s*(\d{2,3})\s*x\s*(\d+,\d)', rura_s)
    if len(casti) == 1 and casti[0][0] in ('1', '2') and len(re.findall(r'x', rura_s)) <= 2:
        v['rura'] = {'d': num(casti[0][1]), 's': num(casti[0][2])}
    elif casti:
        v['rura_text'] = ' '.join(f'{c[0]}x{c[1]}/{c[2]}' for c in casti)
    else:
        m = re.match(r'(\d{2,3})\s*x\s*(\d+(?:,\d)?)', rura_s)
        if m:
            v['rura'] = {'d': num(m.group(1)), 's': num(m.group(2))}
    if kw:
        v['vykon_kw'] = int(kw)
    return v


def main():
    d = json.load(io.open(SRC, encoding='utf-8'))
    stiahnute = d['fetched'][:10]
    os.makedirs(OUT, exist_ok=True)
    kategorie, rady, varianty, produkty, navrh = [], [], [], [], []
    cz_kat, cz_ser, cz_prod = nacitaj_cz()

    cat_by_href = {}
    for c in d['categories']:
        ws = last(c['href'])
        m = KATEGORIE.get(ws)
        if not m:
            print('neznáma kategória', ws, file=sys.stderr)
            continue
        kid = m['slug']
        cat_by_href[c['href']] = kid
        mcs = KATEGORIE_CS[ws]
        kategorie.append({'id': kid, 'slug': m['slug'], 'slug_cs': mcs['slug'], 'nazov': m['nazov'], 'nazov_cs': mcs['nazov'],
                          'kratky_nazov': m['kratky_nazov'], 'kratky_nazov_cs': mcs['kratky_nazov'], 'popis': m['popis'], 'popis_cs': mcs['popis'],
                          'typ': m['typ'], 'piktogram': m['piktogram'], 'poradie': m['poradie'], 'nazov_watts': c['h1'] or c['name'],
                          'nazov_watts_cs': (cz_kat.get(c['href']) or {}).get('h1') or None,
                          'rady': [], 'zdroj_url': WATTS + c['href'], 'stiahnute': stiahnute})
        for poradie, s in enumerate(c['series'], start=1):
            rec = d['series'].get(s['href'], {})
            wslug = last(s['href'])
            mm = RADY.get(wslug) or {'slug': slugify(re.sub(r'^\d+-', '', wslug)), 'nazov': rec.get('h1') or s['name']}
            rid = mm['slug']
            fotka = fotka_pre(wslug, rid)
            cs = RADY_CS.get(wslug, {})
            czr = cz_ser.get(s['href']) or {}
            rad = {'id': rid, 'slug': rid, 'kategoria': kid, 'poradie': poradie, 'nazov': mm['nazov'], 'nazov_cs': cs.get('nazov') or mm['nazov'],
                   'nazov_watts': rec.get('h1') or s['name'], 'nazov_watts_cs': czr.get('h1') or None,
                   'popis': popis(rec), 'popis_cs': popis_cz(czr), 'kratky_popis': mm.get('kratky_popis'), 'kratky_popis_cs': cs.get('kratky_popis'),
                   'medium': mm.get('medium'), 'medium_cs': cs.get('medium'), 'tlak_bar': mm.get('tlak_bar'), 'tlak_text': mm.get('tlak_text'), 'pocet_rur': mm.get('pocet_rur'),
                   'piktogram': mm.get('piktogram'), 'fotka': fotka, 'subory': subory(rec),
                   'je_skupina': bool(rec.get('sublisting')), 'produkty': [], 'suvisiace': [],
                   'zdroj_url': WATTS + s['href'], 'stiahnute': stiahnute}
            vs = parse_variants(rec, rid)
            rad['pocet_variantov'] = len(vs)
            varianty.extend(vs)
            # súvisiace produkty (href -> id doplníme po načítaní produktov)
            rel = ((rec.get('sections') or {}).get('Súvisiace produkty') or {}).get('links', [])
            rad['_suvisiace_href'] = [l['h'] for l in rel if BASE in l['h'] and l['h'].count('/') >= 7]
            rady.append(rad)
            kategorie[-1]['rady'].append(rid)
            navrh.append((kid, rad['nazov_watts'], rad['nazov']))

    # produkty druhej úrovne
    prod_by_href = {}
    for href, p in d['products'].items():
        parent = next((r for r in rady if r['zdroj_url'] == WATTS + p['parent']), None)
        if not parent:
            continue
        pid = slugify(p.get('h1') or p['listName'])
        tx = PRODUKTY.get(pid)
        if tx is None:
            print('POZOR: produkt bez nášho názvu v produkty_texty.py:', pid)
            tx = {}
        if tx.get('skryt'):
            continue  # duplicita zo zdroja (rovnaké obj. čísla ako iný produkt)
        prod_by_href[href] = pid
        vyrad = tuple(tx.get('vyrad_kody') or ())
        vs = [v for v in parse_variants(p, pid) if not v['obj_cislo'].startswith(vyrad or ('\0',))]
        czp = cz_prod.get(href) or {}
        nazov = tx.get('nazov') or p.get('h1') or p['listName']
        nazov_cs = tx.get('nazov_cs') or czp.get('h1') or None
        prod = {'id': pid, 'slug': slugify(nazov), 'slug_cs': slugify(nazov_cs or nazov), 'skupina': parent['id'], 'kategoria': parent['kategoria'],
                'poradie': len(parent['produkty']) + 1, 'nazov': nazov, 'nazov_cs': nazov_cs, 'nazov_watts': p.get('h1') or p['listName'],
                'popis': tx.get('popis') or popis(p), 'popis_cs': tx.get('popis_cs') or popis_cz(czp),
                'subory': subory(p), 'pocet_variantov': len(vs),
                'tabulky': ciste_tabulky(p.get('tables'), vyrad), 'zdroj_url': WATTS + href, 'stiahnute': stiahnute}
        produkty.append(prod)
        parent['produkty'].append(pid)
        varianty.extend(vs)

    # skupiny spojok a príslušenstva: naše názvy a krátke popisy
    for r in rady:
        sk = SKUPINY.get(r['id'])
        if sk:
            r['nazov'] = sk.get('nazov') or r['nazov']
            r['nazov_cs'] = sk.get('nazov_cs') or r.get('nazov_cs')
            r['kratky_popis'] = sk['popis']
            r['kratky_popis_cs'] = sk['popis_cs']

    # obj. číslo je v tabuľkách watts.eu niekedy dvakrát (ten istý diel v dvoch skupinách): nechať prvý výskyt
    videne, jedinecne = set(), []
    for v in varianty:
        kluc = (v['rad'], v['id'])
        if kluc in videne:
            continue
        videne.add(kluc)
        jedinecne.append(v)
    varianty[:] = jedinecne

    # doplnenie z katalógu PDF: PRIMO rady a výkon (kW) s DN pri vykurovacích radoch
    kat = katalog_riadky()
    vykon = {}
    for strana, riadky in kat.items():
        for r in riadky:
            kod = r[0].replace(' ', '')
            vykon.setdefault(kod, (int(r[6]) if r[6] else None, r[2]))
        slug = KAT_STRANY[strana]
        rad = next((x for x in rady if x['slug'] == slug), None) if slug else None
        if rad and not any(v['rad'] == rad['id'] for v in varianty):
            for i, r in enumerate(riadky):
                varianty.append(variant_z_katalogu(rad['id'], i + 1, r, strana))
    for v in varianty:
        kw, dn = vykon.get(v['obj_cislo'], (None, None))
        if kw and 'vykon_kw' not in v:
            v['vykon_kw'] = kw
        if dn and not v.get('dn'):
            v['dn'] = dn
    # to isté obj. číslo môže byť v dvoch radoch (UNO a UNO PRIMO): id záznamu je rad + obj. číslo
    # COOL DUO: na watts.eu tabuľka nie je a v katalógu (s. 17) sú stĺpce plášťa, hmotnosti a polomeru
    # posunuté (2 × 40 mm v plášti 90 mm). Berieme len obj. číslo, rúry a DN, ktoré sedia s kódom.
    cool_duo = next((x for x in rady if x['slug'] == 'microflex-cool-duo'), None)
    if cool_duo and not any(v['rad'] == cool_duo['id'] for v in varianty):
        for i, (kod, d, s, dn) in enumerate([('MD12532PE', 32, 2.9, '25'), ('MD16040PE', 40, 3.7, '32'),
                                             ('MD16050PE', 50, 4.6, '40'), ('MD20063PE', 63, 5.7, '50')]):
            varianty.append({'rad': cool_duo['id'], 'poradie': i + 1, 'obj_cislo': kod, 'id': kod,
                             'raw': {'Kód': kod, 'PEX-a vonk. rozmer (mm)': f'2x{d}x{s}'.replace('.', ','), 'DN': dn},
                             'rura_text': f'2x{d}/{s}'.replace('.', ','), 'dn': dn, 'zdroj_strana': 17,
                             'eshop_url': 'https://www.instalatershop.sk/vyhledavani/?string=' + kod})
    # Zjavné chyby v tabuľkách watts.eu opravené podľa katalógu (QUADRO 200 mm: 1,92 kg/m a polomer 5 m,
    # katalóg s. 15 uvádza 4,12 kg/m a 1,30 m). Menšie rozdiely medzi webom a katalógom nechávame podľa webu.
    OPRAVY = {'MQ20040C4028S': {'hmotnost_kg_m': 4.12, 'polomer_ohybu_m': 1.3}}
    for v in varianty:
        v.update(OPRAVY.get(v['obj_cislo'], {}))

    # Príslušenstvo ku každému obj. číslu potrubia (katalóg s. 8 až 16 a 18): krytky, pevné body, spojky MPP.
    # Diel sa prepojí s produktom podľa obj. čísla v tabuľke produktu; gumové krytky EPDM tabuľku na
    # watts.eu nemajú, priradia sa podľa predpony (MG = UNO, MGD = DUO, MGQ = QUADRO).
    import fitz
    from prislusenstvo import katalog_prislusenstvo, kod_katalogu
    prisl = katalog_prislusenstvo(fitz.open(KATALOG))
    kod_produktu = {}
    for p in produkty:
        for t in p['tabulky']:
            for riadok in t['riadky']:
                kod_produktu.setdefault(riadok[0], p['id'])
    EPDM = {'MGQ': 'dokoncenie-uzaverov-epdm-na-potrubiach-quadro', 'MGD': 'dokoncenie-uzaverov-epdm-na-dvojitych-potrubiach',
            'MG': 'dokoncenie-uzaverov-epdm-na-jednotlivych-potrubiach'}
    rady_potrubia = {r['id'] for r in rady if not r.get('je_skupina')}
    pouzitie = {}  # produkt → {obj. číslo dielu → [obj. čísla potrubia]}
    for v in varianty:
        if v['rad'] not in rady_potrubia:
            continue
        diely = prisl.get(kod_katalogu(v['obj_cislo']))
        if not diely:
            continue
        v['prislusenstvo'] = []
        for d in diely:
            pid = kod_produktu.get(d['obj']) or next((EPDM[k] for k in EPDM if d['druh'] == 'MG' and d['obj'].startswith(k)), None)
            v['prislusenstvo'].append({**d, **({'produkt': pid} if pid else {})})
            if pid:
                zoznam = pouzitie.setdefault(pid, {}).setdefault(d['obj'], [])
                if v['obj_cislo'] not in zoznam:
                    zoznam.append(v['obj_cislo'])
    plast = {v['obj_cislo']: v.get('plast_mm') for v in varianty if v['rad'] in rady_potrubia}
    for p in produkty:
        if p['id'] not in pouzitie:
            continue
        p['pouzitie'] = pouzitie[p['id']]
        if not p['tabulky']:
            # Gumové krytky EPDM: tabuľka obj. čísel z katalógu, plášť podľa potrubia, ku ktorému krytka patrí.
            riadky = []
            for kod, rury in pouzitie[p['id']].items():
                pl = sorted({plast[r] for r in rury if plast.get(r)})
                riadky.append([kod, ' a '.join(str(int(x)) for x in pl), ', '.join(rury)])
            riadky.sort(key=lambda r: (int(r[1].split(' ')[0]) if r[1] else 0, r[0]))
            p['tabulky'] = [{'hlavicky': ['Obj. číslo', 'Plášť potrubia Ø', 'Pre potrubie'], 'hlavicky_cs': ['Obj. číslo', 'Plášť potrubí Ø', 'Pro potrubí'],
                             'jednotky': [None, 'mm', None], 'riadky': riadky, 'riadky_cs': [list(r) for r in riadky]}]
            p['pocet_variantov'] = len(riadky)

    for v in varianty:
        v['id'] = v['rad'] + '/' + v['obj_cislo']
    for r in rady:
        r['pocet_variantov'] = sum(1 for v in varianty if v['rad'] == r['id'])

    for r in rady:
        r['suvisiace'] = [prod_by_href[h] for h in r.pop('_suvisiace_href') if h in prod_by_href]
        r['suvisiace'] = list(dict.fromkeys(r['suvisiace']))

    # piktogramy: verzia 1200 px z podklady/watts/piktogramy/hd má prednosť pred pôvodnými 250–350 px.
    # Každý sa oreže na obsah s rovnakým okrajom (jednotné rámovanie); HP je u výrobca zrkadlovo, otočíme ho.
    from PIL import Image
    os.makedirs(os.path.join(ASSETS, 'piktogramy'), exist_ok=True)
    ZRKADLIT = {'rad-hp-tepelne-cerpadlo.png'}
    for f in os.listdir(os.path.join(PODKLADY, 'piktogramy')):
        if not f.endswith('.png'):
            continue
        hd = os.path.join(PODKLADY, 'piktogramy', 'hd', f)
        src = hd if os.path.exists(hd) else os.path.join(PODKLADY, 'piktogramy', f)
        im = Image.open(src).convert('RGBA')
        bbox = im.getchannel('A').getbbox()
        if bbox:
            pad = int(max(im.size) * 0.02)
            im = im.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(im.width, bbox[2] + pad), min(im.height, bbox[3] + pad)))
        if f in ZRKADLIT:
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
        im.save(os.path.join(ASSETS, 'piktogramy', f), optimize=True)

    def dump(name, rows):
        io.open(os.path.join(OUT, name), 'w', encoding='utf-8', newline='\n').write(json.dumps(rows, ensure_ascii=False, indent=1))
        print('%-16s %4d záznamov' % (name, len(rows)))

    dump('kategorie.json', kategorie)
    dump('rady.json', rady)
    dump('varianty.json', varianty)
    dump('produkty.json', produkty)

    lines = ['# Návrh slovenských názvov radov (na schválenie)', '', 'Zdroj: názvy na watts.eu (strojový preklad) → náš názov. Zmeny robiť v `data/normalize.py` (slovník RADY).', '', '| Kategória | Názov na watts.eu | Náš názov |', '|---|---|---|']
    for kid, w, n in navrh:
        lines.append('| %s | %s | **%s** |' % (kid, w, n))
    io.open(os.path.join(ROOT, 'data', 'nazvy-radov.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(lines) + '\n')
    print('nazvy-radov.md   %4d názvov' % len(navrh))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
