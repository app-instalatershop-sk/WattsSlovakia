"""Príprava modelu pozornosti pre data/pozornost.py (Juraj 22. 10. 2026). Spúšťa sa raz.

1. Stiahne DeepGaze IIE (váhy deepgaze2e.pth, 420 MB) a stredovú mapu MIT1003 z GitHubu autorov.
2. Z verejného súboru UEyes (Jiang a kol., CHI 2023, Zenodo 8010312, licencia CC BY 4.0: 62 ľudí,
   1 980 obrazoviek, sledovanie očí 7 s) vytiahne len potrebné kúsky zipu (12,9 GB nesťahuje)
   a zostaví „predpoklad polohy“ pre webové stránky a mobil: kam sa ľudia pozerajú v prvých 3 s
   bez ohľadu na obsah. Na webe je to ľavý horný roh, nie stred ako pri fotkách, na ktorých sa
   DeepGaze učil.
3. Na 40 webových a 40 mobilných trénovacích obrazovkách nájde pomer obsahu a polohy: výsledná mapa je
   zmes α · DeepGaze + (1 − α) · predpoklad polohy, prípadne s mierne rozmazaným DeepGaze (kalibracia.json).
4. Overí presnosť na testovacích obrazovkách UEyes (27 webov, 27 mobilov, ktoré do predpokladu ani
   kalibrácie nevstúpili) a zapíše ju do overenie.json; správa z data/pozornost.py ju cituje.

Spustenie: C:\\Users\\krist\\nastroje\\web\\.venv\\Scripts\\python.exe data/pozornost_priprava.py
Výsledok: C:\\Users\\krist\\nastroje\\web\\modely (mimo repozitára).
"""
import csv
import http.cookiejar
import json
import random
import struct
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import zlib
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from pozornost import MODELY, Model, na_rozmer, rozmaz, zmes  # noqa: E402

UEYES = MODELY / 'ueyes'
DG = 'https://github.com/matthias-k/DeepGaze/releases/download/v1.0.0/'
ZIP = 'https://zenodo.org/records/8010312/files/UEyes_dataset.zip?download=1'
ZAZNAM = 'https://zenodo.org/records/8010312'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36'
OBRAZOVKA = (1920, 1200)  # monitor v UEyes; obrázky boli zväčšené na celú obrazovku so zachovaným pomerom a vycentrované
PRVE_SEKUNDY = 3.0
VZORKA = 200  # trénovacích obrazoviek na kategóriu pre predpoklad polohy
KALIBRACIA = 40  # z nich na kategóriu na nastavenie pomeru obsahu a polohy
MRIEZKA = 96  # rozlíšenie predpokladu v normalizovaných súradniciach obrázka


# ---------------------------------------------------------------- sťahovanie

def stiahni(url: str, ciel: Path):
    if not ciel.exists():
        ciel.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['curl', '-sL', '-o', str(ciel), url], check=True)


