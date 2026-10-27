# -*- coding: utf-8 -*-
"""
Porovnanie 3D modelu so skutočnosťou pre majiteľa: stránka v živej galérii http://127.0.0.1:4340/realita.

Ku každému z 12 radov dá vedľa seba náš model (čelný pohľad, celé telo, rozložený rez, detail čela 1 : 1
a všetky dimenzie) a skutočnosť (výrez z fotky rodiny z katalógu s. 6, fotky zo stavieb). Render Watts je
osobitne, len ako vzor tvaru (je to počítačová grafika). Pod každým radom je pole na pripomienky, galéria
(data/blender/galeria.mjs) ich ukladá do data/_3d/realita/pripomienky.json. Obrázky berie zo sady `web`
(data/_3d/web, davka.py web); hotové výrezy pri ďalšom spustení preskočí, kým sa zdroj nezmení.

Spúšťa sa Pythonom s Pillow (nie v Blenderi), potom otvoriť http://127.0.0.1:4340/realita:
  C:\\Users\\krist\\nastroje\\web\\.venv\\Scripts\\python.exe -I data/blender/realita.py
"""
import html
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageOps

REPO = Path(__file__).resolve().parents[2]
WEB3D = REPO / "data" / "_3d" / "web"
CIEL = REPO / "data" / "_3d" / "realita"
OBR = CIEL / "obr"

sys.dont_write_bytecode = True

# Poradie ako na webe: vykurovanie, sanita, QUADRO, studená voda, tepelné čerpadlá.
RADY = ["microflex-uno-6-bar", "microflex-duo-6-bar", "microflex-uno-primo-6-bar", "microflex-primo-duo-6-bar",
        "microflex-uno-10-bar", "microflex-duo-10-bar", "microflex-primo-duo-10-bar", "microflex-quadro",
        "microflex-cool", "microflex-cool-s-vyhrievacim-kablom", "microflex-cool-duo", "microflex-hp"]

# Skutočná štúdiová fotka rodiny (katalóg s. 6, vyrezaná Jurajom, 1633 × 963): sedem rúr zľava doprava.
FOTKA_RODINY = REPO / "podklady" / "watts" / "fotky-katalog" / "rodina-potrubi.png"
VYREZY = {
    "duo-kurenie": (20, 470, 380, 800),
    "quadro": (340, 540, 640, 800),
    "cool": (610, 570, 870, 810),
    "uno-kurenie": (865, 600, 1080, 820),
    "cool-kabel": (1070, 620, 1280, 820),
    "duo-sanita": (1275, 630, 1470, 830),
    "uno-male": (1465, 700, 1600, 860),
}
REF = REPO / "web" / "src" / "assets" / "referencie"
FOTKY = REPO / "web" / "src" / "assets" / "fotky"
KATALOG = REPO / "podklady" / "watts" / "fotky-katalog"

