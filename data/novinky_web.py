"""Novinky z 3D modelu (Juraj 28. 10. 2026) z renderov dávky `davka.py web --len teplo,mierka,kotuc,ohyb` do webu.

  teplo     termokamera v zábere hlavy: rovnaký výrez ako hlavy a varianty (spoločný rámec z rendery_web.py),
            web/src/assets/3d/teplo-hlavy, teplo-varianty a body a teploty kót v web/src/data/teplo.json
  mierka    všetky dimenzie radu v mierke: obrázok do web/src/assets/3d/mierka, masky dimenzií a mapa indexov
            do web/public/3d/mierka/<rad>/, body štítkov do web/src/data/mierka.json
  rodina    masky šiestich systémov rodiny z webu (render --maska) do web/public/3d/rodina-masky/
  ohyb      sekvencie ohybu (AVIF 1200 a 800 px, posledná snímka aj WebP) do web/public/3d/ohyb-<rad>/
            a body kóty polomeru do web/src/data/ohyb-<rad>.json
  kotuc     záber kotúča do web/src/assets/3d/kotuc a odvaľovanie do web/public/3d/kotuc-odvalenie/
  vsetko    všetko, čo je vyrenderované (chýbajúce preskočí)

Spustenie: C:/Users/krist/nastroje/web/.venv/Scripts/python.exe -I data/novinky_web.py vsetko
"""
import json
import re
import shutil
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parent.parent
WEB3D = REPO / "data" / "_3d" / "web"
ASSETS = REPO / "web" / "src" / "assets" / "3d"
PUBLIC = REPO / "web" / "public" / "3d"
DATA = REPO / "web" / "src" / "data"
RADY12 = ["microflex-uno-6-bar", "microflex-duo-6-bar", "microflex-uno-primo-6-bar", "microflex-primo-duo-6-bar",
          "microflex-uno-10-bar", "microflex-duo-10-bar", "microflex-primo-duo-10-bar", "microflex-quadro",
          "microflex-cool", "microflex-cool-s-vyhrievacim-kablom", "microflex-cool-duo", "microflex-hp"]
# úloha média v každej nosnej rúre (poradie rúr variantu); názvy prekladá web (i18n teplo.role)
ROLE = {
    "microflex-uno-6-bar": ["privod"], "microflex-uno-primo-6-bar": ["privod"],
    "microflex-duo-6-bar": ["privod", "spiatocka"], "microflex-primo-duo-6-bar": ["privod", "spiatocka"],
    "microflex-uno-10-bar": ["tepla"], "microflex-duo-10-bar": ["tepla", "cirkulacia"],
    "microflex-primo-duo-10-bar": ["tepla", "cirkulacia"],
    "microflex-quadro": ["privod", "spiatocka", "tepla", "cirkulacia"],
    "microflex-hp": ["privod", "spiatocka"], "microflex-cool": ["chlad"], "microflex-cool-duo": ["privod", "spiatocka"],
}


def s_tienom(f):
    obr = Image.open(f).convert("RGBA")
    t = f.with_name(f.stem + "-tien.png")
    return Image.alpha_composite(Image.open(t).convert("RGBA"), obr) if t.exists() else obr


def bbox_spolu(subory, prah=6):
    x0 = y0 = 10 ** 9
    x1 = y1 = 0
    for f in subory:
        for g in (f, f.with_name(f.stem + "-tien.png")):
            if g.exists():
                bb = Image.open(g).getchannel("A").point(lambda v: 255 if v > prah else 0).getbbox()
                if bb:
                    x0, y0, x1, y1 = min(x0, bb[0]), min(y0, bb[1]), max(x1, bb[2]), max(y1, bb[3])
    return x0, y0, x1, y1


def zapis_json(meno, data):
    (DATA / meno).write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def spolocny_ramec_webu():
    """Rovnaký výrez ako hlavy a varianty na webe (data/rendery_web.py, spolocny_ramec)."""
    zdroj = (REPO / "data" / "rendery_web.py").read_text(encoding="utf-8")
    stary = sys.argv
    sys.argv = [stary[0], "--len-body"]
    prostredie = {"__name__": "rendery_web_ramec", "__file__": str(REPO / "data" / "rendery_web.py")}
    exec(compile(zdroj.split("\nRAMEC = None")[0], "rendery_web.py", "exec"), prostredie)
    sys.argv = stary
    return prostredie["spolocny_ramec"]()


