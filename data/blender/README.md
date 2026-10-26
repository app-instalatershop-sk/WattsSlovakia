# 3D model potrubia Microflex (Blender)

Parametrický fotorealistický model predizolovaného potrubia Microflex. `potrubie.py` postaví plášť,
penu a nosné rúry presne podľa rozmerov z `web/src/data/varianty.json` a `rady.json` a vyrenderuje
zvolený pohľad s priehľadným pozadím a samostatnou vrstvou tieňa. Všetko je procedurálne (žiadne cudzie
modely ani textúry), výstup je deterministický: rovnaké parametre dajú rovnaký obrázok.

Materiály, farby a svetlo sú kalibrované podľa **skutočných fotiek** (štúdiová fotka rodiny potrubí,
katalóg s. 6; makrofotka plášťa, katalóg s. 5; fotka rezu DUO `web/src/assets/fotky/prierez-duo.jpg`),
nie podľa renderov Watts, ktoré sú samy počítačová grafika. Rendery Watts slúžili len na uhol pohľadu.

## Súbory

| Súbor | Čo robí |
|---|---|
| `potrubie.py` | model, materiály, štúdio, kamera, render jedného pohľadu alebo sekvencie (beží v Blenderi) |
| `davka.py` | dávky: `najlepsie` (priebežný stav pre majiteľa), `final` (všetky výstupy), `rady` (kontrola radov), `prvy` (výstupy prvého zadania v `data/_3d/prvy`, po sade `final`), `ramovanie` (výrezy A, B, C pre hlavu stránky radu), `rady12` (všetkých 12 radov v štúdiu a ich prehľad); skladá verzie na bielom, fotodokončenie, záznamy JSON k zmenšeninám a porovnania (beží v Pythone s Pillow) |
| `porovnanie.py` | zostava obrázkov vedľa seba v rovnakej výške s popisom |

## Čo treba

- **Blender 5.2 LTS** (portable zip z blender.org, overený SHA-256 a podpisom Blender Foundation):
  `C:\Users\krist\nastroje\blender\blender-5.2.3-windows-x64\blender.exe`
- Grafická karta NVIDIA (OptiX, záložne CUDA); bez nej `--zariadenie CPU` (veľmi pomalé).
- Na dávky a porovnania Python s Pillow a numpy: `C:\Users\krist\nastroje\web\.venv\Scripts\python.exe`.

Výstupy a dočasné súbory patria do `data/_3d/` (je v `.gitignore`).

## Spustenie

Z koreňa repozitára (Git Bash):

```bash
P=/c/Users/krist/nastroje/web/.venv/Scripts/python.exe
B=/c/Users/krist/nastroje/blender/blender-5.2.3-windows-x64/blender.exe

# všetky finálne výstupy (hero 3200 px, makrá 1600 px, rozložený rez 72 snímok, UNO, QUADRO, COOL)
$P -I data/blender/davka.py final --vzorky 1024 --vzorky-sekvencia 256 --vzorky-makro 512

# priebežný stav pre majiteľa (data/_3d/najlepsie): DUO štúdio, tri makrá, porovnania s fotkami
$P -I data/blender/davka.py najlepsie --vzorky 512

# výstupy prvého zadania (data/_3d/prvy): DUO a UNO štúdio, makrá 1200 px, päť fáz rozloženia,
# porovnania s rendermi Watts v ich zábere a so skutočnými fotkami (potrebuje hotovú sadu final)
$P -I data/blender/davka.py prvy --vzorky 1024

# výrezy pre hlavu stránky radu (data/_3d/ramovanie) a všetkých 12 radov (data/_3d/rady)
$P -I data/blender/davka.py ramovanie --vzorky 1024
$P -I data/blender/davka.py rady12 --vzorky 1024

# jeden pohľad priamo v Blenderi, napr. štúdio iného variantu
$B -b --factory-startup -P data/blender/potrubie.py -- \
   --rad microflex-uno-6-bar --obj M16063C --pohlad studio --sirka 1600 --vzorky 1024 \
   --out data/_3d/iny/uno-M16063C.png

# rozložený rez ako sekvencia (rovnaká kamera pre všetky snímky)
$B -b --factory-startup -P data/blender/potrubie.py -- --rad microflex-duo-6-bar --obj MD16032C \
   --pohlad rozlozeny --snimky 72 --sirka 1600 --vzorky 256 --out data/_3d/iny/rozlozeny.png
```