# Skutočnosť ku každému radu: (zdroj, popis). Zdroj "rodina:<kľúč>" je výrez z fotky rodiny.
REALITA = {
    "microflex-uno-6-bar": [("rodina:uno-kurenie", "UNO na štúdiovej fotke z katalógu (s. 6)"),
                            ("rodina:uno-male", "Menšie UNO na tej istej fotke")],
    "microflex-duo-6-bar": [("rodina:duo-kurenie", "DUO na štúdiovej fotke z katalógu (s. 6)"),
                            (FOTKY / "prierez-duo.jpg", "Rez DUO zo stavby"),
                            (REF / "povazska-5.jpg", "DUO s koncovými krytkami v kotolni (Považská Bystrica)"),
                            (REF / "povazska-6.jpg", "Tá istá kotolňa, iný uhol")],
    "microflex-uno-primo-6-bar": [("rodina:uno-kurenie", "UNO PRIMO na fotke nie je, najbližšie je UNO (s. 6)")],
    "microflex-primo-duo-6-bar": [("rodina:duo-kurenie", "PRIMO DUO na fotke nie je, najbližšie je DUO (s. 6)"),
                                  (FOTKY / "prierez-duo.jpg", "Rez DUO zo stavby")],
    "microflex-uno-10-bar": [("rodina:duo-sanita", "UNO sanita na fotke nie je, biela rúra je v DUO sanita (s. 6)")],
    "microflex-duo-10-bar": [("rodina:duo-sanita", "DUO sanita na štúdiovej fotke z katalógu (s. 6)")],
    "microflex-primo-duo-10-bar": [("rodina:duo-sanita", "PRIMO DUO sanita na fotke nie je, najbližšie je DUO sanita (s. 6)")],
    "microflex-quadro": [("rodina:quadro", "QUADRO na štúdiovej fotke z katalógu (s. 6)")],
    "microflex-cool": [("rodina:cool", "COOL na štúdiovej fotke z katalógu (s. 6)")],
    "microflex-cool-s-vyhrievacim-kablom": [("rodina:cool-kabel", "COOL s vyhrievacím káblom na štúdiovej fotke (s. 6), kábel je pri rúre hore")],
    "microflex-cool-duo": [("rodina:cool", "COOL DUO na fotke nie je, najbližšie je COOL (s. 6)")],
    "microflex-hp": [],
}
# Čo je v modeli odhad, nie údaj (pozri data/blender/README.md).
NEISTE = {
    "microflex-hp": "Rozmery chráničiek (32 a 25 mm) sú z objednávacieho čísla, vnútorný priemer podľa brožúry 2026.",
    "microflex-cool-duo": "Priemer plášťa je z objednávacieho čísla (MD16040PE = 160 mm), v údajoch nie je.",
    "microflex-uno-primo-6-bar": "Plášť PRIMO má štandardný profil rebier, údaje o rozdiele nemáme.",
    "microflex-primo-duo-6-bar": "Plášť PRIMO má štandardný profil rebier, údaje o rozdiele nemáme.",
    "microflex-primo-duo-10-bar": "Plášť PRIMO má štandardný profil rebier, údaje o rozdiele nemáme. Farba bielej rúry je nastavená podľa jedinej fotky (s. 6).",
    "microflex-cool-s-vyhrievacim-kablom": "Hrúbka a poloha vyhrievacieho kábla sú odhad.",
    "microflex-uno-10-bar": "Farba bielej rúry je nastavená podľa jedinej fotky (s. 6).",
    "microflex-duo-10-bar": "Farba bielej rúry je nastavená podľa jedinej fotky (s. 6).",
    "microflex-quadro": "Farba bielej rúry je nastavená podľa jedinej fotky (s. 6).",
}
# Zvláštnosti údajov (nie odhad modelu).
SPOLOCNE_CISLA = ("Päť objednávacích čísel je v UNO aj v UNO PRIMO (napr. M12550C) a tri v DUO aj v PRIMO DUO "
                  "(napr. MD12532C); model ich kreslí rovnako.")
UDAJE = {r: SPOLOCNE_CISLA for r in ("microflex-uno-6-bar", "microflex-uno-primo-6-bar", "microflex-duo-6-bar", "microflex-primo-duo-6-bar")}

DRUH = {"pexa-zlta": "žltá PE-Xa", "pexa-biela": "biela PE-Xa", "pe-cierna": "čierna PE", "pe100": "čierna PE",
        "chranicka": "chránička", "kabel": "vyhrievací kábel"}


def cislo(x):
    return f"{x:g}".replace(".", ",")


def rury_text(rury):
    """Rovnaké rúry spolu: „2 × žltá PE-Xa 32 × 2,9 mm“."""
    skupiny = {}
    for r in rury:
        k = (r["druh"], r["d"], round(r["s"], 1))
        skupiny[k] = skupiny.get(k, 0) + 1
    casti = []
    for (druh, d, s), n in skupiny.items():
        nazov = DRUH.get(druh, druh)
        casti.append(f"{n} × {nazov} {cislo(d)} × {cislo(s)} mm" if n > 1 else f"{nazov} {cislo(d)} × {cislo(s)} mm")
    return ", ".join(casti)


