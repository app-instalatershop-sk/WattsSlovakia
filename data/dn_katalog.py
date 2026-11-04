"""DN nosných rúr z katalógu Watts Microflex (SK, s. 8 až 18, stĺpec „PEX-a DN“) → web/src/data/dn.json.

Juraj 4. 11. 2026: zákazník musí vedieť, či číslo je DN (vnútorný priemer) alebo vonkajší priemer rúry;
rúra 25 × 2,3 má DN 20, rúra 32 × 2,9 má DN 25. Web preto pri každej rúre ukáže aj DN.

Katalóg uvádza DN pri každom riadku tabuľky, pri potrubí s viacerými rúrami pre každú rúru zvlášť
(„1x28x4 1x18x2,5 → 20-13“, QUADRO „20-20-18-14“). DN v katalógu je približne vnútorný priemer
(d − 2s). Pre každý rozmer rúry (vonkajší priemer × stena) sa berie najčastejšia hodnota; hodnota, ktorá
od vnútorného priemeru ustupuje o viac ako 3 mm, sa vynechá ako chyba katalógu (vypíše sa) a web DN
pri takej rúre neukáže.

Spúšťať: C:/Python314/python -P data/dn_katalog.py (PyMuPDF je len v tomto Pythone).
"""
import collections
import json
import os
import re

import fitz

KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KATALOG = os.path.join(KOREN, 'podklady', 'watts', 'Microflex-katalog-SK.pdf')
VYSTUP = os.path.join(KOREN, 'web', 'src', 'data', 'dn.json')
TOLERANCIA = 3.0  # mm medzi DN a vnútorným priemerom

# Riadok tabuľky: kód, jedna alebo viac rúr „[n x] d x s“ (v PDF aj „2x25x2. 3“), DN „20“ alebo „20-13“, plášť.
RURA = r'(?:\d\s*[xX]\s*)?\d{2,3}\s*[xX]\s*\d{1,2}(?:[,.]\s?\d)?'
RIADOK = re.compile(rf'\b(M[A-Z]{{0,2}}\d{{4,7}}\s?[A-Z]{{1,2}}(?:\d{{4}}[A-Z])?)\s+((?:{RURA}\s*)+?)\s+(\d{{2,3}}(?:\s*-\s*\d{{2,3}})*)\s+(\d{{2,3}})\b')
CAST = re.compile(r'(?:(\d)\s*[xX]\s*)?(\d{2,3})\s*[xX]\s*(\d{1,2}(?:[,.]\s?\d)?)')


def kluc(d: int, s: float) -> str:
    return f'{d}x{s:g}'


def main():
    pdf = fitz.open(KATALOG)
    hlasy = collections.defaultdict(collections.Counter)   # rozmer → {DN: počet}
    strany = collections.defaultdict(set)
    for cislo in range(8, 19):
        text = pdf[cislo - 1].get_text().replace('\n', ' ')
        for kod, rury, dns, _plast in RIADOK.findall(text):
            casti = []
            for n, d, s in CAST.findall(rury):
                casti += [(int(d), float(s.replace(' ', '').replace(',', '.')))] * int(n or 1)
            dn = [int(x) for x in re.split(r'\s*-\s*', dns)]
            # DUO s dvoma rovnakými rúrami má jedno DN pre obe
            if len(dn) == 1 and len(casti) > 1 and len(set(casti)) == 1:
                dn = dn * len(casti)
            if len(dn) != len(casti):
                print(f'preskočené (počet rúr a DN nesedí): s. {cislo} {kod} {rury!r} {dns!r}')
                continue
            for (d, s), x in zip(casti, dn):
                hlasy[kluc(d, s)][x] += 1
                strany[kluc(d, s)].add(cislo)

    dn, vynechane = {}, []
    for k in sorted(hlasy, key=lambda k: (float(k.split('x')[0]), float(k.split('x')[1]))):
        d, s = (float(x) for x in k.split('x'))
        vnutri = d - 2 * s
        x, _ = hlasy[k].most_common(1)[0]
        if abs(x - vnutri) > TOLERANCIA:
            vynechane.append({'rura': k, 'dn_katalog': x, 'vnutorny_mm': round(vnutri, 1), 'strany': sorted(strany[k])})
            print(f'VYNECHANÉ {k}: katalóg DN {x}, vnútorný priemer {vnutri:.1f} mm (s. {sorted(strany[k])})')
            continue
        if len(hlasy[k]) > 1:
            print(f'rôzne DN pre {k}: {dict(hlasy[k])} → {x}')
        dn[k] = x

    vystup = {
        'zdroj': 'Katalóg Watts Microflex, slovenské vydanie, s. 8 až 18, stĺpec „PEX-a DN“ (data/dn_katalog.py)',
        'pozn': 'Kľúč je vonkajší priemer x hrúbka steny nosnej rúry v mm. DN je približne vnútorný priemer.',
        'dn': dn,
        'vynechane': vynechane,
    }
    with open(VYSTUP, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(vystup, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'{len(dn)} rozmerov rúr s DN → {os.path.relpath(VYSTUP, KOREN)}')


if __name__ == '__main__':
    main()