Rýchly náhľad pri ladení: `--sirka 800 --vzorky 64 --kvalita nahlad --bez-tiena`.
Nový tieň k existujúcemu renderu (rovnaké parametre ako pri renderi): pridať `--len-tien`.

## Výstupy

Jedno spustenie `potrubie.py`:

| Súbor | Čo to je |
|---|---|
| `<out>.png` | render RGBA (priehľadné pozadie), 8 bit, sRGB |
| `<out>-tien.png` | vrstva mäkkého kontaktného tieňa: čierna s alfou (najviac 0,55), rovnaký rozmer a kamera; web ju dá pod render (napr. `mix-blend-mode: multiply`) a môže ju posunúť alebo zoslabiť. Tieň je najtmavší pri dotyku s podlahou a dobehne do nuly vnútri obrázka: záber s ním počíta (`--tien-dosah`) a v pásme 3 % pri každom okraji je alfa vždy nulová, s plynulým nábehom ďalších 6 % |
| `<out>.json` | rad, variant, rozmery, kamera, časy renderu a **polohy bodov v px** (`body_px`: stred čela, okraj plášťa, stredy a okraje rúr) na kreslenie kót na webe; pri sekvencii pre každú snímku. `davka.py` k zmenšeninám a kópiám zapíše vlastný JSON s prepočítanými bodmi |

Pri `--snimky N` vznikne `<out>-000.png` až `<out>-(N-1).png` a ku každej snímke tieň a body.

`davka.py` navyše: `*-cisty.png` je render bez fotodokončenia, súbor bez prípony má jemnú vinetáciu
a fotografické zrno (pevné semienko, sekvencia nebliká); `*-na-bielom.jpg` je náhľad s tieňom na bielom.

`data/_3d/final/`:

| Súbor | Obsah |
|---|---|
| `duo-studio-3200.png` (+ `-tien`, `-cisty`) | DUO kúrenie 6 bar MD16032C, hero 3200 px |
| `duo-studio-1600.png` (+ `-tien`, `-cisty`, `-na-bielom.jpg`) | to isté zmenšené z 3200 px |
| `makro-plast-1600.png`, `makro-pena-1600.png`, `makro-rura-1600.png` | makrá do líp (render 3200 px, zmenšené; `-3200` ostávajú) |
| `rozlozeny/rozlozeny-000.png` až `-071.png` (+ tiene, json) | rozložený rez, 72 snímok, 1600 px |
| `rozlozeny-faza-*.jpg` | snímky 0, 18, 36, 54 a 71 sekvencie (fáza 0 až 1) na bielom, na rýchlu kontrolu |
| `uno-6-bar-M12532C.png`, `quadro-MQ16032C2520S.png`, `cool-M9040PE.png` | kontrola iných radov, 1600 px |

`data/_3d/ramovanie/` (sada `ramovanie`, DUO MD16032C, 1600 px, každý s `-tien`, `-cisty`, `.json`, `-na-bielom.jpg`):

| Súbor | Výrez |
|---|---|
| `A-cele-telo.png` | súčasný výrez: celé telo (z finálnej sady) |
| `B-detail.png` | detail: rez zaberá 47 % šírky vpravo, telo odchádza za ľavý okraj; tieň má nábeh na nulu hore, vpravo a dole, vľavo pokračuje k okraju |
| `C-celny.png` | čelný pohľad na rez (azimut 22°, elevácia 12°), telo ustupuje za rezom |
| `porovnanie.jpg` | tri výrezy vedľa seba |

`data/_3d/rady/` (sada `rady12`): všetkých 12 radov vo výreze A, 1600 px, každý s tieňom, JSON
a verziou na bielom; `rady-prehlad.jpg` je prehľad všetkých radov. COOL DUO nemá v údajoch priemer
plášťa, berie sa z objednávacieho čísla (MD16040PE = 160 mm).

`data/_3d/prvy/` (sada `prvy`, výstupy prvého zadania):

