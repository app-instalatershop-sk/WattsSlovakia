"""Rendery návrhov (data/_3d/navrhy) pre pracovné stránky /navrhy/ (Juraj 28. 10. 2026: „urob mi návrhy,
ako by to vyzeralo“). Po rozhodnutí sa vybrané návrhy prenesú do webu a tento skript sa zmaže spolu
so stránkami /navrhy/.

  ohyb <priecinok> <meno>   sekvencia ohybu: spoločný orez, AVIF 1200/800 px, posledná snímka aj WebP,
                            body kóty polomeru v percentách orezu -> web/src/data/navrhy/<meno>.json
  teplo <priecinok> <meno>  termo pohľady variantov: rovnaký orez ako hlavy a varianty na webe
                            (spoločný rámec z data/rendery_web.py), WebP 1400 px a teploty pre kóty

Spustenie: C:/Users/krist/nastroje/web/.venv/Scripts/python.exe -I data/navrhy_web.py ohyb data/_3d/navrhy/ohyb/duo ohyb-duo
"""
import json
import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
PUBLIC = REPO / "web" / "public" / "navrhy"
DATA = REPO / "web" / "src" / "data" / "navrhy"


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


def s_tienom(f):
    obr = Image.open(f).convert("RGBA")
    t = f.with_name(f.stem + "-tien.png")
    return Image.alpha_composite(Image.open(t).convert("RGBA"), obr) if t.exists() else obr


def ohyb(priecinok, meno, sirky=(1200, 800)):
    vstup = REPO / priecinok
    meta = json.loads((vstup / "ohyb.json").read_text(encoding="utf-8"))
    snimky = sorted(vstup.glob("ohyb-[0-9][0-9][0-9].png"))
    W, H = meta["rozlisenie"]
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
            mala.save(ciel / str(s) / f"{i:03d}.avif", format="AVIF", quality=52, speed=6)
            if i == len(snimky) - 1:
                mala.save(ciel / str(s) / f"{i:03d}.webp", format="WEBP", quality=72, method=4)

    def pct(p):
        return [round((p[0] - x0) / cw * 100, 2), round((p[1] - y0) / ch * 100, 2)]

    body = []
    for f in snimky:
        o = meta["ohyb_px"][f.name]
        k = meta["body_px"][f.name]
        top = min(k["plast_okraj"], key=lambda q: q[1])
        body.append({"stred": pct(o["stred"]), "os": pct(o["os_polovica"]), "koniec": pct(o["os_koniec"]),
                     "uhol": o["uhol"], "plast": pct(top)})
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / f"{meno}.json").write_text(json.dumps({
        "meno": meno, "snimok": len(snimky), "pomer": round(cw / ch, 4), "sirky": list(sirky), "cesta": f"/navrhy/{meno}/",
        "rad": meta["rad"], "obj_cislo": meta["obj_cislo"], "plast_mm": meta["plast_mm"],
        "polomer_m": meta["ohyb"]["polomer_m"], "uhol": meta["ohyb"]["uhol"], "body": body}, ensure_ascii=False),
        encoding="utf-8")
    print(f"{meno}: {len(snimky)} snímok, orez {cw} x {ch} px, polomer {meta['ohyb']['polomer_m']} m")


def spolocny_ramec_webu():
    """Rovnaký výrez ako hlavy a varianty na webe (data/rendery_web.py, spolocny_ramec)."""
    sys.argv = [sys.argv[0], "--len-body"]
    zdroj = (REPO / "data" / "rendery_web.py").read_text(encoding="utf-8")
    prostredie = {"__name__": "rendery_web_ramec", "__file__": str(REPO / "data" / "rendery_web.py")}
    # len definície (bez spracovania skupín na konci súboru)
    exec(compile(zdroj.split("\nRAMEC = None")[0], "rendery_web.py", "exec"), prostredie)
    return prostredie["spolocny_ramec"]()