# ---------------------------------------------------------------------------------------------
def teplo():
    ramec = spolocny_ramec_webu()
    vystup = {"hlavy": {}, "varianty": {}, "role": ROLE}
    for skupina, sirka in (("teplo-hlavy", 1800), ("teplo-varianty", 1400)):
        zdroj = WEB3D / skupina
        if not zdroj.is_dir():
            print(f"{skupina}: chýba, preskakujem")
            continue
        ciel = ASSETS / skupina
        ciel.mkdir(parents=True, exist_ok=True)
        for png in sorted(zdroj.glob("*.png")):
            meta = json.loads(png.with_suffix(".json").read_text(encoding="utf-8"))
            obr = Image.open(png).convert("RGBA")
            x0, y0, x1, y1 = (round(v * obr.width) for v in ramec)
            x1, y1 = min(x1, obr.width), min(y1, obr.height)
            cw, ch = x1 - x0, y1 - y0
            orez = obr.crop((x0, y0, x1, y1))
            orez.resize((sirka, round(ch * sirka / cw)), Image.LANCZOS).save(ciel / f"{png.stem}.webp", "WEBP", quality=90,
                                                                             alpha_quality=100, method=6, exact=True)

            def pct(p):
                return [round((p[0] - x0) / cw * 100, 2), round((p[1] - y0) / ch * 100, 2)]

            k, t = meta["body_px"][png.name], meta["termo"]
            nosne = [k["rury"][int(r.split("_")[1])] for r in t["rury_obj"]]
            top = min(k["plast_okraj"], key=lambda q: q[1])
            vystup["hlavy" if skupina == "teplo-hlavy" else "varianty"][png.stem] = {
                "rad": meta["rad"], "pomer": round(cw / ch, 4),
                "rury": [{"bod": pct(r["stred"]), "t": tt} for r, tt in zip(nosne, t["t_rury"])],
                "plast": {"bod": pct(top), "vlavo": pct(min(k["plast_okraj"], key=lambda q: q[0])), "t": round(t["t_plast"], 1)},
                "poda": t["t_poda"], "q": t["q_katalog"], "rozsah": t["rozsah"],
            }
        print(f"{skupina}: {len(list(zdroj.glob('*.png')))} obrázkov")
    if vystup["hlavy"] or vystup["varianty"]:
        paleta = json.loads(next((WEB3D / "teplo-hlavy").glob("*.json")).read_text(encoding="utf-8"))["termo"]["paleta"]
        vystup["paleta"] = paleta
        zapis_json("teplo.json", vystup)


# ---------------------------------------------------------------------------------------------
def systemy(zaklad, maska, ciel_public, sirka, ciel_obr=None, sirka_mapy=600):
    """Masky systémov (render --maska) vo výreze základného renderu (obrys výrobku aj tieňa + 2,5 % okraj
    ako data/rendery_web.py). Vráti pomer, krok mapy indexov a body štítkov (horný okraj čela plášťa)."""
    spolu = s_tienom(zaklad)
    bb = spolu.getchannel("A").point(lambda v: 255 if v > 4 else 0).getbbox()
    m = round(0.025 * max(bb[2] - bb[0], bb[3] - bb[1]))
    x0, y0 = max(0, bb[0] - m), max(0, bb[1] - m)
    x1, y1 = min(spolu.width, bb[2] + m), min(spolu.height, bb[3] + m)
    cw, ch = x1 - x0, y1 - y0
    farby = [tuple(c) for _, _, c in json.loads(maska.with_suffix(".json").read_text(encoding="utf-8"))["maska_farby"]]
    a = np.asarray(Image.open(maska).convert("RGBA").crop((x0, y0, x1, y1))).astype(np.float32) / 255.0
    vzd = np.stack([((a[..., :3] - np.array(c)) ** 2).sum(-1) for c in farby], -1)
    index = np.where(a[..., 3] > 0.5, vzd.argmin(-1) + 1, 0).astype(np.uint8)
    ciel_public.mkdir(parents=True, exist_ok=True)
    h = round(ch * sirka / cw)
    for k in range(len(farby)):
        mk = Image.fromarray(((index == k + 1) * 255).astype(np.uint8), "L").resize((sirka, h), Image.LANCZOS)
        Image.merge("RGBA", (mk, mk, mk, mk)).save(ciel_public / f"maska-{k}.webp", "WEBP", lossless=True)
    krok = 255 // len(farby)                  # odtieň sivej v mape = (poradie + 1) · krok
    Image.fromarray(index * krok, "L").resize((sirka_mapy, round(ch * sirka_mapy / cw)), Image.NEAREST).save(
        ciel_public / "mapa.png", optimize=True)
    if ciel_obr:
        ciel_obr.parent.mkdir(parents=True, exist_ok=True)
        spolu.crop((x0, y0, x1, y1)).resize((sirka, h), Image.LANCZOS).save(ciel_obr, "WEBP", quality=92, alpha_quality=100,
                                                                            method=6, exact=True)
    body = json.loads(zaklad.with_suffix(".json").read_text(encoding="utf-8"))["body_px"][zaklad.name]
    zoznam = []
    for b in body:
        top = min(b["plast_okraj"], key=lambda q: q[1])
        zoznam.append({"rad": b["rad"], "obj": b["obj_cislo"],
                       "bod": [round((top[0] - x0) / cw * 100, 2), round((top[1] - y0) / ch * 100, 2)]})
    return {"pomer": round(cw / ch, 4), "krok": krok, "systemy": zoznam}


