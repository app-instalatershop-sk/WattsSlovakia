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
| `davka.py` | dávky: `najlepsie` (priebežný stav pre majiteľa), `final` (všetky výstupy), `rady` (kontrola radov), `prvy` (výstupy prvého zadania v `data/_3d/prvy`, po sade `final`), `ramovanie` (výrezy A, B, C pre hlavu stránky radu), `rady12` (všetkých 12 radov v štúdiu a ich prehľad), `web` (produkčná sada pre web v `data/_3d/web`, dá sa prerušiť a pustiť znova, hotové súbory preskočí); skladá verzie na bielom, fotodokončenie, záznamy JSON k zmenšeninám a porovnania (beží v Pythone s Pillow) |
| `porovnanie.py` | zostava obrázkov vedľa seba v rovnakej výške s popisom |
| `galeria.mjs` | živá galéria renderov pre majiteľa, `node data/blender/galeria.mjs` → http://127.0.0.1:4340; zapisuje len pripomienky z porovnania so skutočnosťou |
| `realita.py` | stránka „Model a skutočnosť“ (http://127.0.0.1:4340/realita): 12 radov vedľa skutočných fotiek, render Watts osobitne, všetky dimenzie; pripomienky majiteľa ukladá galéria do `data/_3d/realita/pripomienky.json`. Spustiť po každej sade `web` |

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

# produkčná sada pre web (data/_3d/web), niekoľko hodín; --len vyberie skupiny
$P -I data/blender/davka.py web
$P -I data/blender/davka.py web --len hlavy,hero

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

`data/_3d/web/` (sada `web`, **produkčné mená, web na ne stavia, nemeniť**). Každé PNG je RGBA
s priehľadným pozadím, vedľa neho `<meno>-tien.png` (vrstva tieňa, pri okrajoch nulová) a `<meno>.json`
(`rad`, `obj_cislo`, `rozlisenie`, `body_px` na kóty, `geometria`). Postup a časy sa po každej skupine
pripíšu do `STAV.txt`, kontaktné hárky skupín sú v `data/_3d/najlepsie/web-<skupina>.jpg`.

| Priečinok | Obsah |
|---|---|
| `hlavy/<rad-id>.png` | výrez C (čelný pohľad na rez, azimut 22°, elevácia 12°), **jednotný** pre všetky varianty, 2000 px, 1024 vzoriek, 12 radov (reprezentatívny variant ako v `data/_3d/rady`) |
| `hero/duo.png` | hlavný obrázok domova: DUO MD16032C, rez v ľavej tretine obrátený k nadpisu, telo odchádza za pravý okraj (objektív 60 mm, telo 14 D), 3200 × 2206 px; tieň slabne hore, vľavo a dole, vpravo pokračuje s telom |
| `rady/<rad-id>.png` | výrez A (celé telo), 1600 px, 12 radov |
| `makra/plast.png`, `pena.png`, `rura-zlta.png`, `rura-biela.png`, `rura-cierna.png` | makrá do líp, štvorec 1200 px (render 2400 a zmenšenie); celoplošné, `-tien.png` je prázdna vrstva len pre jednotnosť |
| `rodina/rodina.png` | šesť systémov vedľa seba (UNO, DUO, DUO sanita, QUADRO, COOL, HP; všetky plášť 160 mm), rezy ku kamere, schodovito ako fotka v katalógu s. 6, 2400 × 1090 px; v JSON `body_px` pre každú rúru zvlášť |
| `varianty/<obj_cislo>.png` | každý variant 12 radov vo výreze C, 1600 px, 512 vzoriek; **rez plášťa je na každom obrázku na tom istom mieste a rovnako veľký** (prepínanie dimenzie mení len proporcie). 91 variantov, 83 súborov: 8 objednávacích čísel je v údajoch v dvoch radoch (UNO a UNO PRIMO, DUO a PRIMO DUO), JSON má vtedy pole `rady` |
| `rozlozeny/<rad-id>/rozlozeny-000.png` až `-071.png` | rozložený rez, 72 snímok, 1600 px, 256 vzoriek, každý rad vlastný výrez (všetky fázy v zábere); `rozlozeny.json` má `body_px` pre každú snímku |

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
| `--ramec jednotny` | | výrez spoločný pre všetkých 91 variantov 12 radov v danom smere kamery: kamera vo vzdialenosti c · D, rovnaký posun a pomer strán, takže rez plášťa je všade na tom istom mieste a rovnako veľký; parametre sa spočítajú raz a uložia do `data/_3d/_tmp/jednotny-ramec-*.json` |
| `--ramec hero`, `--hero-pomer`, `--hero-podiel`, `--hero-okraj` | 1,45, 0,26, 0,05 | hlavný obrázok: rez vľavo obrátený doľava, telo za pravým okrajom; pomer strán, šírka rezu ako podiel šírky, okraj vľavo; ak sa záber nezmestí na výšku, oddiali sa; hlási, keby bol vidno zadný koniec tela |
| `--pohlad rodina`, `--rodina`, `--rodina-dlzka`, `--rodina-krok`, `--rodina-pomer` | 6 systémov, 2,0, 0,35, 2,2 | spoločný záber radov: zoznam `rad:obj` oddelený čiarkami, dĺžka tiel a posun rezov v násobkoch D, pomer strán |
| `--segmenty`, `--krok`, `--krok-daleko`, `--rebra-blizko` | podľa šírky | hustota siete: dieliky po obvode, krok oblúkov profilu; pri dlhom tele v perspektíve majú vzdialené vlny hrubší krok (napr. hero: 40 vĺn jemne, ďalej 12°) |
| `--natocenie`, `--presah` | −20° a automatika, podľa počtu rúr (asi 0,4 D, najviac 0,42 až 0,45 D) | natočenie rúr v reze; bez zadania sa natočenie upraví tak, aby koniec **bielej** rúry ostal v obryse plášťa (inak splynie s bielym pozadím) a pri 3 a viac rúrach boli biele vľavo hore nad penou; presah rúr pred penu podľa fotiek brožúry 2026 (jedna a dve rúry 1,3 a 1,6 d + 8 mm, štyri 1,5 d + 8 mm a vzdialenejšie vyčnievajú viac, chráničky HP 0,5 d + 4 mm, kábel o 0,1 d rúry ďalej ako rúra) |
| `--pena-styl`, `--bunka` | `vrstvy`, 1 mm | `vrstvy` (podľa fotiek: tmavé jadro okolo rúr, svetlejšie navinuté vrstvy, hrubé bunky), `jemna` (hladká bez jadra ako retušovaná fotka s. 6, len na porovnanie) |
| `--prierez`, `--zarez`, `--komory` | v makre plášťa prierez | plášť rozrezaný pozdĺž osi (dvojitá stena a dutiny), alebo zárez cez tri vlny (pomalší, booleovský rez) |
| `--bez-tiena`, `--len-tien` | | bez vrstvy tieňa; len vrstva tieňa k existujúcemu renderu |
| `--tien-sila`, `--tien-prah`, `--tien-okraj`, `--tien-dosah` | 0,55, 0,12, 0,03, 0,55 | najväčšia alfa tieňa; slabší dosvit okolia sa zahodí (ostane kontaktný tieň); pás bez tieňa pri okrajoch; kam siaha tieň od osi (násobok D) pre výrez záberu |
| `--tien-okraje` | `lhpd` (detail `hpd`) | okraje s nábehom tieňa na nulu: l, h, p, d (ľavý, horný, pravý, dolný); pri detaile ľavý okraj nie, telo aj tieň tam odchádzajú |
| `--jas-kluc`, `--jas-vypln-st`, `--jas-kontra-st`, `--jas-celo` | 18, 8, 14, 0,8 | jas svetiel štúdia (W/m²/sr); ladenie proti fotke |
| `--kluc-sirka`, `--kluc-y` | 2400 mm, 0,15 | šírka kľúčového softboxu a jeho poloha naprieč (kladné = mierne za telom) |
| `--hrana-drsnost` | 0,15 | o koľko sú hrany a steny vĺn drsnejšie ako vrchol (mäkký odlesk na hrane) |
| `--farba-plast`, `--sss-plast` | | ladenie farby (lineárne RGB) a presvitania plášťa (váha, dosah v mm) |
| `--svet` | 0,04 | sila okolia (tmavé štúdio, svieti len zhora; čierne zástery) |
| `--prevod`, `--expozicia`, `--teplota` | Standard, −0,25 | prevod farieb, expozícia (štúdio o štvrť clony tmavšie od 27. 10., `EXPOZICIA_STUDIO`; makro peny +0,45 k tomu), vyváženie bielej (makro peny 5900 K) |
| `--kvalita` | `studio` | `nahlad` (bez posunutia povrchu peny), `studio`, `makro` (jemnejšia sieť); hustota siete rastie so šírkou |
| `--watts cx,cy,os,š,v` | | porovnávací výrez: prstenec plášťa presne tam, kde je na renderi Watts |
| `--blend` | | uloží aj `.blend` na kontrolu |
| `--vyrez x0,y0,x1,y1` | | ladenie: renderuje len časť snímky v plnom rozlíšení (podiel šírky a výšky, y zhora), napr. čelo peny |

## Ako je model postavený

- **Plášť (HDPE, dvojitá stena):** rotačné teleso z profilu. Vlny sú ploché „skrinky“ s malými
  zaobleniami (polomer 0,14 P), takmer zvislými stenami a úzkou drážkou s rovným dnom (0,30 P hore,
  0,22 P dole), rozstup P = 0,08 · D (12,8 mm pri 160 mm), radiálna hrúbka 0,06 · D, vonkajšia stena
  0,11 P, vnútorná 0,09 P. V každej vlne je dutina (princíp uzavretej komory). Plášť je prerezaný
  **v drážke** ako na skutočnej fotke rezu: rez je tenký (zrastené steny) s otrepom, široký modrý
  „prstenec“ okolo peny je predná stena prvej vlny. Vlny majú drobnú náhodnú nepravidelnosť.
- **Materiál plášťa:** sýta kobaltová modrá (odtieň 226°, do 27. 10. bol do fialova, 238°), vrcholy hladké z formy (drsnosť 0,20 až 0,28, od vlny
  k vlne trochu iná), hrany a steny vĺn drsnejšie (mäkký široký odlesk namiesto tenkej svetlej
  čiary), stopy po nástroji po obvode, slabá pomarančová kôra. Presvitanie náhodnou prechádzkou
  s rozptylom posunutým do tyrkysova: v štúdiu slabé (plášť pôsobí nepriehľadne ako na fotke),
  v makre plášťa silné (tenké steny proti svetlu svietia ako na makrofotke). Rez je matný,
  svetlejší, so stopami po píle.
- **Pena (PE-X):** čelo je triangulované medzikružie so skutočným posunutím povrchu (adaptívne
  delenie po pixeloch), dve vrstvy ako na fotke rezu zo stavby a na fotkách brožúry 2026 (Juraj 27. 10.):
  **jadro** okolo rúr je takmer čierne (kruh okolo osi, ktorý obalí všetky rúry aj kábel s rezervou 0,07
  polomeru peny; pri DUO 125 asi 0,7 polomeru) a o pol milimetra zapustené, na hranici je tenká tieňová
  škára; **vonkajšie vrstvy** k plášťu sú o niečo svetlejšia sivá navinutá v špirále (závity po 5 až 9 mm,
  švy miestami zrastené, každý závit trochu iný odtieň). Povrch tvoria prerezané uzavreté bunky tesne
  vedľa seba (1 a 0,5 mm v škvrnách, miska so svetlým okrajom), riedke väčšie bubliny do 1,3 mm a
  svetlé zrnká; vo veľkosti webu pôsobí pena hrubo a bublinkato ako na fotkách, nie ako jemný prášok; pri okraji piliny a modré triesky z plášťa. Čelo je kúsok za rezom plášťa. Koža peny a steny
  otvorov (vidno ich v rozloženom reze) majú farbu vonkajších vrstiev a jadra; koža má nižšie albedo,
  lebo na ňu svieti kľúčové svetlo zhora a inak by pôsobila ako iný, svetlý materiál.
- **Rúry:** PE-Xa žltá (kúrenie) a krémovo biela (sanita): lesklé, mierne presvitajú. Rez má farbu
  rúry, len je svetlejší a matný so stopami po píle (do 27. 10. mala žltá rúra na reze biely lem, na
  žiadnej fotke ho nemá); vnútro je rovnakej farby v tieni, pri bielej krémové, nie sivé.
  Mikroškrabance, potlač len ako pás drobných nečitateľných značiek (žiadny vymyslený text ani logo).
  Biela rúra má jemne tmavší okraj pri pohľade pod uhlom a je menej presvitá, aby nesplynula s bielym
  pozadím. PE 100 (COOL) čierna pololesklá so štyrmi modrými pruhmi, rez tmavosivý. Pri COOL s káblom
  plochý čierny kábel 8 × 4,5 mm (odhad podľa fotiek) leží plochou stranou navrchu rúry (katalóg s. 18:
  rúra je v kontakte s káblom), mierne natočený ku kamere; jeho rez ukazuje vrstvy podľa nákresu
  v katalógu s. 21 (čierny plášť, opletenie, svetlá izolácia, tmavé jadro, dva vodiče), ako svetlý
  krúžok na fotke s. 6. Pri HP dve čierne vlnité chráničky s jemnými hlbokými vlnami (0,14 d) a
  svetlosivou vložkou, rozmer z objednávacieho čísla (MQ16032C3225E = 32 a 25 mm, vnútorný priemer
  podľa brožúry 2026: 25/18,8 až 40/32 mm); vyčnievajú len krátko, žlté rúry ďaleko (fotka brožúry).
  Hrúbka steny nosných rúr podľa údajov. Albedo bielej rúry je nízke (0,31) preto, lebo štúdio svieti
  silno: pri vyššom by sa krémová belosť prepálila do čistej bielej a rúra by na bielom pozadí zmizla
  (kalibrované na stred sRGB 239 ako na fotke s. 6).
- **Rozmiestnenie rúr:** UNO v strede, dve rúry nad sebou (−20°) s medzerou 0,2 d, štyri do
  tesného štvorca s medzerou 2,5 mm (kúrenie na jednej uhlopriečke, sanita alebo chráničky na druhej;
  overené na fotkách QUADRO a HP v brožúre 2026). Natočenie a presah sa rozhodujú v rovnakom
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

**27. 10. 2026 (2. kolo, podľa pripomienok Juraja):** farby sú zmerané na produktových fotkách deviatich
radov z brožúry 2026 (`podklady/watts/fotky-katalog/brozura-2026-*.jpeg`, jedno štúdio), na fotke rezu
DUO zo stavby a na fotke s. 6; segmentácia podľa odtieňa a sýtosti, mediány sRGB. Ciele a výsledok
skúšobných hláv (výrez C, 1100 px): plášť odtieň 220 až 226° (fotky 214 až 230°, predtým 238°),
lineárny jas 0,056 (fotky 0,04 až 0,06, o kúsok tmavšie ako predtým 0,059); pena celkovo sRGB 96 až 100
(fotky 94 až 111, predtým 115), jadro asi 51 a vonkajšie vrstvy asi 98, pomer jasu 0,3 (fotka zo stavby
0,3, brožúra 0,58); žltá odtieň 47 až 48° a jas 0,47 až 0,55 (fotky 0,50 až 0,58); biela sRGB 231 až 248
(fotky 227 až 240). Farby sú rovnaké vo všetkých záberoch, lebo sa celá sada `web` renderuje znova
s jednou verziou modelu (`GEOMETRIA` v JSON každého renderu, `davka.py` staršie obnoví).

**Do 26. 10.:** štúdiový pohľad v rovnakom uhle ako fotka s. 6 (`--azimut -42 --elevacia 14`), stredné hodnoty sRGB
(fotka v zátvorke): plášť 50/54/160 pri sýtosti 0,52 (49/54/136, 0,50), tiene 29/32/104 (26/27/87),
žltá 255/226/26 (253/221/5), pena 124 (122). Plášť sa porovnáva po zónach (tiene, stred, svetlá),
nie len priemerom: priemer môže sedieť, kým rozloženie tónov nie. Rozstup vĺn overený autokoreláciou
jasu na fotke rodiny potrubí a na fotke kotúča (0,07 až 0,10 D). Nástroje na meranie sú v histórii
práce (výrezy, zóny, mapa nenasýtených miest), nie v repozitári.

## Čo je odhad (nie z výkresu)

Tvar a hrúbky profilu plášťa, poloha a presah rúr a rozostup rúr v reze sú odmerané z fotiek, nie
z výkresu. Ak Watts pošle výkres plášťa (DWG v `subory` radov), stačí upraviť slovník `PLAST`
v `potrubie.py`. Farby sú zladené s fotkami brožúry 2026, fotkou zo stavby a s. 6 (JPEG z tlače a
z webu, malé); iná fotka môže mať iné vyváženie. Odhad sú aj polomer tmavého jadra peny, hrúbka
závitov a rozmer kábla COOL (8 × 4,5 mm).

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
| výrez B detail (DUO) | 1600 × 1684 | 1024 | 57 s | 17 s |
| výrez C čelný (DUO) | 1600 × 1278 | 1024 | 41 s | 11 s |
| ktorýkoľvek z 12 radov, výrez A | 1600 × 1032 až 1092 | 1024 | 26 až 34 s | 9 až 10 s |

Celá sada `final` trvá asi 40 minút (2411 s), sada `prvy` 4 minúty, `najlepsie` 4 minúty,
`ramovanie` 2,5 minúty, `rady12` (12 radov s tieňmi a prehľadom) 10,5 minúty (625 s).

Produkčná sada `web` (27. 10. 2026; čistý čas renderu, bez spánku počítača):

| Skupina | Počet | Render | Na jeden obrázok |
|---|---|---|---|
| `hlavy` (2000 px, 1024 vz.) | 12 | 13,1 min | 45 až 53 s + tieň 15 s |
| `hero` (3200 × 2206, 1024 vz.) | 1 | 2,5 min | 108 s + tieň 43 s |
| `rady` (1600 px, 1024 vz.) | 12 | asi 7 min | 26 až 34 s + tieň 9 s |
| `makra` (render 2400, 512 vz.) | 5 | 13,8 min | 2 až 4 min |
| `rodina` (2400 × 1090, 1024 vz.) | 1 | 0,9 min | |
| `varianty` (1600 px, 512 vz.) | 83 | 31,7 min | 18 s + tieň 5,6 s (s prípravou asi 29 s) |
| `rozlozeny` (72 snímok, 1600 px, 256 vz.) | 11 × 72 | 9,5 až 13 min na rad | 6 až 7 s + tieň 3,7 s |

Celá sada beží asi 3,5 hodiny čistého času. Dávka sa dá prerušiť a pustiť znova (hotové súbory
preskočí); ak počítač zaspí, po prebudení pokračuje sama. Kým dávka beží, Windows počítač pre
nečinnosť neuspí (`nezaspi()` v `davka.py`, len pre tento proces, nastavenia napájania sa nemenia).
Zatvorené veko ani odpojenie napájania to neprekoná: na noc nechať počítač zapojený a s otvoreným vekom.