def teplo(priecinok, meno, sirka=1400):
    vstup = REPO / priecinok
    ramec = spolocny_ramec_webu()
    ciel = PUBLIC / meno
    ciel.mkdir(parents=True, exist_ok=True)
    zaznamy = {}
    for png in sorted(vstup.glob("*.png")):
        if png.stem.endswith("-tien"):
            continue
        meta = json.loads(png.with_suffix(".json").read_text(encoding="utf-8"))
        obr = Image.open(png).convert("RGBA")
        x0, y0, x1, y1 = (round(v * obr.width) for v in ramec)
        x1, y1 = min(x1, obr.width), min(y1, obr.height)
        orez = obr.crop((x0, y0, x1, y1))
        h = round(orez.height * sirka / orez.width)
        orez.resize((sirka, h), Image.LANCZOS).save(ciel / f"{png.stem}.webp", "WEBP", quality=90, alpha_quality=100,
                                                     method=6, exact=True)
        cw, ch = x1 - x0, y1 - y0

        def pct(p):
            return [round((p[0] - x0) / cw * 100, 2), round((p[1] - y0) / ch * 100, 2)]

        k = meta["body_px"][png.name]
        t = meta["termo"]
        nosne = [k["rury"][int(r.split("_")[1])] for r in t["rury_obj"]]
        top = min(k["plast_okraj"], key=lambda q: q[1])
        zaznamy[png.stem] = {
            "src": f"/navrhy/{meno}/{png.stem}.webp", "pomer": round(cw / ch, 4),
            "rury": [{"bod": pct(r["stred"]), "t": tt} for r, tt in zip(nosne, t["t_rury"])],
            "plast": {"bod": pct(top), "t": round(t["t_plast"], 1)},
            "t_poda": t["t_poda"], "q": t["q"], "q_katalog": t["q_katalog"], "q_model": t["q_model"],
            "faktor": t["faktor"], "rozsah": t["rozsah"], "paleta": t["paleta"],
        }
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / f"{meno}.json").write_text(json.dumps(zaznamy, ensure_ascii=False), encoding="utf-8")
    print(f"{meno}: {len(zaznamy)} obrázkov, výrez {tuple(round(v, 4) for v in ramec)}")


def rodina(maska_png, meno):
    """Rodina na ťuknutie: základ je rodina z webu (data/_3d/web/rodina), obrázok sa neukladá."""
    systemy("data/_3d/web/rodina/rodina.png", maska_png, meno, 2400, False)


def mierka(zaklad_png, maska_png, meno):
    """Dimenzie v mierke: vlastný render radu (rodina so zoznamom variantov), uloží aj obrázok."""
    systemy(zaklad_png, maska_png, meno, 2000, True)