def mierka():
    vystup = {}
    for rad in RADY12:
        png, maska = WEB3D / "mierka" / f"{rad}.png", WEB3D / "mierka" / f"{rad}-maska.png"
        if not (png.exists() and maska.exists()):
            continue
        d = systemy(png, maska, PUBLIC / "mierka" / rad, 2000, ASSETS / "mierka" / f"{rad}.webp")
        vystup[rad] = {**d, "cesta": f"/3d/mierka/{rad}/"}
    if vystup:
        zapis_json("mierka.json", vystup)
    print(f"mierka: {len(vystup)} radov")


def rodina():
    maska = WEB3D / "rodina" / "rodina-maska.png"
    if not maska.exists():
        src = REPO / "data" / "_3d" / "navrhy" / "rodina" / "maska.png"
        if not src.exists():
            print("rodina: chýba maska (render --pohlad rodina --azimut 40 --elevacia 18 --sirka 4800 --maska)")
            return
        shutil.copy(src, maska)
        shutil.copy(src.with_suffix(".json"), maska.with_suffix(".json"))
    d = systemy(WEB3D / "rodina" / "rodina.png", maska, PUBLIC / "rodina-masky", 2400)
    zapis_json("rodina-masky.json", {**d, "cesta": "/3d/rodina-masky/"})
    print(f"rodina: {len(d['systemy'])} systémov, pomer {d['pomer']}")


# ---------------------------------------------------------------------------------------------
def sekvencia(vstup, vzor, meno, sirky, kvalita=52):
    """Spoločný výrez všetkých snímok s tieňom, AVIF vo všetkých šírkach, posledná snímka aj WebP."""
    snimky = sorted(vstup.glob(vzor))
    W, H = Image.open(snimky[0]).size
    x0, y0, x1, y1 = bbox_spolu(snimky)
    m = round(0.03 * (x1 - x0))
    x0, y0, x1, y1 = max(0, x0 - m), max(0, y0 - m), min(W, x1 + m), min(H, y1 + m)
    cw, ch = x1 - x0, y1 - y0
    ciel = PUBLIC / meno
    for i, f in enumerate(snimky):
        spolu = s_tienom(f).crop((x0, y0, x1, y1))
        for s in sirky:
            mala = spolu.resize((s, round(ch * s / cw)), Image.LANCZOS)
            (ciel / str(s)).mkdir(parents=True, exist_ok=True)
            mala.save(ciel / str(s) / f"{i:03d}.avif", format="AVIF", quality=kvalita, speed=6)
            if i in (0, len(snimky) - 1):   # statický obraz bez skriptu (ohyb: koniec, kotúč: začiatok)
                mala.save(ciel / str(s) / f"{i:03d}.webp", format="WEBP", quality=74, method=4)

    def pct(p):
        return [round((p[0] - x0) / cw * 100, 2), round((p[1] - y0) / ch * 100, 2)]

    return snimky, pct, round(cw / ch, 4)


def dokoncena(skupina, rad, snimky):
    """Sekvencia je dokončená: dávka zapíše riadok radu do STAV.txt až po renderi aj fotodokončení všetkých snímok
    (vinetácia a zrno sa prepisujú na mieste, skorší prevod by zmiešal snímky). Hotová sekvencia z predošlého behu
    riadok mať nemusí (dávka ju preskočí), stačí, že sa snímky pol hodiny nemenili."""
    posledna = max(f.stat().st_mtime for f in snimky)
    stav = WEB3D / "STAV.txt"
    casy = [time.mktime(time.strptime(r[:16], "%Y-%m-%d %H:%M"))
            for r in (stav.read_text(encoding="utf-8").splitlines() if stav.exists() else []) if f"| {skupina}/{rad} (" in r]
    return (bool(casy) and max(casy) + 60 >= posledna) or time.time() - posledna > 1800


