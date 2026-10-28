"""Ustálené teplotné pole v reze potrubia a tepelná strata do pôdy (pohľad studio s --termo).

Rovnaké predpoklady ako výpočet strát v katalógu Watts (Microflex-katalog-SK.pdf, s. 38):
λ peny 0,0335 W/m·K pri 10 °C a 0,0372 W/m·K pri 40 °C, λ pôdy 1 W/m·K, krytie 0,8 m nad horným
okrajom potrubia. Pena je homogénna, rúry majú na povrchu teplotu média (odpor steny PE-Xa je pod 2 %),
plášť má po obvode jednu teplotu a teplo z neho odchádza do pôdy cez odpor valca uloženého v hĺbke.

Pole sa rieši v štvorcovej mriežke cez rez peny (Laplaceova rovnica, SOR od hrubej mriežky po jemnú).
Pre každú rúru vznikne jednotkové pole (1 na rúre, 0 na ostatných a na plášti), z toku cez medzikružie pri
plášti jej tepelná vodivosť; teplota plášťa a strata vyplynú z rovnováhy s pôdou.

Overenie: sústredná rúra UNO 63 v plášti 160 pri ΔT 50 K dá 12,54 W/m, presný vzorec 12,67 W/m. Grafy
katalógu (s. 38) sú pri rovnakých parametroch o 8 až 11 % (UNO) a 17 až 21 % (DUO) vyššie; katalóg zrejme
ráta s menším vnútorným priemerom plášťa alebo s rezervou, ktorú neuvádza. Tvar poľa od vodivosti peny
nezávisí, preto ju pri známej strate z katalógu (q_katalog) zväčšíme tak, aby strata sedela presne.
"""
import math

import numpy as np

LAMBDA_PENA = ((10.0, 0.0335), (40.0, 0.0372))
LAMBDA_PODA = 1.0
KRYTIE_M = 0.8


def lambda_peny(t):
    (t0, l0), (t1, l1) = LAMBDA_PENA
    return l0 + (t - t0) * (l1 - l0) / (t1 - t0)


def odpor_pody(D_mm, krytie=KRYTIE_M, lam=LAMBDA_PODA):
    """Odpor valca s priemerom D v polopriestore (m·K/W), os v hĺbke krytie + D/2."""
    D = D_mm / 1000.0
    x = 2.0 * (krytie + D / 2.0) / D
    return math.log(x + math.sqrt(x * x - 1.0)) / (2.0 * math.pi * lam)


def _mriezka(n, r):
    s = np.linspace(-r, r, n)
    Y, Z = np.meshgrid(s, s)          # riadok = z (zdola nahor), stĺpec = y
    return Y, Z, s[1] - s[0]


def _masky(Y, Z, r_pena, rury):
    von = Y * Y + Z * Z >= r_pena * r_pena
    vnutri = [(Y - v) ** 2 + (Z - w) ** 2 <= (d / 2.0) ** 2 for v, w, d in rury]
    return von, vnutri


def _sor(T, volne, iteracie, omega):
    """Red-black SOR na vnútorných bodoch (okraj mriežky je vždy pevný: leží mimo peny)."""
    n = T.shape[0]
    I, J = np.meshgrid(np.arange(n), np.arange(n), indexing="ij")
    farby = [((I + J) % 2 == k) & volne for k in (0, 1)]
    farby = [f[1:-1, 1:-1] for f in farby]
    for _ in range(iteracie):
        for f in farby:
            stred = T[1:-1, 1:-1]
            nove = 0.25 * (T[:-2, 1:-1] + T[2:, 1:-1] + T[1:-1, :-2] + T[1:-1, 2:])
            stred[f] += omega * (nove[f] - stred[f])
    return T


