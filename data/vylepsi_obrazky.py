"""Vylepšenie obrázkov webu lokálnou AI (Juraj 22. 10. 2026): zväčšenie a výrez pozadia.

Zväčšenie: Real-ESRGAN ncnn-vulkan, model realesrgan-x4plus (grafická karta). Výrez pozadia: rembg
s modelom BiRefNet (licencia MIT; predvolený model rembg má nekomerčnú licenciu). Nástroje sú
v C:\\Users\\krist\\nastroje (NAVOD.txt), skript sa spúšťa Pythonom z prostredia rembg:

    C:\\Users\\krist\\nastroje\\rembg\\.venv\\Scripts\\python.exe data/vylepsi_obrazky.py [skupina ...]

Skupiny: produkty, fotky (aj referencie); bez argumentu obe. Zdroje sú originály v podklady/watts,
výsledok ide rovno do web/src/assets. Veľkosť zdroja rýchlosť webu neovplyvní: Astro z neho robí
AVIF a WebP len v šírkach, ktoré stránka pýta. Strop dlhšej strany drží repozitár malý.
Rendery radov (piktogramy) sa nezväčšujú: chýba im najviac 1,37x a len na displejoch 2x.
"""
import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PODKLADY = ROOT / 'podklady' / 'watts'
ASSETS = ROOT / 'web' / 'src' / 'assets'
NASTROJE = Path(r'C:\Users\krist\nastroje')
ESRGAN = NASTROJE / 'realesrgan' / 'realesrgan-ncnn-vulkan.exe'

# Fotky dielov z galérie watts.eu (biele pozadie, 380 až 612 px): zväčšiť, vyrezať, priehľadné WebP.
PRODUKTY_STROP = 1200

# Fotky, ktoré web zobrazuje väčšie, než sú (meranie 22. 10. 2026 na všetkých stránkach: displej
# s hustotou 2x, monitor 1920 px, telefón 3x): (zdroj v podklady/watts, cieľ v assets, strop dlhšej
# strany, orez, zrno). Orez (x0, y0, x1, y1) je v pixeloch originálu a robí sa po zväčšení (súradnice × 4).
# Referencie berú originál z watts.eu (lepšia kvalita JPEG ako dnešné súbory v assets, farby rovnaké).
# Orange (1200 px) a ostatné fotky chýba najviac 1,3x, zväčšenie by tam pridalo viac „AI“ textúry ako ostrosti.
# Zrno: model vyhladí štrk a hlinu do „maľby“, jemné zrno vráti fotografický vzhľad (AVIF +0 až 5 %).
FOTKY: list[tuple[str, str, int, tuple[int, int, int, int] | None, bool]] = [
    *[(f'fotky-referencie/orig/{f}.jpg', f'referencie/{f}.jpg', 1800, None, True)
      for f in ('fackov-1', 'fackov-2', 'skola-1', 'skola-2', 'povazska-2', 'povazska-3', 'povazska-4', 'povazska-5',
                'povazska-6', 'povazska-7')],
    ('fotky-katalog/brozura-2026-s1-areal.jpg', 'fotky/areal-vykop.jpg', 2048, None, True),
    ('fotky-katalog/katalog-s35-x630.jpeg', 'fotky/montaz-odbocka.jpg', 1600, None, False),  # ilustrácia, bez zrna
]


def zvacsi(src: Path, tmp: Path) -> Image.Image:
    """Real-ESRGAN x4. Priehľadnosť: farba sa zväčší modelom, alfa kanál samostatne tým istým modelom
    ako sivý obrázok. Priehľadné okolie dostane farbu najbližšieho pixela výrobku, inak by model
    primiešal do hrany farbu pozadia a na tmavom podklade by bola svetlá obruba."""
    im = Image.open(src)
    rgba = im.convert('RGBA')
    a = rgba.getchannel('A')
    if a.getextrema()[0] == 255:
        p = tmp / f'{src.stem}-in.png'
        im.convert('RGB').save(p)
        return esrgan(p, tmp)
    import numpy as np
    from scipy.ndimage import distance_transform_edt
    pole = np.asarray(rgba).copy()
    plne = pole[..., 3] > 250
    _, (iy, ix) = distance_transform_edt(~plne, return_indices=True)
    pole[..., :3] = pole[iy, ix, :3]
    p_rgb, p_a = tmp / f'{src.stem}-rgb.png', tmp / f'{src.stem}-a.png'
    Image.fromarray(pole[..., :3]).save(p_rgb)
    Image.merge('RGB', (a, a, a)).save(p_a)
    out = esrgan(p_rgb, tmp).convert('RGBA')
    out.putalpha(esrgan(p_a, tmp).convert('L'))
    return out