| Súbor | Obsah |
|---|---|
| `studio-duo-MD16032C.png`, `studio-uno-M16063C.png` (+ `-tien`, `-cisty`, `.json`, `-na-bielom.jpg`) | štúdio DUO a UNO kúrenie 6 bar, 1600 px |
| `makro-plast.png`, `makro-pena.png`, `makro-rura.png` | makrá do líp, štvorec 1200 px |
| `rozlozeny-faza-0.00.png` až `-1.00.png` (+ tiene, json) | rozložený rez presne vo fázach 0, 0,25, 0,5, 0,75, 1, kamera rovnaká ako v sekvencii |
| `porovnanie-duo-watts.png`, `porovnanie-uno-watts.png` | render v zábere Watts (rovnaká poloha a veľkosť prstenca) vedľa renderu Watts |
| `porovnanie-studio-watts.png` | celé telo vedľa renderu Watts v rovnakej výške |
| `porovnanie-studio-s-fotkou.png`, `porovnanie-makro-plast-s-fotkou.png`, `porovnanie-makra-s-fotkou.png` | porovnanie so skutočnými fotkami |

## Parametre `potrubie.py`

| Parameter | Predvolené | Význam |
|---|---|---|
| `--rad`, `--obj` | DUO, stredný variant | rad z `rady.json` a objednávacie číslo z `varianty.json`; fungujú všetky rady Microflex (UNO, DUO, PRIMO, sanita, QUADRO, COOL, COOL DUO, COOL s káblom, HP) |
| `--pohlad` | `studio` | `studio`, `rozlozeny`, `makro-plast`, `makro-pena`, `makro-rura` |
| `--faza`, `--snimky` | 0, 0 | rozloženie 0 až 1 (plášť ide dozadu, pena trochu dopredu, rúry dopredu); sekvencia N snímok |
| `--sirka`, `--vyska` | 1600 (makrá 1200) | šírka v px; výška podľa výrobku, ak nie je zadaná |
| `--vzorky` | 512 | vzorky Cycles (adaptívne, odšumenie OpenImageDenoise) |
| `--dlzka` | 2,2 (detail 4) | dĺžka kusu v násobkoch priemeru plášťa (celé telo v zábere aj so zadným koncom; pri detaile je koniec za ľavým okrajom) |
| `--azimut`, `--elevacia` | 42°, 18° | smer pohľadu na stred čela; záporný azimut = pohľad z druhej strany (štúdio sa zrkadlí) |
| `--ohnisko`, `--clona` | 100 mm, bez | objektív na snímač 36 mm; štúdio je ostré od začiatku po koniec (ako produktová fotka skladaná z viacerých záberov), makrá f/18 až f/32 |
| `--ramec` | podľa pohľadu | `tesny` (celé telo), `rozlozeny` (obsiahne všetky fázy, rovnaká kamera pre sekvenciu), `detail` (rez veľký vpravo, telo odchádza za ľavý okraj, kde ho web nechá utiecť za okraj obrazovky) |
| `--detail-podiel`, `--detail-okraj` | 0,47, 0,05 | detail: šírka rezu plášťa ako podiel šírky snímky; okraj vpravo za rezom alebo koncami rúr |
| `--natocenie`, `--presah` | −20° a automatika, podľa počtu rúr | natočenie rúr v reze; bez zadania sa natočenie upraví tak, aby koniec **bielej** rúry ostal v obryse plášťa (inak splynie s bielym pozadím) a pri 3 a viac rúrach boli biele vľavo hore nad penou; presah rúr pred penu (pri 3 a viac rúrach kratší, vzdialenejšie vyčnievajú viac) |
| `--pena-styl`, `--bunka` | `jemna` | `jemna` (ako fotka: sivá, matná, jemné póry), `bunky`, `zrna` (ako rendery Watts) |
| `--prierez`, `--zarez`, `--komory` | v makre plášťa prierez | plášť rozrezaný pozdĺž osi (dvojitá stena a dutiny), alebo zárez cez tri vlny (pomalší, booleovský rez) |
| `--bez-tiena`, `--len-tien` | | bez vrstvy tieňa; len vrstva tieňa k existujúcemu renderu |
| `--tien-sila`, `--tien-prah`, `--tien-okraj`, `--tien-dosah` | 0,55, 0,12, 0,03, 0,55 | najväčšia alfa tieňa; slabší dosvit okolia sa zahodí (ostane kontaktný tieň); pás bez tieňa pri okrajoch; kam siaha tieň od osi (násobok D) pre výrez záberu |
| `--tien-okraje` | `lhpd` (detail `hpd`) | okraje s nábehom tieňa na nulu: l, h, p, d (ľavý, horný, pravý, dolný); pri detaile ľavý okraj nie, telo aj tieň tam odchádzajú |
| `--jas-kluc`, `--jas-vypln-st`, `--jas-kontra-st`, `--jas-celo` | 18, 8, 14, 0,8 | jas svetiel štúdia (W/m²/sr); ladenie proti fotke |
| `--kluc-sirka`, `--kluc-y` | 2400 mm, 0,15 | šírka kľúčového softboxu a jeho poloha naprieč (kladné = mierne za telom) |
| `--hrana-drsnost` | 0,15 | o koľko sú hrany a steny vĺn drsnejšie ako vrchol (mäkký odlesk na hrane) |
| `--farba-plast`, `--sss-plast` | | ladenie farby (lineárne RGB) a presvitania plášťa (váha, dosah v mm) |
| `--svet` | 0,04 | sila okolia (tmavé štúdio, svieti len zhora; čierne zástery) |
| `--prevod`, `--expozicia`, `--teplota` | Standard, 0 | prevod farieb, expozícia, vyváženie bielej (makro peny 5900 K) |
| `--kvalita` | `studio` | `nahlad` (bez posunutia povrchu peny), `studio`, `makro` (jemnejšia sieť); hustota siete rastie so šírkou |
| `--watts cx,cy,os,š,v` | | porovnávací výrez: prstenec plášťa presne tam, kde je na renderi Watts |
| `--blend` | | uloží aj `.blend` na kontrolu |

