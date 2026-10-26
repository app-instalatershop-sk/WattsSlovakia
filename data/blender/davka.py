# -*- coding: utf-8 -*-
"""
Dávkové rendre potrubia Microflex: spustí Blender so skriptom potrubie.py pre celú sadu záberov,
zloží verzie na bielom pozadí a porovnania so skutočnými fotkami.

Spúšťa sa Pythonom s Pillow (nie v Blenderi):
  C:\\Users\\krist\\nastroje\\web\\.venv\\Scripts\\python.exe -I data/blender/davka.py najlepsie
  ... davka.py final        (hero 3200 px, makrá 1600 px, rozložený rez 72 snímok, kontrola radov)
  ... davka.py rady         (len kontrola všeobecnosti: UNO, QUADRO, COOL)

Výstupy: data/_3d/najlepsie/ (vždy aktuálne najlepšie) a data/_3d/final/.
"""
import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[2]
SKRIPT = REPO / "data" / "blender" / "potrubie.py"
BLENDER = Path(r"C:\Users\krist\nastroje\blender\blender-5.2.3-windows-x64\blender.exe")
FOTO_STUDIO = REPO / "podklady" / "watts" / "fotky-katalog" / "katalog-s06-x53.jpeg"
FOTO_MAKRO = REPO / "podklady" / "watts" / "fotky-katalog" / "katalog-s05-x46.jpeg"
FOTO_REZ = REPO / "web" / "src" / "assets" / "fotky" / "prierez-duo.jpg"

sys.dont_write_bytecode = True          # žiadny __pycache__ v repozitári
sys.path.insert(0, str(Path(__file__).resolve().parent))
import porovnanie  # noqa: E402  (zostavy vedľa seba)


def blender(*args, log=None):
    """Spustí potrubie.py v Blenderi; vráti riadky HOTOVO (časy). Pri chybe skončí."""
    cmd = [str(BLENDER), "-b", "--factory-startup", "-P", str(SKRIPT), "--", *[str(a) for a in args]]
    t0 = time.time()
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=REPO)
    riadky = [l for l in r.stdout.splitlines() if l.startswith(("HOTOVO", "Pozor", "POZOR"))]
    for l in riadky:
        print("  ", l)
    if r.returncode != 0 or "Traceback" in r.stdout + r.stderr:
        print(r.stdout[-3000:], r.stderr[-3000:])
        raise SystemExit(f"Blender zlyhal: {' '.join(map(str, args))}")
    print(f"   spolu {time.time() - t0:.0f} s")
    if log is not None:
        log.append({"args": [str(a) for a in args], "hotovo": riadky, "spolu_s": round(time.time() - t0, 1)})
    return riadky


def na_bielom(render, tien, out, sila_tiena=0.7, sirka=None):
    """Render RGBA s vrstvou tieňa na bielom pozadí (náhľad pre majiteľa, JPG/PNG bez alfy)."""
    a = Image.open(render).convert("RGBA")
    bg = Image.new("RGBA", a.size, (255, 255, 255, 255))
    if tien and Path(tien).exists():
        t = Image.open(tien).convert("RGBA")
        if sila_tiena != 1.0:
            t.putalpha(t.getchannel("A").point(lambda v: int(v * sila_tiena)))
        bg.alpha_composite(t)
    bg.alpha_composite(a)
    if sirka and sirka < bg.width:
        bg = bg.resize((sirka, round(bg.height * sirka / bg.width)), Image.LANCZOS)
    bg.convert("RGB").save(out, quality=94)
    return out


def zmensi(src, out, sirka):
    im = Image.open(src)
    im.resize((sirka, round(im.height * sirka / im.width)), Image.LANCZOS).save(out)
    return out


