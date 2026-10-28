"""Ohyb potrubia za rezom (pohľad `ohyb` v potrubie.py).

Os potrubia je svetová os X, rez leží pri x = 0 a telo ide do záporného X. Od bodu x_b (svetové,
x_b <= 0) sa os ohne vo vodorovnej rovine XY do oblúka s polomerom R (v metroch, meraný na osi)
o uhol theta; za oblúkom telo pokračuje rovno po dotyčnici. Priečny posun bodu od osi (y) ide po
normále oblúka a výška z ostáva, takže vnútorná strana plášťa sa stlačí a vonkajšia natiahne ako
pri skutočnom ohybe. Polomer ostáva rovnaký a rastie len uhol: rúra sa ovíja okolo prekážky.

Pôvodné lokálne súradnice siete sú v atribúte "povodne". Ohyb sa z nich počíta vždy nanovo (dá sa
nastaviť ľubovoľný uhol opakovane) a materiály z nich berú súradnice textúr (Uzly.mm v potrubie.py),
aby potlač, bunky peny a šum ostali prilepené k povrchu aj v oblúku.
"""
import math

import bmesh
import numpy as np

ATRIBUT = "povodne"


def zahusti_profil(prof, mat, x_hi, x_lo, krok, uzavrety=True):
    """Rozdelí úseky profilu (x, r) v mm, ktoré idú pozdĺž osi cez oblasť ohybu [x_lo, x_hi], na kúsky
    najviac `krok` mm (v oblúku sa inak dlhá rovná plocha, napr. vnútorná stena plášťa, zmení na tetivu).
    Hranice oblasti dostanú vlastný bod, aby sa ohyb začal presne v x_hi."""
    P = np.asarray(prof, float)
    n = len(P)
    nh = n if uzavrety else n - 1
    body, mats = [], []
    for j in range(nh):
        a, b = P[j], P[(j + 1) % n]
        body.append(a)
        m = 0 if mat is None else int(mat[j])
        dx = b[0] - a[0]
        lo, hi = max(min(a[0], b[0]), x_lo), min(max(a[0], b[0]), x_hi)
        if abs(dx) < 1e-9 or hi <= lo:
            mats.append(m)
            continue
        k = max(1, int(math.ceil((hi - lo) / krok)))
        xs = np.linspace(lo, hi, k + 1)
        xs = xs[(xs > min(a[0], b[0]) + 1e-6) & (xs < max(a[0], b[0]) - 1e-6)]
        xs = np.sort(xs) if dx > 0 else np.sort(xs)[::-1]
        for x in xs:
            t = (x - a[0]) / dx
            body.append(a + t * (b - a))
        mats.extend([m] * (len(xs) + 1))
    if not uzavrety:
        body.append(P[-1])
    return np.array(body), (None if mat is None else np.array(mats, dtype=np.int32))


def zahusti_siet(o, x_hi, x_lo, krok):
    """Prstence vrcholov v rovinách x = konšt. (lokálne súradnice = svetové x, objekty sú posunuté len
    v y, z a otočené okolo osi x) pre malé siete: rúry, kábel, telo a otvory peny."""
    me = o.data
    bm = bmesh.new()
    bm.from_mesh(me)
    xs = [v.co.x for v in bm.verts]
    lo, hi = max(min(xs), x_lo), min(max(xs), x_hi)
    if hi > lo:
        k = max(1, int(math.ceil((hi - lo) / krok)))
        for x in np.linspace(lo, hi, k + 1):
            if min(xs) + 1e-7 < x < max(xs) - 1e-7:
                bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
                                       plane_co=(float(x), 0.0, 0.0), plane_no=(1.0, 0.0, 0.0), dist=1e-7)
    bm.to_mesh(me)
    bm.free()
    me.update()


def uloz_povodne(o):
    me = o.data
    co = np.empty(len(me.vertices) * 3, dtype=np.float32)
    me.vertices.foreach_get("co", co)
    at = me.attributes.get(ATRIBUT) or me.attributes.new(ATRIBUT, "FLOAT_VECTOR", "POINT")
    at.data.foreach_set("vector", co)


def ohni_body(P, x_b, R, theta, smer=1.0):
    """P: N x 3 svetové body v metroch. smer +1 ohne telo k +Y, -1 k -Y."""
    if theta <= 1e-9:
        return P.copy()
    X, Y, Z = P[:, 0], P[:, 1], P[:, 2]
    t = x_b - X                                  # vzdialenosť za začiatkom ohybu
    s_obl = R * theta
    phi = np.clip(t, 0.0, s_obl) / R
    rovno = np.maximum(t - s_obl, 0.0)           # rovný kus za oblúkom
    sp, cp = np.sin(phi), np.cos(phi)
    ax = x_b - R * sp - rovno * math.cos(theta)  # bod osi
    ay = smer * R * (1.0 - cp) + rovno * smer * math.sin(theta)
    ex, ey = smer * sp, cp                       # pôvodný smer +Y po ohnutí (normála oblúka)
    pred = t <= 0.0
    out = np.empty_like(P)
    out[:, 0] = np.where(pred, X, ax + Y * ex)
    out[:, 1] = np.where(pred, Y, ay + Y * ey)
    out[:, 2] = Z
    return out


def bod_osi(x_b, R, theta, smer, t):
    """Bod osi vo vzdialenosti t za začiatkom ohybu (svetové m), napr. na kótu polomeru."""
    return ohni_body(np.array([[x_b - t, 0.0, 0.0]]), x_b, R, theta, smer)[0]


def nastav_ohyb(objekty, x_b, R, theta, smer=1.0):
    for o in objekty:
        if o.type != "MESH":
            continue
        me = o.data
        at = me.attributes.get(ATRIBUT)
        if at is None:
            continue
        loc = np.empty(len(me.vertices) * 3, dtype=np.float32)
        at.data.foreach_get("vector", loc)
        loc = loc.reshape(-1, 3).astype(np.float64)
        M = np.array(o.matrix_world)
        W = loc @ M[:3, :3].T + M[:3, 3]
        if W[:, 0].min() >= x_b:                 # celé pred ohybom (čelo, otrep): bez zmeny
            nove = loc
        else:
            Mi = np.linalg.inv(M)
            nove = ohni_body(W, x_b, R, theta, smer) @ Mi[:3, :3].T + Mi[:3, 3]
        me.vertices.foreach_set("co", nove.astype(np.float32).ravel())
        me.update()