## Ako je model postavený

- **Plášť (HDPE, dvojitá stena):** rotačné teleso z profilu. Vlny sú ploché „skrinky“ s malými
  zaobleniami (polomer 0,14 P), takmer zvislými stenami a úzkou drážkou s rovným dnom (0,30 P hore,
  0,22 P dole), rozstup P = 0,08 · D (12,8 mm pri 160 mm), radiálna hrúbka 0,06 · D, vonkajšia stena
  0,11 P, vnútorná 0,09 P. V každej vlne je dutina (princíp uzavretej komory). Plášť je prerezaný
  **v drážke** ako na skutočnej fotke rezu: rez je tenký (zrastené steny) s otrepom, široký modrý
  „prstenec“ okolo peny je predná stena prvej vlny. Vlny majú drobnú náhodnú nepravidelnosť.
- **Materiál plášťa:** sýty ultramarín, vrcholy hladké z formy (drsnosť 0,20 až 0,28, od vlny
  k vlne trochu iná), hrany a steny vĺn drsnejšie (mäkký široký odlesk namiesto tenkej svetlej
  čiary), stopy po nástroji po obvode, slabá pomarančová kôra. Presvitanie náhodnou prechádzkou
  s rozptylom posunutým do tyrkysova: v štúdiu slabé (plášť pôsobí nepriehľadne ako na fotke),
  v makre plášťa silné (tenké steny proti svetlu svietia ako na makrofotke). Rez je matný,
  svetlejší, so stopami po píle.
- **Pena (PE-X):** čelo je triangulované medzikružie so skutočným posunutím povrchu (adaptívne
  delenie po pixeloch): stredne sivá, matná, jemné plytké póry, sem-tam hlbší pór, slabé navinuté
  vrstvy, piliny a modré triesky z plášťa pri okraji. Čelo je kúsok za rezom plášťa.
- **Rúry:** PE-Xa žltá (kúrenie) a krémovo biela (sanita): lesklé, mierne presvitajú, rez bledší
  krémový so stopami po píle, vnútro tmavšie do oranžova, mikroškrabance, potlač len ako pás
  drobných nečitateľných značiek (žiadny vymyslený text ani logo). Biela rúra má jemne tmavší okraj
  pri pohľade pod uhlom a je menej presvitá, aby nesplynula s bielym pozadím. PE 100 (COOL) čierna
  so štyrmi modrými pruhmi; pri COOL s káblom tenký čierny kábel pri rúre, vyčnieva ďalej ako rúra;
  pri HP dve čierne vlnité chráničky so svetlou vložkou, rozmer z objednávacieho čísla
  (MQ16032C3225E = 32 a 25 mm, vnútorný priemer podľa brožúry 2026: 25/18,8 až 40/32 mm).
  Hrúbka steny nosných rúr podľa údajov.
- **Rozmiestnenie rúr:** UNO v strede, dve rúry nad sebou (−20°), tri a štyri do štvorca
  (kúrenie na jednej uhlopriečke, sanita na druhej). Natočenie a presah sa rozhodujú v rovnakom
  referenčnom štúdiovom pohľade pre všetky výrezy, takže A, B, C aj makrá ukazujú ten istý kus.