def ohyb():
    for rad in RADY12:
        vstup = WEB3D / "ohyb" / rad
        if not (vstup / "ohyb.json").exists():
            continue
        snimky = list(vstup.glob("ohyb-[0-9][0-9][0-9].png"))
        if len(snimky) != len(json.loads((vstup / "ohyb.json").read_text(encoding="utf-8"))["ohyb_px"]) or not dokoncena("ohyb", rad, snimky):
            print(f"ohyb {rad}: ešte sa renderuje, preskočené")
            continue
        meta = json.loads((vstup / "ohyb.json").read_text(encoding="utf-8"))
        snimky, pct, pomer = sekvencia(vstup, "ohyb-[0-9][0-9][0-9].png", f"ohyb-{rad}", (1200, 800))
        body = [{"stred": pct(meta["ohyb_px"][f.name]["stred"]), "os": pct(meta["ohyb_px"][f.name]["os_polovica"])}
                for f in snimky]
        zapis_json(f"ohyb-{rad}.json", {"snimok": len(snimky), "pomer": pomer, "sirky": [1200, 800], "cesta": f"/3d/ohyb-{rad}/",
                                        "rad": rad, "obj_cislo": meta["obj_cislo"], "plast_mm": meta["plast_mm"],
                                        "polomer_m": meta["ohyb"]["polomer_m"], "body": body})
        print(f"ohyb {rad}: {len(snimky)} snímok, polomer {meta['ohyb']['polomer_m']} m")


def kotuc():
    zdroj = WEB3D / "kotuc"
    png = zdroj / "kotuc.png"
    vystup = {}
    if png.exists():
        meta = json.loads(png.with_suffix(".json").read_text(encoding="utf-8"))
        spolu = s_tienom(png)
        bb = spolu.getchannel("A").point(lambda v: 255 if v > 4 else 0).getbbox()
        m = round(0.03 * max(bb[2] - bb[0], bb[3] - bb[1]))
        x0, y0, x1, y1 = max(0, bb[0] - m), max(0, bb[1] - m), min(spolu.width, bb[2] + m), min(spolu.height, bb[3] + m)
        cw, ch = x1 - x0, y1 - y0
        (ASSETS / "kotuc").mkdir(parents=True, exist_ok=True)
        spolu.crop((x0, y0, x1, y1)).resize((1600, round(ch * 1600 / cw)), Image.LANCZOS).save(
            ASSETS / "kotuc" / "kotuc.webp", "WEBP", quality=90, alpha_quality=100, method=6, exact=True)
        kp = meta["kotuc_px"][png.name]
        pct = lambda p: [round((p[0] - x0) / cw * 100, 2), round((p[1] - y0) / ch * 100, 2)]   # noqa: E731
        vystup["zaber"] = {"pomer": round(cw / ch, 4), "kotuc": meta["kotuc"],
                           "body": {k: pct(v) for k, v in kp.items() if isinstance(v, list)} |
                           {"celo": pct(meta["body_px"][png.name]["plast_celo_stred"])}}
    clanok = zdroj / "kotuc-clanok.png"      # na šírku do hlavy článku Pokládka
    if clanok.exists():
        spolu = s_tienom(clanok)
        bb = spolu.getchannel("A").point(lambda v: 255 if v > 4 else 0).getbbox()
        m = round(0.03 * max(bb[2] - bb[0], bb[3] - bb[1]))
        spolu = spolu.crop((max(0, bb[0] - m), max(0, bb[1] - m), min(spolu.width, bb[2] + m), min(spolu.height, bb[3] + m)))
        spolu.resize((1600, round(spolu.height * 1600 / spolu.width)), Image.LANCZOS).save(
            ASSETS / "kotuc" / "kotuc-clanok.webp", "WEBP", quality=90, alpha_quality=100, method=6, exact=True)
    d = zdroj / "odvalenie"
    if (d / "kotuc.json").exists() and len(list(d.glob("kotuc-[0-9][0-9][0-9].png"))) >= 48:
        meta = json.loads((d / "kotuc.json").read_text(encoding="utf-8"))
        snimky, pct, pomer = sekvencia(d, "kotuc-[0-9][0-9][0-9].png", "kotuc-odvalenie", (1600, 1000))
        vystup["odvalenie"] = {"snimok": len(snimky), "pomer": pomer, "sirky": [1600, 1000], "cesta": "/3d/kotuc-odvalenie/",
                               "kotuc": meta["kotuc"], "body": [
                                   {"vrch": pct(meta["kotuc_px"][f.name]["vrch"]), "celo": pct(meta["body_px"][f.name]["plast_celo_stred"]),
                                    "volny_m": meta["kotuc_px"][f.name]["volny_m"]} for f in snimky]}
    if vystup:
        zapis_json("kotuc.json", vystup)
    print(f"kotuc: {', '.join(vystup) or 'nič'}")


if __name__ == "__main__":
    kroky = {"teplo": teplo, "mierka": mierka, "rodina": rodina, "ohyb": ohyb, "kotuc": kotuc}
    for k in (kroky if sys.argv[1] == "vsetko" else sys.argv[1:]):
        kroky[k]()
