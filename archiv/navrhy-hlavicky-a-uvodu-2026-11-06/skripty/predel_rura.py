"""Úvod K3-A: obrys rúry z renderu a najmenšia vzdialenosť rúry od predelu tmavého pásu.

1. Z alfa kanála web/src/assets/3d/hero/duo.webp vytiahne pre každé percento výšky najľavejší nepriehľadný bod
   (a pre každé percento šírky najnižší) a uloží duo-profil.json (používa ho aj makety uvod3.mjs).
2. Predeľ je kubická Bézierova krivka v jednotkách u (1 % šírky renderu) od päty nahor:
   P0 (0, 0), P1 (9,68; 17,96), P2 (13,71; 37,13), P3 (16,13; 59,88), nad ňou rovno so sklonom 0,1064.
   (Odmerané zo schválenej makety pri 1 600 px: pás 800 × 594 px, render 992 px.)
3. Render leží spodkom čela (83,4 % výšky obrázka) na spodku pásu. Pre každý riadok obrysu a pre štítok
   a body kót vypočíta, o koľko u musí byť ľavý okraj renderu za pätou, aby nič neprekročilo predeľ.
   Výsledok 7,18 u (stred čela, 45 % výšky obrázka) je v Domov.astro ako 7,2 u + 28 px medzery.

Spustenie z koreňa projektu: C:/Python314/python -P -X utf8 archiv/navrhy-hlavicky-a-uvodu-2026-11-06/skripty/predel_rura.py
"""
import json
import os

import numpy as np
from PIL import Image

KOREN = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
RENDER = os.path.join(KOREN, 'web', 'src', 'assets', '3d', 'hero', 'duo.webp')
PROFIL = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'duo-profil.json')

a = np.array(Image.open(RENDER))[:, :, 3]
H, W = a.shape
lavy = []
for yp in range(101):
    xs = np.where(a[min(H - 1, int(H * yp / 100))] > 120)[0]
    lavy.append(round(float(xs.min()) / W * 100, 2) if len(xs) else None)
spodok = []
for xp in range(101):
    ys = np.where(a[:, min(W - 1, int(W * xp / 100))] > 120)[0]
    spodok.append(round(float(ys.max()) / H * 100, 2) if len(ys) else None)
json.dump({'lavy': lavy, 'spodok': spodok, 'pomer': H / W}, open(PROFIL, 'w'))

P = [(0, 0), (9.68, 17.96), (13.71, 37.13), (16.13, 59.88)]


def bez(t, i):
    u = 1 - t
    p = [q[i] for q in P]
    return u * u * u * p[0] + 3 * u * u * t * p[1] + 3 * u * t * t * p[2] + t * t * t * p[3]


def predel(h):
    """x predelu (u) vo výške h (u) nad pätou."""
    if h <= 0:
        return 0.0
    if h >= 59.88:
        return 16.13 + (h - 59.88) * 0.1064
    lo, hi = 0.0, 1.0
    for _ in range(60):
        m = (lo + hi) / 2
        if bez(m, 1) < h:
            lo = m
        else:
            hi = m
    return bez((lo + hi) / 2, 0)


rh = 100 * H / W  # výška renderu v u
dno = 0.834       # spodok čela (podiel výšky obrázka)
riadky = sorted(((predel((dno - yp / 100) * rh) - lx, yp) for yp, lx in enumerate(lavy) if lx is not None and (dno - yp / 100) * rh >= 0), reverse=True)
print('rúra: najviac', round(riadky[0][0], 2), 'u pri', riadky[0][1], '% výšky obrázka')
hb = (dno - 0.3064) * rh  # bod plášťa; štítok nad ním 10,6 u až 17 u
print('štítok plášťa:', round(max(predel(hb + 10.6 + k * 0.64) - 10.63 for k in range(11)), 2), 'u')
print('bod plášťa:', round(predel(hb) - 10.63, 2), 'u + 14 px')
