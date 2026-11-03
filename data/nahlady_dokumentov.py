"""Náhľady podkladov výrobcu pre stôl dokumentov na stránkach radov (web/src/components/Subory.astro).

Zdroje stiahol Juraj z watts.eu do podklady/watts/dokumenty (zoznam a odkazy v STIAHNUT.md, 3. 11. 2026).
Výstup sú JPG vo web/src/assets/dokumenty v hustote obálok katalógu a brožúry (910 px na šírku A4):
- PDF: prvá strana ako list A4 na výšku; strana vo formáte Letter (vyhlásenie, EPD) sa doplní bielou dole.
- DXF: celý list A3 naležato (1820 × 1287 px) s rámom a pečiatkou, čiary vo farbe textu webu na bielom
  papieri. Vrstva NASCOSTO (skryté) je vo výkresoch vypnutá a nevykreslí sa.
Potom treba obnoviť rozmazané náhľady: python data/nahlady_fotiek.py.

Spustenie (PyMuPDF, Pillow, ezdxf): python data/nahlady_dokumentov.py
"""
import io
from pathlib import Path

import fitz
from PIL import Image

try:
    import ezdxf
    from ezdxf.addons.drawing import Frontend, RenderContext, config, layout, pymupdf
    from ezdxf.math import BoundingBox2d
except ImportError:
    raise SystemExit('Chýba ezdxf: pip install ezdxf')

KOREN = Path(__file__).resolve().parent.parent
ZDROJ = KOREN / 'podklady' / 'watts' / 'dokumenty'
CIEL = KOREN / 'web' / 'src' / 'assets' / 'dokumenty'
SIRKA_A4 = 910  # px, ako fotky/katalog-obalka.jpg
ATRAMENT = '#0b1b33'  # --color-ink

PDF = {
    'dc000058-microflex-rev12.pdf': 'vyhlasenie-o-zhode.jpg',
    'SmartEPD-Microflex.pdf': 'epd.jpg',
    'MICROFLEX-HP_SK-_-PDF.pdf': 'technicky-list-hp.jpg',
}
DXF = {
    'Microflex_Uno_Primo_Riscaldamento_Raffreddamento.DXF': 'vykres-uno-vykurovanie.jpg',
    'Microflex_Duo_Primo_Riscaldamento_Raffreddamento.DXF': 'vykres-duo-vykurovanie.jpg',
    'Microflex_Uno_Acqua_Sanitaria.DXF': 'vykres-uno-pitna-voda.jpg',
    'Microflex_Duo_Primo_Acqua_Sanitaria.DXF': 'vykres-duo-pitna-voda.jpg',
    'Microflex_Quadro_Riscaldamento_Raffrescamento_ACS.DXF': 'vykres-quadro.jpg',
    'Microflex-Cool-Uno-.DXF': 'vykres-cool-uno.jpg',
    'Microflex-Cool-Uno-Cavo-Scaldante.DXF': 'vykres-cool-uno-kabel.jpg',
    'Microflex_Cool_Duo.DXF': 'vykres-cool-duo.jpg',
    'MICROFLEX_HP_RISC_RAFF_COLL_POMPE_CALORE.DXF': 'vykres-hp.jpg',
}
# Rám výkresov Watts je na x 6,3 až 413,1 mm a y 7,1 až 291,1 mm; list A3 (420 × 297 mm) okolo neho.
STRED = (209.7, 149.1)
LIST_A3 = BoundingBox2d([(STRED[0] - 210, STRED[1] - 148.5), (STRED[0] + 210, STRED[1] + 148.5)])


def uloz(im: Image.Image, meno: str) -> None:
    im.convert('RGB').save(CIEL / meno, 'JPEG', quality=90, optimize=True, progressive=True)
    print(f'{meno}: {im.width} × {im.height}, {(CIEL / meno).stat().st_size // 1024} kB')


def strana_pdf(subor: Path) -> Image.Image:
    strana = fitz.open(subor)[0]
    pix = strana.get_pixmap(matrix=fitz.Matrix(SIRKA_A4 / strana.rect.width, SIRKA_A4 / strana.rect.width), alpha=False)
    im = Image.open(io.BytesIO(pix.tobytes('png')))
    vyska = round(SIRKA_A4 * 297 / 210)
    if im.height >= vyska:
        return im.crop((0, 0, SIRKA_A4, vyska))
    a4 = Image.new('RGB', (SIRKA_A4, vyska), 'white')
    a4.paste(im, (0, 0))
    return a4


def vykres(subor: Path) -> Image.Image:
    doc = ezdxf.readfile(subor)
    nastavenie = config.Configuration(
        background_policy=config.BackgroundPolicy.WHITE,
        color_policy=config.ColorPolicy.CUSTOM,
        custom_fg_color=ATRAMENT,
        # Čiary hrubšie ako pri tlači, lebo náhľad má na stole asi 440 px. Pri dvojnásobku by husté
        # rebrá plášťa (výkres HP) splynuli do tmavej plochy.
        lineweight_scaling=1.4,
    )
    zadok = pymupdf.PyMuPdfBackend()
    Frontend(RenderContext(doc), zadok, config=nastavenie).draw_layout(doc.modelspace())
    strana = layout.Page(420, 297, layout.Units.mm, margins=layout.Margins.all(0))
    png = zadok.get_pixmap_bytes(strana, settings=layout.Settings(fit_page=True, min_stroke_width=0.25),
                                 dpi=round(2 * SIRKA_A4 / (420 / 25.4)), render_box=LIST_A3)
    im = Image.open(io.BytesIO(png))
    return im.resize((2 * SIRKA_A4, round(SIRKA_A4 * 297 / 210)), Image.LANCZOS)


CIEL.mkdir(exist_ok=True)
for zdroj, meno in PDF.items():
    uloz(strana_pdf(ZDROJ / zdroj), meno)
for zdroj, meno in DXF.items():
    uloz(vykres(ZDROJ / zdroj), meno)