- **Štúdio:** veľký softbox nad telom, mierne za ním (jeho odraz leží na hornom okraji ako na
  fotke, nie rozliaty po celom plášti), úzky kontra pás za telom (lemy na hranách vĺn), vlastné
  svetlo na rez so slabým odleskom, len difúzna vyplňovacia doska do drážok, biela podlaha, ktorá
  vracia svetlo, ale v lesku sa neodráža, tmavé okolie (čierne zástery). Svetlá sú zadané jasom
  a škálujú sa s priemerom, takže 75 aj 200 mm vyzerá rovnako.
- **Fotoaparát:** 100 mm, bez hĺbky ostrosti (produktová fotka je ostrá celá), prevod Standard
  (sýte farby ako na fotke), po renderi jemná vinetácia (6 %) a fotografické zrno.
- **Tieň:** samostatný prechod s rovnomerným bielym okolím (ako veľký strop softboxov) a lapačom
  tieňa: tieň je najtmavší pri dotyku s podlahou a plynulo slabne, nie je to tmavá plocha pod celým
  telom; potom prah, krivka, sila 0,55 a nulové okraje (pozri Výstupy).

## Kalibrácia proti fotkám

Štúdiový pohľad v rovnakom uhle ako fotka s. 6 (`--azimut -42 --elevacia 14`), stredné hodnoty sRGB
(fotka v zátvorke): plášť 50/54/160 pri sýtosti 0,52 (49/54/136, 0,50), tiene 29/32/104 (26/27/87),
žltá 255/226/26 (253/221/5), pena 124 (122). Plášť sa porovnáva po zónach (tiene, stred, svetlá),
nie len priemerom: priemer môže sedieť, kým rozloženie tónov nie. Rozstup vĺn overený autokoreláciou
jasu na fotke rodiny potrubí a na fotke kotúča (0,07 až 0,10 D). Nástroje na meranie sú v histórii
práce (výrezy, zóny, mapa nenasýtených miest), nie v repozitári.

## Čo je odhad (nie z výkresu)

Tvar a hrúbky profilu plášťa, poloha a presah rúr a rozostup rúr v reze sú odmerané z fotiek, nie
z výkresu. Ak Watts pošle výkres plášťa (DWG v `subory` radov), stačí upraviť slovník `PLAST`
v `potrubie.py`. Farby sú zladené s jednou katalógovou fotkou (JPEG z tlače); iná fotka môže mať
iné vyváženie.

## Časy renderu (RTX 5070 Laptop, OptiX, 26. 10. 2026)

Čistý čas renderu podľa Blendera (bez načítania a stavby scény, tá trvá 5 až 15 s na spustenie).
Tieň je samostatný prechod s menším počtom vzoriek.

| Záber | Rozmer | Vzorky | Render | Tieň |
|---|---|---|---|---|
| hero DUO MD16032C (`final/duo-studio-3200.png`) | 3200 × 2134 | 1024 | 117 s | 41 s |
| makro plášťa (rez s komorami, presvitanie) | 3200 × 3200 | 512 | 255 s | – |
| makro peny (posunutie povrchu, najnáročnejšie) | 3200 × 3200 | 512 | 554 s | – |
| makro rúry | 3200 × 3200 | 512 | 448 s | – |
| rozložený rez, 1 snímka z 72 | 1600 × 946 | 256 | 6 až 7 s | 3,7 s |
| rozložený rez, celá sekvencia 72 snímok s tieňmi | 1600 × 946 | 256 | 693 s spolu | |
| UNO M12532C, QUADRO MQ16032C2520S, COOL M9040PE | 1600 × asi 1070 | 1024 | 29 až 33 s | 9 s |
| UNO M16063C | 1600 × 1078 | 1024 | 31 s | 9 s |
| fáza rozloženia (jeden záber) | 1600 × 946 | 512 | 11 až 13 s | 4,5 s |
| náhľad pri ladení | 1000 px | 128 | 3 až 4 s | 1,5 s |

Celá sada `final` trvá asi 40 minút (2411 s), sada `prvy` 4 minúty, `najlepsie` 4 minúty.
Ďalší variant v štúdiu 1600 px je teda asi minúta vrátane tieňa; všetkých asi 100 variantov
všetkých radov by trvalo okolo 1,5 hodiny.