def esrgan(src: Path, tmp: Path) -> Image.Image:
    out = tmp / f'{src.stem}-x4.png'
    subprocess.run([str(ESRGAN), '-i', str(src), '-o', str(out), '-n', 'realesrgan-x4plus', '-s', '4', '-f', 'png',
                    '-m', str(ESRGAN.parent / 'models')], check=True, capture_output=True)
    return Image.open(out).copy()


_relacia = None


def vyrez(im: Image.Image) -> Image.Image:
    global _relacia
    from rembg import new_session, remove
    if _relacia is None:
        _relacia = new_session('birefnet-general')
    return remove(im.convert('RGB'), session=_relacia)


def orez_na_obsah(im: Image.Image, okraj: float) -> Image.Image:
    """Oreže priehľadné okolie a nechá rovnaký okraj (podiel dlhšej strany) ako pri piktogramoch."""
    bbox = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if not bbox:
        return im
    pad = int(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * okraj)
    w, h = bbox[2] - bbox[0] + 2 * pad, bbox[3] - bbox[1] + 2 * pad
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.paste(im.crop(bbox), (pad, pad))
    return out


def strop(im: Image.Image, dlhsia: int) -> Image.Image:
    k = dlhsia / max(im.size)
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS) if k < 1 else im


def produkty(tmp: Path):
    for src in sorted((PODKLADY / 'produkty' / 'orig').glob('*.jpg')):
        im = strop(orez_na_obsah(vyrez(zvacsi(src, tmp)), 0.03), PRODUKTY_STROP)
        ciel = ASSETS / 'produkty' / f'{src.stem}.webp'
        im.save(ciel, quality=92, alpha_quality=100, method=6)
        stara = ASSETS / 'produkty' / f'{src.stem}.jpg'
        if stara.exists():
            stara.unlink()
        print(f'produkt {src.stem}: {im.size[0]}x{im.size[1]}, {ciel.stat().st_size // 1024} kB', flush=True)


def zrno(im: Image.Image, sila: float = 3.0, seed: int = 7) -> Image.Image:
    """Jemné jasové zrno fotografie (šum rozmazaný na ~1 px), viac v stredných tónoch ako vo svetlách a tieňoch."""
    import numpy as np
    from scipy.ndimage import gaussian_filter
    a = np.asarray(im, dtype=np.float32)
    n = gaussian_filter(np.random.default_rng(seed).normal(0, 1, a.shape[:2]).astype(np.float32), 0.6)
    n *= sila / n.std()
    jas = a.mean(axis=2, keepdims=True) / 255
    return Image.fromarray((a + n[..., None] * (0.4 + 2.4 * jas * (1 - jas))).clip(0, 255).astype(np.uint8))


def fotky(tmp: Path):
    for zdroj, ciel, dlhsia, orez, so_zrnom in FOTKY:
        im = zvacsi(PODKLADY / zdroj, tmp).convert('RGB')
        if orez:
            im = im.crop(tuple(c * 4 for c in orez))
        im = strop(im, dlhsia)
        if so_zrnom:
            im = zrno(im)
        c = ASSETS / ciel
        im.save(c, quality=90, optimize=True, progressive=True)
        print(f'fotka {ciel}: {im.size[0]}x{im.size[1]}, {c.stat().st_size // 1024} kB', flush=True)


SKUPINY = {'produkty': produkty, 'fotky': fotky}

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('skupiny', nargs='*', choices=list(SKUPINY), default=list(SKUPINY))
    args = ap.parse_args()
    if not ESRGAN.exists():
        sys.exit(f'Chýba {ESRGAN} (pozri C:\\Users\\krist\\nastroje\\NAVOD.txt).')
    with tempfile.TemporaryDirectory() as t:
        for s in dict.fromkeys(args.skupiny):
            SKUPINY[s](Path(t))