def jednotkove_pole(rury, k, r_pena, n=400):
    """Pole s 1 na rúre k, 0 na ostatných rúrach a na plášti. rury: [(v, w, d)] v mm."""
    pole = None
    for nn in (n // 8, n // 4, n // 2, n):
        Y, Z, h = _mriezka(nn, r_pena)
        von, vnutri = _masky(Y, Z, r_pena, rury)
        pevne = von.copy()
        for m in vnutri:
            pevne |= m
        T = np.zeros_like(Y)
        if pole is not None:   # počiatočný odhad z hrubšej mriežky
            s0 = np.linspace(-r_pena, r_pena, pole.shape[0])
            s1 = np.linspace(-r_pena, r_pena, nn)
            T = np.array([np.interp(s1, s0, riadok) for riadok in pole])
            T = np.array([np.interp(s1, s0, stlpec) for stlpec in T.T]).T
        T[pevne] = 0.0
        T[vnutri[k]] = 1.0
        omega = 2.0 / (1.0 + math.sin(math.pi / nn))
        T = _sor(T, ~pevne, 3 * nn if pole is None else nn, omega)
        pole = T
    return pole, h


def vodivost(pole, h, r_pena, rury):
    """Tepelná vodivosť (tvarový faktor, bez λ) z toku cez medzikružie medzi rúrami a plášťom."""
    n = pole.shape[0]
    Y, Z, _ = _mriezka(n, r_pena)
    r = np.hypot(Y, Z)
    dosah = max(math.hypot(v, w) + d / 2.0 for v, w, d in rury)
    r1, r2 = dosah + 0.35 * (r_pena - dosah), r_pena - 3.0 * h
    gz, gy = np.gradient(pole, h)
    dr = (gy * Y + gz * Z) / np.maximum(r, 1e-9)
    kruh = (r >= r1) & (r <= r2)
    return float(-dr[kruh].sum() * h * h / (r2 - r1))


def vypocitaj(rury, teploty, t_poda, r_pena, D_mm, n=400, q_katalog=None):
    """rury: [(v, w, d)] v mm (len nosné rúry), teploty: teplota média v každej (°C), q_katalog: strata
    z katalógu (W/m) na doladenie vodivosti peny. Vráti dict: pole (°C, mriežka n x n cez
    [-r_pena, r_pena]^2, riadok = z zdola), t_plast, q (W/m), q_model (bez doladenia), λ, faktor."""
    polia, S = [], []
    for k in range(len(rury)):
        p, h = jednotkove_pole(rury, k, r_pena, n)
        polia.append(p)
        S.append(vodivost(p, h, r_pena, rury))
    Rp = odpor_pody(D_mm)
    t_plast = t_poda
    for _ in range(4):     # λ peny podľa strednej teploty peny
        lam = lambda_peny(0.5 * (float(np.mean(teploty)) + t_plast))
        G = [lam * s for s in S]
        t_plast = (sum(g * t for g, t in zip(G, teploty)) + t_poda / Rp) / (sum(G) + 1.0 / Rp)
    q = q_model = sum(g * (t - t_plast) for g, t in zip(G, teploty))
    faktor = 1.0
    if q_katalog:
        # q = (Tm - To) / (1 / (f·ΣG) + Rp), Tm = teplota rúr vážená vodivosťou
        Gs = sum(G)
        Tm = sum(g * t for g, t in zip(G, teploty)) / Gs
        faktor = 1.0 / (Gs * ((Tm - t_poda) / q_katalog - Rp))
        G = [faktor * g for g in G]
        t_plast = (sum(g * t for g, t in zip(G, teploty)) + t_poda / Rp) / (sum(G) + 1.0 / Rp)
        q = sum(g * (t - t_plast) for g, t in zip(G, teploty))
    Y, Z, _ = _mriezka(n, r_pena)
    von, vnutri = _masky(Y, Z, r_pena, rury)
    T = t_plast + sum((t - t_plast) * p for t, p in zip(teploty, polia))
    for m, t in zip(vnutri, teploty):
        T[m] = t
    T[von] = t_plast
    return {"pole": T, "t_plast": t_plast, "q": q, "q_model": q_model, "lambda": lam * faktor, "faktor": faktor,
            "odpor_pody": Rp, "tvarove_faktory": S}
