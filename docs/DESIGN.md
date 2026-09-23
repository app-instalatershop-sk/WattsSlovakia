# Dizajnový brief – web Microflex Slovensko

Verzia 1, 21. 9. 2026. Tento dokument je jedna pravda o tom, ako bude web vyzerať a prečo.
Mení sa dohodou s Jurajom. Rozhodnuté body sú bez značky, otvorené otázky majú značku ❔
a sú zhrnuté v kapitole 15.

Referencia: slovenské stránky watts.eu (kategórie, rad UNO 6 bar, domov), preskúmané 21. 9. 2026
v prehliadači pri šírke 1440 px. Snímky sú v `.playwright-mcp/` (nekomitujú sa).

---

## 1. Čo web robí a pre koho

**Úloha webu v jednej vete:** človek do piatich sekúnd pochopí, čo je Microflex, do troch klikov
nájde správny rad a dimenziu a kúpi na instalatershop.sk.

**Tri publiká, tri vstupy:**

| Kto | Čo vie | Čo potrebuje hneď hore |
|---|---|---|
| Inštalatér, montážnik | pozná rad a dimenziu, často aj obj. číslo | vyhľadávanie obj. čísla, tabuľka variantov, odkaz do e-shopu |
| Staviteľ, majiteľ domu (tepelné čerpadlo, prípojka do garáže, chaty, bazéna) | nepozná názvoslovie | výber podľa použitia v troch krokoch, zrozumiteľné vety, referencie |
| Projektant, veľkoobchod, montážna firma (B2B) | potrebuje podklady a cenu na projekt | technické listy, BIM/CAD, dopytový formulár, kontakt na veľkoobchod |

**Jazyk:** spisovná slovenčina bez čechizmov. Texty z watts.eu sú strojový preklad
(„Microflex predizolovaného potrubia“, „sanitárne zariadenia“, „heating pumps“), nekopírujeme ich.
Obchodné názvy radov píšeme ako výrobca: Microflex UNO, DUO, PRIMO, QUADRO, COOL, HP.

---

## 2. Referencia watts.eu: čo preberáme a čo robíme lepšie

**Preberáme, aby zostala rodinná podoba:**
- biela základňa, Watts modrá `#005DB9` ako hlavná farba, modrá pätička,
- produktové fotografie na svetlosivej ploche,
- štruktúra katalógu: 6 kategórií → rady → varianty s obj. číslami,
- osnova produktovej stránky: Popis, Obj. číslo, Technické údaje, Na stiahnutie, Referencie,
  Súvisiace produkty.

**Čo watts.eu robí a ako to robíme lepšie:**

| Prvok | watts.eu (stav 21. 9. 2026) | Náš web |
|---|---|---|
| Hero | karusel s 2 slajdmi, fotobanner, heslo „Flexibilita v každom kroku!“, tlačidlo „Viac informácií“ | statický asymetrický hero: text s výberom vľavo, makro prierezu rúry cez pravý okraj, vyhľadávanie priamo v hero |
| Kategórie | 6 rovnakých kariet, rovnaká fotka, žiadny popis | karta s prierezovým piktogramom, jednou vetou a počtom radov |
| Bočná navigácia | 13 skupín Watts (čerpadlové skupiny, ventily…), Microflex je jedna z nich | web je len o Microflexe; navigácia = 6 kategórií + Výber + Pre firmy |
| Produktový rad | tabuľka 7 stĺpcov s anglickými hlavičkami (Art. No., Insulation, Bending radius), bez filtra, bez kúpy | slovenské hlavičky s jednotkami, filter dimenzie, lepkavá hlavička, každý riadok vedie do e-shopu |
| Vyhľadávanie | ikona v hlavičke, presmeruje na stránku výsledkov | pole v hero aj v hlavičke, výsledky okamžite, hľadá aj obj. čísla a dimenzie |
| Typografia | Helvetica Neue Light 34 px pre H1, slabá hierarchia, popisky VEĽKÝMI | výrazná škála, dve písma s jasnou rolou, žiadne verzálky v popiskoch |
| Konzistencia | popri firemnej modrej uniká Bootstrap modrá `#0D6EFD`, anglické zvyšky („CALCULATION TOOL“) | jeden systém tokenov, žiadny cudzí text |
| Na stiahnutie | štyri zbalené harmoniky (Schválenia, BIM a CAD, Brožúry, Technické listy) | otvorený zoznam súborov s typom, jazykom a veľkosťou, katalóg PDF vždy jedným klikom |
| Fotky | 500 × 500 px rendery na sivom pozadí | vlastné makro fotky odrezkov + fotky z montáže |

**Kontext vyhľadávania (21. 9. 2026):** bývalý slovenský web wattswater.sk presmerúva natrvalo
(301) na watts.eu/sk, čiže oficiálna slovenská stopa Watts je len watts.eu/sk. Pre „Microflex
predizolované potrubie“ sa už dnes zobrazuje instalatershop.sk s kategóriami Microflex. Pre
všeobecný výraz „predizolované potrubie“ súperíme s Uponor Ecoflex, NRG FLEX, Pipelife
a ekoshop.sk. Podrobný plán kľúčových slov bude v samostatnom SEO dokumente.

---

## 3. Päť zásad dizajnu

1. **Produkt je hrdina.** Prierez rúry (modrý zvlnený plášť, sivá pena, žlté jadro) je hlavný
   vizuálny motív celého webu. Žiadne ilustrácie, abstraktné tvary ani stock fotky ľudí v helmách.
2. **Prehľad na prvý pohľad.** Každá stránka bez rolovania odpovedá na dve otázky: „čo to je“ a
   „čo mám urobiť“ (vybrať, hľadať, stiahnuť, kúpiť).
3. **Asymetria pre príbeh, symetria pre výber.** Hero, „Prečo Microflex“ a referencie sú
   asymetrické (pomer 5 : 7 stĺpcov, obraz cez okraj). Mriežky kategórií, variantov a súborov sú
   prísne symetrické, lebo tam človek porovnáva.
4. **Modrá vedie, žltá ukazuje.** Modrá je značka a akcia. Žltá (farba jadra rúry) je len malá
   plocha na jednom mieste obrazovky: jadro v piktograme, aktívny krok sprievodcu, zvýraznený
   riadok. Nikdy žltý text, nikdy žltá ako pozadie sekcie.
