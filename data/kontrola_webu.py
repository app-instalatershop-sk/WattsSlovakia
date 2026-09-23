"""Kontrola hotového webu v web/dist po `npx astro build`.

Použitie:  python data/kontrola_webu.py
Hlási: interné odkazy na neexistujúce stránky alebo súbory, kotvy (#id), ktoré na cieľovej stránke
nie sú, titulky nad 60 znakov, popisy mimo 120 až 160 znakov a stránky bez náhľadového obrázka (og:image).
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
