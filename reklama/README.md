# Reklamné podklady z 3D modelu Microflex

Všetko v tomto priečinku je z nášho vlastného 3D modelu potrubia. Model je postavený z rozmerov v katalógu
Watts a farby sú zmerané na fotkách. Rendery sú v rovnakom štúdiu, svetle a uhle ako na webe.

Prehľad všetkých súborov s náhľadmi je v `index.html`. Otvoríte ho dvojklikom a klik na obrázok otvorí
plné rozlíšenie.

| Priečinok | Čo obsahuje | Rozmer | Hodí sa na |
|---|---|---|---|
| `01-produkty-na-bielom/<rad>/` | každá z 91 dimenzií zvlášť, rez spredu, mäkký tieň, biele pozadie | štvorec 2000 × 2000 px, JPG | e-shop, katalóg, cenové ponuky, Google nákupy, porovnávače |
| `02-rady-na-bielom/` | celé potrubie každého z 12 radov | 3000 × 2000 px, JPG | letáky, ponuky, prezentácie, bannery s bielym pozadím |
| `03-vyrezy-png/` | priehľadné PNG v plnom rozlíšení renderu, s tieňom: hero DUO, rodina šiestich systémov, kotúč 100 m, hlavy a telá radov, dimenzie v mierke, makrá materiálov | 2400 až 5200 px | grafik ich dá na akékoľvek pozadie: billboard, roll-up, veľtržný stánok, reklama v časopise |
| `04-teplo/` | rez ako na termokamere (príklad prevádzky), priehľadné aj na tmavomodrom pozadí | 3000 × 2400 px | technické prezentácie, sociálne siete, porovnanie izolácie |
| `05-ohyb/` | rúra ohnutá na najmenší polomer z katalógu pre každý rad | 2400 × 2000 px | „ohne sa okolo prekážky“: reklama, veľtrh, sociálne siete |
| `06-videa/` | slučky MP4 bez zvuku: rozložený rez, ohyb, odvaľovanie kotúča | 16:9 (1920 × 1080), 1:1 (1080 × 1080), 9:16 (1080 × 1920) | 16:9 web, YouTube a prezentácie; 1:1 príspevky na Facebook, Instagram a LinkedIn; 9:16 stories a reels |

## Dobré vedieť

- **Je to vizualizácia, nie fotka.** Pri reklame netreba nič uvádzať, ale nepredávajme ju ako fotku zo stavby.
  Na skutočné stavby a montáže máme len skutočné fotky.
- **Značka Microflex patrí Watts.** Ako oficiálny partner ju môžeme používať pri predaji. Pri veľkej kampani
  je dobré dať ju Watts na vedomie.
- **Teplo v reze je výpočet.** Je to ustálený stav pri príklade prevádzky (napríklad prívod 70 °C,
  spiatočka 50 °C a pôda 10 °C). Pri vykurovaní je strata na meter z katalógu výrobcu. Čísla uvádzajte
  s podmienkami, rovnako ako na webe.
- **Polomer ohybu a rozmery kotúča** sú z údajov katalógu pre danú dimenziu.
- Priečinok nie je v gite, lebo má stovky MB. Ak sa zmení model alebo pribudnú rendery, vytvorí sa znova
  príkazom `C:/Users/krist/nastroje/web/.venv/Scripts/python.exe -I data/reklama.py`. Hotové súbory preskočí.
  Pred zmazaním alebo presunom si priečinok skopírujte na zdieľaný disk.