def systemy(zaklad_png, maska_png, meno, sirka=2400, ulozit_zaklad=False, sirka_mapy=600):
    """Maska systémov (render --maska) v rovnakom výreze ako základný render (ako data/rendery_web.py:
    obrys výrobku aj tieňa + 2,5 % okraj): masky jednotlivých systémov na zvýraznenie, malá mapa indexov
    na ťuknutie (odtieň sivej = poradie systému) a body štítkov (horný okraj čela plášťa)."""
    zaklad = REPO / zaklad_png
    spolu = s_tienom(zaklad)
    bb = spolu.getchannel("A").point(lambda v: 255 if v > 4 else 0).getbbox()
    m = round(0.025 * max(bb[2] - bb[0], bb[3] - bb[1]))
    x0, y0 = max(0, bb[0] - m), max(0, bb[1] - m)
    x1, y1 = min(spolu.width, bb[2] + m), min(spolu.height, bb[3] + m)
    cw, ch = x1 - x0, y1 - y0
    meta = json.loads((REPO / maska_png).with_suffix(".json").read_text(encoding="utf-8"))
    farby = [tuple(c) for _, _, c in meta["maska_farby"]]
    obr = Image.open(REPO / maska_png).convert("RGBA").crop((x0, y0, x1, y1))
    import numpy as np
    a = np.asarray(obr).astype(np.float32) / 255.0
    rgb, alfa = a[..., :3], a[..., 3]
    vzd = np.stack([((rgb - np.array(c)) ** 2).sum(-1) for c in farby], -1)
    index = np.where(alfa > 0.5, vzd.argmin(-1) + 1, 0).astype(np.uint8)
    ciel = PUBLIC / meno
    ciel.mkdir(parents=True, exist_ok=True)
    h = round(ch * sirka / cw)
    for k in range(len(farby)):
        maska = Image.fromarray(((index == k + 1) * 255).astype(np.uint8), "L").resize((sirka, h), Image.LANCZOS)
        Image.merge("RGBA", (maska, maska, maska, maska)).save(ciel / f"maska-{k}.webp", "WEBP", lossless=True)
    hm = round(ch * sirka_mapy / cw)
    krok = 255 // len(farby)          # odtieň sivej = (poradie + 1) · krok
    Image.fromarray(index * krok, "L").resize((sirka_mapy, hm), Image.NEAREST).save(ciel / "mapa.png", optimize=True)
    if ulozit_zaklad:
        spolu.crop((x0, y0, x1, y1)).resize((sirka, h), Image.LANCZOS).save(ciel / "zaklad.webp", "WEBP", quality=90,
                                                                            alpha_quality=100, method=6, exact=True)
    body = json.loads(zaklad.with_suffix(".json").read_text(encoding="utf-8"))["body_px"][zaklad.name]
    zoznam = []
    for b in body:
        top = min(b["plast_okraj"], key=lambda q: q[1])
        zoznam.append({"rad": b["rad"], "obj": b["obj_cislo"],
                        "bod": [round((top[0] - x0) / cw * 100, 2), round((top[1] - y0) / ch * 100, 2)]})
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / f"{meno}.json").write_text(json.dumps({"pomer": round(cw / ch, 4), "cesta": f"/navrhy/{meno}/", "krok": krok,
                                                   "systemy": zoznam}, ensure_ascii=False), encoding="utf-8")
    print(f"{meno}: {len(zoznam)} systémov, výrez {cw} x {ch} px, pomer {cw / ch:.4f}")


def kotuc(priecinok, meno):
    """Kotúč: hlavný záber (kotuc.png) s bodmi kót a zábery rozvíjania (pohyb-*.png), každý vlastný výrez."""
    vstup = REPO / priecinok
    ciel = PUBLIC / meno
    ciel.mkdir(parents=True, exist_ok=True)
    vysledok = {"cesta": f"/navrhy/{meno}/", "zabery": []}
    for png in [vstup / "kotuc.png"] + sorted(vstup.glob("pohyb-*.png"), key=lambda f: float(f.stem.split("-")[1])):
        if png.stem.endswith("-tien") or not png.exists():
            continue
        meta = json.loads(png.with_suffix(".json").read_text(encoding="utf-8"))
        spolu = s_tienom(png)
        bb = spolu.getchannel("A").point(lambda v: 255 if v > 4 else 0).getbbox()
        m = round(0.03 * max(bb[2] - bb[0], bb[3] - bb[1]))
        x0, y0, x1, y1 = max(0, bb[0] - m), max(0, bb[1] - m), min(spolu.width, bb[2] + m), min(spolu.height, bb[3] + m)
        cw, ch = x1 - x0, y1 - y0
        sirka = 1600 if png.stem == "kotuc" else 1000
        orez = spolu.crop((x0, y0, x1, y1))
        orez.resize((sirka, round(ch * sirka / cw)), Image.LANCZOS).save(ciel / f"{png.stem}.webp", "WEBP", quality=90,
                                                                         alpha_quality=100, method=6, exact=True)

        def pct(p):
            return [round((p[0] - x0) / cw * 100, 2), round((p[1] - y0) / ch * 100, 2)]

        kp = meta["kotuc_px"][png.name]
        k = meta["body_px"][png.name]
        vysledok["zabery"].append({"meno": png.stem, "src": f"/navrhy/{meno}/{png.stem}.webp", "pomer": round(cw / ch, 4),
                                   "volny_m": meta["kotuc"]["volny_m"], "kotuc": meta["kotuc"],
                                   "body": {kluc: pct(v) for kluc, v in kp.items()} | {"celo": pct(k["plast_celo_stred"])}})
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / f"{meno}.json").write_text(json.dumps(vysledok, ensure_ascii=False), encoding="utf-8")
    print(f"{meno}: {len(vysledok['zabery'])} záberov")