class Zenodo:
    """Kúsky zipu cez HTTP Range. Zenodo chce reláciu zo stránky záznamu a dovolí ~133 požiadaviek za minútu."""

    def __init__(self):
        self.zamok, self.posledna = threading.Lock(), 0.0
        self.relacia()

    def relacia(self):
        cj_subor = UEYES / 'cj.txt'
        subprocess.run(['curl', '-s', '--max-time', '60', '--retry', '3', '-c', str(cj_subor), '-A', UA, '-o', 'NUL', ZAZNAM], check=True)
        cj = http.cookiejar.MozillaCookieJar(str(cj_subor))
        cj.load(ignore_discard=True, ignore_expires=True)
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
        self.opener.addheaders = [('User-Agent', UA)]

    def rozsah(self, a: int, b: int | None = None) -> bytes:
        """Bajty a až b; bez b posledných a bajtov súboru."""
        for _ in range(8):
            with self.zamok:
                time.sleep(max(0.0, self.posledna + 0.5 - time.time()))
                self.posledna = time.time()
            try:
                req = urllib.request.Request(ZIP, headers={'Range': f'bytes={a}-{b}' if b is not None else f'bytes=-{a}', 'Referer': ZAZNAM})
                with self.opener.open(req, timeout=90) as r:
                    if r.status != 206:  # server by inak poslal celý 12,9 GB zip
                        raise RuntimeError(f'Zenodo vrátilo {r.status} namiesto časti súboru')
                    return r.read()
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    time.sleep(int(e.headers.get('retry-after') or 30) + 2)
                elif e.code == 403:
                    with self.zamok:
                        self.relacia()
                else:
                    time.sleep(3)
            except Exception:  # noqa: BLE001
                time.sleep(3)
        raise RuntimeError(f'Zenodo: rozsah {a}-{b} zlyhal')

    def adresar(self) -> dict:
        """Centrálny adresár zipu (aj ZIP64): meno → (metóda, komprimovaná, pôvodná veľkosť, offset).
        Uloží sa do adresar.json, pri ďalšom behu sa už nesťahuje (1 MB, zo Zenoda býva pomalý)."""
        ulozeny = UEYES / 'adresar.json'
        if ulozeny.exists():
            return {k: tuple(v) for k, v in json.loads(ulozeny.read_text()).items()}
        chvost = self.rozsah(65536)
        i = chvost.rfind(b'PK\x05\x06')
        velkost, offset = struct.unpack('<II', chvost[i + 12:i + 20])
        if offset == 0xFFFFFFFF:
            j = chvost.rfind(b'PK\x06\x06')
            velkost, offset = struct.unpack('<QQ', chvost[j + 40:j + 56])
        cd = self.rozsah(offset, offset + velkost - 1)
        out, p = {}, 0
        while cd[p:p + 4] == b'PK\x01\x02':
            metoda, = struct.unpack('<H', cd[p + 10:p + 12])
            csize, usize = struct.unpack('<II', cd[p + 20:p + 28])
            fl, el, cl = struct.unpack('<HHH', cd[p + 28:p + 34])
            off, = struct.unpack('<I', cd[p + 42:p + 46])
            meno = cd[p + 46:p + 46 + fl].decode('utf-8', 'replace')
            extra, k = cd[p + 46 + fl:p + 46 + fl + el], 0
            while k + 4 <= len(extra):  # ZIP64: veľké hodnoty sú v poli extra v poradí pôvodná, komprimovaná, offset
                hid, hl = struct.unpack('<HH', extra[k:k + 4])
                if hid == 1:
                    v = iter(struct.unpack(f'<{hl // 8}Q', extra[k + 4:k + 4 + hl - hl % 8]))
                    usize = next(v) if usize == 0xFFFFFFFF else usize
                    csize = next(v) if csize == 0xFFFFFFFF else csize
                    off = next(v) if off == 0xFFFFFFFF else off
                k += 4 + hl
            if not meno.startswith('__MACOSX'):
                out[meno] = (metoda, csize, usize, off)
            p += 46 + fl + el + cl
        ulozeny.write_text(json.dumps(out))
        return out

    def subor(self, zaznam: tuple, kolko: int | None = None) -> bytes:
        metoda, csize, _, off = zaznam
        data = self.rozsah(off, off + 30 + 1024 + (kolko or csize))
        fl, el = struct.unpack('<HH', data[26:30])
        telo = data[30 + fl + el:30 + fl + el + csize]
        return zlib.decompressobj(-15).decompress(telo) if metoda == 8 else telo


def rozmer_obrazka(b: bytes):
    if b[:8] == b'\x89PNG\r\n\x1a\n':
        return struct.unpack('>II', b[16:24])
    i = 2
    while b[:2] == b'\xff\xd8' and i + 9 < len(b):
        if b[i] != 0xFF:
            i += 1
            continue
        m = b[i + 1]
        if m in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            h, w = struct.unpack('>HH', b[i + 5:i + 9])
            return w, h
        i += 2 if (m in (0xD8, 0x01) or 0xD0 <= m <= 0xD7) else 2 + struct.unpack('>H', b[i + 2:i + 4])[0]
    return None


