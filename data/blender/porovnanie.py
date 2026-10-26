# -*- coding: utf-8 -*-
"""
Porovnávacie zostavy renderov: panely vedľa seba v rovnakej výške na neutrálnom pozadí, s popisom.

Spúšťa sa obyčajným Pythonom s Pillow (nie v Blenderi), napr.:
  C:\\Users\\krist\\nastroje\\web\\.venv\\Scripts\\python.exe -I data/blender/porovnanie.py \\
      --out data/_3d/prvy/porovnanie-duo.png --vyska 900 \\
      --panel "data/_3d/prvy/studio-duo-MD16032C.png|data/_3d/prvy/studio-duo-MD16032C-tien.png|Blender: MD16032C" \\
      --panel "web/src/assets/piktogramy/rad-duo-kurenie.png||Watts: oficiálny render"

Panel = "obrázok|tieň (nepovinný)|popis". Priehľadné obrázky sa skladajú na pozadie (aj s tieňom).
"""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def font(velkost):
    for meno in ("segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"):
        for priecinok in (Path("C:/Windows/Fonts"), Path("/usr/share/fonts/truetype/dejavu")):
            p = priecinok / meno
            if p.exists():
                return ImageFont.truetype(str(p), velkost)
    return ImageFont.load_default()


def panel(spec, vyska, pozadie):
    casti = (spec.split("|") + ["", ""])[:3]
    obr, tien, popis = casti
    im = Image.open(obr).convert("RGBA")
    plocha = Image.new("RGBA", im.size, pozadie)
    if tien:
        plocha.alpha_composite(Image.open(tien).convert("RGBA").resize(im.size))
    plocha.alpha_composite(im)
    sirka = round(im.width * vyska / im.height)
    return plocha.resize((sirka, vyska), Image.LANCZOS), popis


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True)
    p.add_argument("--panel", action="append", required=True)
    p.add_argument("--vyska", type=int, default=900)
    p.add_argument("--pozadie", default="240,240,238")
    p.add_argument("--medzera", type=int, default=24)
    p.add_argument("--stlpce", type=int, default=0, help="počet stĺpcov (0 = všetky v jednom rade)")
    a = p.parse_args()
    poz = tuple(int(x) for x in a.pozadie.split(",")) + (255,)
    panely = [panel(s, a.vyska, poz) for s in a.panel]
    st = a.stlpce or len(panely)
    riadky = [panely[i:i + st] for i in range(0, len(panely), st)]
    f = font(max(14, a.vyska // 34))
    vys_popisu = int(f.size * 1.9)
    sirka = max(sum(im.width for im, _ in r) + a.medzera * (len(r) + 1) for r in riadky)
    vyska = len(riadky) * (a.vyska + vys_popisu + a.medzera) + a.medzera
    out = Image.new("RGB", (sirka, vyska), poz[:3])
    d = ImageDraw.Draw(out)
    y = a.medzera
    for r in riadky:
        x = a.medzera
        for im, popis in r:
            out.paste(im.convert("RGB"), (x, y))
            d.text((x + 4, y + a.vyska + int(f.size * 0.35)), popis, fill=(60, 60, 60), font=f)
            x += im.width + a.medzera
        y += a.vyska + vys_popisu + a.medzera
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    out.save(a.out)
    print(a.out, out.size)


if __name__ == "__main__":
    main()
