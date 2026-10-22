"""Podmnožiny písma pre web (Juraj 22. 10. 2026): len znaky, ktoré slovenský a český text potrebuje.

Fontsource dáva písmo po veľkých blokoch (latin, latin-ext, …) a slovenská stránka sťahovala oba bloky
pri každej hrúbke, spolu asi 290 kB. Tu sa z tých istých súborov (rovnaké tvary, Archivo s osami šírky
aj hrúbky) vyrežú len potrebné znaky. Výsledok: web/src/fonts/*.woff2 a web/src/styles/pisma.css.

Spustenie (treba fonttools a brotli, napr. prostredie C:\\Users\\krist\\nastroje\\web\\.venv):

    C:\\Users\\krist\\nastroje\\web\\.venv\\Scripts\\python.exe data/pisma.py

Znak mimo podmnožiny sa nestratí, prehliadač ho vykreslí záložným písmom zo zoznamu font-family.
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
NM = ROOT / 'web' / 'node_modules'
FONTS = ROOT / 'web' / 'src' / 'fonts'
CSS = ROOT / 'web' / 'src' / 'styles' / 'pisma.css'


def rozsah(*casti: str) -> list[int]:
    body = []
    for c in casti:
        a, _, b = c.partition('-')
        body += range(int(a, 16), int(b or a, 16) + 1)
    return body


# Základ: ASCII, z Latin-1 len slovenské, české, nemecké a maďarské písmená a značky (nedeliteľná medzera
# § © « ® ° ± ² ³ µ · » ½ Á Ä É Í Ó Ô Ö × Ø Ú Ü Ý ß á ä é í ó ô ö ÷ ø ú ü ý) a typografia
# (– — „ “ ‚ ‘ ’ … ′ ″ € ™ −, tenká medzera).
ZAKLAD = rozsah('20-7E', 'A0', 'A7', 'A9', 'AB', 'AD-AE', 'B0-B3', 'B5', 'B7', 'BB', 'BD', 'C1', 'C4', 'C9', 'CD',
                'D3-D4', 'D6-D8', 'DA', 'DC-DD', 'DF', 'E1', 'E4', 'E9', 'ED', 'F3-F4', 'F6-F8', 'FA', 'FC-FD',
                '2009-2011', '2013-2014', '2018-201A', '201C-201E', '2022', '2026', '202F', '2032-2033', '2039-203A',
                '20AC', '2122', '2191', '2193', '2212')
# Slovenčina a čeština (Č Ď Ě Ĺ Ľ Ň Ŕ Ř Š Ť Ů Ž) a susedné jazyky pre mená firiem a obcí (ő ű ł ś ź ż ć ń ą ę).
ROZSIRENE = rozsah('104-107', '10C-10F', '118-11B', '139-13A', '13D-13E', '141-144', '147-148', '150-151',
                   '154-155', '158-15B', '160-161', '164-165', '16E-171', '179-17E')
# Fyzikálne značky v tabuľkách (Δ λ μ Ω), len text písmom IBM Plex Sans.
GRECKE = rozsah('394', '3A9', '3BB-3BC')

# (rodina, štýl CSS, zdrojové súbory podľa bloku, cieľový názov)
PISMA = [
    ('Archivo Variable', {'font-weight': '100 900', 'font-stretch': '62% 125%'},
     {'latin': '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2',
      'latin-ext': '@fontsource-variable/archivo/files/archivo-latin-ext-wdth-normal.woff2'}, 'archivo'),
    *[('IBM Plex Sans', {'font-weight': str(w)},
       {'latin': f'@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-{w}-normal.woff2',
        'latin-ext': f'@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-ext-{w}-normal.woff2',
        'greek': f'@fontsource/ibm-plex-sans/files/ibm-plex-sans-greek-{w}-normal.woff2'}, f'plex-{w}')
      for w in (400, 500, 600)],
]
BLOKY = {'latin': ('zaklad', ZAKLAD), 'latin-ext': ('rozsirene', ROZSIRENE), 'greek': ('grecke', GRECKE)}


def unicode_range(body: list[int]) -> str:
    """Súvislé úseky ako U+20-7E, U+A0-FF, …"""
    useky, start, pred = [], None, None
    for b in sorted(body):
        if start is None:
            start = pred = b
        elif b == pred + 1:
            pred = b
        else:
            useky.append((start, pred))
            start = pred = b
    useky.append((start, pred))
    return ', '.join(f'U+{a:X}' if a == b else f'U+{a:X}-{b:X}' for a, b in useky)


def podmnozina(zdroj: Path, body: list[int], ciel: Path) -> list[int]:
    font = TTFont(zdroj)
    v_pisme = set(font.getBestCmap())
    body = [b for b in body if b in v_pisme]
    opt = subset.Options()
    opt.flavor = 'woff2'
    opt.layout_features = ['*']  # kerning, ligatúry, tabuľkové číslice (font-variant-numeric)
    opt.name_IDs = ['*']
    opt.notdef_outline = True
    s = subset.Subsetter(opt)
    s.populate(unicodes=body)
    s.subset(font)
    font.flavor = 'woff2'
    font.save(ciel)
    return body


def main():
    FONTS.mkdir(parents=True, exist_ok=True)
    pravidla = []
    for rodina, styl, zdroje, meno in PISMA:
        for blok, cesta in zdroje.items():
            nazov, body = BLOKY[blok]
            ciel = FONTS / f'{meno}-{nazov}.woff2'
            body = podmnozina(NM / cesta, body, ciel)
            if not body:
                ciel.unlink()
                continue
            vlastnosti = ''.join(f'\n  {k}: {v};' for k, v in styl.items())
            pravidla.append(f"@font-face {{\n  font-family: '{rodina}';\n  font-style: normal;\n  font-display: swap;{vlastnosti}\n"
                            f"  src: url('../fonts/{ciel.name}') format('woff2');\n  unicode-range: {unicode_range(body)};\n}}")
            print(f'{ciel.name:28} {len(body):4} znakov {ciel.stat().st_size / 1024:6.1f} kB (zdroj {(NM / cesta).stat().st_size / 1024:.1f} kB)')
    CSS.write_text('/* Vygenerované skriptom data/pisma.py, needitovať ručne. */\n' + '\n'.join(pravidla) + '\n', encoding='utf-8', newline='\n')


if __name__ == '__main__':
    main()
