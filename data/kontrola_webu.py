"""Kontrola hotového webu v web/dist po `npx astro build`.

Použitie:  python data/kontrola_webu.py
Hlási: interné odkazy na neexistujúce stránky alebo súbory, kotvy (#id), ktoré na cieľovej stránke
nie sú, titulky nad 60 znakov, popisy mimo 120 až 160 znakov, stránky bez náhľadového obrázka (og:image)
a vlastnosti v hotovom CSS len s predponou -webkit- (Chrome a Firefox ich nepoznajú).
Na konci stráž tokenov v zdrojoch web/src (docs/DOLADENIE.md, A1): zaoblenie mimo var(--radius-*),
tieň s výškou mimo var(--elev-*) a veľkosť písma mimo škály.
"""
import collections
import html
import os
import re
import sys
from urllib.parse import unquote, urlsplit

D = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'web', 'dist')
if not os.path.isdir(D):
    sys.exit('Chýba web/dist: najprv spustite v priečinku web `npx astro build`.')

stranky = {}
for koren, _, subory in os.walk(D):
    for f in subory:
        if f.endswith('.html'):
            p = os.path.join(koren, f)
            u = '/' + os.path.relpath(p, D).replace(os.sep, '/')
            u = u[:-len('index.html')] if u.endswith('index.html') else u
            stranky[u] = open(p, encoding='utf-8').read()
idcka = {u: set(re.findall(r'\sid="([^"]+)"', s)) for u, s in stranky.items()}

chyby, priklad = collections.Counter(), {}
dlhe_titulky, zle_popisy, bez_og = [], [], []
for u, s in stranky.items():
    for href in re.findall(r'\shref="([^"]+)"', s):
        href = html.unescape(href)
        if href.startswith(('http', 'mailto:', 'tel:', '//', 'data:')):
            continue
        cast = urlsplit(href)
        cesta = unquote(cast.path) or u
        if not cesta.startswith('/'):
            continue
        if re.search(r'\.(css|js|svg|png|jpg|webp|ico|xml|json|txt|woff2?)$', cesta):
            if not os.path.exists(os.path.join(D, cesta.lstrip('/'))):
                chyby[('súbor', cesta)] += 1; priklad[('súbor', cesta)] = u
            continue
        if cesta not in stranky:
            chyby[('stránka', cesta)] += 1; priklad[('stránka', cesta)] = u
        elif cast.fragment and cast.fragment not in idcka[cesta]:
            k = ('kotva', f'{cesta}#{cast.fragment}')
            chyby[k] += 1; priklad[k] = u
    t = re.search(r'<title>(.*?)</title>', s, re.S)
    t = html.unescape(t.group(1)) if t else ''
    d = re.search(r'<meta name="description" content="([^"]*)"', s)
    d = html.unescape(d.group(1)) if d else ''
    if len(t) > 60:
        dlhe_titulky.append((len(t), t))
    if not 120 <= len(d) <= 160:
        zle_popisy.append((len(d), u))
    if 'property="og:image"' not in s:
        bez_og.append(u)

print(f'{len(stranky)} stránok')
print(f'chybné odkazy a kotvy: {sum(chyby.values())}')
for k, n in chyby.most_common(30):
    print(f'  {n}× {k[0]} {k[1]} (napr. z {priklad[k]})')
print(f'titulky nad 60 znakov: {len(dlhe_titulky)}', *[f'\n  {n} {t}' for n, t in sorted(dlhe_titulky, reverse=True)[:10]])
print(f'popisy mimo 120–160 znakov: {len(zle_popisy)}', *[f'\n  {n} {u}' for n, u in zle_popisy[:10]])
print(f'bez og:image: {len(bez_og)}', *[f'\n  {u}' for u in bez_og[:10]])

# Minifikátor CSS pri poradí „štandardná vlastnosť, potom -webkit-“ nechá len verziu s predponou.
# Tak 26. 10. 2026 zmizlo rozmazanie hlavičky v Chrome a Firefoxe; predpona patrí pred štandardnú.
css = list(stranky.values())
for koren, _, subory in os.walk(os.path.join(D, '_astro')):
    css += [open(os.path.join(koren, f), encoding='utf-8').read() for f in subory if f.endswith('.css')]
