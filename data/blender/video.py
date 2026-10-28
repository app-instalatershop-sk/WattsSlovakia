"""Video MP4 (H.264) z postupnosti PNG cez editor sekvencií Blendera (ffmpeg je v Blenderi zabudovaný).

  blender.exe -b --factory-startup -P data/blender/video.py -- <priečinok s PNG> <výstup.mp4> [fps]

Farby ostávajú ako v PNG (prevod Standard, sRGB). Používa data/navrhy_web.py video.
"""
import sys
from pathlib import Path

import bpy

argv = sys.argv[sys.argv.index("--") + 1:]
vstup, vystup = Path(argv[0]).resolve(), Path(argv[1]).resolve()
fps = int(argv[2]) if len(argv) > 2 else 30
subory = sorted(vstup.glob("*.png"))
sc = bpy.context.scene
sc.sequence_editor_create()
pasy = sc.sequence_editor.strips if hasattr(sc.sequence_editor, "strips") else sc.sequence_editor.sequences   # prázdna kolekcia je False
pas = pasy.new_image(name="snimky", filepath=str(subory[0]), channel=1, frame_start=1)
for f in subory[1:]:
    pas.elements.append(f.name)
obr = bpy.data.images.load(str(subory[0]))
sc.render.resolution_x, sc.render.resolution_y = obr.size
sc.render.resolution_percentage = 100
sc.frame_start, sc.frame_end = 1, len(subory)
sc.render.fps = fps
sc.view_settings.view_transform = "Standard"
sc.view_settings.look = "None"
nast = sc.render.image_settings
if hasattr(nast, "media_type"):
    nast.media_type = "VIDEO"
nast.file_format = "FFMPEG"
sc.render.ffmpeg.format = "MPEG4"
sc.render.ffmpeg.codec = "H264"
sc.render.ffmpeg.constant_rate_factor = "HIGH"
sc.render.ffmpeg.ffmpeg_preset = "GOOD"
sc.render.ffmpeg.gopsize = fps
# Blender pripojí k názvu filmu rozsah snímok: render do dočasného mena, potom premenovať
vystup.parent.mkdir(parents=True, exist_ok=True)
docasny = vystup.parent / f"_{vystup.stem}_"
sc.render.filepath = str(docasny)
bpy.ops.render.render(animation=True)
hotove = sorted(vystup.parent.glob(f"_{vystup.stem}_*"), key=lambda f: f.stat().st_mtime)
hotove[-1].replace(vystup)
print(f"VIDEO {vystup.name}: {len(subory)} snímok, {obr.size[0]} x {obr.size[1]} px, {fps} fps")