5. **Technická dôvera.** Tabuľky s tabulkovými číslicami, jednotky pri každom čísle, zdroj údajov
   (katalóg Watts + dátum) pod každou tabuľkou. Žiadne superlatívy bez čísla.

---

## 4. Farby

Základ je prevzatý z CSS premenných watts.eu (`--primary #005db9`, `--dark-primary #00468b`,
`--primary-extra-pale #d9e7f5`), doplnený o farby samotného produktu.

| Token | Hex | Odkiaľ | Použitie |
|---|---|---|---|
| `--blue-700` | `#005DB9` | Watts modrá | tlačidlá, odkazy, aktívne stavy, obrys piktogramu |
| `--blue-800` | `#00468B` | Watts tmavá | hover tlačidiel, aktívny odkaz v navigácii |
| `--blue-900` | `#0A2A5E` | vlastná, „podzemie“ | pätička, blok Pre firmy, pozadie hero fotky |
| `--blue-100` | `#D9E7F5` | Watts pale | pásy sekcií, pozadie pása parametrov |
| `--blue-50` | `#EEF4FB` | vlastná | hover riadkov, pozadie výsledkov hľadania |
| `--yellow-500` | `#F2C400` | žlté PE-Xa jadro rúry | jediný akcent, len plocha (viď zásada 4) |
| `--grey-300` | `#C8CDD4` | izolačná pena | orámovania, deliace linky, pena v piktograme |
| `--grey-100` | `#F3F4F6` | pozadie fotiek (Watts `#F5F5F5`) | plocha pod produktovými fotkami |
| `--ink` | `#0B1B33` | vlastná | text a nadpisy; modrastá čerň ladí s modrou lepšie než `#000` |
| `--ink-soft` | `#4A5568` | vlastná | sekundárny text, popisky tabuliek |
| `--white` | `#FFFFFF` | | základňa |
| `--ok` | `#1B8A5A` | stav | „skladom“ pri variante, potvrdenie formulára |
| `--error` | `#C8353A` | stav | chyby formulárov |

**Pravidlá:**
- Na jednej stránke najviac tri pozadia: biela, jeden svetlomodrý pás (`--blue-100` alebo
  `--blue-50`) a jeden tmavý blok (`--blue-900`, spravidla pätička alebo Pre firmy).
- Žiadne prechody (gradienty) okrem tmavého presahu cez hero fotku kvôli čitateľnosti textu.
- Zelená a červená sú výlučne stavové, nikdy dekoratívne.
- Kontrast: `--blue-700` na bielej 6,3 : 1, `--ink` na `--yellow-500` 12 : 1, `--ink` na
  `--blue-100` 13 : 1. Biely text na `--blue-700` 6,3 : 1. Všetko spĺňa AA aj pre malý text.

---

## 5. Typografia

Watts používa Helvetica Neue (platená licencia). Chceme rovnakú „švajčiarsku“ vecnosť, ale
s vlastným charakterom a otvorenou licenciou.

| Rola | Písmo | Rezy | Prečo |
|---|---|---|---|
| Nadpisy H1–H3 | **Archivo** (variabilné, os šírky), šírka SemiExpanded | 600, 700 | grotesk ako Helvetica, ale širší; pôsobí ako technický štítok na výrobku. Plná slovenská diakritika (ľ ť ď ô ä ŕ). Licencia OFL. |
| Text, tabuľky, formuláre, H4 | **IBM Plex Sans** | 400, 500, 600 | navrhnutý pre technickú komunikáciu, čitateľný v 14–16 px, má tabulkové číslice (`font-variant-numeric: tabular-nums`) pre tabuľky variantov. Licencia OFL. |

Rozhodnuté 21. 9. 2026 na maketách: nadpisy **Archivo** (variant A). Alternatíva Schibsted Grotesk
sa už nepoužíva.

**Škála** (pomer 1,25, základ 16 px): 13 · 14 · 16 · 20 · 25 · 31 · 39 · 49 · 61.

| Prvok | Veľkosť | Riadkovanie | Poznámka |
|---|---|---|---|
| H1 hero | plynulo 39 → 61 px (`clamp`) | 1,05 | Archivo 700, medzery znakov −0,01 em |
| H1 stránky | 39 px | 1,1 | Archivo 700 |
| H2 | 31 px | 1,15 | Archivo 600 |
| H3 | 25 px | 1,2 | Archivo 600 |
| H4 | 20 px | 1,3 | Plex 600 |
| Telo | 16 px, dlhé texty 18 px | 1,55 | Plex 400 |
| Tabuľky | 14 px | 1,4 | Plex 400/500, tabulkové číslice |
| Popisky, zdroje | 13 px | 1,4 | Plex 400, `--ink-soft` |

**Pravidlá sadzby:**
- Dĺžka riadku najviac 70 znakov (slovenčina má dlhé slová), text zarovnaný doľava všade,
  nikdy do bloku, nikdy na stred okrem prázdnych stavov.
- Žiadne verzálky v popiskoch a tlačidlách. Obchodné názvy UNO, DUO, QUADRO zostávajú verzálkami,
  lebo tak ich píše výrobca.
- Žiadne malé nadpisy nad nadpismi (tzv. eyebrow), žiadne zvýraznenie jedného slova v nadpise
  inou farbou.
- Písma hostujeme sami (Fontsource), s `font-display: swap` a predom načítaným rezom pre hero.

---

## 6. Tvar, plocha, mriežka

- **Kontajner** 1 320 px, 12 stĺpcov, medzera 24 px. Bočný okraj 16 px na mobile, 32 px na tablete,
  48 px na počítači.
- **Zaoblenie** presne dve hodnoty: 4 px (tlačidlá, polia, filtre) a 12 px (fotky, karty
  s obrázkom). Piktogramy sú kruhy.
- **Karty bez tieňa.** Oddeľuje ich plocha (`--grey-100`, `--blue-50`) alebo linka 1 px
  `--grey-300`. Tieň má len to, čo naozaj pláva nad stránkou: menu, dialóg, výsledky hľadania
  (`0 8px 24px rgba(11, 27, 51, .12)`).