def json_k_obrazku(src_png, dst_png, k=1.0):
    """Záznam renderu (parametre, časy, body_px na kóty) pre zmenšenú alebo skopírovanú verziu:
    súradnice bodov v px sa prenásobia k, kľúč body_px sa premenuje na nový súbor."""
    src_png, dst_png = Path(src_png), Path(dst_png)
    zdroj = src_png.with_suffix(".json")
    if not zdroj.exists():
        # snímka sekvencie: záznam je spoločný v <meno>.json bez čísla snímky
        zdroj = src_png.with_name(src_png.stem.rsplit("-", 1)[0] + ".json")
        if not zdroj.exists():
            return None
    z = json.loads(zdroj.read_text(encoding="utf-8"))

    def mierka(v):
        if isinstance(v, list) and len(v) == 2 and all(isinstance(c, (int, float)) for c in v):
            return [round(v[0] * k, 1), round(v[1] * k, 1)]
        if isinstance(v, list):
            return [mierka(x) for x in v]
        if isinstance(v, dict):
            return {kk: (mierka(vv) if kk not in ("d", "s", "druh") else vv) for kk, vv in v.items()}
        return v

    body = z.get("body_px", {}).get(src_png.name)
    z["body_px"] = {dst_png.name: mierka(body)} if body is not None else {}
    if "rozlisenie" in z:
        z["rozlisenie"] = [round(z["rozlisenie"][0] * k), round(z["rozlisenie"][1] * k)]
    z["zdroj"] = src_png.name
    dst_png.with_suffix(".json").write_text(json.dumps(z, ensure_ascii=False, indent=1), encoding="utf-8")
    return dst_png.with_suffix(".json")


