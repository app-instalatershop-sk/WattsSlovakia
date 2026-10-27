# -*- coding: utf-8 -*-
"""
Parametrický fotorealistický model predizolovaného potrubia Microflex (Blender 5.2 LTS, Cycles).

Skript postaví plášť (dvojstenné vlnité HDPE), izoláciu z PE-X peny a nosné rúry presne podľa
rozmerov z web/src/data/varianty.json a rady.json a vyrenderuje zvolený pohľad s priehľadným
pozadím. Návod a parametre: data/blender/README.md.

Spustenie z koreňa repozitára:
  blender.exe -b --factory-startup -P data/blender/potrubie.py -- \
      --rad microflex-duo-6-bar --obj MD16032C --pohlad studio --out data/_3d/prvy/studio-duo.png

Dohody v kóde:
- rozmery píšeme v milimetroch, do Blendera idú v metroch (MM = 0.001),
- os potrubia je svetová os X, čelo rezu plášťa leží v rovine x = 0, telo ide do záporného X,
- v reze (rovina YZ) používame súradnice v (vodorovne, svetové Y) a w (zvisle, svetové Z),
- všetko je deterministické: žiadna náhoda okrem procedurálnych textúr s pevným semienkom.
"""
import argparse
import json
import math
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector
from mathutils.geometry import delaunay_2d_cdt

MM = 0.001
# verzia geometrie (zapisuje sa do JSON): mení sa, keď sa zmení tvar alebo poloha dielov,
# aby dávky vedeli, ktoré staršie rendre treba obnoviť
GEOMETRIA = "2026-10-26b"


def _cesta_skriptu():
    try:
        return Path(__file__).resolve()
    except NameError:  # pri niektorých spôsoboch spustenia __file__ chýba
        for i, a in enumerate(sys.argv):
            if a in ("-P", "--python") and i + 1 < len(sys.argv):
                return Path(sys.argv[i + 1]).resolve()
    return Path.cwd() / "data" / "blender" / "potrubie.py"


SKRIPT = _cesta_skriptu()
REPO = SKRIPT.parents[2]
DATA = REPO / "web" / "src" / "data"

# ---------------------------------------------------------------------------------------------
# Rozmery plášťa ako podiel vonkajšieho priemeru D. Kalibrované podľa skutočných fotiek (štúdiová
# fotka rodiny potrubí v katalógu s. 6, fotka kotúča): rozstup vĺn 0,07 až 0,10 D, rendery Watts
# majú vlny hrubšie (0,105 až 0,12 D). Presný výkres profilu nemáme, preto sú to odhady (README).
# ---------------------------------------------------------------------------------------------
PLAST = {
    "rozstup_a": 0.0,      # rozstup vĺn P = a + b * D v mm (160 mm -> 12,8 mm; fotka rodiny a kotúča)
    "rozstup_b": 0.080,
    "hrubka": 0.060,       # radiálna hrúbka plášťa od vrcholu vlny po vnútorný povrch / D
    "stena_vnut": 0.0072,  # hrúbka vnútornej hladkej steny / D (asi 0,09 P)
    "stena_vonk": 0.0088,  # hrúbka vonkajšej vlnitej steny / D (asi 0,11 P, makrofotka s. 5)
    "drazka_hore": 0.30,   # šírka drážky v úrovni vrcholov / P (vrchol s rohmi asi 70 % P)
    "drazka_dole": 0.22,   # šírka plochého dna drážky / P (steny takmer zvislé)
    "r_rameno": 0.20,      # polomer zaoblenia rohu vrcholu / P (plochý vrchol, mäkšie rohy)
    "r_dno": 0.06,         # polomer zaoblenia rohu v dne drážky / P
    "r_rez": 0.15,         # mm, zrazenie hrán rezu (ostrá, ale nie dokonalá hrana)
    "zapustenie_peny": 0.006,  # o koľko je čelo peny za rezom plášťa / D
    "nepravidelnost": 0.12,    # mm, náhodná odchýlka polohy stien a výšky jednotlivých vĺn
}

# váha a dosah (mm) podpovrchového rozptylu HDPE. V štúdiu pôsobí plášť nepriehľadne (fotka s. 6),
# presvitanie je len slabé na tenkých hranách; silné len v makre plášťa proti svetlu (fotka s. 5).
PLAST_SSS_STUDIO = (0.25, 1.2)
PLAST_SSS_MAKRO = (1.0, 7.0)
PLAST_SSS = list(PLAST_SSS_STUDIO)
PLAST_HRANA = [0.15]   # o koľko je drsnejšia stena a hrana vlny ako vrchol (mäkký odlesk na hrane)

FARBY = {
    # lineárne RGB (nie sRGB); podľa štúdiovej fotky (katalóg s. 6): plášť ultramarín do fialova
    # (sRGB stred 49, 54, 136), pena neutrálna stredná sivá, PE-Xa citrónová žltá
    "plast": (0.0040, 0.0050, 0.095),   # sýty ultramarín (zóny tieň/stred/svetlo podľa fotky s. 6)
    "pena": (0.072, 0.074, 0.071),
    "pexa_zlta": (0.270, 0.190, 0.000),
    # krémovo biela sanitárna PE-Xa: pri jase štúdia podľa fotky s. 6 (stred sRGB 239/238/229);
    # vyššie albedo by sa prepálilo do čistej bielej a rúra by na bielom pozadí zmizla
    "pexa_biela": (0.310, 0.302, 0.268),
    "pe100": (0.014, 0.015, 0.017),
    "pruh_pe100": (0.004, 0.100, 0.360),
}


# =============================================================================================
# Údaje o výrobku
# =============================================================================================
@dataclass
class Rura:
    d: float              # vonkajší priemer (mm)
    s: float              # hrúbka steny (mm)
    druh: str             # pexa-zlta | pexa-biela | pe100 | kabel
    v: float = 0.0        # poloha stredu v reze, vodorovne (mm)
    w: float = 0.0        # poloha stredu v reze, zvisle (mm)
    presah: float = 0.0   # o koľko vyčnieva pred čelo peny (mm)


def nacitaj_json(meno):
    return json.loads((DATA / meno).read_text(encoding="utf-8"))


def _cislo(t):
    return float(str(t).replace(",", "."))


# vnútorný priemer chráničky HP podľa vonkajšieho (brožúra Microflex 2026; 32 mm dopočítané)
VNUTRO_CHRANICKY = {25: 18.8, 32: 25.0, 40: 32.0}

RE_RURY = re.compile(r"(\d)\s*[x×х]\s*(\d+(?:[.,]\d+)?)\s*[/x×х]\s*(\d+[.,]\d)")


def druh_rury(rad_id, d, s):
    """Materiál nosnej rúry podľa radu a pomeru hrúbky steny (SDR 11 kúrenie, SDR 7,4 sanita)."""
    if "cool" in rad_id:
        return "pe100"
    if rad_id in ("microflex-quadro", "microflex-hp"):
        return "pexa-zlta" if s / d < 0.11 else "pexa-biela"
    if "10-bar" in rad_id:
        return "pexa-biela"
    return "pexa-zlta"


def nacitaj_variant(rad_id, obj):
    rady = {r["id"]: r for r in nacitaj_json("rady.json")}
    if rad_id not in rady:
        raise SystemExit(f"Neznámy rad {rad_id!r}. Známe: {', '.join(k for k in rady if k.startswith('microflex'))}")
    varianty = [v for v in nacitaj_json("varianty.json") if v.get("rad") == rad_id]
    if not varianty:
        raise SystemExit(f"Rad {rad_id} nemá varianty v varianty.json")
    if obj:
        cist = obj.replace(" ", "").upper()
        vyber = [v for v in varianty if v["obj_cislo"].replace(" ", "").upper() == cist]
        if not vyber:
            raise SystemExit(f"Variant {obj} v rade {rad_id} nie je. Sú: {', '.join(v['obj_cislo'] for v in varianty)}")
        variant = vyber[0]
    else:
        variant = varianty[len(varianty) // 2]
    return rady[rad_id], variant


def priemer_z_kodu(kod):
    """Priemer plášťa z objednávacieho čísla, keď v údajoch chýba (napr. MD12532PE -> 125)."""
    cisla = re.sub(r"^M[DQV]?", "", kod.replace(" ", "").upper())
    for D in (200, 160, 125, 90, 75):
        if cisla.startswith(str(D)):
            return float(D)
    raise SystemExit(f"Neviem určiť priemer plášťa variantu {kod}")


def rury_variantu(rad, variant):
    """Zoznam nosných rúr (bez polohy) z údajov variantu."""
    rad_id = rad["id"]
    rury = []
    if variant.get("rura"):
        d, s = float(variant["rura"]["d"]), float(variant["rura"]["s"])
        for _ in range(int(rad.get("pocet_rur") or 1)):
            rury.append(Rura(d, s, druh_rury(rad_id, d, s)))
    else:
        text = variant.get("rura_text") or ""
        for n, d, s in RE_RURY.findall(text):
            d, s = _cislo(d), _cislo(s)
            for _ in range(int(n)):
                rury.append(Rura(d, s, druh_rury(rad_id, d, s)))
    if not rury:
        raise SystemExit(f"Neviem prečítať rozmery rúr variantu {variant.get('obj_cislo')}")
    if rad_id == "microflex-cool-s-vyhrievacim-kablom":
        rury.append(Rura(8.0, 3.7, "kabel"))           # samoregulačný vykurovací kábel pri rúre
    if rad_id == "microflex-hp":
        # dve vlnité chráničky na silový a dátový kábel (brožúra 2026: vonkajší/vnútorný priemer
        # od 25/18,8 do 40/32 mm). Rozmer berieme z objednávacieho čísla: MQ16032C3225E = chráničky
        # 32 a 25 mm, MQ16040C32E = dve po 32 mm (výklad čísla je odhad, v tabuľke nie je)
        m = re.search(r"C(\d{2})(\d{2})?E$", variant["obj_cislo"].replace(" ", "").upper())
        rozmery = [float(m.group(1)), float(m.group(2) or m.group(1))] if m else [rury[0].d] * 2
        for dc in rozmery:
            rury.append(Rura(dc, 0.5 * (dc - VNUTRO_CHRANICKY.get(int(dc), 0.78 * dc)), "chranicka"))
    return rury


def rozmiestni_rury(rad_id, vsetky, r_pena):
    """Poloha rúr v reze ako na renderoch Watts. Rúry sa nesmú dotýkať plášťa ani seba.
    Kábel (COOL s vyhrievacím káblom) leží tesne pri rúre vpravo hore."""
    rury = [r for r in vsetky if r.druh != "kabel"]
    kable = [r for r in vsetky if r.druh == "kabel"]
    n = len(rury)
    if n == 1:
        rury[0].v = rury[0].w = 0.0
    elif n == 2:
        a, b = rury
        medzera = max(5.0, 0.25 * 0.5 * (a.d + b.d))
        dist = 0.5 * (a.d + b.d) + medzera
        # väčšia rúra hore; stred dvojice v strede peny
        a.w, b.w = dist * b.d / (a.d + b.d), -dist * a.d / (a.d + b.d)
        a.v = b.v = 0.0
    else:
        # štyri rúry do štvorca: kúrenie na jednej uhlopriečke, sanita na druhej
        zlte = [r for r in rury if r.druh == "pexa-zlta"]
        ine = [r for r in rury if r.druh != "pexa-zlta"]
        poradie = []
        for i in range(max(len(zlte), len(ine))):
            if i < len(zlte):
                poradie.append(zlte[i])
            if i < len(ine):
                poradie.append(ine[i])
        rury[:] = poradie
        medzera = max(4.0, 0.18 * sum(r.d for r in rury) / len(rury))
        rho = 0.0
        for i in range(len(rury)):
            a, b = rury[i], rury[(i + 1) % len(rury)]
            rho = max(rho, (0.5 * (a.d + b.d) + medzera) / math.sqrt(2.0))
        for i, r in enumerate(rury):
            uhol = math.radians(45 + 90 * i)
            r.v, r.w = rho * math.cos(uhol), rho * math.sin(uhol)
    # kontrola: rúra musí byť celá v pene s rezervou aspoň 2 mm, inak zmenši rozostup
    presah = max(math.hypot(r.v, r.w) + r.d / 2 - (r_pena - 2.0) for r in rury)
    if presah > 0:
        for r in rury:
            rr = math.hypot(r.v, r.w)
            if rr > 1e-6:
                k = max(0.0, rr - presah) / rr
                r.v, r.w = r.v * k, r.w * k
        print(f"Pozor: rúry by presahovali penu o {presah:.1f} mm, rozostup zmenšený")
    for kb in kable:
        hl = rury[0]
        uhol = math.radians(55.0)
        rr = hl.d / 2 + kb.d / 2 + 0.6
        kb.v, kb.w = hl.v + rr * math.cos(uhol), hl.w + rr * math.sin(uhol)
    vsetky[:] = rury + kable
    return vsetky


# =============================================================================================
# Geometria
# =============================================================================================
def zaobli(body, polomery, krok_deg=5.0, uzavrety=True):
    """Lomená čiara so zaoblenými rohmi (kružnicový oblúk v každom rohu).

    body: [(x, r)] v mm, polomery: polomer zaoblenia pre každý bod (0 = ostrý roh).
    krok_deg: krok oblúka v stupňoch, jedno číslo alebo zoznam pre každý bod (vzdialené vlny
    v perspektíve môžu mať hrubší oblúk). Ak sa susedné zaoblenia nezmestia, polomer sa zmenší.
    Vracia pole (n, 2)."""
    P = [np.asarray(p, float) for p in body]
    n = len(P)
    kroky = list(krok_deg) if isinstance(krok_deg, (list, tuple, np.ndarray)) else [krok_deg] * n
    out = []
    for i in range(n):
        p1 = P[i]
        if not uzavrety and (i == 0 or i == n - 1):
            out.append(p1)
            continue
        p0, p2 = P[i - 1], P[(i + 1) % n]
        r = float(polomery[i])
        u1 = p0 - p1
        l1 = float(np.linalg.norm(u1))
        u2 = p2 - p1
        l2 = float(np.linalg.norm(u2))
        if r <= 0 or l1 < 1e-9 or l2 < 1e-9:
            out.append(p1)
            continue
        u1 /= l1
        u2 /= l2
        uhol = math.acos(float(np.clip(u1 @ u2, -1.0, 1.0)))
        if uhol > math.pi - 1e-4:
            out.append(p1)
            continue
        pol = uhol / 2.0
        t = r / math.tan(pol)
        tmax = 0.5 * min(l1, l2) * 0.999
        if t > tmax:
            t = tmax
            r = t * math.tan(pol)
        a = p1 + u1 * t
        b = p1 + u2 * t
        osa = u1 + u2
        osa /= np.linalg.norm(osa)
        c = p1 + osa * (r / math.sin(pol))
        a0 = math.atan2(a[1] - c[1], a[0] - c[0])
        a1 = math.atan2(b[1] - c[1], b[0] - c[0])
        da = a1 - a0
        while da > math.pi:
            da -= 2 * math.pi
        while da < -math.pi:
            da += 2 * math.pi
        k = max(2, int(math.ceil(abs(math.degrees(da)) / kroky[i])))
        for j in range(k + 1):
            th = a0 + da * j / k
            out.append(c + r * np.array([math.cos(th), math.sin(th)]))
    out = np.array(out)
    # odstráň duplicitné susedné body
    keep = [0]
    for i in range(1, len(out)):
        if np.linalg.norm(out[i] - out[keep[-1]]) > 1e-6:
            keep.append(i)
    if uzavrety and len(keep) > 1 and np.linalg.norm(out[keep[-1]] - out[keep[0]]) < 1e-6:
        keep.pop()
    return out[keep]


def plocha_profilu(P):
    x, y = P[:, 0], P[:, 1]
    return 0.5 * float(np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y))


def mesh_z_poli(meno, V, F, mat_idx=None, hladke=True):
    """Rýchla tvorba mriežky z numpy polí. V v metroch; F je pole n-uholníkov rovnakej veľkosti
    alebo zoznam takých polí (napr. štvoruholníky a trojuholníky spolu)."""
    V = np.ascontiguousarray(V, dtype=np.float32)
    casti = F if isinstance(F, (list, tuple)) else [F]
    casti = [np.ascontiguousarray(f, dtype=np.int32) for f in casti if len(f)]
    slucky = np.concatenate([f.ravel() for f in casti])
    velkosti = np.concatenate([np.full(len(f), f.shape[1], np.int32) for f in casti])
    zaciatky = np.concatenate([[0], np.cumsum(velkosti)[:-1]]).astype(np.int32)
    me = bpy.data.meshes.new(meno)
    me.vertices.add(len(V))
    me.vertices.foreach_set("co", V.ravel())
    me.loops.add(len(slucky))
    me.loops.foreach_set("vertex_index", slucky)
    me.polygons.add(len(velkosti))
    me.polygons.foreach_set("loop_start", zaciatky)
    F = velkosti
    if mat_idx is not None:
        me.polygons.foreach_set("material_index", np.ascontiguousarray(mat_idx, dtype=np.int32))
    me.update(calc_edges=True)
    if hladke:
        me.polygons.foreach_set("use_smooth", np.ones(len(F), dtype=bool))
    me.update()
    return me


def rotacne_teleso(meno, profil, segmenty, uzavrety=True, mat_hrany=None):
    """Plocha vzniknutá otočením profilu (x, r) v mm okolo osi X.

    Pri uzavretom profile musí byť materiál vľavo od smeru obchádzania (kladná plocha), potom
    normály smerujú von. mat_hrany: index materiálu pre každú hranu profilu."""
    return mesh_z_poli(meno, *rotacne_polia(profil, segmenty, uzavrety, mat_hrany))


def spoj_polia(*casti):
    """Spojí viac (V, F, mat) do jednej mriežky (napr. plášť, dutiny komôr, rezné plochy).
    Plochy rôznej veľkosti ostanú v zozname po skupinách; poradie materiálov sedí s poradím plôch."""
    Vs, skupiny, posun = [], {}, 0
    for V, F, M in casti:
        Vs.append(V)
        k = F.shape[1]
        f, m = skupiny.setdefault(k, ([], []))
        f.append(F + posun)
        m.append(M if M is not None else np.zeros(len(F), np.int32))
        posun += len(V)
    Fs = [np.concatenate(f) for f, _ in skupiny.values()]
    Ms = np.concatenate([np.concatenate(m) for _, m in skupiny.values()])
    return np.concatenate(Vs), Fs, Ms


def rotacne_polia(profil, segmenty, uzavrety=True, mat_hrany=None, uhly=None):
    """Polia (V, F, materiál) rotačnej plochy. uhly=(od, do) v radiánoch: len časť obvodu."""
    P = np.asarray(profil, float)
    n = len(P)
    if uhly is not None:
        phi = np.linspace(uhly[0], uhly[1], segmenty + 1)
    else:
        phi = np.linspace(0.0, 2.0 * math.pi, segmenty, endpoint=False)
    c, s = np.cos(phi), np.sin(phi)
    X = np.repeat(P[:, 0], len(phi))
    Y = (P[:, 1:2] * c[None, :]).ravel()
    Z = (P[:, 1:2] * s[None, :]).ravel()
    V = np.stack([X, Y, Z], 1) * MM
    nh = n if uzavrety else n - 1
    ns = len(phi)
    J, I = np.meshgrid(np.arange(nh), np.arange(segmenty), indexing="ij")
    J1 = (J + 1) % n
    I1 = (I + 1) % ns
    a = J * ns + I
    b = J * ns + I1
    cc = J1 * ns + I1
    d = J1 * ns + I
    F = np.stack([a, d, cc, b], -1).reshape(-1, 4)
    mi = None
    if mat_hrany is not None:
        mi = np.repeat(np.asarray(mat_hrany[:nh], dtype=np.int32), segmenty)
    return V, F, mi


