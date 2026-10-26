# Predikcia pozornosti (ako Attention Insight)

Nástroj odhadne, kam sa ľudia pozrú v prvých sekundách po otvorení stránky: teplotná mapa, mapa hmly
(ostane len to, čo zachytí 60 % pozornosti), poradie najsilnejších miest a podiel pozornosti na prvkoch
(logo, menu, nadpis, tlačidlo, obraz, kóty …). Vie porovnať aj variant úpravy skôr, než sa urobí. Beží
lokálne a zadarmo.

## Spustenie

1. Web zostaviť a spustiť: v priečinku `web` príkazy `npm run build` a `npm run preview`.
2. `C:\Users\krist\nastroje\web\.venv\Scripts\python.exe data/pozornost.py`
   - `--stranky / /referencie/` vybrané stránky, `--zariadenia mobil` len mobil, `--base http://127.0.0.1:4321` iná adresa,
   - `--variant "Väčšie tlačidlo" "main .btn-yellow{font-size:19px!important;padding:17px 30px!important}"`
     porovná dnešný stav s úpravou: CSS sa vloží len do snímky, web sa nemení. Variantov môže byť viac.
3. Otvoriť `data/_pozornost/<dátum a čas>/index.html` (do gitu nejde).

Prvá príprava na novom počítači: `data/pozornost_priprava.py` (stiahne model, zostaví predpoklad polohy,
nastaví zmes a overí presnosť; asi 30 minút).

## Ako to funguje

- **Obsah:** DeepGaze IIE (Linardos, Kümmerer, Press, Bethge 2021). Na verejnom benchmarku MIT/Tübingen má
  AUC 0,883, Attention Insight tam má 0,864. Učil sa na fotkách.
- **Poloha:** kam sa ľudia na webe a na mobile pozerajú bez ohľadu na obsah, z verejného súboru UEyes
  (Jiang a kol., CHI 2023; 62 ľudí, 1 980 obrazoviek, sledovanie očí, licencia CC BY 4.0): pohľady z prvých
  3 sekúnd na 200 webových a 200 mobilných obrazovkách. Na webe ťahá ľavý horný roh (ťažisko na 40 % šírky
  a 34 % výšky, tri štvrtiny pohľadov v hornej polovici), nie stred ako pri fotkách.
- **Zmes:** výsledná mapa = α · DeepGaze (rozmazaný) + (1 − α) · poloha. Pomer a rozmazanie sú nastavené na 40
  webových a 40 mobilných obrazovkách UEyes tak, aby skutočné pohľady mali najvyššiu pravdepodobnosť:
  web α = 0,85 a rozmazanie 2° (70 px), mobil α = 0,65 a 1° (35 px).
- **Mierka:** desktop 1440 × 900 sa pred výpočtom zmenší na 80 % (asi 35 px na stupeň zorného uhla, ako pri
  učení modelu), mobil 390 × 844 ide v CSS pixeloch.

## Presnosť

Overené na testovacích obrazovkách UEyes, ktoré do predpokladu ani nastavenia nevstúpili, prvé 3 sekundy
(27 webov, 27 mobilov). AUC 0,5 je náhoda, 1 dokonalá predpoveď; NSS 0 je náhoda, čím vyššie, tým lepšie.

| Mapa | Web AUC | Web NSS | Mobil AUC | Mobil NSS |
|---|---|---|---|---|
| Len poloha („ľudia hľadia hore vľavo“) | 0,789 | 1,14 | 0,800 | 1,24 |
| DeepGaze tak, ako je (učený na fotkách) | 0,700 | 0,56 | 0,728 | 0,71 |
| DeepGaze s polohou z UEyes | 0,767 | 1,07 | 0,788 | 1,28 |
| **Zmes (tento nástroj)** | **0,818** | **1,44** | **0,824** | **1,47** |

Model učený na fotkách je na webe horší ako jednoduché pravidlo polohy; až nastavený na webových dátach
ho prekoná. Čísla nie sú priamo porovnateľné s tvrdeniami predajcov (Attention Insight uvádza 90 až 96 %,
podľa všetkého ako podiel ľudskej hranice na fotkách).

## Čo to vie a čo nie

- Ukáže, čo vyčnieva a čo v prvej obrazovke zaniká, a porovná varianty tej istej stránky.
- Text (nadpisy, logo, tlačidlá) priťahuje model silnejšie ako veľké obrázky; render a fotky dielov dostávajú
  v prvých sekundách menej, než by človek čakal.
- Nevie, či text presvedčí, ani ako sa správa človek, ktorý niečo konkrétne hľadá (predpovedá voľné
  pozeranie). Poradie pohľadov je poradie najsilnejších miest, nie meraný sled očí.
- Animácie sa nehodnotia (snímka je po dobehnutí, s obmedzeným pohybom).
- Licencia DeepGaze nie je v repozitári autorov uvedená; nástroj je len na vnútornú analýzu, nič sa
  nezverejňuje ani nedistribuuje.

## Prvé zistenia (26. 10. 2026)

Správa s mapami: `data/_pozornost/2026-10-26-1307/index.html` (10 stránok, desktop a mobil, dva varianty).

- **Nadpis nesie hlavné stránky:** domov, Potrubia, kategória, rad, Pre firmy a Výber majú na nadpise 15 až 26 %
  pozornosti (2 až 3,5× viac, než zodpovedá jeho ploche). Na stránkach Spojky, diel, Referencie a Na stiahnutie
  6 až 8 %, lebo nadpis je krátky; na jednotku plochy má aj tam na desktope 2,3 až 2,9×, slabý teda nie je.
- **Drobčeky** majú na desktope 5 až 9 % a na mobile 9 až 15 %. Najviac na stránkach dielov, kde sa cesta na mobile
  zalomí do dvoch riadkov; jeden odkaz o úroveň vyššie by tam ubral 4,6 bodu v prospech nadpisu, textu, tlačidla a fotky.
- **Hlavné žlté tlačidlo** dostane na hlavných stránkach na desktope 1,0 až 1,4 % a na mobile 4,4 až 5,5 %. Väčšie
  tlačidlo (písmo 19 px, viac vnútorného okraja) by na mobile zvýšilo podiel na 6,0 až 7,1 % (o 1 až 2 body), na
  desktope o 0,3 až 0,8 bodu.
- **Tmavý horný pás** s partnerstvom Watts a telefónom má 8 až 13 %. Svetlý pás by ubral len 1 až 2 body, takže
  kvôli pozornosti ho meniť netreba.
- **Kóty na renderoch** dostanú 0,4 až 2,5 %: sú to detaily na druhý pohľad, nie prvý dojem.

## Overené úpravy

- **26. 10. 2026, väčšie hlavné tlačidlo a kratšie drobčeky na mobile** (`docs/PLAN-ZLEPSENIA.md` krok 5):
  test variantov sa po stavbe potvrdil. Tlačidlo na mobile 4,4–6,7 % → 5,7–8,2 % (domov 4,7 → 7,2 %),
  na desktope +0,4 až 0,7 bodu; drobčeky na stránke dielu na mobile 15,3 → 10,6 % a tlačidlo tam 2,9 → 4,9 %.
  Väčší nadpis na podstránkach (variant B) sa neurobil: pridal by len plochu, na jednotku plochy rovnaký účinok.