def novsie(out, *zdroje):
    """Výstup existuje a je novší ako všetky zdroje."""
    if not out.exists():
        return False
    t = out.stat().st_mtime
    return all(not z.exists() or z.stat().st_mtime <= t for z in zdroje)


def na_bielom(png):
    """Render s priehľadnosťou + jeho kontaktný tieň (ak je) na bielom pozadí."""
    im = Image.open(png).convert("RGBA")
    tien = png.with_name(png.stem + "-tien.png")
    if tien.exists():
        im = Image.alpha_composite(Image.open(tien).convert("RGBA"), im)
    biele = Image.new("RGBA", im.size, (255, 255, 255, 255))
    return Image.alpha_composite(biele, im).convert("RGB")


def uloz(im, meno, sirka=None, kvalita=88):
    if sirka and im.width > sirka:
        im = im.resize((sirka, round(im.height * sirka / im.width)), Image.LANCZOS)
    out = OBR / meno
    im.save(out, quality=kvalita, optimize=True)
    return out


def priprav(meno, zdroje, vyrob):
    """Vyrobí obrázok len vtedy, keď chýba alebo je starší ako zdroj; vráti cestu."""
    out = OBR / meno
    if not novsie(out, *zdroje):
        vyrob(out)
    return out


def url(cesta):
    rel = cesta.relative_to(REPO).as_posix()
    return f"/subor/{rel}?t={int(cesta.stat().st_mtime)}"


def ulohy_radu(rad):
    """Zoznam (meno, zdroje, funkcia) pre obrázky jedného radu."""
    u = []
    hlava = WEB3D / "hlavy" / f"{rad}.png"
    telo = WEB3D / "rady" / f"{rad}.png"
    rozklad = WEB3D / "rozlozeny" / rad / "rozlozeny-071.png"
    u.append((f"{rad}-hlava.jpg", [hlava], lambda o, s=hlava: uloz(na_bielom(s), o.name, 1400)))
    u.append((f"{rad}-hlava-velka.jpg", [hlava], lambda o, s=hlava: uloz(na_bielom(s), o.name, None, 92)))
    u.append((f"{rad}-telo.jpg", [telo], lambda o, s=telo: uloz(na_bielom(s), o.name, 1600, 90)))
    if rozklad.exists():
        u.append((f"{rad}-rozklad.jpg", [rozklad], lambda o, s=rozklad: uloz(na_bielom(s), o.name, 1600, 90)))

    def detail(o, s=hlava):
        meta = json.loads(s.with_suffix(".json").read_text(encoding="utf-8"))
        b = meta["body_px"][s.name]
        body = list(b["plast_okraj"]) + [q for r in b.get("rury", []) for q in r.get("okraj", [])]
        xs, ys = [q[0] for q in body], [q[1] for q in body]
        m = 0.08 * (max(xs) - min(xs))
        box = (int(min(xs) - m), int(min(ys) - m), int(max(xs) + m), int(max(ys) + m))
        uloz(na_bielom(s).crop(box), o.name, None, 92)
    u.append((f"{rad}-detail.jpg", [hlava, hlava.with_suffix(".json")], detail))
    watts = [p for p in (REPO / "podklady" / "upravene" / "rady" / f"{rad}.png", REPO / "podklady" / "upravene" / "rady" / f"{rad}.jpg") if p.exists()]
    if watts:
        def watts_obr(o, s=watts[0]):
            im = Image.open(s).convert("RGBA")
            biele = Image.new("RGBA", im.size, (255, 255, 255, 255))
            uloz(Image.alpha_composite(biele, im).convert("RGB"), o.name, 1000)
        u.append((f"{rad}-watts.jpg", [watts[0]], watts_obr))
    return u


def varianty_radu(rad):
    out = []
    for j in sorted((WEB3D / "varianty").glob("*.json")):
        m = json.loads(j.read_text(encoding="utf-8"))
        if rad == m.get("rad") or rad in m.get("rady", []):
            out.append(m)
    return sorted(out, key=lambda m: (m["plast_mm"], [r["d"] for r in m["rury"]]))


