# Rozmery záložného písma (Arial) tak, aby text pred načítaním Plex a Archiva zaberal to isté miesto: size-adjust
# podľa priemernej šírky znaku na slovenskom texte, ascent/descent/line-gap podľa hhea webového písma.
# Archivo je variabilné: šírka 112,5 % a hrúbky ako na webe. Výsledok ide ručne do web/src/styles/global.css (@font-face … nahrada).
# python data/pisma_zalozne.py (Windows: Arial z C:/Windows/Fonts)
import io
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

NM = 'C:/Users/krist/Documents/FajnInstalater/MicroflexWeb/web/node_modules/'
TEXT = ('Microflex vedie prívod aj spiatočku vykurovania v jednom plášti. Stačí jeden výkop a jedna pokládka, '
        'preto je to najčastejšia voľba pre prípojku domu z kotolne, kotla na biomasu alebo tepelného čerpadla. '
        'Obe rúry sú z PE-Xa s kyslíkovou bariérou, izolácia z peny PE-X ich obklopuje spoločne. Výber dimenzie, '
        'obj. číslo MD12525C, 8 variantov v 5 priemeroch nosnej rúry, z toho 3 so zosilnenou izoláciou.')

def sirka(font, text):
    cmap = font.getBestCmap(); hmtx = font['hmtx']; upm = font['head'].unitsPerEm
    w = [hmtx[cmap[ord(c)]][0] for c in text if ord(c) in cmap]
    return sum(w) / len(w) / upm

def nacitaj(cesta, osi=None):
    f = TTFont(cesta)
    if osi:
        f = instancer.instantiateVariableFont(f, osi)
    return f

def metriky(font):
    upm = font['head'].unitsPerEm; h = font['hhea']
    return h.ascent / upm, -h.descent / upm, h.lineGap / upm

arial = TTFont('C:/Windows/Fonts/arial.ttf'); arialb = TTFont('C:/Windows/Fonts/arialbd.ttf')
# Plex: latin + latin-ext sú osobitné súbory; diakritika je v latin-ext, preto šírky z oboch
def plex(rez):
    return [TTFont(f'{NM}@fontsource/ibm-plex-sans/files/ibm-plex-sans-{s}-{rez}-normal.woff2') for s in ('latin', 'latin-ext')]
def sirka_viac(fonty, text):
    w, n = 0, 0
    for c in text:
        for f in fonty:
            cm = f.getBestCmap()
            if ord(c) in cm:
                w += f['hmtx'][cm[ord(c)]][0] / f['head'].unitsPerEm; n += 1; break
    return w / n

vysledky = {}
for meno, fonty, zaloha in [('Plex 400', plex(400), arial), ('Plex 600', plex(600), arialb)]:
    sa = sirka_viac(fonty, TEXT) / sirka(zaloha, TEXT)
    a, d, g = metriky(fonty[0])
    vysledky[meno] = (sa, a / sa, d / sa, g / sa)
arch = f'{NM}@fontsource-variable/archivo/files/'
import os
subor = [x for x in os.listdir(arch) if x.startswith('archivo-latin-ext-full-normal') or x.startswith('archivo-latin-full-normal')]
print('súbory Archivo:', subor[:4])
cesta_l = arch + ('archivo-latin-full-normal.woff2' if os.path.exists(arch + 'archivo-latin-full-normal.woff2') else 'archivo-latin-wdth-normal.woff2')
cesta_e = cesta_l.replace('archivo-latin-', 'archivo-latin-ext-')
for meno, wght, zaloha in [('Archivo 500', 500, arial), ('Archivo 600', 600, arialb), ('Archivo 700', 700, arialb)]:
    fonty = []
    for c in (cesta_l, cesta_e):
        f = TTFont(c)
        osi = {}
        if 'fvar' in f:
            axy = {a.axisTag: a for a in f['fvar'].axes}
            if 'wdth' in axy: osi['wdth'] = 112.5
            if 'wght' in axy: osi['wght'] = wght
            f = instancer.instantiateVariableFont(f, osi)
        fonty.append(f)
    sa = sirka_viac(fonty, TEXT) / sirka(zaloha, TEXT)
    a, d, g = metriky(fonty[0])
    vysledky[meno] = (sa, a / sa, d / sa, g / sa)
for k, (sa, a, d, g) in vysledky.items():
    print(f'{k}: size-adjust {sa * 100:.2f}%; ascent-override {a * 100:.2f}%; descent-override {d * 100:.2f}%; line-gap-override {g * 100:.2f}%')