len_predpona = set()
for s in css:
    for blok in re.findall(r'\{([^{}]*)\}', s):
        for v in re.findall(r'-webkit-(backdrop-filter|mask-image|mask-size|mask-position|mask-repeat|user-select)\s*:', blok):
            if not re.search(rf'(?<![-\w]){v}\s*:', blok):
                len_predpona.add(f'-webkit-{v} v {{{blok[:90]}}}')
print(f'vlastnosti len s predponou -webkit-: {len(len_predpona)}', *[f'\n  {x}' for x in sorted(len_predpona)[:8]])

# Stráž tokenov v zdrojoch: hodnoty mimo zaoblení, úrovní hĺbky a škály písma (global.css, DOLADENIE A1), od polishu
# 1. 11. 2026 aj medzery mimo mriežky 4 px a biele polopriesvitné plochy mimo var(--sklo-*) (docs/POLISH.md M1, F2).
SRC = os.path.join(os.path.dirname(D), 'src')
SKALA_PISMA = {12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 28}
NAVY = re.compile(r'rgb\((?:10 42 94|11 27 51|2 10 30|4 16 40) / [0-9.]+\)')
mimo = collections.defaultdict(list)
for koren, _, subory in os.walk(SRC):
    for f in subory:
        if not f.endswith(('.astro', '.css')) or f == 'pisma.css':
            continue
        cesta = os.path.join(koren, f)
        rel = os.path.relpath(cesta, SRC).replace(os.sep, '/')
        for i, riadok in enumerate(open(cesta, encoding='utf-8'), 1):
            for h in re.findall(r'(?<![-\w])border-radius:\s*([^;}"\n]+)', riadok):
                if not re.search(r'var\(|clamp\(|%|999px', h) and re.search(r'\b(?:[4-9]|\d{2,})px', h):
                    mimo['zaoblenie mimo var(--radius-*)'].append(f'{rel}:{i} {h.strip()}')
            for h in re.findall(r'(?<![-\w])box-shadow:\s*([^;}"\n]+)', riadok):
                for z in re.split(r',\s*(?![^()]*\))', h):
                    c = re.findall(r'-?\d+(?:\.\d+)?', z.split('rgb')[0])
                    if 'inset' not in z and NAVY.search(z) and len(c) >= 3 and float(c[1]) > 2 and float(c[2]) > 12:
                        mimo['tieň mimo var(--elev-*)'].append(f'{rel}:{i} {z.strip()}')
            for v in re.findall(r'(?<![-\w])font-size:\s*(\d+(?:\.\d+)?)px', riadok) + re.findall(r'(?<![-\w])font:\s*(?:\d{3}\s+)?(\d+(?:\.\d+)?)px', riadok):
                if float(v) not in SKALA_PISMA:
                    mimo['písmo mimo škály'].append(f'{rel}:{i} {v}px')
            # medzery: px v margin*, padding*, gap mimo násobkov 4 (bez 0 až 2 px, záporných, funkcií a vyrovnania hlavičky)
            for vl, h in re.findall(r'(?<![-\w])((?:margin|padding)(?:-[a-z-]+)?|gap|row-gap|column-gap):\s*([^;}"\n]+)', riadok):
                if '(' in h or 'is-scrolled' in riadok:
                    continue
                for v in re.findall(r'(?<![\w.-])(\d+(?:\.\d+)?)px', h):
                    if float(v) > 2 and float(v) % 4:
                        mimo['medzera mimo mriežky 4 px'].append(f'{rel}:{i} {vl}: {h.strip()}')
            for a in re.findall(r'(?<![-\w])background(?:-color)?:\s*rgba?\(\s*255[\s,]+255[\s,]+255\s*[/,]\s*(0?\.\d+)\s*\)\s*[;}]', riadok):
                if float(a) > 0.5:
                    mimo['biela plocha mimo var(--sklo-*)'].append(f'{rel}:{i} {a}')
for k in ('zaoblenie mimo var(--radius-*)', 'tieň mimo var(--elev-*)', 'písmo mimo škály', 'medzera mimo mriežky 4 px', 'biela plocha mimo var(--sklo-*)'):
    print(f'{k}: {len(mimo[k])}', *[f'\n  {x}' for x in mimo[k][:8]])