def fotodokoncenie(src, out, vinetacia=0.06, zrno=0.008, seed=11):
    """Fotografický dojem: jemná vinetácia a zrno (nie šum renderu), ako na snímke z fotoaparátu.

    - vinetácia: jas klesá k rohom o 'vinetacia' (podiel, kvadraticky od stredu),
    - zrno: jasový šum s jemným zhlukovaním (rozmazanie 0,6 px), najsilnejší v stredných tónoch,
      sila 'zrno' v jednotkách 0..1 sRGB; pevné semienko, takže sekvencia nebliká.
    Mení sa len farba, alfa (priehľadnosť) ostáva; vrstva tieňa sa neupravuje."""
    import numpy as np
    from PIL import ImageFilter

    im = Image.open(src).convert("RGBA")
    a = np.asarray(im).astype(np.float32) / 255.0
    rgb, alfa = a[..., :3], a[..., 3:4]
    H, W = rgb.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r2 = ((xx - (W - 1) / 2) ** 2 + (yy - (H - 1) / 2) ** 2) / (((W - 1) / 2) ** 2 + ((H - 1) / 2) ** 2)
    rgb = rgb * (1.0 - vinetacia * r2)[..., None]
    rng = np.random.default_rng(seed)
    sum_ = rng.normal(0.0, 1.0, (H, W)).astype(np.float32)
    sum_img = Image.fromarray(np.clip(sum_ * 40 + 128, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    sum_ = (np.asarray(sum_img).astype(np.float32) - 128) / 40.0
    sum_ /= max(1e-6, sum_.std())
    jas = rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    vaha = 0.35 + 2.6 * jas * (1.0 - jas)                  # stredné tóny viac, tiene a svetlá menej
    rgb = rgb + (zrno * sum_ * vaha)[..., None]
    out_a = np.concatenate([np.clip(rgb, 0, 1), alfa], -1)
    Image.fromarray((out_a * 255 + 0.5).astype(np.uint8), "RGBA").save(out)
    return out


def vyrez(src, box, out, mierka=1.0):
    im = Image.open(src).convert("RGB").crop(box)
    if mierka != 1.0:
        im = im.resize((round(im.width * mierka), round(im.height * mierka)), Image.LANCZOS)
    im.save(out)
    return out


def dokonci(cesta, **kw):
    """Uloží čistý render ako <meno>-cisty.png a na pôvodné miesto dá verziu s fotodokončením."""
    cesta = Path(cesta)
    cisty = cesta.with_name(cesta.stem + "-cisty" + cesta.suffix)
    Image.open(cesta).save(cisty)
    fotodokoncenie(cisty, cesta, **kw)
    return cesta


def zostava(out, panely, vyska=700):
    """panely: [(cesta, popis)] -> porovnanie vedľa seba v rovnakej výške."""
    sys.argv = ["porovnanie.py", "--out", str(out), "--vyska", str(vyska), "--pozadie", "255,255,255"]
    for cesta, popis in panely:
        sys.argv += ["--panel", f"{cesta}||{popis}"]
    porovnanie.main()


def sada_najlepsie(a, log):
    """Aktuálne najlepší stav pre majiteľa: DUO štúdio, tri makrá, porovnania so skutočnými fotkami."""
    o = REPO / "data" / "_3d" / "najlepsie"
    tmp = REPO / "data" / "_3d" / "_tmp"
    o.mkdir(parents=True, exist_ok=True)
    tmp.mkdir(parents=True, exist_ok=True)
    v = a.vzorky
    duo = ["--rad", "microflex-duo-6-bar", "--obj", "MD16032C"]
    print("DUO štúdio")
    blender(*duo, "--pohlad", "studio", "--sirka", a.sirka, "--vzorky", v, "--out", o / "duo-studio.png", log=log)
    dokonci(o / "duo-studio.png")
    na_bielom(o / "duo-studio.png", o / "duo-studio-tien.png", o / "duo-studio-na-bielom.jpg")
    for m, extra in (("makro-plast", []), ("makro-pena", []), ("makro-rura", [])):
        print(m)
        blender(*duo, "--pohlad", m, "--sirka", a.sirka_makro, "--vzorky", v, *extra, "--out", o / f"{m}.png", log=log)
        dokonci(o / f"{m}.png", vinetacia=0.06)
    print("porovnanie so štúdiovou fotkou (rovnaký uhol ako fotka)")
    blender(*duo, "--pohlad", "studio", "--azimut", "-42", "--elevacia", "14", "--sirka", 1200, "--vzorky", v,
            "--out", tmp / "ako-foto.png", log=log)
    dokonci(tmp / "ako-foto.png")
    na_bielom(tmp / "ako-foto.png", tmp / "ako-foto-tien.png", tmp / "ako-foto-na-bielom.png")
    vyrez(FOTO_STUDIO, (40, 240, 520, 540), tmp / "foto-studio-vyrez.png", 2.0)
    zostava(o / "porovnanie-studio-s-fotkou.jpg", [(tmp / "ako-foto-na-bielom.png", "Blender (MD16032C)"),
                                                  (tmp / "foto-studio-vyrez.png", "skutočná fotka (katalóg s. 6)")])
    Image.open(FOTO_MAKRO).convert("RGB").save(tmp / "foto-makro.png")
    zostava(o / "porovnanie-makro-plast-s-fotkou.jpg", [(o / "makro-plast.png", "Blender: plášť so zárezom"),
                                                       (tmp / "foto-makro.png", "skutočná fotka (katalóg s. 5)")])
    vyrez(FOTO_REZ, (60, 110, 330, 380), tmp / "foto-rez-vyrez.png", 2.0)
    zostava(o / "porovnanie-makra-s-fotkou.jpg", [(o / "makro-rura.png", "Blender: rúra PE-Xa"),
                                                 (o / "makro-pena.png", "Blender: pena PE-X"),
                                                 (tmp / "foto-rez-vyrez.png", "skutočná fotka rezu DUO")], vyska=600)
    # tri makrá vedľa seba, ako budú v lupách na webe
    zostava(o / "makra-spolu.jpg", [(o / "makro-plast.png", "plášť HDPE (dvojitá stena)"),
                                    (o / "makro-pena.png", "izolácia PE-X"),
                                    (o / "makro-rura.png", "rúra PE-Xa")], vyska=600)


def sada_rady(a, log, o):
    """Kontrola všeobecnosti: iné rady v tom istom štúdiu."""
    for rad, obj in (("microflex-uno-6-bar", "M12532C"), ("microflex-quadro", "MQ16032C2520S"),
                     ("microflex-cool", "M9040PE")):
        print(rad, obj)
        out = o / f"{rad.replace('microflex-', '')}-{obj}.png"
        blender("--rad", rad, "--obj", obj, "--pohlad", "studio", "--sirka", 1600, "--vzorky", a.vzorky, "--out", out, log=log)
        dokonci(out)
        na_bielom(out, out.with_name(out.stem + "-tien.png"), out.with_name(out.stem + "-na-bielom.jpg"))


def sada_final(a, log):
    o = REPO / "data" / "_3d" / "final"
    o.mkdir(parents=True, exist_ok=True)
    duo = ["--rad", "microflex-duo-6-bar", "--obj", "MD16032C"]
    print("hero 3200 px")
    hero = o / "duo-studio-3200.png"
    blender(*duo, "--pohlad", "studio", "--sirka", 3200, "--vzorky", a.vzorky, "--out", hero, log=log)
    dokonci(hero)                                                 # -> duo-studio-3200-cisty.png + dokončený
    zmensi(o / "duo-studio-3200-cisty.png", o / "duo-studio-1600.png", 1600)
    dokonci(o / "duo-studio-1600.png")
    zmensi(o / "duo-studio-3200-tien.png", o / "duo-studio-1600-tien.png", 1600)
    json_k_obrazku(hero, o / "duo-studio-1600.png", 0.5)
    na_bielom(o / "duo-studio-1600.png", o / "duo-studio-1600-tien.png", o / "duo-studio-1600-na-bielom.jpg")
    for m in ("makro-plast", "makro-pena", "makro-rura"):
        print(m)
        # makrá v dvojnásobnom rozlíšení a zmenšené: čistejšie jemné detaily (póry, stopy po nástroji)
        blender(*duo, "--pohlad", m, "--sirka", 3200, "--vzorky", a.vzorky_makro, "--out", o / f"{m}-3200.png", log=log)
        zmensi(o / f"{m}-3200.png", o / f"{m}-1600.png", 1600)
        dokonci(o / f"{m}-1600.png", vinetacia=0.06)
    print("rozložený rez, 72 snímok")
    r = o / "rozlozeny"
    r.mkdir(exist_ok=True)
    blender(*duo, "--pohlad", "rozlozeny", "--snimky", 72, "--sirka", 1600, "--vzorky", a.vzorky_sekvencia,
            "--out", r / "rozlozeny.png", log=log)
    for f in sorted(r.glob("rozlozeny-[0-9][0-9][0-9].png")):
        dokonci(f)                                                # rovnaké zrno vo všetkých snímkach
    for i in (0, 18, 36, 54, 71):                                 # fázy 0, 0,25, 0,5, 0,75, 1
        f = r / f"rozlozeny-{i:03d}.png"
        na_bielom(f, f.with_name(f.stem + "-tien.png"), o / f"rozlozeny-faza-{i / 71:.2f}-na-bielom.jpg")
    sada_rady(a, log, o)


def sada_prvy(a, log):
    """Výstupy podľa prvého zadania v data/_3d/prvy: štúdio DUO a UNO, makrá 1200 px, päť fáz
    rozloženia (0, 0,25, 0,5, 0,75, 1) s kamerou sekvencie, porovnania s rendermi Watts a s fotkami.
    Predpokladá hotovú sadu final (hero a makrá sa len zmenšia, nerenderujú sa znova)."""
    o = REPO / "data" / "_3d" / "prvy"
    f = REPO / "data" / "_3d" / "final"
    n = REPO / "data" / "_3d" / "najlepsie"
    tmp = REPO / "data" / "_3d" / "_tmp"
    o.mkdir(parents=True, exist_ok=True)
    tmp.mkdir(parents=True, exist_ok=True)
    duo = ["--rad", "microflex-duo-6-bar", "--obj", "MD16032C"]
    # štúdio DUO (z finálnej sady) a UNO M16063C
    for kon in ("", "-tien", "-cisty"):
        Image.open(f / f"duo-studio-1600{kon}.png").save(o / f"studio-duo-MD16032C{kon}.png")
    json_k_obrazku(f / "duo-studio-1600.png", o / "studio-duo-MD16032C.png", 1.0)
    na_bielom(o / "studio-duo-MD16032C.png", o / "studio-duo-MD16032C-tien.png", o / "studio-duo-MD16032C-na-bielom.jpg")
    print("UNO M16063C")
    uno = o / "studio-uno-M16063C.png"
    blender("--rad", "microflex-uno-6-bar", "--obj", "M16063C", "--pohlad", "studio", "--sirka", 1600,
            "--vzorky", a.vzorky, "--out", uno, log=log)
    dokonci(uno)
    na_bielom(uno, uno.with_name(uno.stem + "-tien.png"), uno.with_name(uno.stem + "-na-bielom.jpg"))
    # makrá 1200 px zo štvorcov 3200 px
    for m in ("makro-plast", "makro-pena", "makro-rura"):
        zmensi(f / f"{m}-3200.png", o / f"{m}.png", 1200)
        dokonci(o / f"{m}.png", vinetacia=0.06)
    # päť fáz rozloženia presne v 0, 0,25, 0,5, 0,75, 1 (kamera rovnaká ako v sekvencii)
    for faza in (0.0, 0.25, 0.5, 0.75, 1.0):
        print("rozložený", faza)
        cesta = o / f"rozlozeny-faza-{faza:.2f}.png"
        blender(*duo, "--pohlad", "rozlozeny", "--faza", faza, "--sirka", 1600, "--vzorky", a.vzorky_sekvencia * 2,
                "--out", cesta, log=log)
        dokonci(cesta)
        na_bielom(cesta, cesta.with_name(cesta.stem + "-tien.png"), cesta.with_name(cesta.stem + "-na-bielom.jpg"))
    # porovnanie s rendermi Watts v ich zábere (rovnaká poloha a veľkosť prstenca plášťa)
    piktogramy = REPO / "web" / "src" / "assets" / "piktogramy"
    for meno, args, ref, watts in (
            ("duo", duo, "rad-duo-kurenie.png", "726,591,806,1145,1018"),
            ("uno", ["--rad", "microflex-uno-6-bar", "--obj", "M12563C"], "rad-uno-kurenie.png", "813,514,660,1200,901")):
        print("záber Watts", meno)
        c = tmp / f"zaber-watts-{meno}.png"
        blender(*args, "--pohlad", "studio", "--watts", watts, "--ohnisko", 82, "--dlzka", 1.6,
                "--vzorky", a.vzorky_sekvencia * 2, "--out", c, log=log)
        dokonci(c)
        na_bielom(c, c.with_name(c.stem + "-tien.png"), tmp / f"zaber-watts-{meno}-na-bielom.png")
        na_bielom(piktogramy / ref, None, tmp / f"watts-{meno}-na-bielom.png")
        zostava(o / f"porovnanie-{meno}-watts.png", [(tmp / f"zaber-watts-{meno}-na-bielom.png", "Blender, záber ako Watts"),
                                                     (tmp / f"watts-{meno}-na-bielom.png", f"Watts: {ref} (render)")])
    zostava(o / "porovnanie-studio-watts.png", [(o / "studio-duo-MD16032C-na-bielom.jpg", "Blender: celé telo MD16032C"),
                                                (tmp / "watts-duo-na-bielom.png", "Watts: rad-duo-kurenie.png")], vyska=800)
    # porovnania so skutočnými fotkami (z priebežnej sady)
    for m in ("porovnanie-studio-s-fotkou", "porovnanie-makro-plast-s-fotkou", "porovnanie-makra-s-fotkou"):
        if (n / f"{m}.jpg").exists():
            Image.open(n / f"{m}.jpg").save(o / f"{m}.png")


RADY12 = (
    # (rad, reprezentatívny variant) – stredná veľkosť, plášť 125 alebo 160, kde je
    ("microflex-uno-6-bar", "M12532C"),
    ("microflex-duo-6-bar", "MD16032C"),
    ("microflex-uno-primo-6-bar", "M12550C"),
    ("microflex-primo-duo-6-bar", "MD12532C"),
    ("microflex-uno-10-bar", "M12550S"),
    ("microflex-duo-10-bar", "MD1603225SWI"),
    ("microflex-primo-duo-10-bar", "MD1253225S"),
    ("microflex-quadro", "MQ16032C2520S"),
    ("microflex-cool", "M9040PE"),
    ("microflex-cool-s-vyhrievacim-kablom", "MV12550PE"),
    ("microflex-cool-duo", "MD16040PE"),          # plášť v údajoch chýba: 160 mm z obj. čísla
    ("microflex-hp", "MQ16032C3225E"),
)


def sada_ramovanie(a, log):
    """Výrezy pre hlavu stránky radu (DUO MD16032C, 1600 px): A celé telo (z finálnej sady),
    B detail (rez veľký vpravo, telo za ľavým okrajom), C čelný pohľad na rez. Každý s tieňom,
    JSON s body_px a verziou na bielom; porovnanie vedľa seba v ramovanie/porovnanie.jpg."""
    o = REPO / "data" / "_3d" / "ramovanie"
    f = REPO / "data" / "_3d" / "final"
    o.mkdir(parents=True, exist_ok=True)
    duo = ["--rad", "microflex-duo-6-bar", "--obj", "MD16032C"]
    for kon in ("", "-tien", "-cisty"):
        Image.open(f / f"duo-studio-1600{kon}.png").save(o / f"A-cele-telo{kon}.png")
    json_k_obrazku(f / "duo-studio-1600.png", o / "A-cele-telo.png", 1.0)
    for meno, args in (("B-detail", ["--ramec", "detail"]),
                       ("C-celny", ["--azimut", 22, "--elevacia", 12])):
        print(meno)
        cesta = o / f"{meno}.png"
        blender(*duo, "--pohlad", "studio", *args, "--sirka", 1600, "--vzorky", a.vzorky, "--out", cesta, log=log)
        dokonci(cesta)
    for meno in ("A-cele-telo", "B-detail", "C-celny"):
        na_bielom(o / f"{meno}.png", o / f"{meno}-tien.png", o / f"{meno}-na-bielom.jpg")
    zostava(o / "porovnanie.jpg", [(o / "A-cele-telo-na-bielom.jpg", "A: celé telo (súčasný výrez)"),
                                   (o / "B-detail-na-bielom.jpg", "B: detail, telo za ľavým okrajom"),
                                   (o / "C-celny-na-bielom.jpg", "C: čelný pohľad na rez")], vyska=900)


def sada_rady12(a, log):
    """Všetkých 12 radov Microflex v štúdiu (výrez A, 1600 px) s tieňom, JSON a verziou na
    bielom do data/_3d/rady, plus prehľad všetkých radov vedľa seba."""
    o = REPO / "data" / "_3d" / "rady"
    o.mkdir(parents=True, exist_ok=True)
    nazvy = {r["id"]: r["nazov"] for r in json.loads((REPO / "web" / "src" / "data" / "rady.json").read_text(encoding="utf-8"))}
    panely = []
    for rad, obj in RADY12:
        print(rad, obj)
        out = o / f"{rad.replace('microflex-', '')}-{obj}.png"
        blender("--rad", rad, "--obj", obj, "--pohlad", "studio", "--sirka", 1600, "--vzorky", a.vzorky, "--out", out, log=log)
        dokonci(out)
        na_bielom(out, out.with_name(out.stem + "-tien.png"), out.with_name(out.stem + "-na-bielom.jpg"))
        panely.append((out.with_name(out.stem + "-na-bielom.jpg"), f"{nazvy.get(rad, rad)} ({obj})"))
    sys.argv = ["porovnanie.py", "--out", str(o / "rady-prehlad.jpg"), "--vyska", "420", "--pozadie", "255,255,255",
                "--stlpce", "4"]
    for cesta, popis in panely:
        sys.argv += ["--panel", f"{cesta}||{popis}"]
    porovnanie.main()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("sada", choices=["najlepsie", "final", "rady", "prvy", "ramovanie", "rady12"])
    p.add_argument("--vzorky", type=int, default=512)
    p.add_argument("--vzorky-sekvencia", type=int, default=256)
    p.add_argument("--vzorky-makro", type=int, default=512, help="makrá sa renderujú 2x a zmenšia (4x viac vzoriek na pixel)")
    p.add_argument("--sirka", type=int, default=1600)
    p.add_argument("--sirka-makro", type=int, default=1200)
    a = p.parse_args()
    log = []
    t0 = time.time()
    if a.sada == "najlepsie":
        sada_najlepsie(a, log)
    elif a.sada == "prvy":
        sada_prvy(a, log)
    elif a.sada == "ramovanie":
        sada_ramovanie(a, log)
    elif a.sada == "rady12":
        sada_rady12(a, log)
    elif a.sada == "rady":
        o = REPO / "data" / "_3d" / "final"
        o.mkdir(parents=True, exist_ok=True)
        sada_rady(a, log, o)
    else:
        sada_final(a, log)
    cesta = REPO / "data" / "_3d" / {"najlepsie": "najlepsie", "prvy": "prvy", "ramovanie": "ramovanie",
                                     "rady12": "rady"}.get(a.sada, "final") / f"davka-{a.sada}.json"
    cesta.write_text(json.dumps({"spolu_s": round(time.time() - t0), "kroky": log}, ensure_ascii=False, indent=1),
                     encoding="utf-8")
    print(f"Sada {a.sada} hotová za {time.time() - t0:.0f} s")


if __name__ == "__main__":
    main()