- **Linky** 1 px `--grey-300`; hrubšia linka 2 px `--blue-700` len pod aktívnou položkou
  podnavigácie.

### Piktogramy radov = rendery výrobcu

Rozhodnutie Juraja 21. 9. 2026: žiadne ručne kreslené ikony, len profesionálne riešenie. Ako
piktogramy radov používame **oficiálne 3D rendery Watts** (rez potrubím pod uhlom, priehľadné
pozadie), ktoré máme so súhlasom z brožúry 2026 pre všetkých deväť radov: UNO a DUO vykurovanie,
UNO a DUO sanita, QUADRO, HP, COOL, COOL s vyhrievacím káblom, COOL DUO. Súbory
`podklady/watts/piktogramy/rad-*.png` (od Juraja v HD 1200 px). Používajú sa v kartách katalógu
na domove, v hlavičke kategórie a všade, kde treba rad rozoznať na pohľad. Na jednej stránke sa
rendery kategórií ukážu len raz, aby dve sekcie nevyzerali ako tá istá. V tabuľkách a čipoch
piktogram nie je, stačí text.

Ak budeme neskôr chcieť jednotnú kreslenú sadu (napr. pre favicon a veľmi malé veľkosti),
zadáme ju grafikovi so zadaním: 9 radov + spojky + príslušenstvo, mriežka 24 px, jeden štýl
ťahu, testované v 16, 24 a 48 px. Dovtedy favicon = písmeno M v Archive na modrej.

### Rebrovaný vzor

Zvislé pruhy 2 px / 6 px (`--blue-800` na `--blue-900`) pripomínajú zvlnený plášť. Nahrádzajú
šikmé pruhy z pätičky watts.eu. Len na dvoch miestach: pätička a úzky pás na okraji hero fotky.

### Ikony

**Lucide** (balík `lucide-static`, licencia ISC), vždy originálne súbory z balíka, nikdy
napodobeniny. Hrúbka 2 px v mriežke 24 px, zobrazované v 16 až 24 px. Iba funkčné: hľadať,
filter (sliders-horizontal), stiahnuť, menu, zavrieť, externý odkaz (pri odkazoch do e-shopu),
šípka ďalej (chevron-right), telefón, e-mail, dokument, potvrdenie. Do makiet ich skladá
`makety/build.py` zo súborov v `makety/src/icons/lucide/` ako SVG sprite.

---

## 7. Obraz

- **Vlastné makro fotky odrezkov** UNO, DUO, QUADRO, COOL a HP: čelný rez, rez pod 45°, na bielej
  a na `--blue-900`. Toto je najsilnejší a najunikátnejší obsah webu (Google Obrázky, sociálne
  siete). Odrezky vieme urobiť z tovaru v predajni. ❔ kto a kedy nafotí.
- **Fotky z montáže** (výkop s modrou rúrou, napojenie tepelného čerpadla) pre referencie a sekciu
  „Prečo Microflex“. Pýtať od montážnych firiem a zákazníkov so súhlasom na zverejnenie.
- **Fotky Watts** (500 × 500 px, sivé pozadie) len ako doplnok pri variantoch a len so súhlasom
  Watts (kapitola 14).
- Formáty AVIF a WebP so záložným JPEG, responzívne veľkosti, hero obrázok predom načítaný.
- Alt texty po slovensky s názvom radu a dimenziou, napríklad „Prierez potrubia Microflex DUO
  125/2×32 s dvoma žltými rúrami PE-Xa“.

---

## 8. Pohyb

- **Jeden orchestrovaný moment (domov v4, 23. 9. 2026):** pri otvorení domova sa prvý riadok nadpisu
  „Flexibilné potrubie.“ roztiahne po osi šírky písma Archivo zo 72 % na 112,5 %, tak ako sa rozvinie
  ohybné potrubie; render súčasne dosadne sprava. Spolu do 1,2 s. Animácia nemá koncový stav, cieľom
  je šírka, ktorú má nadpis podľa šírky okna (na mobile 100 %). Popisky nad fotkou prierezu sa
  nepoužívajú (Juraj 21. 9.: „nie popisky ako dieťaťu“).
- **Pohyb viazaný na rolovanie má význam, nie ozdobu** (`web/src/scripts/pohyb.ts`): rúra pri
  krokoch pokládky sa s rolovaním rozvinie a kroky, ku ktorým dorazí, sa rozsvietia (`data-rozvin`);
  kotúč sa jemne pootočí, akoby sa odvíjal (`data-otacaj`); vrstvy potrubia prídu zvonka dnu
  (`data-reveal-seq`). Všeobecné vynáranie sekcií sa nepridáva.
- Všetok ostatný pohyb je odpoveď na akciu človeka: prepnutie kategórie v katalógu, rozbalenie filtra,
  prepnutie kroku sprievodcu (posun 150–200 ms), zobrazenie výsledkov hľadania, potvrdenie formulára.
- Žiadne zväčšovanie kariet pri prejdení myšou, žiadne karusely. Pri `prefers-reduced-motion` sa
  nehýbe nič a všetko je hneď viditeľné (kroky pokládky plné, rúra rozvinutá).

---

## 9. Rozloženie stránok

Drôtené modely pre šírku 1 440 px. Na mobile sa stĺpce skladajú pod seba v poradí čítania,
hero fotka ide pod text.

### Domov

Domov v4 (23. 9. 2026, zadanie Juraja „najpútavejší dizajn, kľudne asymetrický, nie štvorec vedľa
štvorca“). Rozbor a dôvody sú v `docs/AUDIT-DOMOV.md` kap. 8. Stránka je rad „dvojstrán“ na mriežke
12 stĺpcov, každá je ukotvená inak a obrázky prekračujú hrany sekcií. Tón ide zhora nadol od bielej
(povrch) cez svetlomodrú k tmavomodrej (podzemie), kam potrubie naozaj ide.