def ueyes() -> tuple[dict, dict, dict, list]:
    """Zoznam obrazoviek, fixácie (len prvé sekundy), rozmery vzorky trénovacích a všetkých testovacích
    obrazoviek a mená kalibračných obrazoviek (stiahnuté celé ako testovacie)."""
    UEYES.mkdir(parents=True, exist_ok=True)
    pref = 'UEyes_dataset/'
    spojenie: list = []
    zamok = threading.Lock()

    def zenodo():
        """Na Zenodo sa pripojí, len keď niečo chýba (stránka záznamu býva pomalá); jedno spojenie pre všetky vlákna."""
        with zamok:
            if not spojenie:
                z = Zenodo()
                spojenie.extend([z, z.adresar()])
        return spojenie
    if not (UEYES / 'image_types.csv').exists():
        z, adr = zenodo()
        (UEYES / 'image_types.csv').write_bytes(z.subor(adr[pref + 'image_types.csv']))
    info = {r[0]: (r[1], r[3].strip().lower()) for r in list(csv.reader(open(UEYES / 'image_types.csv', encoding='utf-8'), delimiter=';'))[1:]}
    with ThreadPoolExecutor(3) as ex:
        if not (UEYES / 'logy' / 'hotovo.txt').exists():  # záznamy sledovania (blok × účastník), 554 súborov
            z, adr = zenodo()

            def log(m):
                c = UEYES / 'logy' / m.rsplit('/', 1)[1]
                if not c.exists():
                    c.parent.mkdir(parents=True, exist_ok=True)
                    c.write_bytes(z.subor(adr[m]))
            list(ex.map(log, [m for m in adr if m.startswith(pref + 'eyetracker_logs/') and m.endswith('.csv')]))
            (UEYES / 'logy' / 'hotovo.txt').write_text('všetky záznamy stiahnuté\n', encoding='utf-8')
        rnd = random.Random(1)
        test = [m for m, (k, s) in info.items() if k in ('web', 'mobile') and s == 'test']
        vzorka = [m for k in ('web', 'mobile') for m in rnd.sample([m for m, (kk, s) in info.items() if kk == k and s == 'train'], VZORKA)]
        roz_subor = UEYES / 'rozmery.json'
        rozmery = json.loads(roz_subor.read_text()) if roz_subor.exists() else {}

        def cely(m):
            c = UEYES / 'obrazky' / m
            if not c.exists():
                z, adr = zenodo()
                c.parent.mkdir(parents=True, exist_ok=True)
                c.write_bytes(z.subor(adr[pref + 'images/' + m]))
            return m, tuple(Image.open(c).size)

        def rozmer(m):
            z, adr = zenodo()
            for kolko in (2048, 131072, None):
                if (wh := rozmer_obrazka(z.subor(adr[pref + 'images/' + m], kolko))):
                    return m, tuple(wh)
            raise RuntimeError(m)
        kal = vzorka[:KALIBRACIA] + vzorka[VZORKA:VZORKA + KALIBRACIA]  # prvých 40 webov a 40 mobilov zo vzorky
        for m, wh in ex.map(cely, test + kal):
            rozmery[m] = wh
        for m, wh in ex.map(rozmer, [m for m in vzorka if m not in rozmery]):
            rozmery[m] = wh
        roz_subor.write_text(json.dumps(rozmery))
    fix: dict[str, list] = {}
    for f in (UEYES / 'logy').glob('*.csv'):
        for r in csv.DictReader(open(f, encoding='utf-8', errors='replace')):
            m = r['MEDIA_NAME']
            if m in rozmery and r['FPOGV'] == '1' and float(r['FPOGS']) < PRVE_SEKUNDY:
                fix.setdefault(m, []).append((float(r['FPOGX']), float(r['FPOGY'])))
    return info, fix, rozmery, kal


def na_obrazok(fixacie: list, w: int, h: int) -> np.ndarray:
    """Body z obrazovky (0–1) do normalizovaných súradníc obrázka (0–1); body mimo obrázka vypadnú."""
    s = min(OBRAZOVKA[0] / w, OBRAZOVKA[1] / h)
    dw, dh = w * s, h * s
    x0, y0 = (OBRAZOVKA[0] - dw) / 2, (OBRAZOVKA[1] - dh) / 2
    b = np.array([((x * OBRAZOVKA[0] - x0) / dw, (y * OBRAZOVKA[1] - y0) / dh) for x, y in fixacie])
    return b[(b[:, 0] >= 0) & (b[:, 0] < 1) & (b[:, 1] >= 0) & (b[:, 1] < 1)] if len(b) else b.reshape(0, 2)


# ---------------------------------------------------------------- predpoklad polohy