def main():
    OBR.mkdir(parents=True, exist_ok=True)
    rady_data = {r["id"]: r for r in json.loads((REPO / "web" / "src" / "data" / "rady.json").read_text(encoding="utf-8"))}

    ulohy = []
    for rad in RADY:
        ulohy += ulohy_radu(rad)
        for m in varianty_radu(rad):
            png = WEB3D / "varianty" / f"{m['obj_cislo']}.png"
            ulohy.append((f"var-{m['obj_cislo']}.jpg", [png], lambda o, s=png: uloz(na_bielom(s), o.name, 420, 85)))
            ulohy.append((f"var-{m['obj_cislo']}-velka.jpg", [png], lambda o, s=png: uloz(na_bielom(s), o.name, None, 90)))
    # Skutočnosť: výrezy z fotky rodiny a celé fotky.
    def rodina_vyrez(o, box):
        im = Image.open(FOTKA_RODINY).convert("RGBA")
        biele = Image.new("RGBA", im.size, (255, 255, 255, 255))
        uloz(Image.alpha_composite(biele, im).convert("RGB").crop(box), o.name, None, 92)
    for k, box in VYREZY.items():
        ulohy.append((f"real-rodina-{k}.jpg", [FOTKA_RODINY], lambda o, b=box: rodina_vyrez(o, b)))

    def cela_fotka(o, s):
        im = Image.open(s).convert("RGBA")
        biele = Image.new("RGBA", im.size, (255, 255, 255, 255))
        uloz(Image.alpha_composite(biele, im).convert("RGB"), o.name, 1800, 90)
    fotky = {FOTKA_RODINY, KATALOG / "katalog-s05-x46.jpeg", KATALOG / "brozura-2026-s4-a.jpg", REF / "skola-1.jpg"}
    fotky |= {z for zoz in REALITA.values() for z, _ in zoz if isinstance(z, Path)}
    for s in sorted(fotky):
        ulohy.append((f"real-{s.stem}.jpg", [s], lambda o, s=s: cela_fotka(o, s)))
    rodina = WEB3D / "rodina" / "rodina.png"
    ulohy.append(("model-rodina.jpg", [rodina], lambda o, s=rodina: uloz(ImageOps.mirror(na_bielom(s)), o.name, 1800, 90)))
    for mk in ("plast", "pena", "rura-zlta", "rura-biela", "rura-cierna"):
        png = WEB3D / "makra" / f"{mk}.png"
        ulohy.append((f"makro-{mk}.jpg", [png], lambda o, s=png: uloz(na_bielom(s), o.name, 1200, 90)))

    # Jeden súbor raz: 8 objednávacích čísel je v dvoch radoch a dve vlákna by písali ten istý súbor.
    ulohy = list({u[0]: u for u in ulohy}.values())
    with ThreadPoolExecutor(max_workers=8) as ex:
        list(ex.map(lambda u: priprav(*u), ulohy))
    print(f"obrázky: {len(ulohy)} (nové len pri zmene zdroja) v {OBR.relative_to(REPO)}")
    (CIEL / "index.html").write_text(stranka(rady_data), encoding="utf-8")
    print(f"stránka: {(CIEL / 'index.html').relative_to(REPO)} → http://127.0.0.1:4340/realita")


def obr(meno, popis, velka=None, trieda=""):
    o = OBR / meno
    v = OBR / velka if velka else o
    w, h = Image.open(o).size  # rozmer vopred: obsah pod obrázkom neskáče, kým sa načíta (aj skok na rad z menu)
    return (f'<figure class="obr {trieda}" data-src="{url(v)}"><img loading="lazy" src="{url(o)}" width="{w}" height="{h}" alt="">'
            f'<figcaption>{html.escape(popis)}</figcaption></figure>')


def pole(id_, nadpis, napoveda):
    return (f'<div class="pripomienka"><label for="p-{id_}">{html.escape(nadpis)}</label>'
            f'<textarea id="p-{id_}" data-id="{id_}" rows="5" placeholder="{html.escape(napoveda)}"></textarea>'
            f'<span class="ulozene" data-stav="{id_}"></span></div>')