```
+----------------------------------------------------------------------------+
| PREDIZOLOVANÉ POTRUBIA MICROFLEX® |   Ø 75 až 200 mm        od 0,20 m      |
| Flexibilné potrubie.  (os šírky)  |   plášť z HDPE          polomer ohybu  |
| Precízne riešenie.                |        ●──── render rezu ────●         |
| Pre vykurovanie, pitnú vodu, …    |   (kružnice za rezom, odlesk, myš)     |
| [Vybrať potrubie ↓]  Stiahnuť katalóg PDF, 19 MB ↓                         |
|                                   |   ● 25 až 125 mm, nosné rúry na 6,     |
|                                   |     10 alebo 16 bar                    |
+----------------------------------------------------------------------------+
| Výber podľa použitia / Každý projekt má svoje potrubie.   (svetlý pás)      |
| ▌Vykurovanie      4 rady |        mäkké svetlo štúdia                      |
|  Teplá a studená  3 rady |   [render UNO]        [render DUO]              |
|  …                       |   ────────────── spoločná podlaha ───────────── |
| popis kategórie,         |   Microflex UNO       Microflex DUO             |
| Aj vo vyhotovení PRIMO   |   Jedna rúra v plášti Dve rúry v plášti         |
| Celý katalóg potrubí ↗   |   16 dimenzií, plášť  8 dimenzií, plášť         |
| Spojky a príslušenstvo: skupiny dielov ako odkazy                          |
+--------------------------+-------------------------------------------------+
| Päť systémov, jedna rodina.       |   render rodiny cez švík pásu, za      |
| ┃ Plášť z HDPE        (modrá)     |   pravý okraj obrazovky                |
| ┃ ┃ Izolácia z PE-X   (sivá)      |                                        |
| ┃ ┃ ┃ Nosná rúra      (žltá)      |                                        |
+-----------------------------------+----------------------------------------+
| ⟵ kotúč cez ľavý okraj            |  Sto metrov za štyridsať minút.        |
|   (biela fotky splynie s pásom,   |  1 Kotúč k výkopu   ┃ rúra sa rozvinie  |
|   pri rolovaní sa pootočí)        |  2 Rozvinúť do piesku  s rolovaním     |
|                                   |  3 Spojky a skúška                     |
|                                   |  4 Páska a zásyp      až 60 t, zdroj   |
+==== šikmá hrana, fotka z výkopu ju prekračuje =============================+
| Kde už Microflex leží (biely text) |  fotka z výkopu, cez pravý okraj      |
| 3 referencie ako zoznam            |                                       |
|----------------------------------------------------------------------------|
| Pre projektantov, montážne firmy…  |  technické listy, BIM a CAD, …        |
+----------------------------------------------------------------------------+
| Pätička (tmavomodrá, nadväzuje bez schodu)                                 |
+----------------------------------------------------------------------------+
```

Hero (Juraj 22. 9. 2026, podľa jeho vlastného návrhu): **svetlé pole, nie tmavý panel.** Farbu nesie
samotný výrobok. Nad nadpisom je tichý riadok s kľúčovým slovom (ostáva súčasťou H1 kvôli
vyhľadávaniu), nadpis má dva riadky a druhý je modrý. Akcie sú nerovnocenné zámerne: žlté tlačidlo
vedie na výber podľa použitia priamo pod ním (kotva `#vyber`, sprievodca `/vyber/` je zatiaľ zástupná
stránka) a podčiarknutý odkaz otvára katalóg PDF výrobcu s veľkosťou súboru. Veta o partnerstve
v hero nie je, lebo to isté aj s logom hovorí horný pás. Render má strop 1 180 px.

Hero v5 (Juraj 23. 9.: „grafika veľmi jednoduchá, ničím nezaujme; tabuľka pod tým vyzerá
neprofesionálne, netuším, aký má zmysel“): **pás čísel pod hero je zrušený, čísla sú technické popisy
priamo pri renderi.** Bod leží na tom, čo číslo opisuje (okraj plášťa: Ø 75 až 200 mm, spodná žltá
rúra: 25 až 125 mm a tlak, zvlnené telo: polomer ohybu od 0,20 m), čiara vedie k štítku. Hodnoty sú
z dát. Súradnice bodov sú v percentách obrázka, takže sedia pri každej šírke; na telefóne majú
kratšie čiary. Za rezom sú jemné sústredné kružnice ako na výkrese prierezu, po načítaní raz prejde
po plášti pás svetla (maska je samotný render) a výrobok sa pri pohybe myši nepatrne posunie.
Poradie po načítaní: nadpis sa roztiahne, render dosadne, objavia sa body, čiary a štítky.

Katalóg na domove (Juraj 22. 9. 2026, podľa jeho vlastného návrhu, v4 prekomponované): záložky =
kategórie, v paneli veľké rendery radov. V4 z nich robí **register** vľavo (ako palcový register
tlačeného katalógu: názov a počet radov, vybraná kategória má žltú značku, farbu jadra rúry) a
**štúdio** vpravo: rendery stoja na spoločnej podlahe s tieňom, popisy sú zarovnané doľava a začínajú
na jednej linke (podmriežka). Pri jednom rade je popis vedľa renderu. Popis vybranej kategórie je
v ľavom stĺpci pod registrom. Záložky sú prepínače bez skriptu a obsah všetkých panelov je v HTML
kvôli vyhľadávačom.

Počet radov v registri musí sedieť s tým, čo je vidieť (Juraj 23. 9.: „sú 4 rady, ukázané sú len 2“).
Rady, ktoré zdieľajú render so súrodencom (PRIMO), preto majú vlastný riadok s názvom, odkazom
a odlišnosťou pod renderom základného radu: „Užší plášť pri tej istej rúre“ (katalóg s. 8 proti 9
a 10 proti 11; vlastný obrázok PRIMO nemá ani výrobca, fotka PRIMO DUO je tá istá ako DUO).

Rodina: render prechádza cez švík z pásu katalógu a za pravý okraj obrazovky. Pod ním je **stavba
potrubia ako balenie**: tri plochy vnorené do seba, modrá (plášť) obsahuje sivú (pena) a tá žltú
(nosná rúra). Každá má kruhový detail skutočného materiálu vyrezaný z renderu výrobcu
(`web/src/assets/detaily/`, zdroj `rad-duo-kurenie.png`). Na počítači idú plochy zľava doprava cez
celú šírku ako rez od plášťa k rúre, na tablete a telefóne pod sebou (Juraj 23. 9.: „balenie je
rozumná voľba, len grafika je slabá, tri čiarky“). Pozor na fakty: spoločná je stavba, nie materiál
rúry. COOL má nosnú rúru PE 100 do 16 bar, ostatné PE-Xa (katalóg s. 8 až 18).

