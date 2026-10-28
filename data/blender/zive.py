"""Živé okno: Blender s oknom ukazuje scénu, na ktorej sa práve pracuje, a poslednú hotovú snímku.

Spustenie okna z koreňa repozitára (ostane otvorené, kým ho nezavriete):
  C:/Users/krist/nastroje/blender/blender-5.2.3-windows-x64/blender.exe --factory-startup -P data/blender/zive.py

Okno sleduje data/_3d/zive/stav.json. Zapíše ho ten, kto spúšťa render, tým istým súborom
spusteným obyčajným Pythonom:
  python data/blender/zive.py "čo sa práve robí" "data/_3d/navrhy/ohyb/*.png" --rad ... --pohlad ohyb ...
(druhý argument je maska snímok, prázdny reťazec = bez snímok; zvyšok sú argumenty potrubie.py).

Pri nových argumentoch okno postaví scénu tým istým skriptom (potrubie.py so sieťou v kvalite
náhľadu, bez renderu) a ukáže ju cez kameru v režime Rendered: 48 vzoriek, potom sa výpočet zastaví,
takže render v dávke spomalí len na pár sekúnd. Vpravo je najnovšia hotová snímka z masky.
"""
import glob
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
STAV = REPO / "data" / "_3d" / "zive" / "stav.json"
SKRIPT = REPO / "data" / "blender" / "potrubie.py"
VZORKY_NAHLAD = 48

try:
    import bpy
except ImportError:   # obyčajný Python: len zapísať stav
    bpy = None


def zapis_stav(argv):
    text, snimky, argumenty = argv[0], (argv[1] if len(argv) > 1 else ""), argv[2:]
    STAV.parent.mkdir(parents=True, exist_ok=True)
    docasny = STAV.with_suffix(".tmp")
    docasny.write_text(json.dumps({"text": text, "snimky": snimky, "argumenty": argumenty}, ensure_ascii=False),
                       encoding="utf-8")
    docasny.replace(STAV)


if bpy is None:
    if __name__ == "__main__":
        zapis_stav(sys.argv[1:])
    sys.exit(0)

import importlib.util  # noqa: E402
import time  # noqa: E402
import traceback  # noqa: E402

pamat = {"argumenty": None, "text": None, "obrazok": None, "obrazok_cas": 0.0, "rozlozenie": False}


def oblasti(typ):
    for win in bpy.context.window_manager.windows:
        for area in win.screen.areas:
            if area.type == typ:
                yield win, area


def gpu():
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for typ in ("OPTIX", "CUDA"):
        try:
            prefs.compute_device_type = typ
            prefs.refresh_devices()
            if any(d.type == typ for d in prefs.devices):
                for d in prefs.devices:
                    d.use = d.type == typ
                return
        except Exception:  # noqa: BLE001
            pass


def priprav_rozlozenie():
    """Hlavný 3D pohľad rozdelí: vľavo scéna cez kameru, vpravo posledná hotová snímka."""
    for win, area in oblasti("VIEW_3D"):
        with bpy.context.temp_override(window=win, screen=win.screen, area=area):
            bpy.ops.screen.area_split(direction="VERTICAL", factor=0.5)
        break
    v3d = sorted((ar for _, ar in oblasti("VIEW_3D")), key=lambda ar: ar.x)
    if len(v3d) >= 2:
        v3d[-1].type = "IMAGE_EDITOR"
    for _, area in oblasti("VIEW_3D"):
        area.header_text_set("Živé okno: čakám na prvú úlohu")
    pamat["rozlozenie"] = True


def postav(argumenty):
    spec = importlib.util.spec_from_file_location("potrubie_zive", SKRIPT)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["potrubie_zive"] = mod
    spec.loader.exec_module(mod)
    stary = sys.argv
    sys.argv = [bpy.app.binary_path, "--"] + [str(x) for x in argumenty] + ["--kvalita", "nahlad", "--len-scena"]
    try:
        mod.hlavny(mod.argumenty())
    finally:
        sys.argv = stary


def ukaz_scenu():
    sc = bpy.context.scene
    # náhľad počíta procesor: grafická karta ostane celá pre render v dávke (Rendered drží scénu v jej pamäti)
    sc.cycles.device = "CPU"
    sc.render.preview_pixel_size = "2"
    sc.cycles.preview_samples = VZORKY_NAHLAD
    sc.cycles.use_preview_denoising = True
    for win, area in oblasti("VIEW_3D"):
        sp = area.spaces.active
        sp.shading.type = "RENDERED"
        sp.overlay.show_overlays = False
        sp.show_gizmo = False
        sp.show_region_toolbar = sp.show_region_ui = False
        sp.region_3d.view_perspective = "CAMERA"
        for reg in area.regions:
            if reg.type == "WINDOW":
                with bpy.context.temp_override(window=win, area=area, region=reg):
                    bpy.ops.view3d.view_center_camera()


def ukaz_obrazok(maska):
    subory = [f for f in glob.glob(str(REPO / maska)) if not f.endswith("-tien.png")]
    # len dopísané súbory (render zapisuje PNG na konci snímky)
    subory = [f for f in subory if time.time() - Path(f).stat().st_mtime > 1.0]
    if not subory:
        return
    najnovsi = max(subory, key=lambda f: Path(f).stat().st_mtime)
    cas = Path(najnovsi).stat().st_mtime
    if najnovsi == pamat["obrazok"] and cas == pamat["obrazok_cas"]:
        return
    img = bpy.data.images.get("zive_snimka")
    if img is not None:
        bpy.data.images.remove(img)
    img = bpy.data.images.load(najnovsi)
    img.name = "zive_snimka"
    for win, area in oblasti("IMAGE_EDITOR"):
        area.spaces.active.image = img
        area.header_text_set(f"Posledná hotová snímka: {Path(najnovsi).name}")
    bpy.app.timers.register(prisposob_obrazok, first_interval=0.3)
    pamat["obrazok"], pamat["obrazok_cas"] = najnovsi, cas


def prisposob_obrazok():
    """Celá snímka v okne (až po prekreslení: hneď po načítaní editor ešte nepozná veľkosť obrázka)."""
    for win, area in oblasti("IMAGE_EDITOR"):
        for reg in area.regions:
            if reg.type == "WINDOW":
                with bpy.context.temp_override(window=win, screen=win.screen, area=area, region=reg):
                    bpy.ops.image.view_all(fit_view=True)
    return None


def kolo():
    try:
        if not pamat["rozlozenie"]:
            priprav_rozlozenie()
        if STAV.exists():
            stav = json.loads(STAV.read_text(encoding="utf-8"))
            text = stav.get("text") or ""
            if stav.get("argumenty") and stav["argumenty"] != pamat["argumenty"]:
                pamat["argumenty"] = stav["argumenty"]
                for _, area in oblasti("VIEW_3D"):
                    area.header_text_set(f"Staviam scénu: {text}")
                postav(stav["argumenty"])
                ukaz_scenu()
                pamat["text"] = None
            if text != pamat["text"]:
                for _, area in oblasti("VIEW_3D"):
                    area.header_text_set(text)
                pamat["text"] = text
            if stav.get("snimky"):
                ukaz_obrazok(stav["snimky"])
    except Exception:  # noqa: BLE001
        traceback.print_exc()
        for _, area in oblasti("VIEW_3D"):
            area.header_text_set("Živé okno: chyba pri stavbe scény (podrobnosti v konzole Blendera)")
    return 1.0


gpu()
bpy.app.timers.register(kolo, first_interval=1.0, persistent=True)