def vnutri_polygonu(body, poly):
    """Ktoré body (m, 2) ležia vo vnútri polygónu (n, 2): párno-nepárne pravidlo, vektorovo."""
    x, y = body[:, 0:1], body[:, 1:2]
    x0, y0 = poly[:, 0][None, :], poly[:, 1][None, :]
    x1, y1 = np.roll(poly[:, 0], -1)[None, :], np.roll(poly[:, 1], -1)[None, :]
    krizi = ((y0 > y) != (y1 > y)) & (x < (x1 - x0) * (y - y0) / np.where(y1 - y0 == 0, 1e-12, y1 - y0) + x0)
    return (krizi.sum(1) % 2) == 1


def viecko_prierezu(profil, diery, uhol, hustota=1.0):
    """Rovinná rezná plocha polovičného plášťa pod uhlom 'uhol': profil steny (x, r) bez dutín
    komôr, triangulovaný (CDT). Normála smeruje do odrezanej polovice (k divákovi)."""
    obrys = np.asarray(profil, float)
    body = [tuple(b) for b in obrys]
    hrany = [(i, (i + 1) % len(obrys)) for i in range(len(obrys))]
    for d in diery:
        z = len(body)
        body += [tuple(b) for b in d]
        hrany += [(z + i, z + (i + 1) % len(d)) for i in range(len(d))]
    # vnútorné body na mriežke, nech sú trojuholníky pekné
    xmin, xmax = obrys[:, 0].min(), obrys[:, 0].max()
    rmin, rmax = obrys[:, 1].min(), obrys[:, 1].max()
    gx, gr = np.meshgrid(np.arange(xmin, xmax, hustota), np.arange(rmin, rmax, hustota))
    g = np.column_stack([gx.ravel(), gr.ravel()])
    g = g[vnutri_polygonu(g, obrys)]
    for d in diery:
        g = g[~vnutri_polygonu(g, np.asarray(d))]
    body += [tuple(b) for b in g]
    vs, es, fs, _, _, _ = delaunay_2d_cdt([Vector(b) for b in body], hrany, [], 0, 1e-7, False)
    V2 = np.array([(v.x, v.y) for v in vs])
    F = np.array([f for f in fs if len(f) == 3])
    stred = V2[F].mean(1)
    ok = vnutri_polygonu(stred, obrys)
    for d in diery:
        ok &= ~vnutri_polygonu(stred, np.asarray(d))
    F = F[ok]
    V = np.column_stack([V2[:, 0], V2[:, 1] * math.cos(uhol), V2[:, 1] * math.sin(uhol)]) * MM
    # normála k divákovi: pri uhle 90° je to +Y, pri 270° tiež +Y (odrezaná je polovica y > 0)
    n = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    F[n[:, 1] < 0] = F[n[:, 1] < 0][:, [0, 2, 1]]
    return V, F, np.ones(len(F), np.int32)


def profil_plasta(D, L_ziad, krok_deg=5.0, prm=PLAST, krok_daleko=None, rebra_blizko=None):
    """Uzavretý profil plášťa (x, r) v mm: rez, vlny ako ploché skrinky, zadný rez, vnútorná stena.

    Ako na skutočnej fotke rezu: plášť je prerezaný v drážke (rez je tenký, vnútorná a vonkajšia
    stena sú tam zrastené), široký modrý „prstenec“ okolo peny je predná stena prvej vlny. Drážka
    k leží v x = -k * P, vrchol vlny k medzi drážkami k a k + 1. Vracia (profil, materiál hrán,
    dĺžka, rozmery)."""
    R = D / 2.0
    P = prm["rozstup_a"] + prm["rozstup_b"] * D
    T = prm["hrubka"] * D
    ti = prm["stena_vnut"] * D
    to = prm["stena_vonk"] * D
    r_i = R - T
    rv = r_i + ti + to
    gt = prm["drazka_hore"] * P
    gb = prm["drazka_dole"] * P
    rs = prm["r_rameno"] * P
    rb = prm["r_dno"] * P
    rr = prm["r_rez"]
    n = max(2, int(round(L_ziad / P)))
    L = n * P
    body, pol = [], []

    def b(x, r, z):
        body.append((x, r))
        pol.append(z)

    rng = np.random.default_rng(1234)
    nep = prm.get("nepravidelnost", 0.0)
    kroky = []                                         # krok oblúka pre každý bod profilu

    def kr(k):
        return krok_daleko if (krok_daleko and rebra_blizko is not None and k >= rebra_blizko) else krok_deg

    # predný rez v strede drážky: tenká rezná plocha od vnútornej steny po dno drážky
    b(0.0, r_i, rr)
    b(0.0, rv, rr)
    kroky += [krok_deg, krok_deg]
    for k in range(n):
        kroky += [kr(k)] * 4
        xg = -k * P                                     # stred drážky k
        dx = nep * rng.uniform(-1, 1) if 0 < k < n else 0.0
        dR = nep * rng.uniform(-1, 1) if k < n - 1 else 0.0
        # zadná stena drážky k = predná stena vrcholu k
        b(xg - 0.5 * gb + dx, rv, rb)
        b(xg - 0.5 * gt + dx, R + dR, rs)
        # predná stena drážky k + 1 = zadná stena vrcholu k
        dx2 = nep * rng.uniform(-1, 1) if k + 1 < n else 0.0
        b(xg - P + 0.5 * gt + dx2, R + dR, rs)
        b(xg - P + 0.5 * gb + dx2, rv, rb)
    # zadný rez v strede poslednej drážky
    b(-L, rv, rr)
    b(-L, r_i, rr)
    kroky += [kr(n), kr(n)]
    prof = zaobli(body, pol, krok_deg=kroky)
    if plocha_profilu(prof) < 0:
        prof = prof[::-1].copy()
    # materiál: 1 = rezné plochy (len zvislé úseky na samom začiatku a konci), 0 = povrch plášťa
    mat = []
    for i in range(len(prof)):
        p0, p1 = prof[i], prof[(i + 1) % len(prof)]
        dx, dr = p1[0] - p0[0], p1[1] - p0[1]
        xmin, xmax = min(p0[0], p1[0]), max(p0[0], p1[0])
        rmax = max(p0[1], p1[1])
        celo = abs(dr) > abs(dx) and rmax <= rv + 1e-6 and (xmin > -rr - 1e-6 or xmax < -L + rr + 1e-6)
        mat.append(1 if celo else 0)
    rozm = dict(R=R, P=P, T=T, r_i=r_i, rv=rv, ti=ti, to=to, L=L, e=0.0, rf=rr, gt=gt, gb=gb, rs=rs, rb=rb, n=n)
    return prof, mat, L, rozm


def otrep_mesh(rz, segmenty, seed=7):
    """Otrep po píle na vnútornej hrane čelného prstenca (fotka rezu DUO): tenký lem, ktorý
    vybieha k osi o 0 až 0,7 mm, miestami chýba. Hladký šum po obvode, pevné semienko."""
    r_i, e = rz["r_i"], rz["e"]
    rng = np.random.default_rng(seed)
    n = int(segmenty)
    phi = np.linspace(0.0, 2 * math.pi, n, endpoint=False)
    # hladký náhodný priebeh po obvode: súčet niekoľkých harmonických s náhodnou fázou
    sig = np.zeros(n)
    for f in (3, 7, 13, 29, 61, 113):
        sig += rng.uniform(0.4, 1.0) / math.sqrt(f) * np.sin(f * phi + rng.uniform(0, 2 * math.pi))
    sig = (sig - sig.min()) / (sig.max() - sig.min())
    dlzka = np.clip((sig - 0.35) / 0.65, 0.0, 1.0) ** 1.5 * 0.7      # mm, kde je sig malé, otrep chýba
    if dlzka.max() <= 0:
        return None
    r_von = np.full(n, r_i + 0.15)
    r_dnu = r_i + 0.15 - 0.2 - dlzka
    x_von = np.full(n, e - 0.12)
    x_dnu = e - 0.12 + 0.25 * dlzka                                  # vlákno sa mierne ohýba dopredu
    V = np.concatenate([np.column_stack([x_von, r_von * np.cos(phi), r_von * np.sin(phi)]),
                        np.column_stack([x_dnu, r_dnu * np.cos(phi), r_dnu * np.sin(phi)])]) * MM
    i = np.arange(n)
    i1 = (i + 1) % n
    F = np.stack([i, i1, n + i1, n + i], -1)
    F = F[(dlzka > 0.02) | (dlzka[i1] > 0.02)]
    return mesh_z_poli("otrep", V, F)


def profily_komor(rz, krok_deg=5.0):
    """Uzavreté dutiny (komory) dvojstenného plášťa: vo vnútri každého vrcholu vlny je dutina
    medzi vonkajšou vlnitou stenou (hrúbka to) a vnútornou hladkou stenou (hrúbka ti), ako na
    makrofotke v katalógu (s. 5). Profily idú v smere hodín (dutina = materiál zvonka)."""
    R, P, r_i, ti, to, rv = rz["R"], rz["P"], rz["r_i"], rz["ti"], rz["to"], rz["rv"]
    gt, gb, rs = rz["gt"], rz["gb"], rz["rs"]
    tg = 0.5 * (gt - gb) / (R - rv)          # sklon steny vlny (dx / dr)
    cos_a = 1.0 / math.sqrt(1.0 + tg * tg)
    dno = r_i + ti
    hore = R - to
    out = []
    for k in range(rz["n"]):
        xg = -k * P
        # predná stena dutiny: rovnobežne so stenou vlny, posunutá o hrúbku to dovnútra vrcholu
        def x_pred(r):
            return xg - 0.5 * gb - (r - rv) * tg - to / cos_a

        def x_zad(r):
            return xg - P + 0.5 * gb + (r - rv) * tg + to / cos_a

        body = [(x_pred(dno), dno), (x_pred(hore), hore), (x_zad(hore), hore), (x_zad(dno), dno)]
        r_h = max(0.35, min(rs - to, 0.3 * (hore - dno)))
        pol = [0.5, r_h, r_h, 0.5]
        prof = zaobli(body, pol, krok_deg=krok_deg)
        if plocha_profilu(prof) > 0:
            prof = prof[::-1].copy()
        out.append(prof)
    return out


def profil_rury(d, s, x_pred, x_zad, krok_deg=6.0, druh="pexa-zlta"):
    """Uzavretý profil nosnej rúry (x, r) s jemne zrazenými hranami rezu.
    Kábel má zaoblený koniec, chránička vlnitý vonkajší povrch a hladkú vložku."""
    ro, ri = d / 2.0, d / 2.0 - s
    fo = min(0.45, 0.12 * s)
    fi = min(0.30, 0.08 * s)
    if druh == "kabel":
        ri, fo = 0.3, 0.35 * ro
    if druh == "chranicka":
        pc, hc = max(3.0, 0.22 * d), max(1.2, 0.07 * d)
        ri = ro - max(s, hc + 0.8)                  # vnútorná hladká vložka (priemer podľa brožúry)
        body, pol = [(x_pred, ri), (x_pred, ro)], [0.2, 0.3]
        n = int((x_pred - x_zad) / pc)
        for k in range(n):
            u = x_pred - k * pc
            body += [(u - 0.30 * pc, ro), (u - 0.40 * pc, ro - hc), (u - 0.90 * pc, ro - hc), (u - pc, ro)]
            pol += [0.18 * pc, 0.12 * pc, 0.12 * pc, 0.18 * pc]
        xz = x_pred - n * pc
        body += [(xz, ri)]
        pol += [0.2]
        body = [body[0]] + body[1:]
        prof = zaobli(body, pol, krok_deg=krok_deg)
        if plocha_profilu(prof) < 0:
            prof = prof[::-1].copy()
        mat = []
        for i in range(len(prof)):
            p0, p1 = prof[i], prof[(i + 1) % len(prof)]
            rm = 0.5 * (p0[1] + p1[1])
            celo = abs(p1[1] - p0[1]) > abs(p1[0] - p0[0]) and (min(p0[0], p1[0]) > x_pred - 0.25 or max(p0[0], p1[0]) < xz + 0.25)
            mat.append(2 if celo else (1 if rm < ri + 0.3 else 0))
        return prof, mat
    body = [(x_pred, ri), (x_pred, ro), (x_zad, ro), (x_zad, ri)]
    pol = [fi, fo, 0.2, 0.2]
    prof = zaobli(body, pol, krok_deg=krok_deg)
    if plocha_profilu(prof) < 0:
        prof = prof[::-1].copy()
    mat = []
    for i in range(len(prof)):
        p0, p1 = prof[i], prof[(i + 1) % len(prof)]
        dx, dr = p1[0] - p0[0], p1[1] - p0[1]
        if abs(dr) > abs(dx):
            mat.append(2)                     # rez
        elif 0.5 * (p0[1] + p1[1]) > 0.5 * (ri + ro):
            mat.append(0)                     # vonkajší povrch
        else:
            mat.append(1)                     # vnútorný povrch
    return prof, mat