Pokládka (nová sekcia v4): jediné miesto s obrázkom vľavo. Fotka kotúča má čisto bielu plochu,
násobením splynie so svetlým pásom a text leží v jeho vnútri. Obsah je z katalógu výrobcu: časy
pokládky (s. 36, „približne, bez dopravy a výkopu“), postup zemných prác (s. 37) skrátený na štyri
skutočné kroky a zaťaženie až 60 t pri uložení v hĺbke 0,5 až 6 m. Odkaz vedie na s. 37 katalógu.
Pod 900 px je kotúč pás nad textom. Fotka kotúča je tónovaná na farbu renderov (len modré plochy,
biela ostala biela), originál je v podkladoch.

Podzemie: referencie, Pre firmy a pätička sú jeden tmavý úsek so šikmou hornou hranou (motív Watts).
Fotka z výkopu hranu prekračuje, takže svetlá a tmavá časť sú jeden prechod. Referencie sú zoznam bez
náhľadov (náhľady boli z 300 px zdrojov a prvý bol rez rúry, nie stavba). Spodok podzemia má tú istú
farbu ako začiatok pätičky.

Zásada domova (Juraj 21. 9. 2026): každá sekcia má inú úlohu aj inú formu. V4: produkt ako monument
(hero), register a štúdio (katalóg), render a typografický rez (rodina), postup s číslami (pokládka),
fotka cez hranu (referencie), tmavý zoznam podkladov (Pre firmy). Ukotvenie sa strieda: obrázok
vpravo, register a štúdio, render vpravo cez švík, kotúč vľavo, fotka vpravo cez šikmú hranu.
Pravidlo „text vľavo, obrázok vpravo v celej stránke rovnako“ z auditu 21. 9. už neplatí, robilo
stránku jednotvárnou. Ten istý motív sa neopakuje v tej istej forme; rez rúry je v hero, v štúdiu
a v rodine, ale zakaždým v inej úlohe (výrobok, voľba radu, porovnanie vrstiev). Pravidlá, podľa
ktorých hodnotíme: Vignelli (disciplína, jedno ohnisko), Müller-Brockmann (mriežka 12 stĺpcov),
Tufte (dátový atrament), Refactoring UI (popis k nadpisu, nekvalitná fotka len ako náhľad).

Hlavička (23. 9., Juraj: „vyzerá ako AI z minulého roka“): znak M so žltým bodom (jadro rúry)
a nápis; Potrubia otvárajú panel so všetkými piatimi systémami, ich rendermi a radmi, pod nimi
spojky, príslušenstvo, celý katalóg a katalóg PDF; pod položkou, na ktorej je myš alebo aktuálna
stránka, sa posúva žltá značka; hľadanie je pole s ikonou a skratkou Ctrl K (⌘ K); E-shop je tmavé
tlačidlo, lebo je cieľom webu. Pod 1 100 px je všetko v menu (predtým na tablete navigácia zmizla
bez náhrady), mobilné menu má hľadanie a systémy s malými rendermi.

Sadzba: texty domova prechádzajú funkciou `sadzba()` (`web/src/lib/sadzba.ts`), ktorá dá
nezlomiteľnú medzeru za jednopísmenové predložky a spojky, medzi číslo a jednotku (95 °C, 16 bar,
60 t) a do označení noriem (EN ISO 15875). Text sa inak nemení.

### Kategória (napr. Potrubia pre vykurovanie)

```
| Domov > Potrubia pre vykurovanie                                            |
| H1 Predizolované potrubia pre vykurovanie                 (piktogram 1|2)   |
| Dve vety: na čo, teplota a tlak, kedy UNO a kedy DUO                        |
+--------------------+-------------------------------------------------------+
| Filtre (lepkavé)   | Rady, 2 karty v riadku: fotka, názov, 3 parametre,    |
|  Počet rúr         |  „16 dimenzií“, [Zobraziť varianty]                   |
|  Tlak              |                                                       |
|  Dimenzia rúry     | [Zobraziť všetky varianty ako tabuľku]                |
|  Izolácia          |                                                       |
+--------------------+-------------------------------------------------------+
| Porovnanie radov v kategórii: UNO / DUO / UNO PRIMO / PRIMO DUO             |
| Otázky a odpovede k kategórii (pre ľudí aj pre vyhľadávače)                 |
```

### Produktový rad (napr. Microflex UNO, vykurovanie 6 bar)

```
| Domov > Potrubia pre vykurovanie > Microflex UNO                            |
+-------------------------------+--------------------------------------------+
| Galéria: hlavná fotka         | H1 Microflex UNO – vykurovanie 6 bar       |
|  + 4 náhľady (6 stĺpcov)      | Jeden odsek po slovensky                   |
|                               | Pás parametrov (blue-100):                 |
|                               |  Médium | Max. teplota | Tlak | Rúra |     |
|                               |  Plášť | Polomer ohybu                     |
|                               | [Vybrať dimenziu]  [Kúpiť v e-shope]       |
+-------------------------------+--------------------------------------------+
| Lepkavá podnavigácia: Varianty  Technické údaje  Na stiahnutie  Referencie  |
|                       Súvisiace                                             |
| Varianty: tabuľka  Obj. číslo | Plášť Ø mm | Rúra Ø × s mm | Hmotnosť kg/m  |
|           | Izolácia | Polomer ohybu m | Kotúč Ø / šírka m | [do e-shopu]   |
|           filter dimenzie nad tabuľkou, lepkavá hlavička, zdroj + dátum     |
| Technické údaje: definičný zoznam (materiály, normy, teploty)               |
| Na stiahnutie: zoznam súborov s typom, jazykom, veľkosťou                   |
| Referencie: 2 fotky asymetricky (7 / 5)                                     |
| Súvisiace: spojky, tesnenie prestupu, koncovky (4 karty)                    |
```

### Výber potrubia (sprievodca)

Kroky sú číslované, lebo ide o skutočnú postupnosť.

