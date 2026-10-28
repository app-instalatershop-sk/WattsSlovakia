"""Reklamné podklady z 3D modelu do jedného priečinka (Juraj 28. 10. 2026: „fotky, ktoré budú dobré pre reklamy,
nechaj uložené v jednej zložke, budú sa hodiť dobudúcna“).

Skladá hotové rendery produkčnej sady (data/_3d/web, dávka davka.py web) do priečinka reklama/ v koreni projektu:

  01-produkty-na-bielom/<rad>/<obj>.jpg   každá dimenzia na bielom, štvorec 2000 px (e-shop, katalóg, ponuky)
  02-rady-na-bielom/<rad>.jpg             celé potrubie každého radu na bielom, 3000 x 2000 px
  03-vyrezy-png/                          priehľadné PNG v plnom rozlíšení renderu s tieňom (grafik ich dá na
                                          akékoľvek pozadie): hero, rodina, hlavy a telá radov, makrá, kotúč, mierka
  04-teplo/                               teplo v reze ako termokamera, na tmavom pozadí aj priehľadné
  05-ohyb/                                ohnutá rúra na najmenší polomer pre každý rad
  06-videa/                               slučky MP4 bez zvuku: rozložený rez, ohyb, kotúč; 16:9, 1:1, 9:16
  index.html                              prehľad všetkého (otvoriť dvojklikom v prehliadači)
  README.md                               čo je kde a na čo sa to hodí

Priečinok je mimo gitu (stovky MB, dá sa kedykoľvek vytvoriť znova týmto skriptom). Skript preskočí, čo už je
hotové a je novšie ako render; chýbajúce rendery preskočí.

Spustenie: C:/Users/krist/nastroje/web/.venv/Scripts/python.exe -I data/reklama.py [fotky|vyrezy|teplo|ohyb|videa|index]
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
WEB3D = REPO / "data" / "_3d" / "web"
CIEL = REPO / "reklama"
BLENDER = "C:/Users/krist/nastroje/blender/blender-5.2.3-windows-x64/blender.exe"
RADY12 = ["microflex-uno-6-bar", "microflex-duo-6-bar", "microflex-uno-primo-6-bar", "microflex-primo-duo-6-bar",
          "microflex-uno-10-bar", "microflex-duo-10-bar", "microflex-primo-duo-10-bar", "microflex-quadro",
          "microflex-cool", "microflex-cool-s-vyhrievacim-kablom", "microflex-cool-duo", "microflex-hp"]
PODKLAD = (242, 245, 249)        # svetlý pás webu (--zem-1) pre videá
TMAVY = (11, 21, 48)             # tmavomodrá obrazovka termokamery na webe


def novsi(ciel, *zdroje):
    """Treba vyrobiť: cieľ chýba alebo je starší ako niektorý zdroj."""
    return not ciel.exists() or any(z.exists() and z.stat().st_mtime > ciel.stat().st_mtime for z in zdroje)


def s_tienom(png):
    obr = Image.open(png).convert("RGBA")
    t = png.with_name(png.stem + "-tien.png")
    return Image.alpha_composite(Image.open(t).convert("RGBA"), obr) if t.exists() else obr


def na_ploche(obr, w, h, farba, vypln=0.84):
    """Výrobok s tieňom v strede plochy danej farby, najdlhšia strana zaberie podiel `vypln`."""
    bb = obr.getchannel("A").point(lambda v: 255 if v > 4 else 0).getbbox()
    o = obr.crop(bb)
    k = min(w * vypln / o.width, h * vypln / o.height)
    o = o.resize((round(o.width * k), round(o.height * k)), Image.LANCZOS)
    plocha = Image.new("RGBA", (w, h), (*farba, 255))
    plocha.alpha_composite(o, ((w - o.width) // 2, (h - o.height) // 2))
    return plocha.convert("RGB")


def fotky():
    varianty = json.loads((REPO / "web" / "src" / "data" / "varianty.json").read_text(encoding="utf-8"))
    n = 0
    for v in varianty:
        meno = "".join(ch for ch in v["obj_cislo"] if ch.isalnum())
        zdroj = WEB3D / "varianty" / f"{meno}.png"
        ciel = CIEL / "01-produkty-na-bielom" / v["rad"] / f"{meno}.jpg"
        if zdroj.exists() and novsi(ciel, zdroj):
            ciel.parent.mkdir(parents=True, exist_ok=True)
            na_ploche(s_tienom(zdroj), 2000, 2000, (255, 255, 255)).save(ciel, "JPEG", quality=92, optimize=True)
            n += 1
    for rad in RADY12:
        zdroj = WEB3D / "rady" / f"{rad}.png"
        ciel = CIEL / "02-rady-na-bielom" / f"{rad}.jpg"
        if zdroj.exists() and novsi(ciel, zdroj):
            ciel.parent.mkdir(parents=True, exist_ok=True)
            na_ploche(s_tienom(zdroj), 3000, 2000, (255, 255, 255), 0.88).save(ciel, "JPEG", quality=92, optimize=True)
            n += 1
    print(f"fotky na bielom: nových {n}")


def vyrezy():
    """Priehľadné PNG s tieňom v plnom rozlíšení (bez orezania prázdna okolo výrobku je 3 %)."""
    zoznam = [(WEB3D / "hero" / "duo.png", "hero-duo"), (WEB3D / "rodina" / "rodina.png", "rodina-6-systemov"),
              (WEB3D / "kotuc" / "kotuc.png", "kotuc-100-m"), (WEB3D / "kotuc" / "kotuc-clanok.png", "kotuc-100-m-na-sirku")]
    zoznam += [(WEB3D / "hlavy" / f"{r}.png", f"hlava-{r}") for r in RADY12]
    zoznam += [(WEB3D / "rady" / f"{r}.png", f"rad-{r}") for r in RADY12]
    zoznam += [(WEB3D / "mierka" / f"{r}.png", f"dimenzie-v-mierke-{r}") for r in RADY12]
    zoznam += [(p, f"makro-{p.stem}") for p in sorted((WEB3D / "makra").glob("*.png")) if not p.stem.endswith("-tien")]
    n = 0
    for zdroj, meno in zoznam:
        ciel = CIEL / "03-vyrezy-png" / f"{meno}.png"
        if not zdroj.exists() or not novsi(ciel, zdroj):
            continue
        ciel.parent.mkdir(parents=True, exist_ok=True)
        obr = s_tienom(zdroj)
        bb = obr.getchannel("A").point(lambda v: 255 if v > 2 else 0).getbbox()
        m = round(0.03 * max(bb[2] - bb[0], bb[3] - bb[1]))
        obr.crop((max(0, bb[0] - m), max(0, bb[1] - m), min(obr.width, bb[2] + m), min(obr.height, bb[3] + m))).save(ciel, optimize=True)
        n += 1
    print(f"výrezy PNG: nových {n}")


def teplo():
    n = 0
    for zdroj in sorted((WEB3D / "teplo-hlavy").glob("*.png")):
        for meno, tmave in ((f"teplo-{zdroj.stem}.png", False), (f"teplo-{zdroj.stem}-tmave.jpg", True)):
            ciel = CIEL / "04-teplo" / meno
            if not novsi(ciel, zdroj):
                continue
            ciel.parent.mkdir(parents=True, exist_ok=True)
            obr = Image.open(zdroj).convert("RGBA")
            if tmave:
                na_ploche(obr, 3000, 2400, TMAVY, 0.86).save(ciel, "JPEG", quality=92, optimize=True)
            else:
                bb = obr.getchannel("A").getbbox()
                obr.crop(bb).save(ciel, optimize=True)
            n += 1
    print(f"teplo: nových {n}")


def ohyb():
    n = 0
    for rad in RADY12:
        snimky = sorted((WEB3D / "ohyb" / rad).glob("ohyb-[0-9][0-9][0-9].png"))
        if len(snimky) < 40:
            continue
        zdroj = snimky[-1]
        for meno, farba in ((f"ohyb-{rad}.png", None), (f"ohyb-{rad}-na-bielom.jpg", (255, 255, 255))):
            ciel = CIEL / "05-ohyb" / meno
            if not novsi(ciel, zdroj):
                continue
            ciel.parent.mkdir(parents=True, exist_ok=True)
            obr = s_tienom(zdroj)
            if farba:
                na_ploche(obr, 2400, 2000, farba, 0.9).save(ciel, "JPEG", quality=92, optimize=True)
            else:
                obr.save(ciel, optimize=True)
            n += 1
    print(f"ohyb: nových {n}")


def video_zo_snimok(snimky, ciel, w, h, pauza_zac=20, pauza_kon=40, tam_a_spat=True, fps=30):
    """Slučka MP4 zo sekvencie s tieňom na svetlom podklade: spoločný výrez, pauzy, tam a späť."""
    x0 = y0 = 10 ** 9
    x1 = y1 = 0
    for f in snimky:
        for g in (f, f.with_name(f.stem + "-tien.png")):
            if g.exists():
                bb = Image.open(g).getchannel("A").point(lambda v: 255 if v > 6 else 0).getbbox()
                if bb:
                    x0, y0, x1, y1 = min(x0, bb[0]), min(y0, bb[1]), max(x1, bb[2]), max(y1, bb[3])
    cw, ch = x1 - x0, y1 - y0
    k = min(w * 0.86 / cw, h * 0.80 / ch)
    ow, oh = round(cw * k), round(ch * k)
    tmp = ciel.with_suffix("")
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir(parents=True)
    obrazy = []
    for f in snimky:
        p = Image.new("RGBA", (w, h), (*PODKLAD, 255))
        p.alpha_composite(s_tienom(f).crop((x0, y0, x1, y1)).resize((ow, oh), Image.LANCZOS), ((w - ow) // 2, (h - oh) // 2))
        obrazy.append(p.convert("RGB"))
    poradie = [0] * pauza_zac + list(range(len(obrazy))) + [len(obrazy) - 1] * pauza_kon
    if tam_a_spat:
        poradie += list(range(len(obrazy) - 1, -1, -1))
    for i, j in enumerate(poradie):
        obrazy[j].save(tmp / f"{i:04d}.png", compress_level=1)
    subprocess.run([BLENDER, "-b", "--factory-startup", "--python-exit-code", "1", "-P", str(REPO / "data" / "blender" / "video.py"),
                    "--", str(tmp), str(ciel), str(fps)], check=True, capture_output=True)
    shutil.rmtree(tmp, ignore_errors=True)


FORMATY = {"16x9": (1920, 1080), "1x1": (1080, 1080), "9x16": (1080, 1920)}


def videa():
    n = 0
    ulohy = []
    for rad in RADY12:
        ulohy.append((sorted((WEB3D / "rozlozeny" / rad).glob("rozlozeny-[0-9][0-9][0-9].png")), f"rozlozeny-rez-{rad}", 72, ("16x9", "1x1", "9x16")))
        ulohy.append((sorted((WEB3D / "ohyb" / rad).glob("ohyb-[0-9][0-9][0-9].png")), f"ohyb-{rad}", 40, ("16x9", "1x1")))
    ulohy.append((sorted((WEB3D / "kotuc" / "odvalenie").glob("kotuc-[0-9][0-9][0-9].png")), "kotuc-odvalenie", 48, ("16x9", "1x1")))
    for snimky, meno, pocet, formaty in ulohy:
        if len(snimky) < pocet:
            continue
        for fmt in formaty:
            ciel = CIEL / "06-videa" / f"{meno}-{fmt}.mp4"
            if novsi(ciel, snimky[-1]):
                ciel.parent.mkdir(parents=True, exist_ok=True)
                video_zo_snimok(snimky, ciel, *FORMATY[fmt])
                n += 1
                print(f"  {ciel.name}: {ciel.stat().st_size / 1e6:.1f} MB")
    print(f"videá: nových {n}")


def index():
    """Miestny prehľad (otvoriť dvojklikom): náhľady obrázkov a videá s rozmermi a veľkosťou."""
    nahlady = CIEL / ".nahlady"
    nahlady.mkdir(parents=True, exist_ok=True)
    sekcie = []
    for priecinok in sorted(p for p in CIEL.iterdir() if p.is_dir() and not p.name.startswith(".")):
        polozky = []
        for f in sorted(priecinok.rglob("*")):
            if f.suffix.lower() in (".jpg", ".png"):
                n = nahlady / (f.relative_to(CIEL).as_posix().replace("/", "__") + ".jpg")
                if novsi(n, f):
                    im = Image.open(f)
                    rozmer = im.size
                    im = im.convert("RGBA")
                    pod = Image.new("RGBA", im.size, (232, 236, 242, 255))
                    pod.alpha_composite(im)
                    pod = pod.convert("RGB")
                    pod.thumbnail((480, 480))
                    pod.save(n, "JPEG", quality=82)
                else:
                    rozmer = Image.open(f).size
                polozky.append(f'<figure><a href="{f.relative_to(CIEL).as_posix()}"><img src=".nahlady/{n.name}" loading="lazy" alt=""></a>'
                               f'<figcaption>{f.name}<br><small>{rozmer[0]} × {rozmer[1]} px, {f.stat().st_size / 1e6:.1f} MB</small></figcaption></figure>')
            elif f.suffix.lower() == ".mp4":
                polozky.append(f'<figure><video src="{f.relative_to(CIEL).as_posix()}" muted loop playsinline preload="metadata" controls></video>'
                               f'<figcaption>{f.name}<br><small>{f.stat().st_size / 1e6:.1f} MB</small></figcaption></figure>')
        if polozky:
            sekcie.append(f'<section><h2>{priecinok.name}</h2><div class="mriezka">{"".join(polozky)}</div></section>')
    (CIEL / "index.html").write_text(f"""<!doctype html><html lang="sk"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Microflex: reklamné podklady z 3D modelu</title>
<style>body{{margin:0;padding:32px;font:15px/1.5 system-ui,sans-serif;background:#f4f6f9;color:#0b1b33}}h1{{font-size:28px;margin:0 0 6px}}
h2{{font-size:18px;margin:36px 0 12px}}.mriezka{{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}}
figure{{margin:0;background:#fff;border-radius:12px;padding:10px;box-shadow:0 1px 3px rgb(0 0 0/.08)}}img,video{{width:100%;height:auto;border-radius:8px;display:block;background:#e8ecf2}}
figcaption{{margin-top:6px;font-size:13px;word-break:break-all}}small{{color:#5b6779}}</style>
<h1>Microflex: reklamné podklady z 3D modelu</h1><p>Popis a odporúčané použitie: README.md v tomto priečinku. Klik na obrázok otvorí plné rozlíšenie.</p>
{"".join(sekcie)}</html>""", encoding="utf-8")
    print("index.html hotový")


if __name__ == "__main__":
    kroky = {"fotky": fotky, "vyrezy": vyrezy, "teplo": teplo, "ohyb": ohyb, "videa": videa, "index": index}
    for k in (sys.argv[1:] or list(kroky)):
        kroky[k]()