PODKLAD = (242, 245, 249)
BLENDER = "C:/Users/krist/nastroje/blender/blender-5.2.3-windows-x64/blender.exe"


def video(priecinok, vzor, meno, format_="16x9", fps=30):
    """Slučka MP4 zo sekvencie (rozložený rez, ohyb): snímky s tieňom na svetlom podklade, spoločný
    výrez, pauza na začiatku a na konci, tam a späť (plynulá slučka). Kódovanie: data/blender/video.py."""
    import shutil
    import subprocess
    vstup = REPO / priecinok
    snimky = sorted(vstup.glob(vzor))
    W, H = {"16x9": (1920, 1080), "1x1": (1080, 1080), "9x16": (1080, 1920)}[format_]
    x0, y0, x1, y1 = bbox_spolu(snimky)
    cw, ch = x1 - x0, y1 - y0
    mierka = min(W * 0.86 / cw, H * 0.80 / ch)
    w, h = round(cw * mierka), round(ch * mierka)
    docasny = REPO / "data" / "_3d" / "navrhy" / "videa" / f"{meno}-snimky"
    shutil.rmtree(docasny, ignore_errors=True)
    docasny.mkdir(parents=True)
    obrazy = []
    for f in snimky:
        platno = Image.new("RGBA", (W, H), (*PODKLAD, 255))
        platno.alpha_composite(s_tienom(f).crop((x0, y0, x1, y1)).resize((w, h), Image.LANCZOS), ((W - w) // 2, (H - h) // 2))
        obrazy.append(platno.convert("RGB"))
    poradie = [0] * 20 + list(range(len(obrazy))) + [len(obrazy) - 1] * 40 + list(range(len(obrazy) - 1, -1, -1))
    for i, k in enumerate(poradie):
        obrazy[k].save(docasny / f"{i:04d}.png", compress_level=1)
    ciel = PUBLIC / "videa" / f"{meno}.mp4"
    subprocess.run([BLENDER, "-b", "--factory-startup", "--python-exit-code", "1", "-P", str(REPO / "data" / "blender" / "video.py"), "--",
                    str(docasny), str(ciel), str(fps)], check=True, capture_output=True)
    obrazy[-1].resize((W // 2, H // 2), Image.LANCZOS).save(PUBLIC / "videa" / f"{meno}.webp", "WEBP", quality=82)
    shutil.rmtree(docasny, ignore_errors=True)
    print(f"{meno}.mp4: {len(poradie)} snímok ({len(poradie) / fps:.1f} s), {W} x {H}, {ciel.stat().st_size / 1e6:.1f} MB")


def fotky(*objs):
    """Produktové fotky variantov na bielom, štvorec 2000 px (napr. pre e-shop): render varianty + tieň."""
    ciel = PUBLIC / "fotky"
    ciel.mkdir(parents=True, exist_ok=True)
    for obj in objs:
        spolu = s_tienom(REPO / "data" / "_3d" / "web" / "varianty" / f"{obj}.png")
        bb = spolu.getchannel("A").point(lambda v: 255 if v > 4 else 0).getbbox()
        orez = spolu.crop(bb)
        k = 2000 * 0.84 / max(orez.size)
        orez = orez.resize((round(orez.width * k), round(orez.height * k)), Image.LANCZOS)
        platno = Image.new("RGBA", (2000, 2000), (255, 255, 255, 255))
        platno.alpha_composite(orez, ((2000 - orez.width) // 2, (2000 - orez.height) // 2))
        platno.convert("RGB").save(ciel / f"{obj}.jpg", "JPEG", quality=90, optimize=True)
        platno.convert("RGB").resize((640, 640), Image.LANCZOS).save(ciel / f"{obj}-nahlad.webp", "WEBP", quality=85)
        print(f"{obj}.jpg: {(ciel / f'{obj}.jpg').stat().st_size / 1000:.0f} kB")


if __name__ == "__main__":
    {"ohyb": ohyb, "teplo": teplo, "rodina": rodina, "mierka": mierka, "kotuc": kotuc, "video": video, "fotky": fotky}[sys.argv[1]](*sys.argv[2:])