```
| 1 Na čo    2 Rúry a tlak    3 Dimenzia          (aktívny krok má žltý podklad) |
|                                                                                |
| Veľké voľby s piktogramom, jedna voľba = klik, vždy možnosť späť               |
|                                                                                |
| Výsledok: 1–3 rady s prierezom a parametrami, [Kúpiť v e-shope] [Poslať dopyt] |
```

### Pre firmy (B2B)

```
| Tmavý hero (blue-900): Pre projektantov, montážne firmy a veľkoobchod          |
+------------------------+------------------------+------------------------------+
| Technické listy,       | Dopyt na projekt       | Veľkoobchodný kontakt        |
| BIM/CAD, vyhlásenia    | (formulár: firma,      | (meno, telefón, e-mail,      |
| o zhode, EPD           |  projekt, rady, súbor) |  otváracie hodiny)           |
+------------------------+------------------------+------------------------------+
| Výpočtový nástroj tepelných strát (odkaz na nástroj Watts alebo vlastný) ❔     |
```

### Poradňa (články)

Dlhé texty 18 px v jednom stĺpci do 70 znakov, obsah článku vľavo lepkavý, fotky cez celú šírku
kontajnera. Slúži pre všeobecné výrazy („ako položiť predizolované potrubie“, „potrubie k tepelnému
čerpadlu“) a vedie do kategórií.

---

## 10. Vyhľadávanie a výber

**Vyhľadávanie**
- Pole v hero a v hlavičke; na mobile ikona otvorí celoobrazovkové pole.
- Hľadá v názvoch radov, obj. číslach (`M7525C`, aj `m7525`, aj `7525`), dimenziách
  (`75/25`, `25x2,3`, `25×2,3`), kategóriách a článkoch.
- Bez ohľadu na diakritiku a veľkosť písmen: „predizolovane“ nájde „predizolované“.
- Výsledky do 100 ms, zoskupené: Rady, Varianty (obj. čísla), Návody a články. Enter otvorí prvý.
- Prázdny výsledok hovorí, čo skúsiť: „Pre „…“ sme nič nenašli. Skúste obj. číslo alebo dimenziu,
  alebo si potrubie vyberte podľa použitia.“ s odkazom na sprievodcu.

**Sprievodca výberom (3 kroky)**
1. Na čo: Vykurovanie / Teplá a studená voda / Chladenie / Tepelné čerpadlo.
2. Koľko rúr a aký tlak: jedna, dve, štyri; 6 bar, 10 bar.
3. Dimenzia: podľa vnútornej rúry, s pomôckou „neviem“ (orientačne podľa výkonu alebo prietoku).
Výsledok: 1 až 3 rady s prierezom a kľúčovými parametrami, tlačidlo „Kúpiť v e-shope“
a „Poslať dopyt“ (B2B). Stav sprievodcu je v adrese, aby sa dal poslať kolegovi.

**Väzba na e-shop**
- Každý variant má odkaz na svoj produkt v instalatershop.sk (mapovanie obj. číslo Watts →
  produkt v e-shope; e-shop už má kategórie Microflex).
- Cena: ❔ Odporúčanie pre fázu 1: bez ceny, tlačidlo „Cena a dostupnosť v e-shope“. Fáza 2:
  živá cena a skladovosť z dát e-shopu.

---

## 11. Komponenty

Hlavička s hľadaním, pás faktov, katalógová tabuľka (systém × počet rúr, skupiny dielov), karta kategórie, karta radu, prierezový
piktogram, pás parametrov, tabuľka variantov (lepkavá hlavička, filter, riadok do e-shopu),
sprievodca (kroky), zoznam súborov na stiahnutie, referencia (fotka + 2 riadky), porovnávacia
tabuľka radov, otázky a odpovede, dopytový formulár, oznam („Predaj zabezpečuje Inštalatérshop“),
drobčeky, prázdny stav, pätička.

Každý komponent má stav: predvolený, prejdenie myšou, fokus (obrys 2 px `--blue-700` s odsadením
2 px), aktívny, vypnutý, načítava sa, prázdny, chyba.

---

## 12. Odporúčané knižnice a nástroje

Zoznam nezávisí od budúceho stacku (framework a hosting rozhodneme neskôr). Vyberá to, čo dizajn
posunie najviac za najmenej práce.

| Nástroj | Na čo | Prečo práve tento | Alternatíva |
|---|---|---|---|
| **Tailwind CSS v4** | tokeny farieb, písma a medzier ako CSS premenné, utility triedy | náš systém z kapitol 4–6 sa zapíše priamo do `@theme`; žiadna cudzia téma na prepisovanie | čisté CSS s vlastnými premennými (web tejto veľkosti to zvládne) |
| **shadcn/ui** (nad Radix primitívami) | prístupné dialógy, popovery, taby, príkazová paleta pre hľadanie (`cmdk`) | kód žije v našom repe a preberá naše tokeny; prístupnosť a klávesnica sú hotové | Radix Themes, Ark UI |
| **Motion** (motion.dev) | jediný orchestrovaný moment v hero a prechody sprievodcu | malá, deklaratívna, rešpektuje reduced-motion | CSS `@keyframes` + View Transitions |
| **MiniSearch** alebo **Fuse.js** | hľadanie na strane klienta nad JSON katalógu (≈ 42 radov, ≈ 300 variantov) | bez servera, okamžité, odstránenie diakritiky si dopíšeme | Pagefind (ak pribudne veľa článkov), Typesense/Meilisearch (pre túto veľkosť zbytočné) |
| **Fontsource** | vlastné hostovanie Archivo a IBM Plex Sans | GDPR bez volaní na Google, rýchlosť, `preload` hero rezu | priamo súbory WOFF2 v repe |
| **Lucide** | ikony | jednotná hrúbka, strom SVG, len to, čo použijeme | Phosphor |
| **Radix Colors** alebo **Leonardo** (Adobe) | vygenerovať 12-stupňové škály z našich základných farieb s kontrolou kontrastu | odpadnú ručné odhady odtieňov pre hover a pozadia | ručne podľa kapitoly 4 |
| **Utopia** (utopia.fyi) | plynulá škála písma a medzier cez `clamp` | jedna škála pre mobil aj počítač bez skokov | pevné body zlomu |
| **Sharp** (v builde) | AVIF/WebP a responzívne veľkosti obrázkov | najsilnejší obsah webu sú fotky, musia byť rýchle | obrazová služba (Cloudinary, imgix) |
| **Playwright + Lighthouse CI + axe** | snímky, rýchlosť, prístupnosť ako brána pred nasadením | to isté, čím sme skúmali watts.eu; každý krok dizajnu sa overí obrazom | ručné testy |

