# Prehľad návrhov stránky Referencie vedľa seba (po navrhy.mjs). Spustenie: C:/Python314/python -P prehlad.py
# alebo pre verzie smeru A: C:/Python314/python -P prehlad.py verzie-a
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

CIEL = Path(__file__).resolve().parent.parent
VERZIE_A = len(sys.argv) > 1 and sys.argv[1] == 'verzie-a'
if VERZIE_A:
    CIEL = CIEL / 'verzie-a'
FONT = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 30)
FONT_M = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 22)
NAVRHY = [
    ('0-dnes', 'Dnes', 'stav na webe'),
    ('A-hlavna-stavba', 'A  Hlavná stavba', 'naša dodávka ako príbeh, ostatné ako karty'),
    ('B-prehlad-stavieb', 'B  Prehľad stavieb', 'dlaždice ako katalóg, pod nimi list každej stavby'),
    ('C-stavba-a-vyrobok', 'C  Stavba a výrobok', 'tabuľka stavieb, pri fotke presný výrobok a kúpa'),
]
if VERZIE_A:
    NAVRHY = [
        ('A1-tmavy-pas-s-prehladom', 'A1  Tmavý pás s prehľadom', 'pôvodné A, pod úvodom pás so všetkými stavbami'),
        ('A2-pribeh-v-kapitolach', 'A2  Príbeh v kapitolách', 'šikmý panel, fotka cez hranu, štyri kapitoly, stavby v riadkoch'),
        ('A3-mozaika-fotiek', 'A3  Mozaika fotiek', 'svetlý úvod s mozaikou a kartou, tmavé karty stavieb'),
    ]
INK, SOFT, POZADIE = (11, 27, 51), (74, 85, 104), (233, 240, 249)


def stlpce(subory, sirka, vyska_max=None, medzera=40, hlavicka=96, nazov='prehlad.jpg'):
    obrazy = []
    for meno, nadpis, popis in NAVRHY:
        im = Image.open(CIEL / f'{meno}{subory}').convert('RGB')
        v = round(im.height * sirka / im.width)
        im = im.resize((sirka, v), Image.LANCZOS)
        if vyska_max and im.height > vyska_max:
            im = im.crop((0, 0, sirka, vyska_max))
        obrazy.append((im, nadpis, popis))
    H = hlavicka + max(i.height for i, _, _ in obrazy) + medzera
    W = len(obrazy) * sirka + (len(obrazy) + 1) * medzera
    plocha = Image.new('RGB', (W, H), POZADIE)
    d = ImageDraw.Draw(plocha)
    for n, (im, nadpis, popis) in enumerate(obrazy):
        x = medzera + n * (sirka + medzera)
        d.text((x, 18), nadpis, font=FONT, fill=INK)
        d.text((x, 56), popis, font=FONT_M, fill=SOFT)
        plocha.paste(im, (x, hlavicka))
    plocha.save(CIEL / nazov, quality=86)
    print(nazov, plocha.size)


def mriezka(subory, sirka, nazov):
    obrazy = [(Image.open(CIEL / f'{m}{subory}').convert('RGB'), n, p) for m, n, p in NAVRHY]
    obrazy = [(im.resize((sirka, round(im.height * sirka / im.width)), Image.LANCZOS), n, p) for im, n, p in obrazy]
    medzera, hlavicka = 40, 96
    h1 = max(i.height for i, _, _ in obrazy)
    W = 2 * sirka + 3 * medzera
    H = 2 * (hlavicka + h1) + medzera
    plocha = Image.new('RGB', (W, H), POZADIE)
    d = ImageDraw.Draw(plocha)
    for n, (im, nadpis, popis) in enumerate(obrazy):
        x = medzera + (n % 2) * (sirka + medzera)
        y = (n // 2) * (hlavicka + h1)
        d.text((x, y + 18), nadpis, font=FONT, fill=INK)
        d.text((x, y + 56), popis, font=FONT_M, fill=SOFT)
        plocha.paste(im, (x, y + hlavicka))
    plocha.save(CIEL / nazov, quality=86)
    print(nazov, plocha.size)


if VERZIE_A:
    stlpce('-pc.png', 800, nazov='00-prehlad-pc-prva-obrazovka.jpg')
    stlpce('-cela-pc.jpg', 640, nazov='00-prehlad-pc-cela-stranka.jpg')
    stlpce('-mobil.png', 390, nazov='00-prehlad-mobil.jpg')
else:
    mriezka('-pc.png', 1000, '00-prehlad-pc-prva-obrazovka.jpg')
    stlpce('-cela-pc.jpg', 560, nazov='00-prehlad-pc-cela-stranka.jpg')
    stlpce('-mobil.png', 390, nazov='00-prehlad-mobil.jpg')
