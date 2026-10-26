"""Rozmazané náhľady fotiek (LQIP) pre web/src/data/nahlady.json.

Pre každú fotku JPG vo web/src/assets vyrobí obrázok šírky 24 px, jemne rozmazaný, ako WebP v data URI
(asi 200 až 400 bajtov). Obraz.astro ho dá fotke ako pozadie: na pomalom pripojení je na mieste fotky
hneď jej farebný odtlačok namiesto prázdnej plochy (docs/DOLADENIE.md kap. 2.6). Kľúč je meno súboru
(mená fotiek sú jedinečné). Rendery a výrezy s priehľadnosťou náhľad nedostávajú (pozadie by presvitalo).

Spustenie (Pillow): python data/nahlady_fotiek.py
"""
import base64
import io
import json
from pathlib import Path

from PIL import Image, ImageFilter

KOREN = Path(__file__).resolve().parent.parent / 'web' / 'src'
nahlady = {}
for subor in sorted((KOREN / 'assets').rglob('*')):
    if subor.suffix.lower() not in ('.jpg', '.jpeg'):
        continue
    im = Image.open(subor).convert('RGB')
    w = 24
    h = max(1, round(im.height * w / im.width))
    maly = im.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    buf = io.BytesIO()
    maly.save(buf, 'WEBP', quality=40, method=6)
    nahlady[subor.name] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()

(KOREN / 'data' / 'nahlady.json').write_text(json.dumps(nahlady, ensure_ascii=False, indent=0, sort_keys=True), encoding='utf-8')
print(len(nahlady), 'náhľadov, spolu', sum(len(v) for v in nahlady.values()) // 1024, 'kB')