def celo_peny_mesh(meno, r_von, diery, x, hustota=3.0, krok_okraja=0.6):
    """Rovinné čelo peny (medzikružie s dierami pre rúry) ako pravidelná triangulácia (CDT).

    diery: [(v, w, r)] v mm. Vnútorné body na šesťuholníkovej mriežke dávajú trojuholníky
    podobnej veľkosti, čo potrebuje adaptívne delenie s posunutím (displacement)."""
    body, hrany = [], []

    def kruh(cv, cw, r, krok):
        n = max(48, int(math.ceil(2 * math.pi * r / krok)))
        z = len(body)
        for k in range(n):
            a = 2 * math.pi * k / n
            body.append((cv + r * math.cos(a), cw + r * math.sin(a)))
        for k in range(n):
            hrany.append((z + k, z + (k + 1) % n))

    kruh(0.0, 0.0, r_von, krok_okraja)
    for (cv, cw, r) in diery:
        kruh(cv, cw, r, krok_okraja * 0.7)
    h = hustota
    okraj = 0.6 * h
    ny = int(2 * r_von / (h * 0.866)) + 2
    for iy in range(-ny // 2, ny // 2 + 1):
        wv = iy * h * 0.866
        posun = 0.5 * h if iy % 2 else 0.0
        nx = int(2 * r_von / h) + 2
        for ix in range(-nx // 2, nx // 2 + 1):
            vv = ix * h + posun
            if math.hypot(vv, wv) > r_von - okraj:
                continue
            if any(math.hypot(vv - cv, wv - cw) < r + okraj for (cv, cw, r) in diery):
                continue
            body.append((vv, wv))
    vs, es, fs, _, _, _ = delaunay_2d_cdt([Vector(p) for p in body], hrany, [], 0, 1e-7, False)
    V2 = np.array([(p.x, p.y) for p in vs])
    tri = []
    for f in fs:
        if len(f) != 3:
            continue
        cxy = V2[list(f)].mean(0)
        if math.hypot(*cxy) > r_von:
            continue
        if any(math.hypot(cxy[0] - cv, cxy[1] - cw) < r for (cv, cw, r) in diery):
            continue
        tri.append(f)
    F = np.array(tri, dtype=np.int64)
    # orientácia: normála +X (v, w) -> (Y, Z), proti smeru hodín v rovine YZ
    a, b2, c2 = V2[F[:, 0]], V2[F[:, 1]], V2[F[:, 2]]
    cross = (b2[:, 0] - a[:, 0]) * (c2[:, 1] - a[:, 1]) - (b2[:, 1] - a[:, 1]) * (c2[:, 0] - a[:, 0])
    F[cross < 0] = F[cross < 0][:, [0, 2, 1]]
    V = np.column_stack([np.full(len(V2), x), V2[:, 0], V2[:, 1]]) * MM
    return mesh_z_poli(meno, V, F, hladke=False)


# =============================================================================================
# Materiály (procedurálne uzly, žiadne cudzie textúry)
# =============================================================================================
class Uzly:
    """Pomocník na stavbu uzlov shaderov: vstupy môžu byť čísla, n-tice aj výstupy iných uzlov."""

    def __init__(self, strom):
        self.nt = strom
        self.nt.nodes.clear()

    def _vstup(self, sock, hodnota):
        if hodnota is None:
            return
        if isinstance(hodnota, bpy.types.NodeSocket):
            self.nt.links.new(hodnota, sock)
        else:
            sock.default_value = hodnota

    def uzol(self, typ, vstupy=None, **vlastnosti):
        n = self.nt.nodes.new(typ)
        for k, v in vlastnosti.items():
            setattr(n, k, v)
        for k, v in (vstupy or {}).items():
            self._vstup(n.inputs[k], v)
        return n

    def math(self, op, a, b=None, c=None, clamp=False):
        n = self.uzol("ShaderNodeMath", operation=op, use_clamp=clamp)
        self._vstup(n.inputs[0], a)
        if b is not None:
            self._vstup(n.inputs[1], b)
        if c is not None:
            self._vstup(n.inputs[2], c)
        return n.outputs[0]

    def rozsah(self, x, a, b, c=0.0, d=1.0, interp="LINEAR", clamp=True):
        n = self.uzol("ShaderNodeMapRange", interpolation_type=interp, clamp=clamp)
        self._vstup(n.inputs["Value"], x)
        n.inputs["From Min"].default_value = a
        n.inputs["From Max"].default_value = b
        n.inputs["To Min"].default_value = c
        n.inputs["To Max"].default_value = d
        return n.outputs["Result"]

    def mix_farba(self, f, a, b):
        n = self.uzol("ShaderNodeMix", data_type="RGBA")
        self._vstup(n.inputs[0], f)  # Factor (float) je vždy prvý vstup
        sa = next(s for s in n.inputs if s.identifier == "A_Color")
        sb = next(s for s in n.inputs if s.identifier == "B_Color")
        self._vstup(sa, a)
        self._vstup(sb, b)
        return next(s for s in n.outputs if s.type == "RGBA")

    def vmath(self, op, a, b=None, scale=None):
        n = self.uzol("ShaderNodeVectorMath", operation=op)
        self._vstup(n.inputs[0], a)
        if b is not None:
            self._vstup(n.inputs[1], b)
        if scale is not None:
            n.inputs["Scale"].default_value = scale
        return n.outputs["Vector"] if op not in ("LENGTH", "DOT_PRODUCT", "DISTANCE") else n.outputs["Value"]

    def mm(self):
        """Súradnice objektu v milimetroch."""
        tc = self.uzol("ShaderNodeTexCoord")
        return self.vmath("SCALE", tc.outputs["Object"], scale=1000.0)

    def sum(self, vec, mierka, detail=2.0, drsnost=0.5, w=None, dim="3D"):
        n = self.uzol("ShaderNodeTexNoise", {"Vector": vec, "Scale": mierka, "Detail": detail, "Roughness": drsnost},
                      noise_dimensions=dim)
        return n.outputs["Factor"]

    def vystup(self, bsdf, posun=None):
        out = self.uzol("ShaderNodeOutputMaterial")
        self.nt.links.new(bsdf, out.inputs["Surface"])
        if posun is not None:
            self.nt.links.new(posun, out.inputs["Displacement"])
        return out


def novy_material(meno):
    m = bpy.data.materials.new(meno)
    if m.node_tree is None:
        try:
            m.use_nodes = True
        except Exception:
            pass
    return m, Uzly(m.node_tree)


def principled(u, **kw):
    mapa = {
        "farba": "Base Color", "drsnost": "Roughness", "ior": "IOR", "normala": "Normal",
        "sss": "Subsurface Weight", "sss_polomer": "Subsurface Radius", "sss_mierka": "Subsurface Scale",
        "spek": "Specular IOR Level", "coat": "Coat Weight", "coat_drsnost": "Coat Roughness",
        "sheen": "Sheen Weight", "sheen_drsnost": "Sheen Roughness", "coat_normala": "Coat Normal",
        "sheen_farba": "Sheen Tint", "prenos": "Transmission Weight", "aniz": "Anisotropic",
        "aniz_rot": "Anisotropic Rotation", "tangenta": "Tangent",
    }
    vstupy = {}
    for k, v in kw.items():
        if isinstance(v, tuple) and len(v) == 3 and mapa[k] in ("Base Color", "Sheen Tint", "Coat Tint"):
            v = (*v, 1.0)
        vstupy[mapa[k]] = v
    n = u.uzol("ShaderNodeBsdfPrincipled", vstupy)
    try:
        n.subsurface_method = "RANDOM_WALK"     # presnejšie pre plasty než predvolený "skin"
    except Exception:  # noqa: BLE001
        pass
    return n.outputs["BSDF"]


def smer_po_obvode(u, p):
    """Jednotkový smer od osi X v rovine YZ (y/r, z/r): spojitý po celom obvode, bez švu."""
    sep = u.uzol("ShaderNodeSeparateXYZ", {"Vector": p})
    r = u.math("SQRT", u.math("ADD", u.math("MULTIPLY", sep.outputs["Y"], sep.outputs["Y"]),
                              u.math("MULTIPLY", sep.outputs["Z"], sep.outputs["Z"])))
    r = u.math("MAXIMUM", r, 1e-4)
    return sep, r, u.math("DIVIDE", sep.outputs["Y"], r), u.math("DIVIDE", sep.outputs["Z"], r)


def stopy_pily(u, p, rozstup=0.35, smer=(0.0, 0.8, 0.6), sila=1.0):
    """Jemné rovnobežné stopy po píle na reznej ploche (výška 0..1), mierne zvlnené šumom."""
    d = u.vmath("DOT_PRODUCT", p, smer)
    sum_ = u.sum(p, 0.35, detail=3.0, drsnost=0.5)
    faza = u.math("ADD", u.math("DIVIDE", d, rozstup), u.math("MULTIPLY", sum_, 3.0))
    vlny = u.math("ADD", 0.5, u.math("MULTIPLY", u.math("SINE", u.math("MULTIPLY", faza, 2 * math.pi)), 0.5))
    jemny = u.sum(p, 3.0, detail=4.0, drsnost=0.6)
    return u.math("ADD", u.math("MULTIPLY", vlny, 0.65 * sila), u.math("MULTIPLY", jemny, 0.35))


def mat_plast(rez=False):
    """HDPE plášť podľa skutočných fotiek (katalóg s. 5 a 6): sýty ultramarín, vrcholy vĺn hladké
    z formy (drsnosť 0,2 až 0,28) s jemnými stopami po nástroji po obvode a slabou pomarančovou
    kôrou, ktoré lámu odlesky; materiál presvitá (náhodná prechádzka, rozptyl posunutý do tyrkysovej:
    tenké steny proti svetlu svietia). Rez je zdrsnený pílou: svetlejší, matný, jemné stopy."""
    m, u = novy_material("plast_rez" if rez else "plast")
    p = u.mm()
    sep, r, cy, cz = smer_po_obvode(u, p)
    hruby = u.sum(p, 0.04, detail=2.0)
    if rez:
        vyska = stopy_pily(u, p, rozstup=0.30, smer=(0.0, 0.83, 0.55))
        bump = u.uzol("ShaderNodeBump", {"Strength": 0.40, "Distance": 0.00003, "Height": vyska}).outputs["Normal"]
        drs = u.rozsah(hruby, 0.3, 0.7, 0.55, 0.68)
    else:
        # stopy po nástroji po obvode: šum rýchly pozdĺž osi, pomalý po obvode (y/r, z/r bez švu)
        v = u.uzol("ShaderNodeCombineXYZ", {"X": u.math("MULTIPLY", sep.outputs["X"], 6.0),
                                             "Y": u.math("MULTIPLY", cy, 7.0), "Z": u.math("MULTIPLY", cz, 7.0)}).outputs[0]
        stopy = u.sum(v, 1.0, detail=7.0, drsnost=0.6)
        stopy_ostre = u.rozsah(stopy, 0.52, 0.62, 0.0, 1.0, interp="SMOOTHSTEP")   # tu a tam ryha
        kora = u.sum(p, 1.6, detail=3.0, drsnost=0.5)
        vyska = u.math("ADD", u.math("MULTIPLY", stopy, 0.45), u.math("MULTIPLY", kora, 0.35))
        vyska = u.math("ADD", vyska, u.math("MULTIPLY", stopy_ostre, 0.20))
        bump = u.uzol("ShaderNodeBump", {"Strength": 0.18, "Distance": 0.00002, "Height": vyska}).outputs["Normal"]
        # pomalé zvlnenie normál (vlny nie sú dokonale kruhové): odlesky sa od vlny k vlne mierne líšia
        vlnenie = u.sum(p, 0.035, detail=2.0, drsnost=0.5)
        bump = u.uzol("ShaderNodeBump", {"Strength": 0.25, "Distance": 0.0006, "Height": vlnenie,
                                         "Normal": bump}).outputs["Normal"]
        po_vlnach = u.sum(u.vmath("MULTIPLY", p, (1.0, 0.15, 0.15)), 0.09, detail=1.0)
        drs = u.math("ADD", u.rozsah(hruby, 0.3, 0.7, 0.20, 0.28), u.math("MULTIPLY", stopy_ostre, 0.10))
        drs = u.math("ADD", drs, u.rozsah(po_vlnach, 0.3, 0.7, -0.04, 0.08))
        # hrany a steny vĺn sú drsnejšie ako vrchol z formy: odlesk na hrane je mäkký a široký,
        # nie tenká svetlá čiara na každom rozhraní vĺn
        geo = u.uzol("ShaderNodeNewGeometry")
        nx = u.math("ABSOLUTE", u.uzol("ShaderNodeSeparateXYZ", {"Vector": geo.outputs["Normal"]}).outputs["X"])
        drs = u.math("ADD", drs, u.rozsah(nx, 0.15, 0.85, 0.0, PLAST_HRANA[0], interp="SMOOTHSTEP"))
    # rez pílou je zdrsnený a rozptyľuje svetlo: svetlejší, mierne zamatový (obe skutočné fotky)
    zak = tuple(c * 2.0 + 0.012 for c in FARBY["plast"]) if rez else FARBY["plast"]
    farba = u.mix_farba(u.rozsah(hruby, 0.2, 0.8, 0.0, 1.0), (*[c * 1.04 for c in zak], 1.0),
                        (*[c * 0.95 for c in zak], 1.0))
    bsdf = principled(u, farba=farba, drsnost=drs, ior=1.53, spek=0.50, normala=bump,
                      sss=PLAST_SSS[0], sss_polomer=(0.10, 0.90, 1.0), sss_mierka=PLAST_SSS[1] * MM,
                      sheen=0.35 if rez else 0.0, sheen_drsnost=0.4, sheen_farba=(0.55, 0.65, 1.0))
    u.vystup(bsdf)
    return m


def mat_pena_celo(prm=None):
    """Rezná plocha PE-X peny so skutočným posunutím povrchu (adaptívne delenie).

    styl "bunky" (predvolený): prerezané uzavreté bunky, teda jamky rôznej veľkosti a hĺbky
    oddelené oblými svetlými stenami, ako na renderoch UNO sanita a QUADRO.
    styl "zrna": svetlé oblé zrná s tmavými medzerami, ako na renderi DUO kúrenie.
    V oboch štýloch sú občas hlboké tmavé póry. Farba tmavne v hĺbke."""
    prm = prm or {}
    styl = prm.get("styl", "jemna")
    bunka = prm.get("bunka", 0.45 if styl == "jemna" else 1.0)   # mm, priemerná veľkosť bunky (zrna)
    vyska = prm.get("vyska", 0.07 if styl == "jemna" else 0.45)  # mm, hĺbka jamky (výška zrna)
    m, u = novy_material("pena_celo")
    p0 = u.mm()
    # pokrivenie súradníc šumom: bunky nie sú pravidelná mozaika
    krivenie = u.uzol("ShaderNodeTexNoise", {"Vector": p0, "Scale": 0.8, "Detail": 3.0, "Roughness": 0.5},
                      noise_dimensions="3D").outputs["Color"]
    krivenie = u.vmath("SUBTRACT", krivenie, (0.5, 0.5, 0.5))
    p = u.vmath("ADD", p0, u.vmath("SCALE", krivenie, scale=0.40 * bunka))
    mikro = u.sum(p0, 6.0, detail=4.0, drsnost=0.6)

    if styl == "jemna":
        # štúdiová fotka: stredne sivá, matná, takmer hladká plocha s jemnou plytkou pórovitosťou
        def jamky_j(mierka, r_min, r_rozptyl):
            v = u.uzol("ShaderNodeTexVoronoi", {"Vector": p, "Scale": 1.0 / mierka, "Randomness": 1.0},
                       voronoi_dimensions="3D", feature="F1")
            sepj = u.uzol("ShaderNodeSeparateColor", {"Color": v.outputs["Color"]})
            r = u.math("ADD", r_min, u.math("MULTIPLY", sepj.outputs[0], r_rozptyl))
            t = u.math("DIVIDE", v.outputs["Distance"], r)
            cup = u.math("SQRT", u.math("MAXIMUM", u.math("SUBTRACT", 1.0, u.math("MULTIPLY", t, t)), 0.0))
            return u.math("MULTIPLY", cup, u.math("ADD", 0.5, sepj.outputs[1])), sepj.outputs[2]

        jA, nahA = jamky_j(bunka, 0.42, 0.25)
        jB, _ = jamky_j(2.2 * bunka, 0.30, 0.25)
        hlbka = u.math("MAXIMUM", jA, u.math("MULTIPLY", jB, 0.7))
        h = u.math("MULTIPLY", hlbka, -vyska)
        svetlost = u.math("SUBTRACT", 1.0, u.math("MULTIPLY", u.rozsah(hlbka, 0.0, 1.3, 0.0, 1.0, interp="SMOOTHSTEP"), 0.55))
    elif styl == "zrna":
        def zrna(mierka, polomer):
            v = u.uzol("ShaderNodeTexVoronoi", {"Vector": p, "Scale": 1.0 / mierka, "Randomness": 1.0},
                       voronoi_dimensions="3D", feature="F1")
            t = u.math("DIVIDE", v.outputs["Distance"], polomer)
            kop = u.math("SQRT", u.math("MAXIMUM", u.math("SUBTRACT", 1.0, u.math("MULTIPLY", t, t)), 0.0))
            nah = u.uzol("ShaderNodeSeparateColor", {"Color": v.outputs["Color"]}).outputs[0]
            return u.math("MULTIPLY", kop, u.math("ADD", 0.65, u.math("MULTIPLY", nah, 0.7))), nah

        zA, nahA = zrna(bunka, 0.64)
        zB, _ = zrna(0.58 * bunka, 0.62)
        vrch = u.math("MAXIMUM", zA, u.math("MULTIPLY", zB, 0.62))      # 0 medzera .. ~1.35 vrch zrna
        h = u.math("SUBTRACT", u.math("MULTIPLY", vrch, vyska), 1.35 * vyska)
        svetlost = u.rozsah(vrch, 0.0, 0.6, 0.0, 1.0, interp="SMOOTHSTEP")
    else:
        def jamky(mierka, r_min, r_rozptyl):
            """Prerezaná bublina: guľová jamka náhodného polomeru a hĺbky okolo bodu Voronoi."""
            v = u.uzol("ShaderNodeTexVoronoi", {"Vector": p, "Scale": 1.0 / mierka, "Randomness": 1.0},
                       voronoi_dimensions="3D", feature="F1")
            sepj = u.uzol("ShaderNodeSeparateColor", {"Color": v.outputs["Color"]})
            r = u.math("ADD", r_min, u.math("MULTIPLY", sepj.outputs[0], r_rozptyl))
            t = u.math("DIVIDE", v.outputs["Distance"], r)
            cup = u.math("SQRT", u.math("MAXIMUM", u.math("SUBTRACT", 1.0, u.math("MULTIPLY", t, t)), 0.0))
            hl = u.math("ADD", 0.55, u.math("MULTIPLY", sepj.outputs[1], 0.8))
            return u.math("MULTIPLY", cup, hl), sepj.outputs[2]

        jA, nahA = jamky(bunka, 0.50, 0.24)
        jB, _ = jamky(0.42 * bunka, 0.36, 0.25)
        hlbka = u.math("MAXIMUM", jA, u.math("MULTIPLY", jB, 0.5))      # 0 stena .. ~1.35 dno
        h = u.math("MULTIPLY", hlbka, -vyska)
        svetlost = u.math("SUBTRACT", 1.0, u.rozsah(hlbka, 0.0, 1.2, 0.0, 1.0, interp="SMOOTHSTEP"))
    # póry: náhodne vybrané bunky s hlbokou tmavou dierou rôznej veľkosti
    vP = u.uzol("ShaderNodeTexVoronoi", {"Vector": p, "Scale": 1.0 / (1.8 * bunka), "Randomness": 1.0},
                voronoi_dimensions="3D", feature="F1")
    sep = u.uzol("ShaderNodeSeparateColor", {"Color": vP.outputs["Color"]})
    je_por = u.math("LESS_THAN", sep.outputs[0], prm.get("pory", 0.06 if styl == "jemna" else 0.22))
    r_por = u.math("ADD", 0.12, u.math("MULTIPLY", u.math("POWER", sep.outputs[1], 2.0), 0.20))
    hrana = u.uzol("ShaderNodeMapRange", {"Value": vP.outputs["Distance"], "From Min": u.math("MULTIPLY", r_por, 0.5),
                                          "From Max": r_por, "To Min": 1.0, "To Max": 0.0},
                   interpolation_type="SMOOTHSTEP").outputs["Result"]
    diera = u.math("MULTIPLY", hrana, je_por)
    h = u.math("ADD", h, u.math("MULTIPLY", mikro, 0.06 * vyska))
    h = u.math("ADD", h, u.math("MULTIPLY", diera, (-6.0 if styl == "jemna" else -2.2) * vyska))
    # navinuté vrstvy peny: slabé sústredné švy (fotka rezu DUO), nízky kontrast
    _, r_v, _, _ = smer_po_obvode(u, p0)
    faza_v = u.math("ADD", u.math("DIVIDE", r_v, prm.get("vrstva", 9.0)),
                    u.math("MULTIPLY", u.sum(p0, 0.08, detail=2.0), 0.6))
    sev = u.math("POWER", u.math("ABSOLUTE", u.math("SINE", u.math("MULTIPLY", faza_v, math.pi))), 40.0)
    sev = u.math("MULTIPLY", sev, prm.get("vrstvy", 1.0))
    h = u.math("SUBTRACT", h, u.math("MULTIPLY", sev, 0.06))
    posun = u.uzol("ShaderNodeDisplacement", {"Height": h, "Midlevel": 0.06 * vyska, "Scale": MM},
                   space="OBJECT").outputs[0]
    # farba: steny a vrchy svetlé, hĺbka tmavá, póry takmer čierne, bunky trochu rôzne svetlé
    zak = FARBY["pena"]
    tmava = (zak[0] * 0.30, zak[1] * 0.30, zak[2] * 0.30, 1.0)
    farba = u.mix_farba(svetlost, tmava, (*zak, 1.0))
    farba = u.mix_farba(diera, farba, (0.020, 0.020, 0.019, 1.0))
    farba = u.mix_farba(u.math("MULTIPLY", sev, 0.22), farba, (zak[0] * 0.6, zak[1] * 0.6, zak[2] * 0.6, 1.0))
    # piliny z rezu (fotka rezu DUO): riedke svetlé zrnká a modré triesky z plášťa, hustejšie pri okraji
    r_okraj = prm.get("r_okraj")
    if r_okraj and prm.get("piliny", 1.0) > 0:
        vf = u.uzol("ShaderNodeTexVoronoi", {"Vector": p0, "Scale": 1.0 / 2.2, "Randomness": 1.0},
                    voronoi_dimensions="3D", feature="F1")
        sf = u.uzol("ShaderNodeSeparateColor", {"Color": vf.outputs["Color"]})
        pri_okraji = u.rozsah(r_v, r_okraj - 14.0, r_okraj - 1.0, 0.25, 1.0, interp="SMOOTHSTEP")
        je_zrnko = u.math("LESS_THAN", sf.outputs[0], u.math("MULTIPLY", pri_okraji, 0.018 * prm.get("piliny", 1.0)))
        r_zr = u.math("ADD", 0.06, u.math("MULTIPLY", sf.outputs[1], 0.14))
        zrnko = u.math("MULTIPLY", je_zrnko, u.rozsah(u.math("DIVIDE", vf.outputs["Distance"], r_zr), 0.7, 1.0, 1.0, 0.0,
                                                    interp="SMOOTHSTEP"))
        modra = u.math("LESS_THAN", sf.outputs[2], 0.35)
        farba_zr = u.mix_farba(modra, (zak[0] * 1.9, zak[1] * 1.9, zak[2] * 1.85, 1.0), (0.010, 0.020, 0.22, 1.0))
        farba = u.mix_farba(zrnko, farba, farba_zr)
    # jemné škvrny (penu tvoria navinuté pásy)
    farba = u.mix_farba(u.rozsah(u.sum(p0, 0.12, detail=3.0), 0.35, 0.65, 0.0, 0.12), farba,
                        (zak[0] * 0.8, zak[1] * 0.8, zak[2] * 0.8, 1.0))
    jas = u.rozsah(nahA, 0.0, 1.0, 0.94 if styl == "jemna" else 0.88, 1.06 if styl == "jemna" else 1.12)
    farba_n = u.uzol("ShaderNodeMix", data_type="RGBA", blend_type="MULTIPLY")
    u._vstup(farba_n.inputs[0], 1.0)
    u._vstup(next(s for s in farba_n.inputs if s.identifier == "A_Color"), farba)
    jas_rgb = u.uzol("ShaderNodeCombineColor", {"Red": jas, "Green": jas, "Blue": jas}).outputs[0]
    u._vstup(next(s for s in farba_n.inputs if s.identifier == "B_Color"), jas_rgb)
    farba = next(s for s in farba_n.outputs if s.type == "RGBA")
    if styl == "jemna":
        drs = u.math("SUBTRACT", 0.80, u.math("MULTIPLY", svetlost, 0.12))
        bsdf = principled(u, farba=farba, drsnost=drs, ior=1.5, spek=0.35, sss=0.15,
                          sss_polomer=(1.0, 1.0, 1.0), sss_mierka=0.0008, sheen=0.25, sheen_drsnost=0.5)
    else:
        drs = u.math("SUBTRACT", 0.60, u.math("MULTIPLY", svetlost, 0.22))
        bsdf = principled(u, farba=farba, drsnost=drs, ior=1.5, spek=0.5, sss=0.08,
                          sss_polomer=(1.0, 1.0, 1.0), sss_mierka=0.0006, sheen=0.12, sheen_drsnost=0.4)
    u.vystup(bsdf, posun)
    m.displacement_method = "BOTH"
    return m


def mat_pena_plast():
    """Vonkajšia koža a otvory peny (vidno ich v rozloženom pohľade): svetlosivá, jemne
    bunkovitá, matná. Koža je hladšia ako rez, bunky sú len naznačené."""
    m, u = novy_material("pena_telo")
    p = u.mm()
    v = u.uzol("ShaderNodeTexVoronoi", {"Vector": p, "Scale": 1.0 / 0.8, "Randomness": 1.0},
               voronoi_dimensions="3D", feature="F1")
    bunky = u.rozsah(v.outputs["Distance"], 0.0, 0.6, 0.0, 1.0, interp="SMOOTHSTEP")
    n1 = u.sum(p, 1.6, detail=4.0, drsnost=0.6)
    n2 = u.sum(p, 0.05, detail=2.0)
    vyska = u.math("ADD", u.math("MULTIPLY", bunky, 0.6), u.math("MULTIPLY", n1, 0.4))
    bump = u.uzol("ShaderNodeBump", {"Strength": 0.30, "Distance": 0.00012, "Height": vyska}).outputs["Normal"]
    zak = FARBY["pena"]
    farba = u.mix_farba(u.rozsah(n2, 0.3, 0.7, 0.0, 1.0), (*[c * 0.86 for c in zak], 1.0), (*[c * 0.74 for c in zak], 1.0))
    farba = u.mix_farba(u.math("MULTIPLY", u.math("SUBTRACT", 1.0, bunky), 0.35), farba, (*[c * 0.55 for c in zak], 1.0))
    bsdf = principled(u, farba=farba, drsnost=0.62, ior=1.5, spek=0.35, normala=bump, sss=0.06,
                      sss_polomer=(1.0, 1.0, 1.0), sss_mierka=0.0006)
    u.vystup(bsdf)
    return m


def mat_rura(druh, cast, d=32.0, ciara_uhol=130.0):
    """Nosná rúra: cast 0 = vonkajší povrch, 1 = vnútro, 2 = rez.

    PE-Xa (žltá kúrenie, krémovo biela sanita): lesklá (drsnosť asi 0,14), mierne presvitá, jemné
    pozdĺžne stopy a mikroškrabance; rez je bledší, krémový, saténový so stopami po píle; vnútro
    tmavšie do oranžova. Potlač je len tenký pás drobných tmavších značiek bez textu (nič si
    nevymýšľame). PE 100 (COOL): čierna so štyrmi modrými pruhmi. Kábel, chránička: čierne, matné."""
    m, u = novy_material(f"{druh}_{cast}_{round(d)}_{round(ciara_uhol)}")
    p = u.mm()
    pexa = druh in ("pexa-zlta", "pexa-biela")
    if druh == "pexa-zlta":
        zak = FARBY["pexa_zlta"]
        sss, polomer, mierka = 0.35, (1.0, 0.75, 0.15), 0.0030
        drs = (0.14, 0.22, 0.40)[cast]
        farba_rez = (0.86, 0.72, 0.30)          # bledší, krémový rez (fotka rezu DUO)
        farba_vnutro = (0.86, 0.52, 0.0)         # vnútro tmavšie do oranžova
    elif druh == "pexa-biela":
        zak = FARBY["pexa_biela"]
        sss, polomer, mierka = 0.28, (1.0, 0.95, 0.85), 0.0030
        drs = (0.18, 0.26, 0.42)[cast]
        farba_rez = (0.40, 0.39, 0.35)
        farba_vnutro = (0.26, 0.25, 0.22)
    else:  # pe100, kabel, chranicka
        zak = FARBY["pe100"]
        sss, polomer, mierka = 0.0, (1.0, 1.0, 1.0), 0.001
        drs = (0.26, 0.32, 0.62)[cast] if druh == "pe100" else (0.38, 0.45, 0.62)[cast]
        farba_rez = (0.05, 0.05, 0.052)
        farba_vnutro = (0.50, 0.53, 0.56) if druh == "chranicka" else zak   # svetlosivá vložka chráničky
    # pozdĺžne stopy po vytláčaní (šum natiahnutý pozdĺž osi X)
    tah = u.sum(u.vmath("MULTIPLY", p, (0.01, 1.0, 1.0)), 1.5, detail=2.0, drsnost=0.5)
    drs_s = drs
    if cast == 2:
        vyska = stopy_pily(u, p, rozstup=0.22, smer=(0.0, 0.6, 0.8))
        bump = u.uzol("ShaderNodeBump", {"Strength": 0.30, "Distance": 0.00003, "Height": vyska}).outputs["Normal"]
        farba = farba_rez
    elif cast == 1:
        bump = u.uzol("ShaderNodeBump", {"Strength": 0.03, "Distance": 0.00002, "Height": tah}).outputs["Normal"]
        farba = farba_vnutro
    else:
        # mikroškrabance z manipulácie: tenké čiary skoro pozdĺž rúry, veľmi jemné
        skr = u.uzol("ShaderNodeTexVoronoi", {"Vector": u.vmath("MULTIPLY", p, (0.08, 1.0, 1.0)), "Scale": 0.9,
                                               "Randomness": 1.0}, voronoi_dimensions="3D",
                     feature="DISTANCE_TO_EDGE").outputs["Distance"]
        skr = u.math("MULTIPLY", u.rozsah(skr, 0.0, 0.025, 1.0, 0.0, interp="SMOOTHSTEP"),
                     u.rozsah(u.sum(p, 0.15, detail=2.0), 0.55, 0.7, 0.0, 1.0))
        vyska = u.math("ADD", u.math("MULTIPLY", tah, 0.8), u.math("MULTIPLY", skr, -0.6))
        bump = u.uzol("ShaderNodeBump", {"Strength": 0.05, "Distance": 0.00002, "Height": vyska}).outputs["Normal"]
        drs_s = u.math("ADD", drs, u.math("MULTIPLY", skr, 0.12))
        farba = zak
    farba_s = (*farba, 1.0)
    if druh == "pexa-biela" and cast == 0:
        # jemne tmavší, teplejší okraj valca pri pohľade pod uhlom: biela rúra sa tak nikdy
        # nezleje s bielym pozadím (ako na fotkách, kde krémová rúra má sivastý obrys)
        lw = u.uzol("ShaderNodeLayerWeight", {"Blend": 0.5})
        okraj = u.math("POWER", lw.outputs["Facing"], 2.2)
        farba_s = u.mix_farba(u.math("MULTIPLY", okraj, 0.55), farba_s,
                              (farba[0] * 0.62, farba[1] * 0.60, farba[2] * 0.55, 1.0))
    if cast == 0 and druh in ("pe100", "pexa-zlta", "pexa-biela"):
        sep = u.uzol("ShaderNodeSeparateXYZ", {"Vector": p})
        uhol = u.math("ARCTAN2", sep.outputs["Z"], sep.outputs["Y"])
        if druh == "pe100":
            # modré pruhy PE 100: štyri po obvode, šírka 3 mm
            t = u.math("FRACT", u.math("ADD", u.math("MULTIPLY", uhol, 4.0 / (2 * math.pi)), 0.5))
            obl = u.math("MULTIPLY", u.math("ABSOLUTE", u.math("SUBTRACT", t, 0.5)), math.pi * d / 4.0)
            pruh = u.rozsah(obl, 1.35, 1.6, 1.0, 0.0, interp="SMOOTHSTEP")
            farba_s = u.mix_farba(pruh, farba_s, (*FARBY["pruh_pe100"], 1.0))
        else:
            # potlač: pás drobných značiek (dva riadky „znakov“ ~0,8 mm), nečitateľný, len o niečo
            # tmavší ako rúra; po dĺžke skupiny značiek s medzerami ako slová
            t = u.math("FRACT", u.math("ADD", u.math("DIVIDE", u.math("SUBTRACT", uhol, math.radians(ciara_uhol)),
                                                         2 * math.pi), 0.5))
            obl = u.math("MULTIPLY", u.math("SUBTRACT", t, 0.5), math.pi * d)         # mm po obvode od stredu pásu
            pas = u.rozsah(u.math("ABSOLUTE", obl), 0.55, 0.75, 1.0, 0.0, interp="SMOOTHSTEP")
            znaky = u.uzol("ShaderNodeTexVoronoi", {"Vector": u.uzol("ShaderNodeCombineXYZ", {
                "X": u.math("DIVIDE", sep.outputs["X"], 0.55), "Y": u.math("DIVIDE", obl, 0.35), "Z": 0.0}).outputs[0],
                "Scale": 1.0, "Randomness": 0.6}, voronoi_dimensions="2D", feature="F1")
            znak = u.rozsah(u.uzol("ShaderNodeSeparateColor", {"Color": znaky.outputs["Color"]}).outputs[0],
                            0.35, 0.45, 0.0, 1.0)
            slova = u.rozsah(u.math("SINE", u.math("DIVIDE", sep.outputs["X"], 2.3)), -0.35, -0.15, 0.0, 1.0)
            potlac = u.math("MULTIPLY", u.math("MULTIPLY", pas, znak), slova)
            tmavsia = tuple(c * 0.45 for c in farba)
            farba_s = u.mix_farba(u.math("MULTIPLY", potlac, 0.75), farba_s, (*tmavsia, 1.0))
    bsdf = principled(u, farba=farba_s, drsnost=drs_s, ior=1.5, spek=0.5, normala=bump,
                      sss=sss if cast != 1 else sss * 0.6, sss_polomer=polomer, sss_mierka=mierka)
    u.vystup(bsdf)
    return m


# =============================================================================================
# Scéna: render, svetlo, kamera
# =============================================================================================
def vycisti_scenu():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for kol in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for x in list(kol):
            kol.remove(x)
    return bpy.context.scene


def nastav_render(sc, a, sirka, vyska, vzorky):
    sc.render.engine = "CYCLES"
    cy = sc.cycles
    if a.zariadenie.upper() == "GPU":
        prefs = bpy.context.preferences.addons["cycles"].preferences
        ok = False
        for typ in ("OPTIX", "CUDA"):
            try:
                prefs.compute_device_type = typ
                prefs.refresh_devices()
                gpu = [d for d in prefs.devices if d.type == typ]
                if gpu:
                    for d in prefs.devices:
                        d.use = d.type == typ
                    ok = True
                    print(f"Render na {typ}: {', '.join(d.name for d in gpu)}")
                    break
            except Exception as e:  # noqa: BLE001
                print("GPU", typ, "nedostupné:", e)
        cy.device = "GPU" if ok else "CPU"
    else:
        cy.device = "CPU"
    cy.samples = vzorky
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.006 if vzorky >= 256 else 0.02
    cy.adaptive_min_samples = min(64, max(16, vzorky // 8))
    cy.use_denoising = True
    cy.denoiser = "OPENIMAGEDENOISE"
    cy.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    cy.denoising_prefilter = "ACCURATE"
    try:
        cy.denoising_quality = "HIGH"
        cy.denoising_use_gpu = True
    except Exception:  # noqa: BLE001
        pass
    cy.max_bounces = 12
    cy.diffuse_bounces = 4
    cy.glossy_bounces = 6
    cy.transmission_bounces = 8
    cy.transparent_max_bounces = 8
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.sample_clamp_direct = 0.0
    cy.sample_clamp_indirect = 4.0
    cy.blur_glossy = 0.5
    cy.seed = 7
    cy.use_animated_seed = False
    cy.dicing_rate = 1.0
    cy.offscreen_dicing_scale = 4.0
    cy.max_subdivisions = 10
    sc.render.film_transparent = True
    sc.render.resolution_x = sirka
    sc.render.resolution_y = vyska
    sc.render.resolution_percentage = 100
    sc.render.use_persistent_data = True
    # Standard: sýte farby ako na renderoch Watts (PBR Neutral a AgX bielia jasnú žltú)
    sc.view_settings.view_transform = a.prevod
    sc.view_settings.look = a.vzhlad
    # vyváženie bielej (ako fotograf podľa sivej karty): v makre peny odrážajú žlté rúry
    if a.teplota:
        sc.view_settings.use_white_balance = True
        sc.view_settings.white_balance_temperature = a.teplota
        sc.view_settings.white_balance_tint = 10.0     # 10 = denné svetlo (predvolené)
    sc.view_settings.exposure = a.expozicia
    sc.view_settings.gamma = 1.0
    st = sc.render.image_settings
    st.file_format = "PNG"
    st.color_mode = "RGBA"
    st.color_depth = "8"
    st.compression = 15


def svet(sc, sila=0.6, pozadie=False):
    """Okolie štúdia: svetlý vrch, tmavší spodok; pri predvolenej slabej sile (0,04) je to tmavé
    štúdio s čiernymi zásterami, svietia hlavne softboxy. Pozadie je pri renderi priehľadné, okolie
    len svieti a odráža sa. pozadie=True: kamera vidí mäkký sivý prechod (svetlejší hore vľavo)
    ako makrofotka plášťa v katalógu."""
    w = bpy.data.worlds.new("studio")
    if w.node_tree is None:
        try:
            w.use_nodes = True
        except Exception:  # noqa: BLE001
            pass
    sc.world = w
    u = Uzly(w.node_tree)
    tc = u.uzol("ShaderNodeTexCoord")
    sep = u.uzol("ShaderNodeSeparateXYZ", {"Vector": tc.outputs["Generated"]})
    t = u.rozsah(sep.outputs["Z"], -0.1, 0.8, 0.0, 1.0, interp="SMOOTHSTEP")
    farba = u.mix_farba(t, (0.30, 0.30, 0.31, 1.0), (1.0, 1.0, 1.0, 1.0))
    bg = u.uzol("ShaderNodeBackground", {"Color": farba, "Strength": sila})
    out = u.uzol("ShaderNodeOutputWorld")
    if not pozadie:
        u.nt.links.new(bg.outputs[0], out.inputs["Surface"])
        return
    kam = u.uzol("ShaderNodeTexCoord").outputs["Window"]
    sepw = u.uzol("ShaderNodeSeparateXYZ", {"Vector": kam})
    dx = u.math("SUBTRACT", sepw.outputs["X"], 0.25)
    dy = u.math("SUBTRACT", sepw.outputs["Y"], 0.80)
    vzd = u.math("SQRT", u.math("ADD", u.math("MULTIPLY", dx, dx), u.math("MULTIPLY", dy, dy)))
    t2 = u.rozsah(vzd, 0.0, 1.1, 0.0, 1.0, interp="SMOOTHSTEP")
    farba2 = u.mix_farba(t2, (0.62, 0.63, 0.63, 1.0), (0.10, 0.10, 0.11, 1.0))
    bg2 = u.uzol("ShaderNodeBackground", {"Color": farba2, "Strength": 1.0})
    lp = u.uzol("ShaderNodeLightPath")
    mix = u.uzol("ShaderNodeMixShader")
    u.nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs[0])
    u.nt.links.new(bg.outputs[0], mix.inputs[1])
    u.nt.links.new(bg2.outputs[0], mix.inputs[2])
    u.nt.links.new(mix.outputs[0], out.inputs["Surface"])


def svetlo(meno, poloha, ciel, rozmer, energia, spread_deg=180.0, farba=(1.0, 1.0, 1.0), os=None):
    """Plošné svetlo (softbox) mieriace na cieľ. os: smer dlhšej strany vo svete (pre pásy)."""
    l = bpy.data.lights.new(meno, "AREA")
    l.shape = "RECTANGLE"
    l.size, l.size_y = rozmer
    l.energy = energia
    l.color = farba
    l.spread = math.radians(spread_deg)
    o = bpy.data.objects.new(meno, l)
    bpy.context.scene.collection.objects.link(o)
    o.location = Vector(poloha)
    smer = (Vector(ciel) - Vector(poloha)).normalized()
    if os is None:
        o.rotation_euler = smer.to_track_quat("-Z", "Y").to_euler()
    else:
        from mathutils import Matrix
        z = -smer
        x = Vector(os) - z * Vector(os).dot(z)
        x.normalize()
        y = z.cross(x)
        o.rotation_euler = Matrix((x, y, z)).transposed().to_euler()
    return o


def studiove_svetla(D, L, sila=1.0, strana=1.0, jasy=None):
    """Produktové štúdio podľa štúdiovej fotky (katalóg s. 6), svetlá zadané jasom:
    - kľúč: veľký softbox nad telom, k divákovi, natiahnutý pozdĺž osi: dlhý svetlý pás navrchu,
    - kontra: úzky silný pás za telom: svetlé lemy na hranách vĺn a na hornom obryse,
    - čelo: softbox spredu na rez (pena, konce rúr),
    - bez predného vyplňujúceho svetla a s tmavším okolím (čierne zástery): odvrátená strana
      a drážky padnú do tieňa; zospodu svieti len biela podlaha.
    Mierka podľa priemeru plášťa; strana = -1 zrkadlí štúdio pre kameru z druhej strany."""
    k = D / 160.0
    stred = Vector((-0.30 * L * MM, 0.0, 0.0))
    y = strana
    s_ = sila
    j = {"kluc": 18.0, "vypln": 8.0, "kontra": 14.0, "celo": 0.8, "kluc_sirka": 2400.0, "kluc_y": 0.15}
    j.update({kk: v for kk, v in (jasy or {}).items() if v is not None})
    sv = []
    # kľúč končí v rovine rezu (čierna zástera vpredu): pás odleskov ide po celom tele, ale na
    # rez nesvieti, ten má vlastné svetlo; inak by čelo peny bolo prepálené
    dlzka_kluca = L + 120.0 * k
    x_kluca = (-0.5 * L + 10.0 * k) * MM
    sv.append(svetlo_jas("kluc", (x_kluca, j["kluc_y"] * k * y, 1.00 * k), (x_kluca, 0.0, 0.0),
                         (dlzka_kluca, j["kluc_sirka"] * k), j["kluc"] * s_, 140, os=(1, 0, 0)))
    # veľká biela doska na strane kamery, nízko: svetlo do drážok a na spodnú polovicu (bez nej
    # telo vyzerá ako stĺpec mincí s čiernymi medzerami)
    # len difúzne (doska sa neodráža v lesku, inak by sivým závojom zmyla sýtosť plášťa)
    sv.append(svetlo_jas("vypln", (stred.x + 0.2 * k, -1.30 * k * y, 0.05 * k), (stred.x, 0.0, -0.05 * k),
                         (L + 900 * k, 900 * k), j["vypln"] * s_, 150, os=(1, 0, 0)))
    sv[-1].data.specular_factor = 0.0
    sv.append(svetlo_jas("kontra", (stred.x + 0.10 * k, 0.95 * k * y, 0.55 * k), (stred.x, 0.0, 0.10 * k),
                         (3000 * k, 150 * k), j["kontra"] * s_, 80, os=(1, 0, 0)))
    sv.append(svetlo_jas("celo", (1.10 * k, -0.55 * k * y, 0.75 * k), (0.0, 0.0, 0.0),
                         (900 * k, 900 * k), j["celo"] * s_, 140))
    # svetlo na rez sa v lesklých stenách vĺn obrátených ku kamere odráža len slabo (ako za
    # difúznou plachtou s čiernym lemom); penu a konce rúr osvetlí naplno
    sv[-1].data.specular_factor = 0.25
    return sv


def svetlo_jas(meno, poloha, ciel, rozmer_mm, jas, spread_deg=120.0, farba=(1.0, 1.0, 1.0), os=None):
    """Plošné svetlo zadané jasom (W/m²/sr) namiesto výkonu, aby malé svetlá v makre mali rovnaký
    jas ako veľké softboxy v štúdiu: výkon = jas * pi * plocha. Rozmery v mm, polohy v metroch."""
    plocha = rozmer_mm[0] * rozmer_mm[1] * MM * MM
    return svetlo(meno, poloha, ciel, (rozmer_mm[0] * MM, rozmer_mm[1] * MM), jas * math.pi * plocha,
                  spread_deg, farba, os)


def makro_svetla_plast(ciel_mm, az, el, rz, a):
    """Svetlo pre makro plášťa v reze, podľa makrofotky v katalógu (s. 5): tmavé okolie, kontra
    zozadu zhora (svetlé lemy na hranách vĺn), mäkké vyplňujúce svetlo od kamery a svetlo na
    odvrátenej strane v úrovni osi, ktoré cez tenké steny presvitá do komôr a dovnútra plášťa."""
    R, P = rz["R"], rz["P"]
    c = Vector(ciel_mm)
    k = Vector((math.cos(math.radians(el)) * math.cos(math.radians(az)),
                -math.cos(math.radians(el)) * math.sin(math.radians(az)), math.sin(math.radians(el))))
    hore = Vector((0, 0, 1)) - k * k.z
    hore.normalize()
    vlavo = hore.cross(k)
    vlavo.normalize()
    m = lambda v: tuple(x * MM for x in v)  # noqa: E731
    # kontra: za predmetom, hore vľavo; pás naprieč osou (odlesky po celej dĺžke hrán vĺn)
    poz = c - k * 1.2 * R + hore * 1.6 * R + vlavo * 0.8 * R
    svetlo_jas("kontra_makro", m(poz), m(c), (0.35 * R, 2.2 * R), a.jas_kontra, 100, os=(0, 1, 0))
    # vyplňujúce svetlo od kamery, trochu zhora
    poz = c + k * 2.2 * R + hore * 0.9 * R - vlavo * 0.6 * R
    svetlo_jas("vypln_makro", m(poz), m(c), (1.2 * R, 1.2 * R), a.jas_vypln, 120)
    # presvitanie: na odvrátenej strane v úrovni osi, mieri na hornú časť steny zvonka
    svetlo_jas("za_stenou", m((c.x, -1.4 * R, -0.1 * R)), m((c.x, -0.3 * R, 0.7 * R)), (3.0 * P, 0.8 * R),
               a.jas_presvit, 120, farba=(0.75, 0.95, 1.0))
    # slabé svetlo vnútri polovice plášťa, aby vnútorná stena za rezom nebola čierna
    svetlo_jas("vnutri", m((c.x, 0.2 * R, -0.2 * R)), m((c.x, -R, 0.0)), (3.0 * P, 0.5 * R),
               a.jas_vnutri, 150, farba=(0.85, 0.93, 1.0))


def biela_podlaha(D, L):
    """Biela podlaha štúdia: kamera ju nevidí, ale vracia svetlo zospodu a odráža sa v lesku."""
    me = bpy.data.meshes.new("biela_podlaha")
    s_ = 4.0 * max(D, L) * MM
    me.from_pydata([(-s_, -s_, 0), (s_, -s_, 0), (s_, s_, 0), (-s_, s_, 0)], [], [(0, 1, 2, 3)])
    o = bpy.data.objects.new("biela_podlaha", me)
    bpy.context.scene.collection.objects.link(o)
    o.location = (-0.4 * L * MM, 0.0, -D / 2 * MM - 0.0002)
    m, u = novy_material("biela_podlaha")
    u.vystup(principled(u, farba=(0.80, 0.80, 0.79), drsnost=0.6, spek=0.3))
    o.data.materials.append(m)
    o.visible_camera = False
    o.visible_shadow = False
    # podlaha vracia svetlo zospodu (difúzne), ale neodráža sa v lesku plášťa: inak sivým závojom
    # zmyje sýtosť spodnej polovice (katalógová fotka je výrez na bielom, štúdio okolo bolo tmavšie)
    o.visible_glossy = False
    return o


def premietni(cam, body):
    """Body (n, 3) vo svete -> (u, v) v jednotkách šírky snímky, bez posunu objektívu."""
    M = np.array(cam.matrix_world.inverted())
    pc = body @ M[:3, :3].T + M[:3, 3]
    z = -pc[:, 2]
    f = cam.data.lens / cam.data.sensor_width
    return pc[:, 0] / z * f, pc[:, 1] / z * f


def body_objektov(objekty, max_bodov=150000):
    bpy.context.view_layer.update()
    vsetko = []
    for o in objekty:
        me = o.data
        n = len(me.vertices)
        if n == 0:
            continue
        co = np.empty(n * 3, np.float32)
        me.vertices.foreach_get("co", co)
        co = co.reshape(-1, 3).astype(np.float64)
        if n > max_bodov:
            co = co[:: max(1, n // max_bodov)]
        M = np.array(o.matrix_world)
        vsetko.append(co @ M[:3, :3].T + M[:3, 3])
    return np.concatenate(vsetko)


def kamera(sc, azimut, elevacia, ciel, ohnisko=90.0):
    c = bpy.data.cameras.new("kamera")
    c.lens = ohnisko
    c.sensor_fit = "HORIZONTAL"
    c.sensor_width = 36.0
    c.clip_start = 0.01
    c.clip_end = 100.0
    o = bpy.data.objects.new("kamera", c)
    sc.collection.objects.link(o)
    sc.camera = o
    az, el = math.radians(azimut), math.radians(elevacia)
    smer = Vector((math.cos(el) * math.cos(az), -math.cos(el) * math.sin(az), math.sin(el)))
    o.location = Vector(ciel) + smer * 2.0
    o.rotation_euler = (-smer).to_track_quat("-Z", "Y").to_euler()
    return o


def ramec_ako_watts(cam, D, x_cela, ciel_px, sirka, vyska):
    """Kamera tak, aby čelný prstenec plášťa ležal na snímke tam, kde na renderi Watts.

    ciel_px = (stred_x, stred_y, hlavna_os) vonkajšej elipsy prstenca v px referencie, ktorá má
    rozmer sirka x vyska. Slúži len na porovnanie materiálov a proporcií v rovnakej mierke."""
    sc = bpy.context.scene
    sc.render.resolution_x, sc.render.resolution_y = sirka, vyska
    t = np.linspace(0, 2 * math.pi, 128, endpoint=False)
    kruh = np.column_stack([np.full_like(t, x_cela * MM), D / 2 * MM * np.cos(t), D / 2 * MM * np.sin(t)])
    cam.data.shift_x = cam.data.shift_y = 0.0
    stred = Vector((x_cela * MM, 0.0, 0.0))
    for _ in range(10):
        bpy.context.view_layer.update()
        u, v = premietni(cam, kruh)
        p = np.column_stack([u, v]) * sirka
        os_ = np.max(np.linalg.norm(p[:64] - p[64:], axis=1))
        k = os_ / ciel_px[2]
        smer = (cam.location - stred).normalized()
        cam.location = stred + smer * (cam.location - stred).length * k
    bpy.context.view_layer.update()
    u, v = premietni(cam, kruh)
    uc, vc = float(u.mean()), float(v.mean())
    # stred elipsy má byť na (cx, cy) v px referencie
    cam.data.shift_x = uc - (ciel_px[0] / sirka - 0.5)
    cam.data.shift_y = vc - (vyska / 2 - ciel_px[1]) / sirka
    return vyska


def body_variantu_D(model, dosah=0.55):
    """Body výrobku v jednotkách D (stred rezu plášťa v počiatku): obrys plášťa vpredu, v strede
    a vzadu, konce rúr a podlaha pod tieňom. Z nich sa skladá jednotný výrez."""
    D, R = model.D, model.D / 2.0
    P = PLAST["rozstup_a"] + PLAST["rozstup_b"] * D
    L = max(2, int(round((model.dlzka_mm or model.a.dlzka * D) / P))) * P
    t = np.linspace(0, 2 * math.pi, 64, endpoint=False)
    casti = [np.column_stack([np.full_like(t, x), R * np.cos(t), R * np.sin(t)]) for x in (0.0, -0.5 * L, -L)]
    for r in model.rury:
        xx = model.x_pena + r.presah
        casti.append(np.column_stack([np.full_like(t, xx), r.v + r.d / 2 * np.cos(t), r.w + r.d / 2 * np.sin(t)]))
    b = np.concatenate(casti)
    xs = np.linspace(b[:, 0].min() - 0.12 * D, b[:, 0].max() + 0.12 * D, 24)
    ys = np.array([-dosah, -0.5 * dosah, 0.0, 0.5 * dosah, dosah]) * D
    X, Y = np.meshgrid(xs, ys)
    podlaha = np.column_stack([X.ravel(), Y.ravel(), np.full(X.size, -R)])
    return np.concatenate([b, podlaha]) / D


def premietni_np(body, az, el, vzd, ohnisko, snimac=36.0):
    """Perspektívna projekcia ako kamera Blendera (snímač na šírku): kamera vo vzdialenosti vzd
    od počiatku v smere (az, el), mieri do počiatku. Vracia (u, v) v jednotkách šírky snímky."""
    k = np.array([math.cos(el) * math.cos(az), -math.cos(el) * math.sin(az), math.sin(el)])
    C = k * vzd
    f = -k
    vpravo = np.cross(f, [0.0, 0.0, 1.0])
    vpravo /= np.linalg.norm(vpravo)
    hore = np.cross(vpravo, f)
    rel = body - C
    z = rel @ f
    return (rel @ vpravo) / z * (ohnisko / snimac), (rel @ hore) / z * (ohnisko / snimac)


def jednotny_ramec(a, okraj=0.03):
    """Výrez spoločný pre všetkých 91 variantov 12 radov v danom smere kamery: kamera vo
    vzdialenosti c * D od stredu rezu, posun objektívu a pomer strán sú pre všetky rovnaké, takže
    rez plášťa je na každom obrázku na tom istom mieste a rovnako veľký; menia sa len rúry.
    Výsledok sa uloží do data/_3d/_tmp (kľúč: smer, ohnisko, dĺžka, údaje)."""
    import hashlib
    az, el = math.radians(a.azimut), math.radians(a.elevacia)
    rady = [r for r in nacitaj_json("rady.json") if r["id"].startswith("microflex-")]
    varianty = [v for v in nacitaj_json("varianty.json") if v.get("rad") in {r["id"] for r in rady}]
    kluc = hashlib.sha1(json.dumps([a.azimut, a.elevacia, a.ohnisko, a.dlzka, okraj, PLAST, varianty],
                                   sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()[:12]
    cache = REPO / "data" / "_3d" / "_tmp" / f"jednotny-ramec-{kluc}.json"
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))
    rady_d = {r["id"]: r for r in rady}
    vsetko = []
    for v in varianty:
        m = Potrubie(rady_d[v["rad"]], v, a).rozloz()
        vsetko.append(body_variantu_D(m, a.tien_dosah))
    body = np.concatenate(vsetko)
    vzd = 6.0
    for _ in range(12):
        u, w = premietni_np(body, az, el, vzd, a.ohnisko)
        vzd *= (u.max() - u.min()) * (1 + 2 * okraj)
    u, w = premietni_np(body, az, el, vzd, a.ohnisko)
    prm = {"vzdialenost_D": vzd, "shift_x": float(0.5 * (u.max() + u.min())), "shift_y": float(0.5 * (w.max() + w.min())),
           "pomer": float((w.max() - w.min()) * (1 + 2 * okraj)), "variantov": len(varianty), "kluc": kluc}
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(prm, indent=1), encoding="utf-8")
    print(f"Jednotný výrez z {len(varianty)} variantov: vzdialenosť {vzd:.3f} D, pomer strán 1 : {prm['pomer']:.3f}")
    return prm


def ramec_jednotny(cam, D, prm, sirka):
    """Kamera podľa jednotného výrezu: vzdialenosť c * D od stredu rezu, pevný posun a pomer."""
    sc = bpy.context.scene
    smer = cam.matrix_world.to_quaternion() @ Vector((0.0, 0.0, 1.0))      # kamera hľadí po -Z
    cam.location = smer * (prm["vzdialenost_D"] * D * MM)
    cam.data.shift_x, cam.data.shift_y = prm["shift_x"], prm["shift_y"]
    vyska = int(round(sirka * prm["pomer"] / 2.0)) * 2
    sc.render.resolution_y = vyska
    bpy.context.view_layer.update()
    return vyska


def ramec_hero(cam, model, body, sirka, pomer=1.45, podiel=0.26, okraj_vlavo=0.05, okraj=0.04):
    """Výrez pre hlavný obrázok domova (text vľavo, výrobok vpravo, ako súčasný hero-rez-duo.png):
    rez plášťa v ľavej tretine obrátený doľava k nadpisu, telo ide doprava a odchádza za pravý
    okraj (koniec nevidno). podiel = šírka obrysu rezu plášťa ako podiel šírky snímky,
    okraj_vlavo = odstup najľavejšieho bodu (konce rúr) od ľavého okraja. Pomer strán je pevný;
    ak sa viditeľná časť (s tieňom) nezmestí na výšku, záber sa oddiali. Vracia výšku v px."""
    sc = bpy.context.scene
    R = model.D / 2.0
    t = np.linspace(0, 2 * math.pi, 128, endpoint=False)
    xp = model.skupiny["plast"].location.x / MM
    obrys = np.column_stack([np.full_like(t, xp), R * np.cos(t), R * np.sin(t)]) * MM
    konce = [obrys]
    xr = model.skupiny["rury"].location.x / MM
    for r in model.rury:
        xx = model.x_pena + r.presah + xr
        konce.append(np.column_stack([np.full_like(t, xx), r.v + r.d / 2 * np.cos(t), r.w + r.d / 2 * np.sin(t)]) * MM)
    konce = np.concatenate(konce)
    ciel = Vector((xp * MM, 0.0, 0.0))
    vyska_w = 1.0 / pomer
    vmin = vmax = 0.0
    for _ in range(8):
        cam.data.shift_x = cam.data.shift_y = 0.0
        for _ in range(12):
            bpy.context.view_layer.update()
            u, _ = premietni(cam, obrys)
            k = (u.max() - u.min()) / podiel
            smer = (cam.location - ciel).normalized()
            cam.location = ciel + smer * (cam.location - ciel).length * k
        bpy.context.view_layer.update()
        uk, _ = premietni(cam, konce)
        cam.data.shift_x = float(uk.min()) + 0.5 - okraj_vlavo
        u, v = premietni(cam, body)
        x_img = u - cam.data.shift_x + 0.5
        vid = (x_img >= 0.0) & (x_img <= 1.0)
        vmin, vmax = float(v[vid].min()), float(v[vid].max())
        if (vmax - vmin) * (1 + 2 * okraj) <= vyska_w * 1.001:
            break
        podiel *= 0.98 * vyska_w / ((vmax - vmin) * (1 + 2 * okraj))
    cam.data.shift_y = 0.5 * (vmax + vmin)
    vyska = int(round(sirka / pomer / 2.0)) * 2
    sc.render.resolution_y = vyska
    zad = np.column_stack([np.full_like(t, xp - model.L), R * np.cos(t), R * np.sin(t)]) * MM
    uz, vz = premietni(cam, zad)
    vnutri = ((uz - cam.data.shift_x + 0.5) < 1.0) & (np.abs(vz - cam.data.shift_y) < 0.5 / pomer)
    if vnutri.any():
        print("Pozor: zadný koniec tela je v zábere, treba dlhšie telo (--dlzka)")
    print(f"Hero: rez plášťa {podiel:.3f} šírky, {sirka} x {vyska} px")
    return vyska


def ramec_detail(cam, model, body, sirka, podiel=0.47, okraj_vpravo=0.05, okraj=0.03, vyska=None):
    """Detailný výrez pre hlavu stránky: kamera v smere štúdia, ale bližšie, až kým vonkajší
    obrys rezu plášťa nezaberie 'podiel' šírky snímky; rez je vpravo (pravý okraj rezu alebo
    koncov rúr je 'okraj_vpravo' od okraja), telo odchádza za ľavý okraj (web ho tam nechá
    utiecť za okraj obrazovky). Výška snímky podľa viditeľnej časti tela a tieňa.
    body: body výrobku a podlahy pod tieňom (n, 3) v metroch. Vracia výšku v px."""
    sc = bpy.context.scene
    cam.data.shift_x = cam.data.shift_y = 0.0
    R = model.D / 2.0
    t = np.linspace(0, 2 * math.pi, 128, endpoint=False)
    xp = model.skupiny["plast"].location.x / MM
    obrys = np.column_stack([np.full_like(t, xp), R * np.cos(t), R * np.sin(t)]) * MM
    konce = [obrys]
    xr = model.skupiny["rury"].location.x / MM
    for r in model.rury:
        xx = model.x_pena + r.presah + xr
        konce.append(np.column_stack([np.full_like(t, xx), r.v + r.d / 2 * np.cos(t), r.w + r.d / 2 * np.sin(t)]) * MM)
    konce = np.concatenate(konce)
    ciel = Vector((xp * MM, 0.0, 0.0))
    for _ in range(12):
        bpy.context.view_layer.update()
        u, _ = premietni(cam, obrys)
        k = (u.max() - u.min()) / podiel
        smer = (cam.location - ciel).normalized()
        cam.location = ciel + smer * (cam.location - ciel).length * k
    bpy.context.view_layer.update()
    uk, _ = premietni(cam, konce)
    cam.data.shift_x = float(uk.max()) - 0.5 + okraj_vpravo
    u, v = premietni(cam, body)
    x_img = u - cam.data.shift_x + 0.5
    vid = (x_img >= 0.0) & (x_img <= 1.0)
    vmin, vmax = float(v[vid].min()), float(v[vid].max())
    if vyska is None:
        vyska = int(round(sirka * (vmax - vmin) * (1 + 2 * okraj) / 2.0)) * 2
    cam.data.shift_y = 0.5 * (vmax + vmin)
    sc.render.resolution_y = vyska
    # kontrola: zadný koniec tela musí byť za ľavým okrajom
    xz = -model.L / 1.0
    zad = np.column_stack([np.full_like(t, xz + xp), R * np.cos(t), R * np.sin(t)]) * MM
    uz, _ = premietni(cam, zad)
    if float((uz - cam.data.shift_x + 0.5).max()) > 0.0:
        print("Pozor: zadný koniec tela je v zábere, treba dlhšie telo (--dlzka)")
    return vyska


def zarovnaj_kameru(cam, body, ciel, sirka, okraj=0.04, vyska=None):
    """Vzdialenosť kamery tak, aby sa výrobok zmestil do šírky (perspektíva sa nemení s ohniskom),
    potom posun objektívu do stredu. Vracia výšku snímky v px."""
    sc = bpy.context.scene
    cam.data.shift_x = cam.data.shift_y = 0.0
    ciel = Vector(ciel)
    for _ in range(8):
        bpy.context.view_layer.update()
        u, v = premietni(cam, body)
        su = (u.max() - u.min()) * (1 + 2 * okraj)
        sv_ = (v.max() - v.min()) * (1 + 2 * okraj)
        k = su if vyska is None else max(su, sv_ * sirka / vyska)
        smer = (cam.location - ciel).normalized()
        cam.location = ciel + smer * (cam.location - ciel).length * k
    bpy.context.view_layer.update()
    u, v = premietni(cam, body)
    cam.data.shift_x = 0.5 * (u.max() + u.min())
    cam.data.shift_y = 0.5 * (v.max() + v.min())
    if vyska is None:
        vyska = int(round(sirka * (v.max() - v.min()) * (1 + 2 * okraj) / 2.0)) * 2
    sc.render.resolution_y = vyska
    return vyska


# =============================================================================================
# Stavba modelu
# =============================================================================================
class Potrubie:
    """Celý výrobok: skupiny plášť, pena, rúry (každá má prázdny objekt rodiča na posun)."""

    def __init__(self, rad, variant, a, dlzka_mm=None):
        self.rad, self.variant, self.a = rad, variant, a
        self.D = float(variant.get("plast_mm") or priemer_z_kodu(variant["obj_cislo"]))
        self.rury = rury_variantu(rad, variant)
        self.kvalita = a.kvalita
        self.dlzka_mm = dlzka_mm                 # pevná dĺžka tela v mm (rodina); inak a.dlzka * D
        self._rozlozene = False

    def rozloz(self):
        """Poloha, natočenie a presah rúr (čistá geometria, bez Blendera). Volá sa raz."""
        if self._rozlozene:
            return self
        a, D = self.a, self.D
        r_i = D / 2.0 - PLAST["hrubka"] * D
        rozmiestni_rury(self.rad["id"], self.rury, r_i - 0.1)
        self.x_pena = -PLAST["zapustenie_peny"] * D
        natocenie, mierka = (a.natocenie, 1.0) if a.natocenie_dane else self.vyber_natocenie(a.natocenie, self.x_pena)
        self.natocenie = natocenie
        rot = math.radians(natocenie)
        for r in self.rury:
            v, w = r.v, r.w
            r.v, r.w = v * math.cos(rot) - w * math.sin(rot), v * math.sin(rot) + w * math.cos(rot)
        for r, pr in zip(self.rury, self._presahy(mierka=mierka)):
            r.presah = pr
        self._rozlozene = True
        return self

    def postav(self):
        a, D = self.a, self.D
        sc = bpy.context.scene
        L_ziad = self.dlzka_mm if self.dlzka_mm else a.dlzka * D
        q = self.kvalita
        # hustota siete podľa výstupu: pri 3200 px treba jemnejšie oblúky aj viac dielikov po obvode
        sirka = a.sirka or 1600
        krok = {"nahlad": 7.0, "studio": 4.5 if sirka <= 1700 else 3.0, "makro": 2.0}[q]
        seg = {"nahlad": 256, "studio": max(720, int(0.75 * sirka)), "makro": 2048}[q]
        if a.krok:
            krok = a.krok
        if a.segmenty:
            seg = a.segmenty
        prof, mat, L, rz = profil_plasta(D, L_ziad, krok_deg=krok, krok_daleko=a.krok_daleko,
                                         rebra_blizko=a.rebra_blizko)
        self.L, self.rz = L, rz
        R, r_i = rz["R"], rz["r_i"]
        self.skupiny = {}
        for meno in ("plast", "pena", "rury"):
            e = bpy.data.objects.new(f"skupina_{meno}", None)
            sc.collection.objects.link(e)
            self.skupiny[meno] = e
        self.objekty = []

        def pridaj(meno, me, skupina, materialy):
            o = bpy.data.objects.new(meno, me)
            sc.collection.objects.link(o)
            o.parent = self.skupiny[skupina]
            for m in materialy:
                o.data.materials.append(m)
            self.objekty.append(o)
            return o

        # plášť (v makre plášťa aj s dutinami komôr; pri --prierez len polovica s reznými plochami)
        uhly = (math.pi / 2, 3 * math.pi / 2) if a.prierez else None
        seg_p = seg // 2 if a.prierez else seg
        casti = [rotacne_polia(prof, seg_p, mat_hrany=mat, uhly=uhly)]
        komory = profily_komor(rz, krok_deg=krok) if a.komory else []
        for pk_ in komory:
            casti.append(rotacne_polia(pk_, seg_p, mat_hrany=[0] * len(pk_), uhly=uhly))
        if a.prierez:
            for u_ in uhly:
                casti.append(viecko_prierezu(prof, komory, u_, hustota=max(0.4, rz["P"] / 30)))
        me = mesh_z_poli("plast", *spoj_polia(*casti))
        o_plast = pridaj("plast", me, "plast", [mat_plast(False), mat_plast(True)])
        # drobný otrep po píle na vnútornej hrane rezu (tenký roztrhaný lem, miestami chýba)
        me = otrep_mesh(rz, seg * 2)
        if me is not None:
            pridaj("otrep", me, "plast", [o_plast.data.materials[1]])
        if a.zarez:
            self._zarez(o_plast, rz)
        if a.len_plast:
            self.x_pena = -PLAST["zapustenie_peny"] * D
            for r in self.rury:
                r.presah = 0.0
            return self

        # rúry a ich poloha
        r_pena = r_i - 0.1
        self.rozloz()
        x_pena = self.x_pena
        x_zad = -L + 2.0
        mats_cache = {}
        for i, r in enumerate(self.rury):
            x_pred = x_pena + r.presah
            prof_r, mat_r = profil_rury(r.d, r.s, x_pred, x_zad, krok_deg=krok, druh=r.druh)
            seg_r = max(96, int(seg * r.d / D * 1.6))
            me = rotacne_teleso(f"rura_{i}", prof_r, seg_r, mat_hrany=mat_r)
            # čiara potlače na boku obrátenom ku kamere (navrchu by vyzerala ako šev), každá rúra inde
            ciara_uhol = (205.0 if a.azimut >= 0 else -25.0) + 23.0 * i
            kluc = (r.druh, round(r.d, 1), i if r.druh.startswith("pexa") else 0)
            if kluc not in mats_cache:
                mats_cache[kluc] = [mat_rura(r.druh, c, r.d, ciara_uhol) for c in range(3)]
            o = pridaj(f"rura_{i}", me, "rury", mats_cache[kluc])
            o.location = (0.0, r.v * MM, r.w * MM)

        # pena: čelo (posunutie povrchu) a telo (koža, otvory)
        fil = min(1.2, 0.3 * (r_pena - max(math.hypot(r.v, r.w) + r.d / 2 for r in self.rury)))
        diery = [(r.v, r.w, r.d / 2 + 0.05) for r in self.rury]
        me = celo_peny_mesh("pena_celo", r_pena - fil, diery, x_pena,
                            hustota={"nahlad": 6.0, "studio": 3.0, "makro": 1.5}[q],
                            krok_okraja={"nahlad": 1.5, "studio": 0.6, "makro": 0.25}[q])
        o = pridaj("pena_celo", me, "pena", [mat_pena_celo({k: v for k, v in (("bunka", a.bunka), ("styl", a.pena_styl), ("r_okraj", r_pena)) if v is not None})])
        if q != "nahlad":
            mod = o.modifiers.new("delenie", "SUBSURF")
            mod.subdivision_type = "SIMPLE"
            mod.levels = 0
            mod.render_levels = 1
            mod.use_adaptive_subdivision = True
            mod.adaptive_space = "PIXEL"
            mod.adaptive_pixel_size = 1.0
        # telo peny: vonkajšia koža so zaoblením pri čele
        pk = zaobli([(x_pena, r_pena - fil), (x_pena, r_pena), (x_zad, r_pena)], [0, fil, 0], krok_deg=krok, uzavrety=False)
        me = rotacne_teleso("pena_telo", pk, seg, uzavrety=False)
        mat_t = mat_pena_plast()
        pridaj("pena_telo", me, "pena", [mat_t])
        for i, r in enumerate(self.rury):
            pd = np.array([(x_zad, r.d / 2 + 0.05), (x_pena, r.d / 2 + 0.05)])
            me = rotacne_teleso(f"pena_otvor_{i}", pd, max(64, int(seg * r.d / D)), uzavrety=False)
            # otvor: normály dovnútra otvoru (k osi rúry)
            o = pridaj(f"pena_otvor_{i}", me, "pena", [mat_t])
            o.location = (0.0, r.v * MM, r.w * MM)
        return self

    def _zarez(self, o_plast, rz):
        """Zárez pílou cez tri vrcholy vĺn na strane ku kamere (ako foto v katalógu, s. 5):
        odhalí dutiny komôr a obe steny. Booleovský rozdiel s kvádrom (presný riešič)."""
        R, P, r_i, ti = rz["R"], rz["P"], rz["r_i"], rz["ti"]
        uhol = math.radians(self.a.zarez_uhol)
        x1, x2 = -1.0 * P, -4.0 * P                     # od drážky po drážku: rez prejde tromi komorami
        r_dno = r_i - 1.0                               # cez celý plášť
        sirka = self.a.zarez_sirka * R                  # široký zárez: bližšia strana nezacláňa rez
        hlbka = R + 6.0 - r_dno
        me = bpy.data.meshes.new("zarez")
        hx, hy, hz = 0.5 * (x1 - x2), 0.5 * sirka, 0.5 * hlbka
        v = [(-hx, -hy, -hz), (hx, -hy, -hz), (hx, hy, -hz), (-hx, hy, -hz),
             (-hx, -hy, hz), (hx, -hy, hz), (hx, hy, hz), (-hx, hy, hz)]
        f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
        me.from_pydata([tuple(c * MM for c in p) for p in v], [], f)
        rez = bpy.data.objects.new("zarez", me)
        bpy.context.scene.collection.objects.link(rez)
        rez.parent = self.skupiny["plast"]
        stred_r = r_dno + hz
        # kváder: os Z smeruje radiálne von pod uhlom 'uhol' v rovine YZ (0 = +Y, 90 = +Z)
        rez.rotation_euler = (uhol - math.pi / 2, 0.0, 0.0)
        rez.location = (0.5 * (x1 + x2) * MM, stred_r * math.cos(uhol) * MM, stred_r * math.sin(uhol) * MM)
        rez.data.materials.append(o_plast.data.materials[1])
        rez.hide_render = True
        rez.display_type = "WIRE"
        mod = o_plast.modifiers.new("zarez", "BOOLEAN")
        mod.operation = "DIFFERENCE"
        mod.object = rez
        mod.solver = "EXACT"
        try:
            mod.material_mode = "TRANSFER"
        except Exception:  # noqa: BLE001
            pass
        self.zarez_obj = rez

    def ref_pohlad(self):
        """Referenčný štúdiový pohľad (azimut, elevácia v radiánoch) pre rozhodnutia o geometrii:
        natočenie rúr a ich presah. Všetky výrezy (celé telo, detail, čelný pohľad, makrá) tak
        ukazujú ten istý výrobok; strana sa riadi znamienkom azimutu."""
        return math.radians(42.0 if self.a.azimut >= 0 else -42.0), math.radians(18.0)

    def _presahy(self, rury=None, mierka=1.0):
        """Presah rúr pred čelo peny (mm). Pri troch a viac rúrach vyčnievajú rúry vzdialenejšie od
        kamery viac, aby ich konce nezakryli bližšie rúry (ako na štúdiovej fotke rodiny potrubí).
        Kábel (COOL s káblom) vyčnieva ďalej ako rúra, ako na renderi Watts."""
        a = self.a
        rury = self.rury if rury is None else rury
        az, el = self.ref_pohlad()
        ku_kamere = (-math.cos(el) * math.sin(az), math.sin(el))          # smer ku kamere v reze (v, w)
        hlbky = [r.v * ku_kamere[0] + r.w * ku_kamere[1] for r in rury]
        hmax = max((abs(h) for h in hlbky), default=1.0) or 1.0
        hlavne = [r for r in rury if r.druh != "kabel"]
        out = []
        for i, r in enumerate(rury):
            if a.presah is not None:
                base = a.presah * r.d
            elif r.druh == "kabel":
                base = min(min(0.75 * hlavne[0].d + 6, 0.45 * self.D) + 0.2 * self.D, 0.6 * self.D)
            elif len(hlavne) == 1:
                base = min(0.75 * r.d + 6, 0.45 * self.D)
            elif len(hlavne) == 2:
                base = min(1.75 * r.d + 8, 0.45 * self.D)
            else:
                base = 1.1 * r.d + 6
            if len(hlavne) > 2 and r.druh != "kabel":
                stup = 0.30 * r.d * (1.0 - hlbky[i] / hmax)              # vzdialenejšie dlhšie
            elif r.druh == "kabel":
                stup = 0.0
            else:
                stup = (0.0, 0.10)[i % 2] * r.d
            out.append((base + stup) * mierka)
        return out

    def _premietni_ref(self, body):
        """Body (n, 3) v mm -> súradnice v referenčnom pohľade (ortogonálne: vpravo, hore)."""
        az, el = self.ref_pohlad()
        vpravo = np.array([math.sin(az), math.cos(az), 0.0])
        f = -np.array([math.cos(el) * math.cos(az), -math.cos(el) * math.sin(az), math.sin(el)])
        hore = np.cross(vpravo, f)
        return np.column_stack([body @ vpravo, body @ hore])

    def vyber_natocenie(self, zaklad, x_pena):
        """Natočenie rúr v reze tak, aby koniec bielej rúry v štúdiovom pohľade nevyčnieval mimo
        obrys plášťa (biela by splynula s bielym pozadím; žltá a čierna sa odlíšia samy). Pri dvoch
        rúrach sa hľadá najbližšie vyhovujúce natočenie k základnému (rúry nad sebou ako na
        renderoch Watts), pri troch a viac sa uprednostnia biele rúry vľavo hore nad sivou penou.
        Ak nevyhovuje nič, presah sa mierne skráti. Vracia (natočenie v stupňoch, mierka presahu)."""
        R = self.D / 2.0
        hlavne = [r for r in self.rury if r.druh != "kabel"]
        if len(hlavne) < 2 or not any(r.druh == "pexa-biela" for r in self.rury):
            # jedna rúra (natočenie nič nemení) alebo žiadna biela rúra: žltá a čierna sa od bieleho
            # pozadia odlíšia samy, ostáva základné natočenie a plný presah
            return zaklad, 1.0
        t = np.linspace(0, 2 * math.pi, 96, endpoint=False)
        obrys = self._premietni_ref(np.column_stack([np.zeros_like(t), R * np.cos(t), R * np.sin(t)]))
        stred = obrys.mean(0)
        obrys_m = stred + (obrys - stred) * 0.955                      # rezerva pri okraji
        zaklad_pol = [(r.v, r.w) for r in self.rury]
        biele = [i for i, r in enumerate(self.rury) if r.druh == "pexa-biela"]

        def otoc(uhol):
            c, s_ = math.cos(math.radians(uhol)), math.sin(math.radians(uhol))
            out = []
            for r, (v, w) in zip(self.rury, zaklad_pol):
                out.append(Rura(r.d, r.s, r.druh, v * c - w * s_, v * s_ + w * c))
            return out

        def posud(uhol, mierka):
            rr = otoc(uhol)
            pres = self._presahy(rr, mierka)
            ok, skore = True, 0.0
            for i, (r, pr) in enumerate(zip(rr, pres)):
                kruh = np.column_stack([np.full_like(t, x_pena + pr), r.v + r.d / 2 * np.cos(t), r.w + r.d / 2 * np.sin(t)])
                q = self._premietni_ref(kruh)
                if i in biele and not vnutri_polygonu(q, obrys_m).all():
                    ok = False                                       # biela rúra mimo obrysu splynie s pozadím
                if i in biele:
                    c = q.mean(0) - stred
                    skore += (-c[0] + c[1]) / R                      # vľavo hore = lepšie
            return ok, skore

        kandidati = sorted(np.arange(-180.0, 180.0, 3.0), key=lambda d: abs(d))
        for mierka in (1.0, 0.9, 0.8, 0.7, 0.55, 0.4):
            posudky = [(d, posud(zaklad + d, mierka)) for d in kandidati]
            vyhovuju = [(d, sk) for d, (ok, sk) in posudky if ok]
            if not vyhovuju:
                continue
            if biele and len(hlavne) > 2:
                najlepsi = max(vyhovuju, key=lambda x: (round(x[1], 2), -abs(x[0])))
            else:
                najlepsi = vyhovuju[0]
            uhol = zaklad + najlepsi[0]
            if najlepsi[0] != 0 or mierka != 1.0:
                print(f"Natočenie rúr {uhol:.0f}° (základ {zaklad:.0f}°), presah x{mierka:.2f}: konce rúr vo vnútri obrysu plášťa")
            return uhol, mierka
        print("Pozor: konce rúr sa nepodarilo dostať do obrysu plášťa, ostáva základné natočenie")
        return zaklad, 1.0

    def nastav_fazu(self, faza):
        """Rozložený pohľad: 0 = zložené, 1 = vrstvy rozostúpené pozdĺž osi."""
        D = self.D

        def krivka(t, zac, dlz):
            x = min(1.0, max(0.0, (t - zac) / dlz))
            return x * x * (3 - 2 * x)

        self.skupiny["plast"].location.x = -0.62 * D * krivka(faza, 0.0, 0.75) * MM
        self.skupiny["pena"].location.x = 0.10 * D * krivka(faza, 0.10, 0.75) * MM
        self.skupiny["rury"].location.x = 0.62 * D * krivka(faza, 0.25, 0.75) * MM
        bpy.context.view_layer.update()


# =============================================================================================
# Pohľady a render
# =============================================================================================
def tienovy_podklad(D, L):
    me = bpy.data.meshes.new("podlaha")
    s = 3.0 * max(D, L) * MM
    me.from_pydata([(-s, -s, 0), (s, -s, 0), (s, s, 0), (-s, s, 0)], [], [(0, 1, 2, 3)])
    o = bpy.data.objects.new("podlaha", me)
    bpy.context.scene.collection.objects.link(o)
    o.location = (-0.4 * L * MM, 0.0, -D / 2 * MM)
    return o


def render(cesta):
    sc = bpy.context.scene
    cesta = Path(cesta)
    cesta.parent.mkdir(parents=True, exist_ok=True)
    sc.render.filepath = str(cesta)
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    dt = time.time() - t0
    print(f"HOTOVO {cesta.name}: {sc.render.resolution_x} x {sc.render.resolution_y} px, {dt:.1f} s")
    return dt


def render_tien(model, podlaha, cesta, vzorky, podlaha_biela=None, a=None):
    """Samostatná vrstva mäkkého kontaktného tieňa (RGBA: čierna s alfou) pre web.

    Výrobok je pre kameru neviditeľný, ale vrhá tieň; podlaha je lapač tieňa. Svieti len
    rovnomerné okolie (ako veľký strop softboxov): tieň je najtmavší pri dotyku s podlahou
    a plynulo slabne do strán, bez tmavej plochy pod celým telom. Potom sa upraví:
    - prah a krivka: slabý široký dosvit okolia zmizne, ostane kontaktný tieň,
    - sila: celkovo svetlý tieň (web ho násobí pod renderom),
    - okraje: alfa plynulo klesne na nulu ďaleko pred okrajom obrázka (žiadna ostrá hrana)."""
    sc = bpy.context.scene
    povodne = sc.cycles.samples
    svetla = [o for o in sc.objects if o.type == "LIGHT"]
    for l in svetla:
        l.hide_render = True
    for o in model.objekty:
        o.visible_camera = False
    if podlaha_biela is not None:
        podlaha_biela.hide_render = True
    # rovnomerné biele okolie namiesto štúdia
    svet_povodny = sc.world
    w = bpy.data.worlds.new("tien_okolie")
    if w.node_tree is None:
        try:
            w.use_nodes = True
        except Exception:  # noqa: BLE001
            pass
    u = Uzly(w.node_tree)
    bg = u.uzol("ShaderNodeBackground", {"Color": (1.0, 1.0, 1.0, 1.0), "Strength": 1.0})
    u.nt.links.new(bg.outputs[0], u.uzol("ShaderNodeOutputWorld").inputs["Surface"])
    sc.world = w
    podlaha.hide_render = False
    podlaha.is_shadow_catcher = True
    sc.cycles.samples = vzorky
    dt = render(cesta)
    sc.world = svet_povodny
    bpy.data.worlds.remove(w)
    for o in model.objekty:
        o.visible_camera = True
    podlaha.hide_render = True
    sc.cycles.samples = povodne
    for l in svetla:
        l.hide_render = False
    if podlaha_biela is not None:
        podlaha_biela.hide_render = False
    uprav_tien(cesta, sila=a.tien_sila if a else 0.55, prah=a.tien_prah if a else 0.12,
               okraj=a.tien_okraj if a else 0.03, okraje=a.tien_okraje if a else "lhpd")
    return dt


def uprav_tien(cesta, sila=0.55, prah=0.12, gama=1.35, okraj=0.03, nabeh=0.06, okraje="lhpd"):
    """Úprava alfy tieňa v PNG: alfa = sila * (max(0, a - prah) / (1 - prah)) ** gama, potom
    plynulý pokles na nulu pri všetkých okrajoch (nulová v pásme 'okraj', nábeh ďalších 'nabeh'
    podielu rozmeru). Farba ostáva čierna. Robí sa v Blenderi (numpy), nič ďalšie netreba."""
    img = bpy.data.images.load(str(cesta), check_existing=False)
    W, H = img.size
    px = np.empty(W * H * 4, np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(H, W, 4)
    alfa = px[..., 3]
    alfa = np.clip((alfa - prah) / (1.0 - prah), 0.0, 1.0) ** gama * sila

    def rampa(n, zaciatok, koniec):
        """Nábeh od okrajov: zaciatok/koniec = či má okraj na začiatku/konci osi nábeh."""
        t = (np.arange(n, dtype=np.float32) + 0.5) / n
        d = np.full(n, np.inf, dtype=np.float32)
        if zaciatok:
            d = np.minimum(d, t)
        if koniec:
            d = np.minimum(d, 1.0 - t)
        x = np.clip((d - okraj) / nabeh, 0.0, 1.0)
        return x * x * (3.0 - 2.0 * x)

    # obrázok v Blenderi začína dolným riadkom: os 0 ide zdola (d = dolný okraj), os 1 zľava
    alfa *= rampa(H, "d" in okraje, "h" in okraje)[:, None] * rampa(W, "l" in okraje, "p" in okraje)[None, :]
    px[..., 0:3] = 0.0
    px[..., 3] = alfa
    img.pixels.foreach_set(px.ravel())
    img.filepath_raw = str(cesta)
    img.file_format = "PNG"
    img.save()
    bpy.data.images.remove(img)


def body_tiena(body, D, dosah=0.9):
    """Body na podlahe okolo pôdorysu výrobku, kam ešte siaha kontaktný tieň (dosah v násobkoch D
    od osi): kamera ich zahrnie do záberu, takže tieň dobehne do nuly vnútri obrázka."""
    x0, x1 = body[:, 0].min() - 0.12 * D * MM, body[:, 0].max() + 0.12 * D * MM
    xs = np.linspace(x0, x1, 24)
    ys = np.array([-dosah, -0.5 * dosah, 0.0, 0.5 * dosah, dosah]) * D * MM
    X, Y = np.meshgrid(xs, ys)
    return np.column_stack([X.ravel(), Y.ravel(), np.full(X.size, -D / 2 * MM)])


def kluc_body(model, cam):
    """2D polohy dôležitých bodov (px) pre kóty na webe: stred čela, okraj plášťa, rúry."""
    sc = bpy.context.scene
    W, H = sc.render.resolution_x, sc.render.resolution_y
    sx, sy = cam.data.shift_x, cam.data.shift_y

    koren = getattr(model, "koren", None)
    posun = np.array(koren.matrix_world.translation) if koren is not None else np.zeros(3)

    def px(pts):
        pts = np.asarray(pts, float) + posun
        u, v = premietni(cam, pts)
        return [[round(float((uu - sx + 0.5) * W), 1), round(float(H / 2 - (vv - sy) * W), 1)] for uu, vv in zip(u, v)]

    def kruh(x, cv, cw, r, n=16):
        return [(x * MM, (cv + r * math.cos(t)) * MM, (cw + r * math.sin(t)) * MM)
                for t in np.linspace(0, 2 * math.pi, n, endpoint=False)]

    xp = model.skupiny["plast"].location.x / MM
    xr = model.skupiny["rury"].location.x / MM
    out = {"plast_celo_stred": px([(xp * MM, 0, 0)])[0], "plast_okraj": px(kruh(xp, 0, 0, model.D / 2)), "rury": []}
    for r in model.rury:
        xx = model.x_pena + r.presah + xr
        out["rury"].append({"d": r.d, "s": r.s, "druh": r.druh, "stred": px([(xx * MM, r.v * MM, r.w * MM)])[0],
                            "okraj": px(kruh(xx, r.v, r.w, r.d / 2))})
    return out


def makro_kamera(cam, ciel_mm, azimut, elevacia, pole_mm):
    """Kamera blízko bodu ciel_mm; pole_mm je šírka záberu v rovine cieľa (mm)."""
    c = cam.data
    c.shift_x = c.shift_y = 0.0
    c.clip_start = 0.002
    vzd = pole_mm * c.lens / c.sensor_width
    az, el = math.radians(azimut), math.radians(elevacia)
    smer = Vector((math.cos(el) * math.cos(az), -math.cos(el) * math.sin(az), math.sin(el)))
    cam.location = Vector(ciel_mm) * MM + smer * vzd * MM
    cam.rotation_euler = (-smer).to_track_quat("-Z", "Y").to_euler()
    bpy.context.view_layer.update()
    return vzd


def vypln_zaber(cam, ciel_mm, azimut, elevacia, pole_mm, docasny, kroky=10):
    """Makro má byť vyplnené výrobkom až do rohov (web ho dá do kruhu, JPG bez priehľadnosti).

    Rýchly náhľad 72 px s jednou vzorkou: ak je niekde priehľadné pozadie, posunie cieľ od neho
    a mierne priblíži; opakuje, kým nie je záber plný. Vracia (ciel_mm, pole_mm)."""
    sc = bpy.context.scene
    zal = (sc.render.resolution_x, sc.render.resolution_y, sc.cycles.samples, sc.cycles.use_denoising,
           sc.cycles.use_adaptive_sampling, sc.render.filepath)
    sc.render.resolution_x = sc.render.resolution_y = 72
    sc.cycles.samples = 1
    sc.cycles.use_denoising = False
    sc.cycles.use_adaptive_sampling = False
    ciel = Vector(ciel_mm)
    docasny = Path(docasny)
    docasny.parent.mkdir(parents=True, exist_ok=True)
    try:
        for _ in range(kroky):
            makro_kamera(cam, ciel, azimut, elevacia, pole_mm)
            sc.render.filepath = str(docasny)
            bpy.ops.render.render(write_still=True)
            img = bpy.data.images.load(str(docasny), check_existing=False)
            px = np.array(img.pixels[:], dtype=np.float32).reshape(img.size[1], img.size[0], 4)
            bpy.data.images.remove(img)
            pozadie = px[..., 3] < 0.98
            if not pozadie.any():
                break
            ys, xs = np.nonzero(pozadie)
            # ťažisko pozadia vzhľadom na stred (y obrázka ide zdola nahor)
            dx = (xs.mean() - 35.5) / 72.0
            dy = (ys.mean() - 35.5) / 72.0
            M = cam.matrix_world.to_3x3()
            vpravo, hore = M.col[0], M.col[1]
            krok = 0.10 * pole_mm
            ciel = ciel - (vpravo * dx + hore * dy).normalized() * krok * min(1.0, 4.0 * math.hypot(dx, dy) + 0.4)
            pole_mm *= 0.97
    finally:
        (sc.render.resolution_x, sc.render.resolution_y, sc.cycles.samples, sc.cycles.use_denoising,
         sc.cycles.use_adaptive_sampling, sc.render.filepath) = zal
    makro_kamera(cam, ciel, azimut, elevacia, pole_mm)
    return tuple(ciel), pole_mm


def volne_miesto_peny(model, smer_v=1.0):
    """Bod na čele peny najďalej od rúr aj od okraja (na strane ku kamere). Vracia (v, w, voľno)."""
    r_p = model.rz["r_i"] - 1.5
    naj = (0.0, 0.0, -1.0)
    for v in np.linspace(-r_p, r_p, 121):
        for w in np.linspace(-r_p, r_p, 121):
            rr = math.hypot(v, w)
            if rr > r_p:
                continue
            vol = r_p - rr
            for r in model.rury:
                vol = min(vol, math.hypot(v - r.v, w - r.w) - r.d / 2)
            vol += 0.08 * smer_v * v + 0.04 * w   # mierne uprednostni stranu ku kamere a hore
            if vol > naj[2]:
                naj = (v, w, vol)
    return naj


# rodina pre domov a stránku Potrubia: šesť systémov, všetky s plášťom 160 mm (vyrovnaný rad
# ako na fotke v katalógu s. 6); UNO a COOL vo veľkosti 160, aby nepôsobili ako menejcenné
RODINA = (("microflex-uno-6-bar", "M16075C"), ("microflex-duo-6-bar", "MD16032C"),
          ("microflex-duo-10-bar", "MD1603225SWI"), ("microflex-quadro", "MQ16032C2520S"),
          ("microflex-cool", "M16075PE"), ("microflex-hp", "MQ16032C3225E"))


def rodina(a, sc, out, zaznam):
    """Spoločný záber šiestich systémov: rúry rovnobežne vedľa seba, rezy ku kamere, každá ďalšia
    o kus ďalej (diagonálny rad ako skutočná fotka v katalógu s. 6), rovnaké štúdio, široký pomer
    strán, vrstva tieňa a JSON s bodmi rezu pre každú rúru."""
    zoznam = [tuple(x.split(":")) for x in a.rodina.split(",")] if a.rodina else list(RODINA)
    modely = []
    for rad_id, obj in zoznam:
        rad, variant = nacitaj_variant(rad_id, obj)
        modely.append((rad, variant))
    Dmax = max(float(v.get("plast_mm") or priemer_z_kodu(v["obj_cislo"])) for _, v in modely)
    dlzka_mm = a.rodina_dlzka * Dmax
    medzera, krok_x = 0.12 * Dmax, a.rodina_krok * Dmax
    # Poradie zľava doprava = poradie v zozname. Kamera je na strane -Y (azimut > 0, rezy vpravo
    # ako na ostatných renderoch): vľavo je rúra najbližšie ku kamere, každá ďalšia je ďalej od
    # kamery (+Y) a o krok vpredu (+X). Bližšia rúra je tak vždy celá za rovinou rezu ďalšej,
    # takže nezakryje žiadny rez (ako fotka s. 6, zrkadlovo); vzdialenejšie telá vykúkajú nad bližšími.
    strana = 1.0 if a.azimut >= 0 else -1.0
    sirka_povodna = a.sirka
    a.sirka = 1000                    # hustota siete: jedna rúra zaberá len časť záberu
    postavene, y = [], 0.0
    for i, (rad, variant) in enumerate(modely):
        m = Potrubie(rad, variant, a, dlzka_mm=dlzka_mm).postav()
        if i > 0:
            y += (0.5 * (postavene[-1].D + m.D) + medzera) * strana
        koren = bpy.data.objects.new(f"koren_{i}", None)
        sc.collection.objects.link(koren)
        for g in m.skupiny.values():
            g.parent = koren
        # všetky ležia na spoločnej podlahe z = -Dmax / 2
        koren.location = (i * krok_x * MM, y * MM, -(Dmax - m.D) / 2 * MM)
        m.koren = koren
        postavene.append(m)
    a.sirka = sirka_povodna
    for m in postavene:                      # rad do stredu: štúdio je postavené okolo osi x
        m.koren.location.y -= 0.5 * y * MM
        m.koren.location.x -= (len(postavene) - 1) * krok_x * MM
    bpy.context.view_layer.update()
    L_eff = dlzka_mm + (len(postavene) - 1) * krok_x
    return postavene, Dmax, L_eff


class _Skupina:
    """Viac modelov ako jeden pre tieň (render_tien potrebuje len zoznam objektov)."""

    def __init__(self, modely):
        self.objekty = [o for m in modely for o in m.objekty]


def hlavny(a):
    if a.farba_plast:
        FARBY["plast"] = tuple(float(x) for x in a.farba_plast.split(","))
    if a.farba_biela:
        FARBY["pexa_biela"] = tuple(float(x) for x in a.farba_biela.split(","))
    if a.hrana_drsnost is not None:
        PLAST_HRANA[0] = a.hrana_drsnost
    if a.sss_plast:
        PLAST_SSS[:] = [float(x) for x in a.sss_plast.split(",")]
    else:
        PLAST_SSS[:] = PLAST_SSS_MAKRO if a.pohlad == "makro-plast" else PLAST_SSS_STUDIO
    rad, variant = nacitaj_variant(a.rad, a.obj)
    print(f"Rad {rad['id']}, variant {variant['obj_cislo']}: plášť {variant.get('plast_mm') or priemer_z_kodu(variant['obj_cislo']):g} mm, "
          f"rúry {variant.get('rura') or variant.get('rura_text')}")
    sc = vycisti_scenu()
    if a.pohlad == "rodina":
        return hlavny_rodina(a, sc)
    model = Potrubie(rad, variant, a).postav()
    D, L = model.D, model.L
    sirka = a.sirka or 1600
    nastav_render(sc, a, sirka, sirka, a.vzorky)
    svet(sc, a.svet * (0.15 if a.pohlad == "makro-plast" else 1.0), pozadie=a.pozadie)
    if a.pozadie:
        sc.render.film_transparent = False
    if not (a.pohlad == "makro-plast" and a.prierez):
        studiove_svetla(D, L, a.svetlo, strana=1.0 if a.azimut >= 0 else -1.0,
                        jasy={"kluc": a.jas_kluc, "vypln": a.jas_vypln_st, "kontra": a.jas_kontra_st, "celo": a.jas_celo,
                              "kluc_sirka": a.kluc_sirka, "kluc_y": a.kluc_y})
    podlaha_biela = biela_podlaha(D, L) if a.pohlad in ("studio", "rozlozeny") else None
    podlaha = tienovy_podklad(D, L)
    podlaha.hide_render = True
    out = Path(a.out or (REPO / "data" / "_3d" / "skusky" / f"{a.pohlad}-{variant['obj_cislo']}.png"))
    if not out.is_absolute():
        out = REPO / out
    # kamera mieri na stred čela: azimut a elevácia teda určujú, pod akým uhlom vidno rez
    # (rovnaký pohľad na čelo pri akomkoľvek výreze); výrez sa robí posunom objektívu
    ciel = (0.0, 0.0, 0.0)
    cam = kamera(sc, a.azimut, a.elevacia, ciel, a.ohnisko)
    zaznam = {"rad": rad["id"], "obj_cislo": variant["obj_cislo"], "plast_mm": D,
              "rury": [dict(d=r.d, s=r.s, druh=r.druh) for r in model.rury], "pohlad": a.pohlad,
              "vzorky": a.vzorky, "kamera": dict(azimut=a.azimut, elevacia=a.elevacia, ohnisko=a.ohnisko),
              "blender": bpy.app.version_string, "geometria": GEOMETRIA, "casy_s": {}}

    if a.pohlad in ("studio", "rozlozeny"):
        fazy = [a.faza] if a.snimky <= 1 else [i / (a.snimky - 1) for i in range(a.snimky)]
        ramec = a.ramec or ("rozlozeny" if a.pohlad == "rozlozeny" else "tesny")
        if a.watts:
            cx, cy, os_, wr, hr = (float(x) for x in a.watts.split(","))
            model.nastav_fazu(fazy[0])
            ramec_ako_watts(cam, D, 0.0, (cx, cy, os_), int(wr), int(hr))
            body = None
        elif ramec == "hero":
            model.nastav_fazu(fazy[0])
            body = body_objektov(model.objekty)
            if not a.bez_tiena:
                body = np.concatenate([body, body_tiena(body, D, a.tien_dosah)])
            ramec_hero(cam, model, body, sirka, pomer=a.hero_pomer, podiel=a.hero_podiel, okraj_vlavo=a.hero_okraj)
            body = None
        elif ramec == "jednotny":
            model.nastav_fazu(fazy[0])
            ramec_jednotny(cam, D, jednotny_ramec(a), sirka)
            body = None
        elif ramec == "detail":
            model.nastav_fazu(fazy[0])
            body = body_objektov(model.objekty)
            if not a.bez_tiena:
                body = np.concatenate([body, body_tiena(body, D, a.tien_dosah)])
            ramec_detail(cam, model, body, sirka, podiel=a.detail_podiel, okraj_vpravo=a.detail_okraj,
                         okraj=a.okraj, vyska=a.vyska)
            body = None
        elif ramec == "rozlozeny":
            model.nastav_fazu(0.0)
            b0 = body_objektov(model.objekty)
            model.nastav_fazu(1.0)
            b1 = body_objektov(model.objekty)
            body = np.concatenate([b0, b1])
        else:
            model.nastav_fazu(fazy[0])
            body = body_objektov(model.objekty)
        if body is not None:
            if not a.bez_tiena:
                body = np.concatenate([body, body_tiena(body, D, a.tien_dosah)])
            zarovnaj_kameru(cam, body, ciel, sirka, okraj=a.okraj, vyska=a.vyska)
        if a.clona:
            cam.data.dof.use_dof = True
            cam.data.dof.focus_distance = (cam.location - Vector((0, 0, 0))).length
            cam.data.dof.aperture_fstop = a.clona
        for i, f in enumerate(fazy):
            model.nastav_fazu(f)
            cesta = out if len(fazy) == 1 else out.parent / f"{out.stem}-{i:03d}{out.suffix}"
            if not a.len_tien:
                dt = render(cesta)
                zaznam["casy_s"][cesta.name] = round(dt, 1)
            if not a.bez_tiena:
                ct = cesta.with_name(cesta.stem + "-tien" + cesta.suffix)
                zaznam["casy_s"][ct.name] = round(render_tien(model, podlaha, ct, max(96, a.vzorky // 4), podlaha_biela, a), 1)
            zaznam.setdefault("body_px", {})[cesta.name] = kluc_body(model, cam)
    else:
        # makro zábery do kruhových líp: štvorec vyplnený materiálom vrstvy
        model.nastav_fazu(0.0)
        sc.render.resolution_x = sc.render.resolution_y = a.sirka or 1200
        rz = model.rz
        if a.pohlad == "makro-pena":
            v, w, vol = volne_miesto_peny(model, smer_v=-1.0)   # strana ku kamere: rúry nezacláňajú
            ciel_mm = (model.x_pena, v, w)
            pole = a.pole or min(34.0, 1.5 * vol)
            az, el = (a.azimut if a.azimut_dany else 18.0), (a.elevacia if a.elevacia_dany else 22.0)
        elif a.pohlad == "makro-rura":
            r = max(model.rury, key=lambda r: (r.w + 0.3 * r.v))   # horná rúra ako na renderoch
            # pohľad skoro pozdĺž rúry: za koncom rúry je čelo peny, nie pozadie
            ciel_mm = (model.x_pena + r.presah - 0.2 * r.d, r.v, r.w)
            pole = a.pole or 1.8 * r.d
            az, el = (a.azimut if a.azimut_dany else 14.0), (a.elevacia if a.elevacia_dany else 22.0)
        elif a.prierez:  # makro-plast: plášť rozrezaný pozdĺž osi, kamera na odrezanej strane
            az, el = a.azimut, a.elevacia
            ciel_mm = (-2.5 * rz["P"], 0.0, rz["R"] - 0.65 * rz["T"])
            pole = a.pole or 4.2 * rz["P"]
        else:  # makro-plast so zárezom
            az, el = (a.azimut if a.azimut_dany else 80.0), (a.elevacia if a.elevacia_dany else 30.0)
            # cieľ na reznej ploche zárezu obrátenej ku kamere (prierez oboch stien a komôr)
            uz = math.radians(a.zarez_uhol)
            rc = rz["R"] - 0.5 * rz["T"]
            hy = 0.5 * a.zarez_sirka * rz["R"]
            ciel_mm = (-2.5 * rz["P"], rc * math.cos(uz) + hy * math.sin(uz), rc * math.sin(uz) - hy * math.cos(uz))
            pole = a.pole or 3.6 * rz["P"]
        vzd = makro_kamera(cam, ciel_mm, az, el, pole)
        if a.pohlad == "makro-plast" and a.prierez:
            makro_svetla_plast(ciel_mm, az, el, rz, a)
        elif a.pohlad == "makro-plast":
            # svetlo vo vnútri plášťa mieri na zárez: presvitá cez tenké steny a otvorené komory
            uz = math.radians(a.zarez_uhol)
            rv_ = 0.25 * rz["R"]
            svetlo("vnutri", (-3.0 * rz["P"] * MM, -rv_ * math.cos(uz) * MM, -rv_ * math.sin(uz) * MM),
                   (-3.0 * rz["P"] * MM, rz["R"] * math.cos(uz) * MM, rz["R"] * math.sin(uz) * MM),
                   (0.6 * rz["R"] * MM, 0.6 * rz["R"] * MM), a.svetlo_vnutri, 150, farba=(0.80, 0.95, 1.0))
        if not a.pozadie:
            ciel_mm, pole = vypln_zaber(cam, ciel_mm, az, el, pole, REPO / "data" / "_3d" / "_tmp" / "alfa.png")
        vzd = pole * cam.data.lens / cam.data.sensor_width
        if a.clona:
            cam.data.dof.use_dof = True
            cam.data.dof.focus_distance = vzd * MM
            cam.data.dof.aperture_fstop = a.clona
        dt = render(out)
        zaznam["casy_s"][out.name] = round(dt, 1)
        zaznam["makro"] = dict(ciel_mm=[round(float(x), 2) for x in ciel_mm], pole_mm=round(pole, 1), azimut=az, elevacia=el)
    zaznam["rozlisenie"] = [sc.render.resolution_x, sc.render.resolution_y]
    if a.blend:
        bpy.ops.wm.save_as_mainfile(filepath=str(Path(a.blend).resolve()))
    cesta_json = out.with_suffix(".json")
    if a.len_tien and cesta_json.exists():
        # len nový tieň: doplniť čas tieňa do existujúceho záznamu, ostatné ponechať
        stary = json.loads(cesta_json.read_text(encoding="utf-8"))
        stary.setdefault("casy_s", {}).update(zaznam.get("casy_s", {}))
        zaznam = stary
    cesta_json.write_text(json.dumps(zaznam, ensure_ascii=False, indent=1), encoding="utf-8")


def hlavny_rodina(a, sc):
    """Render rodiny systémov (pozri rodina())."""
    out = Path(a.out or (REPO / "data" / "_3d" / "skusky" / "rodina.png"))
    if not out.is_absolute():
        out = REPO / out
    modely, Dmax, L_eff = rodina(a, sc, out, None)
    sirka = a.sirka or 2400
    nastav_render(sc, a, sirka, sirka, a.vzorky)
    svet(sc, a.svet)
    studiove_svetla(Dmax, L_eff, a.svetlo, strana=1.0 if a.azimut >= 0 else -1.0,
                    jasy={"kluc": a.jas_kluc, "vypln": a.jas_vypln_st, "kontra": a.jas_kontra_st, "celo": a.jas_celo,
                          "kluc_sirka": a.kluc_sirka, "kluc_y": a.kluc_y})
    podlaha_biela = biela_podlaha(Dmax, L_eff)
    podlaha = tienovy_podklad(Dmax, L_eff)
    for pl in (podlaha_biela, podlaha):
        pl.scale = (3.0, 3.0, 1.0)
    podlaha.hide_render = True
    bpy.context.view_layer.update()
    body = body_objektov([o for m in modely for o in m.objekty])
    if not a.bez_tiena:
        body = np.concatenate([body, body_tiena(body, Dmax, a.tien_dosah)])
    ciel = tuple(0.5 * (body.min(0) + body.max(0)))
    cam = kamera(sc, a.azimut, a.elevacia, ciel, a.ohnisko)
    zarovnaj_kameru(cam, body, ciel, sirka, okraj=a.okraj, vyska=a.vyska or int(round(sirka / a.rodina_pomer / 2)) * 2)
    zaznam = {"rad": "rodina", "obj_cislo": [m.variant["obj_cislo"] for m in modely],
              "rady": [m.rad["id"] for m in modely], "pohlad": "rodina", "vzorky": a.vzorky,
              "kamera": dict(azimut=a.azimut, elevacia=a.elevacia, ohnisko=a.ohnisko),
              "blender": bpy.app.version_string, "geometria": GEOMETRIA, "casy_s": {}}
    zaznam["casy_s"][out.name] = round(render(out), 1)
    if not a.bez_tiena:
        ct = out.with_name(out.stem + "-tien" + out.suffix)
        zaznam["casy_s"][ct.name] = round(render_tien(_Skupina(modely), podlaha, ct, max(96, a.vzorky // 4), podlaha_biela, a), 1)
    zaznam["body_px"] = {out.name: [dict(rad=m.rad["id"], obj_cislo=m.variant["obj_cislo"], **kluc_body(m, cam)) for m in modely]}
    zaznam["rozlisenie"] = [sc.render.resolution_x, sc.render.resolution_y]
    out.with_suffix(".json").write_text(json.dumps(zaznam, ensure_ascii=False, indent=1), encoding="utf-8")


def argumenty():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser(prog="potrubie.py", description="Parametrický render potrubia Microflex")
    p.add_argument("--rad", default="microflex-duo-6-bar", help="id radu z rady.json")
    p.add_argument("--obj", default=None, help="objednávacie číslo variantu (napr. MD16032C)")
    p.add_argument("--pohlad", default="studio",
                   choices=["studio", "makro-plast", "makro-pena", "makro-rura", "rozlozeny", "rodina"])
    p.add_argument("--faza", type=float, default=0.0, help="rozloženie 0..1")
    p.add_argument("--snimky", type=int, default=0, help="počet snímok sekvencie rozloženia (0 = jedna)")
    p.add_argument("--sirka", type=int, default=None)
    p.add_argument("--vyska", type=int, default=None, help="pevná výška; inak podľa výrobku")
    p.add_argument("--vzorky", type=int, default=512)
    p.add_argument("--out", default=None)
    p.add_argument("--bez-tiena", action="store_true")
    p.add_argument("--len-tien", action="store_true", help="vyrenderuje len vrstvu tieňa k existujúcemu renderu")
    p.add_argument("--tien-sila", type=float, default=0.55, help="najväčšia alfa tieňa (0..1)")
    p.add_argument("--tien-prah", type=float, default=0.12, help="slabší tieň okolia sa zahodí (kontaktný tieň)")
    p.add_argument("--tien-okraj", type=float, default=0.03, help="pás pri okrajoch bez tieňa (podiel rozmeru)")
    p.add_argument("--tien-dosah", type=float, default=0.55, help="kam siaha tieň od osi (násobok D) pri výreze záberu")
    p.add_argument("--tien-okraje", default=None,
                   help="okraje s nábehom tieňa na nulu: l, h, p, d (ľavý, horný, pravý, dolný); predvolené všetky, pri detaile hpd")
    p.add_argument("--detail-podiel", type=float, default=0.47, help="detail: šírka rezu plášťa ako podiel šírky snímky")
    p.add_argument("--hero-pomer", type=float, default=1.45, help="hero: pomer strán šírka : výška")
    p.add_argument("--hero-podiel", type=float, default=0.26, help="hero: šírka rezu plášťa ako podiel šírky snímky")
    p.add_argument("--hero-okraj", type=float, default=0.05, help="hero: okraj vľavo pred koncami rúr")
    p.add_argument("--detail-okraj", type=float, default=0.05, help="detail: okraj vpravo za rezom alebo koncami rúr")
    p.add_argument("--dlzka", type=float, default=None, help="dĺžka tela v násobkoch priemeru plášťa (2,2; pri detaile 4)")
    p.add_argument("--natocenie", type=float, default=None,
                   help="natočenie rúr v reze (stupne); bez zadania -20° a automatická úprava, aby konce rúr ostali v obryse plášťa")
    p.add_argument("--presah", type=float, default=None, help="presah rúr pred penu v násobkoch d")
    p.add_argument("--azimut", type=float, default=None, help="smer kamery od osi (stupne, štúdio 42)")
    p.add_argument("--elevacia", type=float, default=None, help="výška kamery (stupne, štúdio 18)")
    p.add_argument("--pole", type=float, default=None, help="makro: šírka záberu v mm")
    p.add_argument("--ohnisko", type=float, default=100.0, help="ohnisková vzdialenosť (mm, snímač 36 mm)")
    p.add_argument("--clona", type=float, default=None,
                   help="clonové číslo pre hĺbku ostrosti (0 = bez; štúdio bez, makrá f/18 až f/32)")
    p.add_argument("--okraj", type=float, default=0.03)
    p.add_argument("--ramec", choices=["tesny", "rozlozeny", "detail", "jednotny", "hero"], default=None,
                   help="tesny (celé telo), rozlozeny (všetky fázy rozloženia), detail (rez veľký vpravo, telo za ľavým "
                        "okrajom), jednotny (rovnaký výrez pre všetky varianty: rez plášťa vždy rovnako veľký a na tom istom mieste)")
    p.add_argument("--watts", default=None,
                   help="porovnávací výrez: cx,cy,os,sirka,vyska vonkajšej elipsy prstenca na renderi Watts (px)")
    p.add_argument("--expozicia", type=float, default=None)
    p.add_argument("--svetlo", type=float, default=1.0, help="násobok jasu svetiel")
    p.add_argument("--svet", type=float, default=0.04, help="sila okolia (tmavé štúdio, svieti len zhora)")
    p.add_argument("--bunka", type=float, default=None, help="veľkosť bunky peny (mm)")
    p.add_argument("--pena-styl", choices=["jemna", "bunky", "zrna"], default="jemna",
                   help="vzhľad rezu peny: jemna (ako fotka), bunky, zrna (ako rendery Watts)")
    p.add_argument("--prevod", default="Standard", help="view transform (Standard, Khronos PBR Neutral, AgX)")
    p.add_argument("--vzhlad", default="None", help="look prevodu farieb (napr. 'AgX - Punchy')")
    p.add_argument("--teplota", type=float, default=None,
                   help="vyváženie bielej v K (makro peny 5900: kompenzuje žltý odraz od rúr)")
    p.add_argument("--kvalita", choices=["nahlad", "studio", "makro"], default="studio")
    p.add_argument("--segmenty", type=int, default=None, help="počet dielikov po obvode (inak podľa šírky)")
    p.add_argument("--krok", type=float, default=None, help="krok oblúkov profilu v stupňoch (inak podľa kvality)")
    p.add_argument("--krok-daleko", type=float, default=None, help="krok oblúkov vzdialených vĺn (perspektíva, dlhé telo)")
    p.add_argument("--rebra-blizko", type=int, default=None, help="koľko vĺn od rezu má jemný krok (zvyšok --krok-daleko)")
    p.add_argument("--zariadenie", default="GPU")
    p.add_argument("--komory", action="store_true", help="dutiny dvojstennej konštrukcie plášťa (v makre plášťa vždy)")
    p.add_argument("--zarez", action="store_true", help="makro plášťa so zárezom cez tri vlny namiesto pozdĺžneho rezu")
    p.add_argument("--zarez-uhol", type=float, default=None, help="poloha zárezu po obvode (stupne)")
    p.add_argument("--len-plast", action="store_true", help="len plášť bez peny a rúr (makro plášťa)")
    p.add_argument("--prierez", action="store_true", help="plášť rozrezaný pozdĺž osi (makro plášťa)")
    p.add_argument("--pozadie", action="store_true", help="kamera vidí sivé štúdiové pozadie (makro plášťa)")
    p.add_argument("--svetlo-vnutri", type=float, default=1.2, help="makro plášťa: sila svetla za stenou (W)")
    p.add_argument("--zarez-sirka", type=float, default=1.1, help="šírka zárezu v násobkoch polomeru plášťa")
    p.add_argument("--jas-kontra", type=float, default=18.0, help="makro plášťa: jas kontry (W/m²/sr)")
    p.add_argument("--jas-vypln", type=float, default=10.0, help="makro plášťa: jas vyplňujúceho svetla")
    p.add_argument("--jas-presvit", type=float, default=40.0, help="makro plášťa: jas svetla za stenou")
    p.add_argument("--jas-vnutri", type=float, default=1.5, help="makro plášťa: jas svetla vnútri")
    p.add_argument("--jas-kluc", type=float, default=None, help="štúdio: jas kľúčového softboxu (W/m²/sr)")
    p.add_argument("--jas-vypln-st", type=float, default=None, help="štúdio: jas vyplňovacej dosky (len difúzne)")
    p.add_argument("--jas-kontra-st", type=float, default=None, help="štúdio: jas kontra pásu")
    p.add_argument("--jas-celo", type=float, default=None, help="štúdio: jas svetla na rez")
    p.add_argument("--kluc-sirka", type=float, default=None, help="štúdio: šírka kľúčového softboxu v mm (pri D 160)")
    p.add_argument("--kluc-y", type=float, default=None, help="štúdio: poloha kľúča naprieč (záporné = ku kamere, v m pri D 160)")
    p.add_argument("--hrana-drsnost", type=float, default=None, help="o koľko sú hrany a steny vĺn drsnejšie (ladenie)")
    p.add_argument("--farba-plast", default=None, help="lineárna farba plášťa r,g,b (ladenie)")
    p.add_argument("--farba-biela", default=None, help="lineárna farba bielej PE-Xa r,g,b (ladenie)")
    p.add_argument("--sss-plast", default=None, help="presvitanie plášťa: váha,dosah_mm (ladenie)")
    p.add_argument("--rodina", default=None, help="rodina: zoznam rad:obj oddelený čiarkami (predvolene 6 systémov)")
    p.add_argument("--rodina-dlzka", type=float, default=2.0, help="rodina: dĺžka tiel v násobkoch najväčšieho D")
    p.add_argument("--rodina-krok", type=float, default=0.35, help="rodina: o koľko je každý ďalší rez vpredu (násobok D)")
    p.add_argument("--rodina-pomer", type=float, default=2.2, help="rodina: pomer strán šírka : výška")
    p.add_argument("--blend", default=None, help="uložiť .blend na kontrolu")
    a = p.parse_args(argv)
    a.azimut_dany, a.elevacia_dany = a.azimut is not None, a.elevacia is not None
    a.natocenie_dane = a.natocenie is not None
    if a.dlzka is None:
        a.dlzka = {"detail": 4.0, "hero": 7.0}.get(a.ramec, 2.2)
    if a.tien_okraje is None:
        a.tien_okraje = {"detail": "hpd", "hero": "lhd"}.get(a.ramec, "lhpd")
    if a.natocenie is None:
        a.natocenie = -20.0
    a.expozicia_dana = a.expozicia is not None
    if a.expozicia is None:
        a.expozicia = 0.0
    if a.azimut is None:
        a.azimut = 42.0
    if a.elevacia is None:
        a.elevacia = 18.0
    if a.pohlad.startswith("makro"):
        if a.kvalita == "studio":
            a.kvalita = "makro"
        a.dlzka = min(a.dlzka, 1.2 if a.pohlad != "makro-plast" else 0.75)
    if a.pohlad == "makro-plast":
        a.komory = a.len_plast = a.pozadie = True
        if not a.zarez:
            a.prierez = True
            # kamera na odrezanej strane (+Y), mierne spredu a zhora; štúdio sa zrkadlí podľa azimutu
            if not a.azimut_dany:
                a.azimut = -66.0
            if not a.elevacia_dany:
                a.elevacia = 34.0
            if a.expozicia_dana is False:
                a.expozicia = 0.0
    if a.pohlad == "makro-pena":
        if a.teplota is None:
            a.teplota = 5900.0
        if not a.expozicia_dana:
            a.expozicia = 0.45
    if a.clona is None:
        # mierna hĺbka ostrosti ako na produktovej fotke; makrá viac zacloniť
        a.clona = {"studio": 0.0, "rozlozeny": 0.0, "rodina": 0.0, "makro-rura": 18.0, "makro-pena": 22.0, "makro-plast": 32.0}[a.pohlad]
    if a.zarez_uhol is None:
        # zárez na strane ku kamere: smer od osi ku kamere v rovine YZ
        az, el = math.radians(a.azimut if a.azimut_dany else 80.0), math.radians(a.elevacia if a.elevacia_dany else 30.0)
        # zárez hore, mierne od kamery: jeho rezná plocha je natočená ku kamere skoro kolmo
        a.zarez_uhol = math.degrees(math.atan2(math.sin(el), -math.cos(el) * math.sin(az))) - 85.0
    return a


if __name__ == "__main__":
    hlavny(argumenty())