def stranka(rady_data):
    casti = []
    obsah = ['<a href="#rodina">Rodina</a>']
    for i, rad in enumerate(RADY, 1):
        r = rady_data[rad]
        nazov = r["nazov"]
        obsah.append(f'<a href="#{rad}">{i} {html.escape(nazov.replace("Microflex ", ""))}</a>')
        meta = json.loads((WEB3D / "hlavy" / f"{rad}.json").read_text(encoding="utf-8"))
        fakty = (f"Na obrázkoch je {meta['obj_cislo']}: plášť {cislo(meta['plast_mm'])} mm, {rury_text(meta['rury'])}. "
                 f"Na webe: <a href=\"http://localhost:4321/potrubia/{r['kategoria']}/{rad}/\" target=\"_blank\">stránka radu</a>.")
        model = [obr(f"{rad}-hlava.jpg", "Čelný pohľad (hlava stránky radu)", f"{rad}-hlava-velka.jpg", "hlavny")]
        mensie = [obr(f"{rad}-detail.jpg", "Detail čela, plné rozlíšenie"), obr(f"{rad}-telo.jpg", "Celé telo (karty, katalóg)")]
        if (OBR / f"{rad}-rozklad.jpg").exists():
            mensie.append(obr(f"{rad}-rozklad.jpg", "Rozložený rez, posledná snímka"))
        realita = []
        for zdroj, popis in REALITA[rad]:
            if isinstance(zdroj, str) and zdroj.startswith("rodina:"):
                realita.append(obr(f"real-rodina-{zdroj.split(':', 1)[1]}.jpg", popis, f"real-{FOTKA_RODINY.stem}.jpg"))
            else:
                realita.append(obr(f"real-{zdroj.stem}.jpg", popis))
        if not realita:
            realita.append('<p class="pozn">Skutočnú fotku tohto radu nemáme. Ak ho máte na sklade, fotka z mobilu stačí.</p>')
        watts = ""
        if (OBR / f"{rad}-watts.jpg").exists():
            watts = (f'<h4>Render Watts</h4><p class="pozn">Počítačová grafika výrobcu, nie fotka. Len na porovnanie tvaru.</p>'
                     + obr(f"{rad}-watts.jpg", "Render Watts", trieda="watts"))
        var = varianty_radu(rad)
        dlazdice = "".join(
            obr(f"var-{m['obj_cislo']}.jpg", f"{m['obj_cislo']}: plášť {cislo(m['plast_mm'])} mm, {rury_text(m['rury'])}", f"var-{m['obj_cislo']}-velka.jpg", "var")
            for m in var)
        neiste = f'<p class="neiste"><strong>V modeli odhadnuté:</strong> {html.escape(NEISTE[rad])}</p>' if rad in NEISTE else ""
        neiste += f'<p class="neiste"><strong>V údajoch:</strong> {html.escape(UDAJE[rad])}</p>' if rad in UDAJE else ""
        casti.append(f"""
<section class="rad" id="{rad}">
  <h2><span class="c">{i}</span> {html.escape(nazov)}</h2>
  <p class="fakty">{fakty}</p>{neiste}
  <div class="dvoj">
    <div><h3>Náš model</h3>{''.join(model)}<div class="tri">{''.join(mensie)}</div></div>
    <div><h3>Skutočnosť</h3><div class="realita">{''.join(realita)}</div>{watts}</div>
  </div>
  <details><summary>Všetky dimenzie radu ({len(var)}), rovnaký výrez ako čelný pohľad</summary><div class="mriezka">{dlazdice}</div></details>
  {pole(rad, f"{i} {nazov.replace('Microflex ', '')}: čo vidíš ako chybné", "Tvar, rozmery, rebrá plášťa, pena, rúry a ich presah, farba, lesk, svetlo…")}
</section>""")
    obsah += ['<a href="#materialy">Materiály</a>', '<a href="#celkovo">Celkovo</a>']
    makra = "".join(obr(f"makro-{m}.jpg", p) for m, p in (("plast", "Plášť"), ("pena", "Pena"), ("rura-zlta", "Žltá PE-Xa"), ("rura-biela", "Biela PE-Xa"), ("rura-cierna", "Čierna PE (COOL)")))
    realne_makra = "".join(obr(f"real-{s}.jpg", p) for s, p in (
        ("katalog-s05-x46", "Plášť zblízka, katalóg s. 5 (dvojitá stena)"), ("brozura-2026-s4-a", "Plášť zblízka, brožúra 2026"),
        ("skola-1", "Kotúč na stavbe (Bratislava, škola)"), ("prierez-duo", "Rez DUO zo stavby: pena a rúry"), ("povazska-5", "Rúry a krytky v kotolni")))
    return f"""<!doctype html><html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Model a skutočnosť</title><style>
:root{{--ink:#0b1b33;--soft:#4a5568;--navy:#0a2a5e;--bg:#eef2f7;--line:rgb(10 42 94/.12);--ok:#1b8a5a;--chyba:#b42318}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 "Segoe UI",system-ui,sans-serif}}
header{{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid var(--line);padding:10px 24px}}
header h1{{font-size:19px;margin:0 0 6px}}nav{{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:14px}}nav a{{color:var(--navy);text-decoration:none}}nav a:hover{{text-decoration:underline}}
main{{max-width:1680px;margin:0 auto;padding:20px 24px 80px;display:grid;gap:28px}}
.uvod{{background:#fff;border-radius:14px;padding:16px 20px;max-width:900px}}.uvod p{{margin:6px 0}}
section{{background:#fff;border-radius:16px;padding:18px 20px 20px;box-shadow:0 14px 30px -24px rgb(10 42 94/.5);scroll-margin-top:90px}}
h2{{font-size:24px;margin:0 0 6px;display:flex;gap:12px;align-items:baseline}}h2 .c{{font-size:15px;color:#fff;background:var(--navy);border-radius:999px;min-width:30px;height:30px;display:inline-grid;place-items:center}}
h3{{font-size:15px;margin:14px 0 8px;color:var(--soft);font-weight:600}}h4{{font-size:15px;margin:18px 0 2px}}
.fakty,.neiste,.pozn{{margin:4px 0;color:var(--soft);max-width:110ch}}.neiste{{color:#7a4b00}}.pozn{{font-size:14px}}
.dvoj{{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:24px;align-items:start}}
.tri{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}}
.realita{{display:grid;gap:10px}}
.obr{{margin:0;cursor:zoom-in}}.obr img{{display:block;width:100%;height:auto;border-radius:10px;border:1px solid var(--line);background:#fff}}
.tri .obr img{{aspect-ratio:4/3;object-fit:contain}}.obr figcaption{{font-size:13px;color:var(--soft);margin-top:4px}}
.watts img{{max-width:420px;opacity:.95}}
details{{margin-top:14px}}summary{{cursor:pointer;font-weight:600;color:var(--navy)}}
.mriezka{{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-top:10px}}
.pripomienka{{margin-top:16px;display:grid;gap:6px}}.pripomienka label{{font-weight:600}}
textarea{{width:100%;font:inherit;padding:10px 12px;border-radius:10px;border:1px solid #c5cfdd;background:#fbfcfe;resize:vertical}}
textarea:focus{{outline:2px solid #2f6fd6;outline-offset:1px;background:#fff}}.ulozene{{font-size:13px;color:var(--soft);min-height:18px}}.ulozene.ok{{color:var(--ok)}}.ulozene.chyba{{color:var(--chyba)}}
.rodina{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}}.makra{{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}}
@media(max-width:1000px){{.dvoj,.rodina{{grid-template-columns:minmax(0,1fr)}}.makra{{grid-template-columns:repeat(2,minmax(0,1fr))}}}}
dialog{{border:0;padding:0;background:transparent;max-width:98vw}}dialog img{{max-width:98vw;max-height:94vh;display:block;border-radius:8px;background:#fff}}dialog::backdrop{{background:rgb(11 27 51/.85)}}
</style></head><body>
<header><h1>Model a skutočnosť</h1><nav>{''.join(obsah)}</nav></header>
<main>
<div class="uvod"><p>Pri každom rade je vľavo náš model, vpravo skutočná fotka. Ak rad na fotke nie je, je tam najbližší skutočný.
Render Watts je osobitne, lebo aj on je počítačová grafika. Do poľa pod radom napíš, čo vidíš ako chybné; ukladá sa samo.</p>
<p>Klik na obrázok ho otvorí v plnom rozlíšení, ďalší klik ho zavrie. Dimenzie radu sú pod obrázkami (rozbaliť).
Skutočná fotka rodiny má len 1 633 px na sedem rúr, preto sú jej výrezy pri zväčšení mäkšie.</p></div>
<section id="rodina"><h2>Rodina systémov</h2>
<p class="fakty">Skutočná štúdiová fotka z katalógu (s. 6) a náš model. Náš je zrkadlovo otočený, aby boli rezy vľavo ako na fotke; telá sú rovné, na fotke ohnuté.</p>
<div class="rodina">{obr(f"real-{FOTKA_RODINY.stem}.jpg", "Skutočnosť: katalóg s. 6")}{obr("model-rodina.jpg", "Náš model (UNO, DUO, DUO sanita, QUADRO, COOL, HP)")}</div>
{pole("rodina", "Rodina: čo vidíš ako chybné", "Napríklad farba plášťa, hustota rebier, farba peny, presah rúr…")}</section>
{''.join(casti)}
<section id="materialy"><h2>Materiály zblízka</h2>
<h3>Náš model</h3><div class="makra">{makra}</div>
<h3>Skutočnosť</h3><div class="makra">{realne_makra}</div>
{pole("materialy", "Materiály: čo vidíš ako chybné", "Plášť (farba, lesk, priesvitnosť, rebrá), pena (farba, póry), rúry (farba, lesk, potlač)…")}</section>
<section id="celkovo"><h2>Celkovo</h2>
{pole("celkovo", "Celkový dojem, svetlo a čo má mať prednosť", "Čo ťa ruší najviac, čo má byť opravené ako prvé…")}</section>
</main><dialog id="dlg"><img id="dlgImg" alt=""></dialog>
<script>
const dlg = document.getElementById('dlg');
document.addEventListener('click', (e) => {{ const f = e.target.closest('[data-src]'); if (!f) return; document.getElementById('dlgImg').src = f.dataset.src; dlg.showModal(); }});
dlg.addEventListener('click', () => dlg.close());
const stav = (id, text, trieda) => {{ const s = document.querySelector('[data-stav="' + id + '"]'); s.textContent = text; s.className = 'ulozene ' + (trieda || ''); }};
const casy = {{}};
async function uloz(t) {{
  const id = t.dataset.id;
  try {{
    const r = await fetch('/pripomienky', {{ method: 'POST', headers: {{ 'content-type': 'application/json' }}, body: JSON.stringify({{ id, text: t.value }}) }});
    if (!r.ok) throw new Error(r.status);
    stav(id, 'Uložené ' + new Date().toLocaleTimeString('sk-SK'), 'ok');
  }} catch (e) {{ stav(id, 'Neuložené: galéria nebeží alebo je stará verzia. Text ostáva v poli, skús znova.', 'chyba'); }}
}}
document.querySelectorAll('textarea[data-id]').forEach((t) => {{
  t.addEventListener('input', () => {{ stav(t.dataset.id, 'Píšeš…'); clearTimeout(casy[t.dataset.id]); casy[t.dataset.id] = setTimeout(() => uloz(t), 700); }});
  t.addEventListener('blur', () => {{ clearTimeout(casy[t.dataset.id]); uloz(t); }});
}});
fetch('/pripomienky').then((r) => r.json()).then((d) => {{
  for (const [id, p] of Object.entries(d)) {{ const t = document.querySelector('textarea[data-id="' + id + '"]'); if (t && p.text) {{ t.value = p.text; stav(id, 'Uložené ' + new Date(p.cas).toLocaleString('sk-SK'), 'ok'); }} }}
}}).catch(() => {{}});
</script></body></html>"""


if __name__ == "__main__":
    main()