def predpoklad(body: np.ndarray) -> np.ndarray:
    """Hustota fixácií v normalizovaných súradniciach (MRIEZKA × MRIEZKA), vyhladená a s 5 % rovnomernej
    zložky (aj miesto, kam sa v dátach nikto nepozrel, má malú pravdepodobnosť). Vracia log hustotu."""
    from scipy.ndimage import gaussian_filter
    hist, _, _ = np.histogram2d(body[:, 1], body[:, 0], bins=MRIEZKA, range=[[0, 1], [0, 1]])
    hustota = gaussian_filter(hist, MRIEZKA * 0.035, mode='nearest')
    hustota = hustota / hustota.sum()
    hustota = 0.95 * hustota + 0.05 / hustota.size
    return np.log(hustota)


# ---------------------------------------------------------------- overenie

def metriky(log_hustota: np.ndarray, body_px: np.ndarray) -> dict:
    """NSS (priemer z-skóre mapy v miestach pohľadov), AUC (pohľady proti všetkým pixelom) a log-likelihood
    v bitoch na pohľad oproti rovnomernej mape (informačný zisk)."""
    p = np.exp(log_hustota)
    ys, xs = np.clip(body_px[:, 1].astype(int), 0, p.shape[0] - 1), np.clip(body_px[:, 0].astype(int), 0, p.shape[1] - 1)
    if p.std() < 1e-12 * p.mean():  # rovnomerná mapa: NSS 0, AUC 0,5 a zisk 0 bitov z definície
        return {'NSS': 0.0, 'AUC': 0.5, 'IG': 0.0}
    z = (p - p.mean()) / p.std()
    hodnoty = p[ys, xs]
    vsetky = np.sort(p.ravel())
    auc = float(np.mean(np.searchsorted(vsetky, hodnoty, side='left') / vsetky.size + 0.5 * (np.searchsorted(vsetky, hodnoty, side='right') - np.searchsorted(vsetky, hodnoty, side='left')) / vsetky.size))
    ig = float(np.mean(log_hustota[ys, xs] + np.log(p.size)) / np.log(2))
    return {'NSS': float(z[ys, xs].mean()), 'AUC': auc, 'IG': ig}


def scena(m: str, rozmery: dict, fix: dict):
    """Obrazovka v takej veľkosti, v akej ju ľudia videli, prepočítaná na ~35 px na stupeň (ako pri učení
    DeepGaze; monitor UEyes 52 cm na 1920 px vo vzdialenosti ~60 cm je ~41 px na stupeň) a pohľady v nej."""
    w, h = rozmery[m]
    s = min(OBRAZOVKA[0] / w, OBRAZOVKA[1] / h) * 35 / 41
    W, H = round(w * s), round(h * s)
    body = na_obrazok(fix.get(m, []), w, h) * [W, H]
    if len(body) < 5:
        return None
    return Image.open(UEYES / 'obrazky' / m).convert('RGB').resize((W, H), Image.LANCZOS), body, W, H


def v_bodoch(mapa: np.ndarray, body: np.ndarray) -> np.ndarray:
    ys = np.clip(body[:, 1].astype(int), 0, mapa.shape[0] - 1)
    xs = np.clip(body[:, 0].astype(int), 0, mapa.shape[1] - 1)
    return mapa[ys, xs]


SIGMY = (0, 18, 35, 70, 105, 140, 210)  # rozmazanie DeepGaze v px modelu (35 px ≈ 1 stupeň)
ALFY = np.round(np.linspace(0, 1, 21), 2)


def kalibruj(model, mena: list, fix: dict, rozmery: dict, prior: np.ndarray, kluc: str) -> dict:
    """Pomer α a rozmazanie, pri ktorých mapa dá skutočným pohľadom na kalibračných obrazovkách najvyššiu
    priemernú pravdepodobnosť (log-likelihood v bitoch na pohľad oproti rovnomernej mape, priemer obrazoviek)."""
    zisk, n = np.zeros((len(SIGMY), len(ALFY))), 0
    for m in mena:
        sc = scena(m, rozmery, fix)
        if not sc:
            continue
        img, body, W, H = sc
        pr = na_rozmer(prior, H, W)
        dg = np.exp(model.log_hustota(img, pr))
        p_pr = v_bodoch(np.exp(pr), body)
        for i, s in enumerate(SIGMY):
            p_dg = v_bodoch(rozmaz(dg, s), body)
            for j, a in enumerate(ALFY):
                zisk[i, j] += np.mean(np.log2((a * p_dg + (1 - a) * p_pr) * W * H))
        n += 1
        print('kalibrácia', kluc, n, m, flush=True)
    zisk /= n
    i, j = np.unravel_index(np.argmax(zisk), zisk.shape)
    return {'alfa': float(ALFY[j]), 'sigma_px': SIGMY[i], 'zisk_bitov': float(zisk[i, j]), 'obrazoviek': n,
            'len_poloha_bitov': float(zisk[0, 0]), 'len_deepgaze_bitov': float(zisk[0, -1]),
            'mriezka': {'sigmy': list(SIGMY), 'alfy': ALFY.tolist(), 'zisk': np.round(zisk, 4).tolist()}}