**Ako budeme dizajn ladiť:** najprv HTML makety s reálnym obsahom z katalógu (rad UNO 6 bar),
v dvoch variantoch písma, vedľa seba s snímkou watts.eu. Až po schválení tokenov a makiet ide
kód. Makety vieme robiť ako artefakty v Claude, takže ich Juraj otvorí v prehliadači bez inštalácie.

**Čo nepoužiť a prečo:**
- hotové marketingové šablóny (ThemeForest, šablóny Webflow, Framer): vyzerajú ako všetky ostatné,
  presne opak zámeru „vymakaný dizajn“;
- efektové knižnice (Aceternity, Magic UI): pohyb bez obsahu, pomalé, čítajú sa ako generované;
- Bootstrap: práve on robí watts.eu nejednotný (dve modré);
- aplikačné knižnice ako Mantine alebo MUI: sú pre aplikácie s formulármi, nie pre prezentačný web
  s fotkami.

---

## 13. Kvalita (základ, nie nadstavba)

- Mobil od 360 px bez vodorovného rolovania. Tabuľka variantov na mobile ako karty, alebo
  vodorovne rolovateľná so zamrznutým stĺpcom obj. čísla.
- Kontrast AA, viditeľný fokus, celý sprievodca aj hľadanie ovládateľné klávesnicou, čítačka
  obrazovky prečíta piktogram („Microflex DUO, dve rúry“).
- Rýchlosť: najväčší prvok (LCP) do 2 s na mobile, posun rozloženia (CLS) 0, žiadne karusely,
  žiadne externé písma a skripty tretích strán okrem meraní.
- SEO základ: jedna H1 na stránku, štruktúrované dáta Product/Offer s odkazom na e-shop,
  BreadcrumbList, Organization, FAQPage; sitemap; kanonické adresy; alt texty. Podrobný plán
  kľúčových slov a adres bude v samostatnom SEO dokumente.
- Tmavý režim: v 1. fáze nie (prezentačný web postavený na fotkách na bielej). ❔

---

## 14. Značka a právo

- **Watts a Microflex sú ochranné známky Watts. Súhlas na použitie loga, fotiek a podkladov
  máme** (dlhodobá spolupráca, sme popredný e-shop pre ich produkty; potvrdil Juraj 21. 9. 2026).
  Logá, fotky a PDF od výrobcu zbierame v `podklady/watts/` (zdroj a licenčná poznámka v README
  priečinka). Vlastné makro fotky odrezkov ostávajú cieľom, lebo ich nemá nikto iný.
- **Web musí byť na prvý pohľad náš, nie web Watts.** V hlavičke je náš názov (pracovne
  „Microflex Slovensko“, ❔ definitívny názov), logo Watts ako výrobca v sekcii „Výrobca“ a v pätičke.
  V pätičke prevádzkovateľ s úplnými údajmi (firma za instalatershop.sk, sídlo, IČO), kontakt
  a veta „Predaj zabezpečuje instalatershop.sk“.
- Označenie „autorizovaný predajca“ alebo „oficiálny partner“: presné znenie dohodnúť s Watts. ❔
- Cookies a meranie: bez súhlasu len nevyhnutné; lišta v našom dizajne (nie cudzí widget).

---

## 15. Otvorené rozhodnutia pre Juraja

1. **Názov webu a doména.** Značkový (napr. microflex.sk, ak je voľná) alebo generický
   (predizolovane-potrubie.sk) alebo kombinácia. Ovplyvní hlavičku, logo aj SEO stratégiu.
2. ~~Súhlas Watts~~ máme (21. 9. 2026). Zostáva len presné znenie označenia partnerstva.
3. **Cena na webe:** fáza 1 bez ceny (odporúčam), alebo hneď živá cena z e-shopu.
4. **Vlastné fotky odrezkov:** kto nafotí, aké rady máme fyzicky k dispozícii.
5. **Rozsah sortimentu:** všetkých 42 radov z katalógu Watts, alebo len to, čo e-shop reálne
   ponúka.
6. **B2B hĺbka:** len dopytový formulár a kontakt (fáza 1), alebo aj prihlásenie a veľkoobchodný
   cenník (to už je funkcia, patrí do fázy stacku).
7. **Druhý jazyk (čeština) v budúcnosti:** áno alebo nie. Ovplyvní štruktúru adres od začiatku.
8. ~~Písmo nadpisov~~ rozhodnuté: Archivo (21. 9. 2026).

---

## 16. Čo z webu urobí profesionálny web: pohyb, hĺbka, detaily

Stav 21. 9. 2026: makety v3 sú čistý HTML a CSS bez knižníc (len ikony Lucide a písma). Ukazujú
rozloženie, farby a typografiu, ale nie správanie. Pocit profesionality vzniká až z vecí nižšie,
zoradených podľa toho, koľko pridajú za koľko práce. Všetky sa dajú urobiť nezávisle od stacku.

### 16.1 Pohyb (najväčší rozdiel)

Pravidlo z kapitoly 8 platí: jeden orchestrovaný moment pri načítaní, všetko ostatné je odpoveď
na akciu človeka. Pohyb má trvať 150 až 250 ms, dlhšie len hero (do 900 ms), krivka „rýchly
začiatok, mäkký dojazd“ (`cubic-bezier(.2,.7,.2,1)`), vždy s `prefers-reduced-motion`.