VARIANTY = ('rovnomerna', 'len_predpoklad', 'deepgaze_mit', 'deepgaze_ueyes', 'zmes')


def overenie(model, info: dict, fix: dict, rozmery: dict, priory: dict, kalib: dict, cb_mit: np.ndarray) -> dict:
    from scipy.ndimage import zoom
    from scipy.special import logsumexp
    vysledky = {}
    for kat, kluc in (('web', 'web'), ('mobile', 'mobil')):
        riadky = []
        for m in sorted(x for x, (k, s) in info.items() if k == kat and s == 'test' and x in fix):
            sc = scena(m, rozmery, fix)
            if not sc:
                continue
            img, body, W, H = sc
            cb = zoom(cb_mit, (H / cb_mit.shape[0], W / cb_mit.shape[1]), order=0, mode='nearest')
            cb -= logsumexp(cb)
            pr = na_rozmer(priory[kluc], H, W)
            dg = model.log_hustota(img, pr)
            riadok = {'obrazok': m, 'pohladov': len(body),
                      'rovnomerna': metriky(np.full((H, W), -np.log(H * W)), body),
                      'len_predpoklad': metriky(pr, body),
                      'deepgaze_mit': metriky(model.log_hustota(img, cb), body),
                      'deepgaze_ueyes': metriky(dg, body),
                      'zmes': metriky(zmes(dg, pr, kalib[kluc]['alfa'], kalib[kluc]['sigma_px']), body)}
            riadky.append(riadok)
            print(kluc, m, {k: round(v['NSS'], 2) for k, v in riadok.items() if isinstance(v, dict)}, flush=True)
        vysledky[kluc] = {'obrazoviek': len(riadky), 'priemer': {v: {met: float(np.mean([r[v][met] for r in riadky])) for met in ('NSS', 'AUC', 'IG')}
                                                                for v in VARIANTY}}
    return vysledky


def main():
    stiahni(DG + 'deepgaze2e.pth', MODELY / 'deepgaze2e.pth')
    stiahni(DG + 'centerbias_mit1003.npy', MODELY / 'centerbias_mit1003.npy')
    info, fix, rozmery, kal = ueyes()
    priory = {}
    for kat, kluc in (('web', 'web'), ('mobile', 'mobil')):
        body = np.concatenate([na_obrazok(fix[m], *rozmery[m]) for m in rozmery if info[m] == (kat, 'train') and m in fix])
        priory[kluc] = predpoklad(body)
        np.save(MODELY / f'predpoklad_{kluc}.npy', priory[kluc])
        print(kluc, 'predpoklad z', len(body), 'pohľadov', flush=True)
    model = Model()
    kalib = {kluc: kalibruj(model, [m for m in kal if info[m][0] == kat], fix, rozmery, priory[kluc], kluc)
             for kat, kluc in (('web', 'web'), ('mobile', 'mobil'))}
    (MODELY / 'kalibracia.json').write_text(json.dumps(kalib, indent=1), encoding='utf-8')
    print('kalibrácia', kalib, flush=True)
    vysl = overenie(model, info, fix, rozmery, priory, kalib, np.load(MODELY / 'centerbias_mit1003.npy'))
    vysl['zdroj'] = 'UEyes (Jiang a kol., CHI 2023), Zenodo 8010312, CC BY 4.0; prvé 3 s; test 27 webov a 27 mobilov'
    (MODELY / 'overenie.json').write_text(json.dumps(vysl, indent=1, ensure_ascii=False), encoding='utf-8')
    print(json.dumps({k: v for k, v in vysl.items() if k != 'zdroj'}, indent=1))


if __name__ == '__main__':
    main()