| Kde | Čo sa deje | Prečo to pôsobí profesionálne |
|---|---|---|
| Hero pri načítaní | fotka sa zmenší z 104 % na 100 %, nadpis, odsek a tlačidlá vystúpia postupne o 12 px, popisky prierezu prídu po nich | jediný „vstup“ webu, ukazuje, že je živý a premyslený |
| Karty, dlaždice | pri prejdení myšou sa zdvihnú o 2 px, orámovanie zmodrie, tieň sa jemne objaví; kliknutie stlačí na 98 % | odozva na každý dotyk, ale bez zväčšovania obsahu |
| Tlačidlá, čipy, polia | prechod farby 150 ms, viditeľný fokus, stav stlačenia | základ, ktorý bežné weby vynechajú |
| Filter variantov | riadky, čo zostávajú, sa presunú na nové miesto (FLIP), čo odchádza, zmizne, počet sa prepočíta | človek vidí, čo filter urobil, nič „neblikne“ |
| Podnavigácia radu | podčiarknutie aktívnej položky sa plynulo presúva (layout animácia), kotvy rolujú hladko | orientácia na dlhej stránke |
| Hlavička pri rolovaní | z 72 px na 60 px, objaví sa tieň, nápis sa zmenší | viac miesta na obsah, stále po ruke |
| Galéria radu | prekrytie fotiek krížovým prelínaním 200 ms, náhľad sa posunie do stredu | žiadne skoky obrázkov |
| Otázky a odpovede | výška sa rozbalí plynulo, znak + sa otočí na × | detail, ktorý si každý všimne, keď chýba |
| Výsledky hľadania | panel sa objaví s posunom 8 px a tieňom, výsledky prídu odstupňovane po 20 ms, zhoda je zvýraznená | okamžitá odozva je hlavný „wow“ moment webu |
| Prechod medzi stránkami | krížové prelínanie stránky, fotka radu „doletí“ z karty kategórie na stránku radu (View Transitions API, natívne) | web pôsobí ako aplikácia, nie ako sled načítaní |
| Sekcia „Prečo Microflex“ | tri fakty prídu odstupňovane pri prvom zjavení v okne (jediná reveal animácia na webe) | výnimka, ktorá potvrdzuje pravidlo |

**Knižnica:** **Motion** (motion.dev, 5 kB v jadre, funguje s čistým JS aj Reactom, má `animate`,
`inView`, `stagger`, layout animácie). **GSAP** so ScrollTriggerom len keby sme chceli choreografiu
pri rolovaní, čo zatiaľ nechceme. Prechody stránok riešime natívnym View Transitions API bez knižnice.

### 16.2 Hĺbka a povrchy

- Fotky s jemným tmavým presahom zospodu, aby text a popisky vždy čitateľne sedeli.
- Produktové plochy nie sú plochá sivá: jemný radiálny prechod (svetlejší stred) pôsobí ako
  fotoštúdio, rendery dostanú mäkký tieň pod sebou. Všetky rendery v rovnakej mierke a orientácii.
- Plávajúce vrstvy (výsledky hľadania, menu, dialógy) majú jediný definovaný tieň
  `--shadow-float`. Nič iné tieň nemá, kým sa nezdvihne pri prejdení myšou.
- Načítavanie obrázkov: rozmazaný náhľad, ktorý sa preostrí (thumbhash alebo LQIP) namiesto
  prázdneho miesta a skoku.

### 16.3 Typografia do detailu

- Archivo má os šírky: nadpisy na počítači 112,5 %, na mobile 100 %. Jedna plynulá zmena podľa
  šírky okna, ktorú nikto iný nemá.
- Nadpisy nad 40 px s medzerami znakov −0,02 em, odseky s `text-wrap: pretty`, nadpisy `balance`.
- Čísla v páse parametrov a v porovnaní radov v Archive 600, 24 až 31 px: „6 bar“, „25 až 125 mm“
  sa stanú podpisom webu. Tabuľky ostávajú v Plex Sans s tabulkovými číslicami.
- Farba označenia textu `--blue-100`, jednotné podčiarknutia odkazov v texte (2 px, odsadené).

### 16.4 Správanie, ktoré ľudia očakávajú

- Hľadanie ako príkazová paleta (Ctrl + K aj klik): okamžité výsledky, klávesnica, zvýraznenie
  zhody, skupiny Rady / Varianty / Články. Knižnica **cmdk** cez **shadcn/ui** (Radix), alebo
  vlastné nad **MiniSearch**.
- Dialógy, popovery, akordeón, taby: **Radix** primitíva cez shadcn/ui, lebo majú hotovú
  klávesnicu, fokus a ARIA. Vlastné `<details>` ostáva len tam, kde netreba animáciu.
- Kliknutie na obj. číslo ho skopíruje a ukáže krátku správu „Skopírované M7525C“. Inštalatéri to
  používajú denne.
- Prázdne a načítavacie stavy: kostry (skeletony) v tvare obsahu, nie točiace sa kolieska.
- Tlačidlá do e-shopu vždy s ikonou externého odkazu a s uvedením, kam vedú.

### 16.5 Drobnosti, ktoré si ľudia všimnú podvedome

- Favicon a ikony aplikácie (M v Archive na modrej), obrázok pre zdieľanie (OG) s renderom radu.
- Tlačová šablóna tabuľky variantov (inštalatéri si tlačia obj. čísla).
- Vlastný posuvník v širokých tabuľkách, jemné oddelenie zamrznutého stĺpca tieňom.
- Stránka 404 v našom dizajne s hľadaním a odkazmi na kategórie.
- Konzistentné 4 px raster medzier, dve zaoblenia, jeden tieň, jedna krivka pohybu. Žiadne výnimky.

### 16.6 Čo z toho vieme ukázať v maketách a čo až v stavbe

V maketách (artefakty) vieme načítať Motion z CDN, takže 16.1 okrem prechodov medzi stránkami,
16.2 a 16.3 sa dajú predviesť hneď. Hľadanie ako paleta, Radix diely, thumbhash, tlač a prechody
stránok patria do stavby, lebo potrebujú build. Preto rozhodnutie o stacku (Astro + Tailwind v4 +
shadcn/ui ako ostrovy Reactu + Motion je navrhovaná kombinácia) odomyká väčšinu profesionality.

## 17. Ďalší krok

1. Vytiahnuť z PDF katalógu (MICROFLEX_SK_PDF.pdf) zoznam radov a variantov do dát v repe
   (`data/`), aby makety aj hľadanie pracovali s reálnym obsahom.
2. Tri HTML makety s reálnym obsahom: domov, kategória Potrubia pre vykurovanie, rad Microflex UNO
   6 bar. Každá v dvoch variantoch písma nadpisov. Porovnať vedľa watts.eu.
3. Po schválení makiet a tokenov: rozhodnutie o stacku a hostingu (samostatný dokument).
