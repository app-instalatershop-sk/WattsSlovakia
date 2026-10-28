# Doladenie dizajnu a pocitu: prieskum a plán (26. 10. 2026)

Podnet od Juraja: „Urob prieskum, ako by sme mohli urobiť polish stránky pre lepší dizajn a pocit. Chcem
využiť aj tvoje zručnosti a schopnosti, ale kľudne aj externé služby, knižnice alebo AI. Chcem od teba čo
najlepšiu radu, ako na to.“

**Výsledok:** koncept webu je silný a vlastný (kóty na výrobku, štúdio, zostup pod zem, šikmé hrany,
hadovité vedenie oka). Dojem hotovej prémiovej značky mu dnes neberú chýbajúce nápady, ale tri druhy
drobností: **obraz** (každý obrázok má iné svetlo, uhol a ostrosť, niektoré sú dočasné), **systém**
(brief povoľuje 2 zaoblenia a 1 tieň, kód ich má 28 a 72) a **hrany** (orezané rendery, šev na mobile,
prázdne pásy, zvyšky šablóny). Najlepšia rada: pred spustením len bezpečné doladenie bez nových podkladov,
potom jeden obrazový jazyk (vlastné fotky + 3D model potrubia z rozmerov katalógu) a až nad ním jeden
podpisový pohyb. Knižnice netreba meniť, AI používať len na úpravu skutočných podkladov a pocit overiť
na ľuďoch z cieľovej skupiny, nie len mojím okom.

## 1. Čo som pozrel

- **Web:** 11 typických stránok (domov, Potrubia, Vykurovanie, Microflex DUO 6 bar, T-kus z bronzu,
  Referencie, Pre firmy, Výber, Na stiahnutie, článok Pokládka, Kontakt) pri 1440 × 900 a 390 × 844,
  zostavený web (`npm run build`, `astro preview`), 63 snímok po obrazovkách. Snímky sú len v pracovnom
  priečinku sedenia, do repozitára nejdú.
- **Kód:** `global.css`, komponenty a šablóny, súpis všetkých hodnôt zaoblení, tieňov, veľkostí písma,
  farieb a trvaní pohybu (skript nad `web/src`).
- **Meranie:** výmena písma (stránky s písmami a so zablokovanými písmami), kontrola dotykových stavov,
  zástupných obrázkov a tlače.
- **Prieskum mimo webu:** podpora nových techník CSS v prehliadačoch, knižnice pohybu, AI a externé služby
  na obraz a 3D, benchmark prémiových webov technických značiek, nástroje na overenie dojmu (kap. 4).

## 2. Diagnóza

### 2.1 Čo funguje a nemeniť

Hero s kótami na renderi, štúdio s registrom v katalógu, rez pod lupou ako koncept, pokládka s kotúčom,
tmavé podzemie s projektmi a kótami na fotkách zo stavieb, tabuľky variantov (kopírovanie, filter, karty
na mobile), obálky katalógu „na stole“, typografia (široké Archivo v nadpisoch), prechody medzi stránkami
s preletom renderu. Tieto prvky robia web rozpoznateľným a nikto v odbore ich nemá.

### 2.2 Obraz: najväčšia medzera

| Miesto | Dnes | Prečo to uberá |
|---|---|---|
| Hlava radu, systému a Potrubí (štúdio) | render Watts, telo rúry vľavo končí rovnou zvislou hranou (pri 1440 px dobre vidno) | výrobok pôsobí ako výstrižok, nie ako predmet v štúdiu |
| Projekty a Referencie | fotky zo stavieb z telefónu, zväčšené AI (Orange 1 200 px, Považská Bystrica 895 px) | pri veľkom zobrazení mäkké, hlina a štrk „maľované“ |
| Lupy (domov, stavba radu) | dočasné výrezy; makro plášťa je nečitateľná modrá plocha | detail, ktorý má dokázať kvalitu materiálu, ju neukazuje |
| Pre firmy, hlava | počítačová vizualizácia Watts (prestup stenou do budovy) | starší štýl renderu, iný jazyk než štúdio aj fotky |
| Podklady na stránke radu | DWG, DXF, PDF a EPD ako farebné listy so skratkou, EPD zelený | vymyslený obraz hneď vedľa skutočných obálok katalógu a brožúry |
| Článok Pokládka, hlava | fotka kotúča v zaoblenom ráme, pravá polovica rámu je biele pozadie fotky | vyzerá ako nedokončený výrez |
| Diely (41) | AI zväčšenie a výrez z fotiek Watts 500 px | ako celok dobré, svetlo a uhol má však každý diel iné |

Spoločný menovateľ: **každý obraz má iné svetlo, uhol, farbu a ostrosť.** Prémiové značky majú jeden
obrazový jazyk (rovnaké štúdiové svetlo, rovnaký uhol pohľadu, rovnaké farebné ladenie fotiek). Kým ho
nemáme, žiadne CSS ani pohyb dojem nevytiahnu.

### 2.3 Systém: pravidlá z briefu sa v kóde rozbehli

| Vlastnosť | Brief (`DESIGN.md` kap. 4 až 6 a 16) | Kód 26. 10. 2026 | Čo to robí |
|---|---|---|---|
| Zaoblenie rohov | 2 hodnoty, 4 a 12 px | 28 rôznych zápisov (2, 3, 6, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22 px …) | rohy vedľa seba nesedia: karta radu 22, hárok 18, fotka projektu 16, pás častí stránky 14, karta 12, štítok kóty 12 a na mobile 10 |
| Tiene | jeden tieň `--shadow-float` | 61 rôznych `box-shadow` a 11 `drop-shadow` | svetlo prichádza z rôznych výšok a smerov, hĺbka nepôsobí ako jedna scéna |
| Veľkosť písma | škála 9 hodnôt (13 až 61 px) | 20 pevných veľkostí (11,5 až 28 px, aj polovičné) a 27 plynulých | hierarchia popisov je o kúsok rozostrená |
| Farby | 13 tokenov | 81 rôznych hex a 79 rôznych `rgb()` | takmer biele a svetlomodré plochy sa nepatrne bijú |
| Pohyb | 150 až 250 ms, hero do 900 ms, jedna krivka | 20 rôznych trvaní (60 až 900 ms), 4 krivky | pohyb nemá jeden rytmus |

Návštevník tieto čísla nepočíta, ale vidí výsledok: stránky pôsobia poskladané z častí, ktoré ladil každý
osobitne. Zjednotenie je jadro doladenia a zároveň najlacnejší krok, lebo nemení obsah ani rozloženie.

### 2.4 Chyby na hranách

1. **Štúdio v hlave** (rad, systém, Potrubia; `Hlava.astro`, `.hs-studio`): render nemá dozvenie vľavo,
   telo rúry končí rovnou hranou. Oprava: maska zľava ako v katalógu na domove, neskôr vlastný render
   s celým telom (kap. 3, B2).
2. **Domov na mobile, Rodina** (`Domov.astro`, `.rodina-obraz` pod 1 100 px má `width: 100%`): render
   končí na okraji mriežky 16 px pred okrajom obrazovky, rúry sú tam zrezané, a cez horný okraj renderu
   prechádza tenká vodorovná čiara (švík dvoch pásov s mierne inou farbou). Oprava: nechať render dobehnúť
   za okraj ako na počítači a zjednotiť farbu švíka.
3. **Článok Pokládka:** hlava (kap. 2.2). Oprava: kotúč násobením do plochy ako na domove alebo iný záber.
4. **Prázdny pás na počítači:** pod spojkami na domove je 200 px rezerva pre prechod renderu rodiny; vpravo
   ju render využije, vľavo je prázdna. Buď ju využiť (začiatok textu rodiny), alebo skrátiť.
5. **Mobil, filter tabuľky variantov:** pri 390 px sa „63“ zalomí do druhého riadku samo.

### 2.5 Zvyšky šablóny

- Krátke žlté čiarky nad nadpismi stĺpcov v časti „Pri veľkom projekte“ na domove: typický znak šablóny.
- Rad, „Čo budete potrebovať k potrubiu“: štyri biele karty s ikonkou v štvorčeku a zoznamom odkazov.
  Máme 41 vyrezaných dielov, ktoré inde stoja na podlahe štúdia; tu by urobili to isté.
- Domov, „Spojky a príslušenstvo“: riadok odkazov so šípkami bez obrazu.
- Výber, krok 1: päť rovnakých bielych kariet s rovnakým tieňom (vzhľad „sady kariet“).
- Obálky podkladov (kap. 2.2) a veľa rovnako podčiarknutých odkazov na jednej obrazovke.

### 2.6 Správanie a pocit

- **Dotyk:** web má 75 pravidiel pre prejdenie myšou (`:hover`) a ani jedno nie je obmedzené na zariadenie
  s myšou. Na telefóne ostane karta po ťuknutí „zdvihnutá“, kým človek neťukne inde.
- **Načítanie fotiek:** bez zástupného náhľadu. Na pomalom mobile sa fotka zjaví z prázdnej plochy.
  Riešenie je náhľad s priemernou farbou alebo rozmazaný náhľad s veľkosťou pár sto bajtov priamo v HTML.
- **Písmo:** záložné písmo nemá prispôsobené rozmery, ale meranie 26. 10. (390 aj 1440 px, 4 stránky,
  písma zablokované) ukázalo, že sa riadky nelámu inak a tlačidlá sa neposunú. Pri pomalom pripojení
  blikne iné písmo, nič sa nehýbe. Nízka priorita.
- **Tabuľka variantov:** filter mení riadky skokom; plynulý presun riadkov (FLIP) z briefu (kap. 16.1)
  nie je. Kóty na renderi v hlave radu sa s vybranou dimenziou nemenia, hoci dáta máme.
- **Prechod medzi stránkami** je rovnaký vpred aj späť.
- **Tlač:** tlačovú úpravu má len zoznam materiálu vo Výbere. Tabuľka variantov radu ju nemá, hoci brief
  (kap. 16.5) s tlačou počíta, lebo inštalatéri si obj. čísla tlačia.

## 3. Odporúčaný postup

Poradie podľa toho, čo pridá najviac dojmu za najmenej rizika. Pravidlá z `docs/RYCHLOST.md` platia ďalej
(Lighthouse na mobile 90 a viac, CLS 0, prvok LCP nikdy z nulovej priehľadnosti).

### Fáza A: pred spustením, bez nových podkladov (2 až 3 dni, robím ja)

| Krok | Čo | Hotovo, keď |
|---|---|---|
| A1 | **Tokeny:** zaoblenia podľa úrovne (ovládací prvok, štítok, karta, hárok, kruh) a pravidlo vnorených rohov; hĺbka v 4 úrovniach s jedným smerom svetla, vrstvené tiene tónované do tmavomodrej; škála písma bez polovičných veľkostí; 3 až 4 trvania a 3 krivky pohybu vrátane pružného dojazdu cez CSS `linear()`; odtiene modrej a sivej ako škála v OKLCH. Stráž v kontrole kódu (Stylelint), aby sa hodnoty znova nerozbehli. | v kóde ostanú len hodnoty z tokenov, snímky pri 6 šírkach bez nechcených zmien |
| A2 | **Chyby na hranách** 1 až 5 z kap. 2.4 | snímky pri 360, 390, 768, 1024, 1440 a 1920 px bez orezaných renderov a švíkov |
| A3 | **Dotyk a tlač:** efekty prejdenia myšou len pre `@media (hover: hover) and (pointer: fine)`; tlačová úprava tabuľky variantov | na telefóne nič neostane „zdvihnuté“, tabuľka sa vytlačí na A4 bez hlavičky a pätičky webu |
| A4 | **Zvyšky šablóny** (kap. 2.5): navrhnem varianty na pracovnej stránke ako 22. 10. a Juraj vyberie | zvolené varianty na webe, pracovná stránka zmazaná |
| A5 | **Overenie:** porovnanie snímok pred a po (Playwright, rozdiel pixelov), meranie pozornosti, Lighthouse | žiadna stránka pod 90 na mobile, CLS 0 |

### Fáza B: jeden obrazový jazyk (paralelne, 1 až 3 týždne)

| Krok | Čo | Kto |
|---|---|---|
| B1 | **Fotenie** podľa zoznamu záberov (`docs/AUDIT-PREMIUM.md` kap. 7): odrezky radov, makro plášťa, peny a rúry, predajňa a sklad, video rozvíjania kotúča. Nové z benchmarku (kap. 4.4): makro potlače plášťa na piesku z výkopu, rez so svetlom zozadu na tmavom pozadí, snímka termokamerou počas prevádzky, spojky zhora v poradí montáže, ruka v rukavici ohýba rúru na najmenší polomer (dôkaz slova „flexibilné“). | Juraj alebo fotograf; ja pripravím presné zadanie a svetlo |
| B2 | **3D model potrubia z rozmerov katalógu** (Blender, skript v Pythone): všetky rady v rovnakom svetle, uhle a mierke, celé telá bez orezu, rozložený rez, otočka, makrá do líp. Najprv skúška na UNO a DUO (1 deň); ďalej len ak obstojí vedľa renderu Watts. | skript a nastavenie ja, výpočet na grafickej karte RTX 5070 |
| B3 | **AI úprava skutočných fotiek** (len bežné úpravy, kap. 4.3): zväčšenie, výrez, čistenie, zladenie svetla vyrezaných dielov, jedno farebné ladenie pre všetky fotky stavieb | ja (lokálne nástroje) a Juraj (Photoshop) |
| B4 | **Skutočné náhľady dokumentov** (prvá strana PDF, výkres DWG ako obrázok) namiesto farebných listov | ja |

### Fáza C: jeden podpisový pohyb (po spustení)

Odvážnosť minúť na jednom mieste. Kandidáti v poradí odporúčania:

1. **Rez sa rozloží:** pri rolovaní sa plášť, pena a nosné rúry rozostúpia pozdĺž osi a pri každej vrstve
   sa objaví kóta. Nahrádza alebo dopĺňa lupy, nesie informáciu (stavba z troch vrstiev je hlavný argument).
   Obrazová sekvencia z B2 kreslená na `<canvas>`, načítaná až po LCP; bez skriptu a pri „obmedziť pohyb“
   statický obraz.
2. **Živé kóty podľa dimenzie:** výber dimenzie v tabuľke prepíše kóty na renderi v hlave radu krátkym
   pretočením číslic (ako Rivian R2, kap. 4.4); pri „obmedziť pohyb“ sa čísla len vymenia. Lacné, dáta
   máme, dá sa aj vo fáze A. V odbore to nerobí nikto.
3. **Kotúč sa rozvinie** v pokládke ako skutočný 3D pohyb namiesto rastúcej čiary.

### Fáza D: overiť pocit na ľuďoch

- **Päťsekundový test a výber slov** pred fázou A a po fáze B: 10 až 15 inštalatérov a projektantov priamo
  v predajni (cieľová skupina chodí denne). Telefón s webom na 5 s, potom tri otázky (čo predávame, komu,
  čo by ste urobili) a výber 5 slov zo zoznamu asi 25 (prémiový, lacný, technický, dôveryhodný, zastaraný,
  prehľadný …; metóda Microsoft Product Reaction Cards). Zadarmo a od skutočných zákazníkov.
- **Pozornosť** (`data/pozornost.py`) na tých istých stránkach pred a po.
- **Po spustení:** Core Web Vitals z Chrome (Search Console) a meranie bez cookies.

## 4. Nástroje, knižnice, AI a služby

### 4.1 Čo urobím ja (Claude Code)

- **Kód:** tokeny a stráž v kontrole kódu, opravy hrán, dotykové stavy, pohyb v CSS, plynulý filter
  tabuľky, živé kóty, náhľady obrázkov, varianty na pracovnej stránke `/navrhy/` (osvedčené 22. 10.).
- **Kontrola:** snímky pri 6 šírkach a porovnanie pixelov pred a po (Playwright), Lighthouse na všetkých
  147 stránkach, prístupnosť (axe), meranie pozornosti (`data/pozornost.py`), `data/kontrola_webu.py`.
- **Obraz:** skript pre Blender, ktorý postaví potrubie z rozmerov v `web/src/data` (plášť, rúry, ich
  počet a poloha) a vyrenderuje ho v jednom štúdiu; dávkové spracovanie fotiek (zväčšenie, výrez, farebné
  ladenie, zrno, AVIF) nadväzuje na `data/vylepsi_obrazky.py`; náhľady dokumentov z PDF (PyMuPDF).
- **Artefakty Claude** (návrh na plátne, krátke video z renderov) vedia ukázať koncept, ale web so značkou
  Watts ako artefakt nezverejňujeme (pravidlo z 23. 9.). Varianty preto robím priamo v repozitári.

### 4.2 Webové technológie a knižnice (stav 26. 10. 2026)

Nič nové pridávať netreba. To, čo chceme, vie dnes samotné CSS v prehliadačoch.

| Technika | Na čo u nás | Podpora | Odporúčanie |
|---|---|---|---|
| Pohyb viazaný na rolovanie v CSS (`animation-timeline: view()`) | pootočenie kotúča, posun obrazov, otvorenie fotky projektu | Chrome 115, Safari 26, Firefox 159 (vychádza 27. 10. 2026) | **áno:** presunúť z Motion `scroll()` do CSS. Beží mimo hlavného vlákna, bez podpory obraz len stojí. |
| Krivka `linear()` (pružný dojazd v CSS) | tlačidlá, panely, štítky kót | všetky prehliadače | **áno:** 1 až 2 pružné krivky do tokenov (generátor Easing Wizard alebo Linear Easing Generator) |
| `text-box: trim-both cap alphabetic` | text presne v strede tlačidiel, čipov a štítkov | Chrome 133, Safari 18.2, Firefox 154 | **áno:** drobnosť, ktorú oko vníma ako presnosť |
| View Transitions a ich typy | prechod vpred a späť, prelet renderov | všetky prehliadače (v rámci stránky) | máme; doplniť smer vpred a späť |
| `@starting-style` | plynulé otvorenie menu a výsledkov hľadania | všetky prehliadače | áno, kde dnes prvok len „blikne“ |
| `sibling-index()` | odstupňovaný nástup kót a položiek bez premennej v HTML | všetky prehliadače od 8/2026 | voliteľne |
| `corner-shape` (mäkké „squircle“ rohy) | karty, štítky | len Chrome | nie, rohy by sa líšili podľa prehliadača |
| `hyphens: auto` po slovensky | dlhé slová v úzkych stĺpcoch | Chrome a Firefox; Safari nemá slovenský slovník | nie, na iPhone by nefungovalo |

| Knižnica | Stav | Odporúčanie |
|---|---|---|
| **Motion** (máme 13.4.0, aktuálna 14.6) | od 13.5 beží `scroll()` s `offset` na hlavnom vlákne; 14.1 pridal plynulé presuny rozloženia (`animateLayout`) v čistom JS | ostať; pri aktualizácii presunúť rolovanie do CSS, `animateLayout` použiť na filter tabuľky variantov |
| **GSAP** 3.15 | od verzie 3.13 úplne zadarmo aj komerčne vrátane ScrollTrigger a SplitText; asi 46 kB (gzip) s ScrollTrigger | netreba; len keby podpisový pohyb potreboval zložitú choreografiu |
| **Lenis** (plynulé rolovanie) | 5 kB, Thoughtworks Radar ho drží v „Assess“ pre prístupnosť, v Safari strop 60 snímok/s | **nie:** mení pocit rolovania, ktorý ľudia poznajú z každého iného webu |
| **Astro** (máme 7.3.3, aktuálne 7.4.2) | vstavané Fonts API so záložným písmom s dopočítanými rozmermi; zástupné náhľady obrázkov vstavané nie sú (komunitný `astro-lqip`) | aktualizovať pri najbližšej údržbe; náhľady dorobiť vlastnou úpravou `Obraz.astro` (farba alebo rozmazaný náhľad pár sto bajtov) |

| Kontrola kvality | Na čo | Cena |
|---|---|---|
| Playwright `toHaveScreenshot` | porovnanie snímok pred a po pri zjednocovaní tokenov | zadarmo |
| Unlighthouse | Lighthouse na všetkých stránkach naraz | zadarmo |
| axe-core cez Playwright | prístupnosť | zadarmo |
| Argos | prehľad rozdielov snímok (voliteľné) | zadarmo do 5 000 snímok mesačne |
| Polypane | prehliadač s viacerými šírkami naraz, pre Jurajovu kontrolu | asi 9 až 12 USD mesačne |
| VisBug, Lost Pixel | nepoužiť: VisBug sa už nevyvíja, Lost Pixel končí | |

### 4.3 AI a externé služby na obraz

**Zásada:** AI len na úpravu skutočných podkladov (ostrosť, výrez, svetlo, čistenie, štúdiové pozadie).
Nikdy nevytvárať stavby, montáže, počet rúr, farby rúr ani nápisy. Modely na úpravu obrázkov prekresľujú
celý záber, preto pôvodné pixely výrobku idú vždy späť navrch.

| Úloha | Nástroj | Cena (26. 10. 2026) | Licencia | Odporúčanie |
|---|---|---|---|---|
| Zdrojové podklady | **Watts:** 3D a CAD modely, súbory scén renderov, originálne fotky, video, prípadové štúdie | 0 € | od výrobcu | **najprv toto** (otázka č. 18 pre manažéra) |
| 3D model potrubia | **Blender 5.2 LTS** + Cycles (OptiX na RTX 5070 Laptop, 8 GB, ovládač 592 stačí), svetlo štúdia z Poly Haven (CC0) | 0 € | výstupy sú naše | **áno:** skúška 1 deň, celé 3 až 6 dní (odhad) |
| Zväčšenie výrobkov a textu | najlepšie nový render z 3D; inak Magnific Precision alebo Topaz Gigapixel v režime High Fidelity či Text & Shapes | Magnific od 16 €/mes.; Gigapixel 149 USD/rok, pri obrate firmy nad 1 mil. USD Pro 499 USD/rok | komerčne áno | len presné režimy, najviac 2×; nikdy tvorivé (Redefine, Wonder, Creative), prekresľujú nápisy |
| Zväčšenie fotiek zo stavieb | Topaz Recover, Magnific Precision; Real-ESRGAN máme zadarmo | ako vyššie | komerčne áno | áno, ale fotky ukazovať v poctivej veľkosti (galéria, nie hero cez celú šírku) |
| Svetlo a farba | Photoshop Harmonize | 5 kreditov Adobe | áno | na zladenie vyrezaných dielov; výsledok je o kúsok mäkší |
| Rozšírenie fotky do šírky | Photoshop Generative Expand | 1 kredit | áno | **nie na fotky stavieb:** pridaný obsah by sme podľa AI Act museli označiť (nižšie) |
| Úpravy cez modely | Gemini (Nano Banana 2.1), OpenAI gpt-image-2, FLUX Kontext | 0,03 až 0,24 USD za obrázok | komerčne áno (cez API) | len štúdiové pozadie, tieň, čistenie prachu |
| 3D z fotky | Meshy, Rodin, Tripo; Hunyuan3D, TRELLIS.2 | 19 až 30 € mesačne | Hunyuan3D v EÚ licenciou vylúčený | **nie:** zvlnenie plášťa a počet rúr vychádzajú nepresne |
| Jemný 3D posun fotky (2,5D) | hĺbková mapa Depth Anything 3 Mono-Large + vlastný malý shader | 0 € | Apache-2.0 (Apple Depth Pro len na výskum) | voliteľne na 1 až 2 fotkách projektov, len malý posun (okraje rúr sa inak trhajú) |
| 3D na webe (konfigurátor) | three.js asi 194 kB, model-viewer asi 289 kB (gzip); Spline nie (runtime asi 468 kB) | 0 € | áno | len na klik za statickým obrázkom, nikdy v hlave stránky |
| AI video | Runway, Kling, Gemini Omni | asi 0,10 až 0,30 USD za sekundu | komerčne áno | **nie** pre výrobok a stavby: tuhé diely sa deformujú, mení sa počet rúr aj nápisy |
| Fotenie a dron | fotograf a pilot s licenciou na skutočnej stavbe | odhad 500 až 1 500 € za deň (slovenské cenníky som nenašiel, poľské ako odhad) | naše | **áno**, jeden deň na stavbe |

**Rozložený rez ako sekvencia:** 60 až 90 snímok do šírky 1 280 px vychádza asi na 2 až 3 MB (odhad).
Načítať až po LCP, bez skriptu a pri „obmedziť pohyb“ alebo pomalom pripojení len statický obraz.

**AI Act, čl. 50:** od 2. 8. 2026 musí firma, ktorá zverejní realistický obraz alebo video vytvorené či
zmenené AI tak, že pôsobí ako skutočné (deep fake), viditeľne označiť, že ide o AI. Podľa usmernenia
Komisie z júla 2026 bežné úpravy (orez, farba, doostrenie, odšumenie, odstránenie pozadia) pod povinnosť
nespadajú, pridanie alebo odstránenie objektov a skladanie záberov áno. Zväčšenie AI usmernenie výslovne
nerieši. Keďže web nemá popisky pod fotkami (rozhodnutie z 21. 9.), najjednoduchšie je robiť len bežné
úpravy a originály si nechať. Nie je to právna rada.

### 4.4 Čo robia najlepší (benchmark 26. 10. 2026)

Stránky otvorené 26. 10. v prehliadači pri 1440 px. Nadväzuje na `docs/AUDIT-PREMIUM.md` kap. 2 (Brugg,
Logstor, Apple, Porsche a ďalšie sa neopakujú).

| Web | Technika | Čo si vziať pre Microflex |
|---|---|---|
| [Rivian R2](https://rivian.com/r2) | výber výbavy prepíše čísla pod autom krátkym pretočením číslic | **živé kóty:** výber dimenzie prepíše kóty na reze (plášť, polomer ohybu, kg/m, dĺžka kotúča) |
| [Polestar 5](https://www.polestar.com/global/polestar-5/) | tri čísla tesne pri aute, nie v páse; štúdio s mäkkým tieňom pod autom | potvrdzuje kóty pri výrobku; tieň dopadu pod renderom |
| [Rimowa Original](https://www.rimowa.com/sk/en/original/), [Kvadrat](https://www.kvadrat.dk/en) | makro podpisového detailu s malou hĺbkou ostrosti; vzorky na tom istom materiáli pod bočným svetlom | makro potlače plášťa (názov, dimenzia, norma, metráž) ako „odznak“ Microflexu; fotiť na piesku z výkopu, nie na prázdnom pozadí |
| [SPAN Panel](https://www.span.io/panel) | výrobok osvetlený zozadu na tmavom pozadí, potom detail cez celú šírku | jedno makro rezu so svetlom zozadu tam, kde je pozadie webu už tmavé (podzemie) |
| [Dyson V16](https://www.dyson.co.uk/vacuum-cleaners/cordless/v16-piston-animal/black-copper) | svetlo samo dokazuje tvrdenie (zelený lúč ukáže prach) | **skutočná snímka termokamerou:** studený plášť, vnútri 70 °C, s uvedeným prístrojom a podmienkami |
| [Framework Laptop 13](https://frame.work/laptop13) | fotky zhora na pracovnom stole, skutočné ruky a náradie počas výmeny | spojky rozložené v poradí montáže (rúra, objímka, spojka, náradie) pre inštalatérov |
| [Leica M EV1](https://leica-camera.com/en-int/photography/cameras/m/m-ev1-black) | pri každej fotke autor, téma pravosti obrázkov (C2PA) | pri referencii v texte (nie pod fotkou) montážna firma, miesto, rok, dimenzia a metre; originály uchovať |
| [Anduril](https://www.anduril.com/) | výrobok vždy tam, kde naozaj pracuje, v prirodzenom svetle | každá hĺbka „zostupu pod zem“ má skutočné prostredie: záhrada, otvorený výkop, kotolňa |
| [Aevion (Riotters)](https://drone.riotters.com/), Awwwards 10/2026 | jeden 3D predmet putuje cez sekcie | potvrdzuje prechody renderov cez hrany; s vlastným 3D modelom môže kotúč meniť stav v každej sekcii |
| [Hadrian](https://www.hadrian.co/), [CRYOX](https://cryox.be/en) | tmavomodrá a žltá nad skutočným videom z výroby; jeden akcent len na akcie | najbližší vzor našej palety; funguje, lebo žltej je málo. Video z výroby (vytláčanie, penenie, navíjanie) pýtať od Watts |

**Konkurencia 26. 10.:** watts.eu má mriežku renderov na bielych kartách bez fotiek zo stavieb; Uponor
(teraz „+GF+ uponor“) skrýva videá za súhlasom s cookies; REHAU a Thermaflex majú rad ikon s výhodami;
isoplus ukazuje v texte stránky „0 výrobných závodov“, kým nedobehne počítadlo; NRG flex má v pätičke
© 2017. **Nikto neukazuje rozmery naviazané na zvolený variant, skutočný dôkaz izolácie ani podpísané
fotky z montáží.** Tento priestor je voľný.

**Znaky lacného alebo generovaného webu a náš stav:**

| Znak | Náš web 26. 10. |
|---|---|
| predvolené písma a farby (Inter, fialové prechody) | v poriadku: Archivo, Plex, farby výrobku |
| rady kariet s ikonou, všade rovnaké zaoblenie a slabý tieň | **dve miesta** (kap. 2.5): Čo budete potrebovať, Výber krok 1 |
| počítadlá čísel a pásy štatistík | v poriadku, pás čísel je od 23. 9. preč |
| AI obrázky ľudí a výrobkov | v poriadku; zväčšené fotky ukazovať v poctivej veľkosti |
| pohyb, ktorý zadržiava obsah (preberanie rolovania, úvodné animácie) | v poriadku; kotúč a rúra sledujú rolovanie, neberú ho |
| obsah za súhlasom s cookies | v poriadku |
| reklamný jazyk („nielen…, ale aj“, „jedinečný“, „špičkový“) | v poriadku, v textoch webu sa nenašiel |
| efekty bez údajov (svetlo za kurzorom, zrno, „výkresové“ vlasové čiary) | v poriadku; kružnice v hero sú prierez, nie ozdoba |

### 4.5 Overenie dojmu

- **V predajni s inštalatérmi** (kap. 3, fáza D): zadarmo a od skutočných zákazníkov. Odporúčam ako hlavný
  spôsob.
- **UXtweak** (firma z Bratislavy): bezplatný plán má 15 odpovedí mesačne, päťsekundový a preferenčný test
  v ňom však len 3 odpovede na štúdiu; platený plán s panelom respondentov z 8 krajín (cenu stránka
  26. 10. neukázala).
- **Lyssna:** bezplatný plán 15 odpovedí mesačne, Pro 175 USD mesačne, respondenti z panelu sa platia
  zvlášť (podľa tretích strán asi 1 USD za minútu testu na človeka).
- **Microsoft Clarity** (mapy klikov, záznamy návštev): od 31. 10. 2025 vyžaduje v EÚ súhlas návštevníka,
  teda lištu súhlasu. Nejde dokopy s rozhodnutím „meranie bez cookies a bez lišty“, preto nie.

## 5. Čo neodporúčam

| Čo | Prečo nie |
|---|---|
| Plynulé rolovanie (Lenis a podobné) | mení rolovanie, ktoré ľudia poznajú z každého iného webu; prístupnosť; v Safari strop 60 snímok/s |
| AI obrázky a videá stavieb, montáží alebo ľudí | inžinier si všimne zlý počet rúr či nápis, dôvera B2B je preč; AI Act vyžaduje označenie |
| 3D z fotky (Meshy, Rodin, Tripo) pre výrobok | zvlnenie plášťa a počet rúr nepresné, rozmery nesedia |
| Úvodná animácia, vlastný kurzor, magnetické tlačidlá, zvuk | zdržujú a čítajú sa ako efekt, nie ako remeslo |
| Video, WebGL alebo 3D v hlave stránky | zhorší LCP a na mobile minie dáta; 3D len na klik za statickým obrázkom |
| Vynáranie každej sekcie pri rolovaní | brief (kap. 8) ho zakazuje a je to najčastejší znak generovaného webu |
| Efektové knižnice (Aceternity, Magic UI), Spline | brief (kap. 12); Spline má runtime asi 468 kB |
| `corner-shape`, slovenské delenie slov | fungujú len v časti prehliadačov, web by vyzeral v každom inak |

## 6. Rozhodnutia pre Juraja

**Rozhodnuté 26. 10. večer** (Juraj: „Urob čo najviac práce teraz, ja nemám možnosť urobiť tie fotky 3D…
V Blenderi nemám problém urobiť to, ak tam máš možnosť pomôcť alebo to urobiť. Chcel by som to živé
a čo najlepšie.“): fáza A áno, hneď; fotenie nie (nemá kto), namiesto neho 3D model v Blenderi robím ja;
podpisový pohyb = živé kóty, v čo najlepšej podobe. Body nižšie ostávajú ako pôvodné otázky.

1. **Fáza A pred spustením:** áno alebo nie. Odporúčam áno: A1 až A3 nemenia rozloženie ani obsah, A4 až
   po výbere variantov.
2. **Obraz:** otázka č. 18 pre manažéra (zdrojové podklady od Watts) je v dokumente od 26. 10. Ďalej:
   skúška 3D modelu v Blenderi (1 deň) áno alebo nie; fotenie vlastnými silami v predajni, alebo fotograf
   s dronom na skutočnej stavbe (odhad 500 až 1 500 €).
3. **Podpisový pohyb po spustení:** rozložený rez, živé kóty podľa dimenzie, alebo rozvinutie kotúča.
4. **Test v predajni:** kedy a s kým (10 až 15 inštalatérov a projektantov), raz pred fázou A a raz po
   fáze B.

## 7. Stav (27. 10. 2026)

| Krok | Stav | Kde |
|---|---|---|
| C2 Živé kóty | **hotové**: výber priemeru (a plášťa) prepíše kóty pretočením číslic, bod pulzne, po plášti prejde svetlo; obj. číslo s kopírovaním, filter tabuľky oboma smermi, variant v adrese `?obj=`; 11 radov SK aj CS (COOL DUO nemá kóty) | `components/VolbaDimenzie.astro`, commit 4c5a04b |
| A2 Chyby na hranách | **hotové** 1 až 5 (dozvenie renderu v štúdiu; mobil rodina bez rezu a škáry; kotúč v článku; pás pod spojkami využije text rodiny; čipy filtra sa na mobile lámu celé, overené 27. 10.) | `Hlava.astro`, `Domov.astro`, `TabulkaVariantov.astro` |
| A3 Dotyk a tlač | **hotové**: 27 efektov len pre myš, tlač tabuľky na A4 | commit 4c5a04b |
| A1 Tokeny | **hotové**: zaoblenie 4 stupne, hĺbka 4 úrovne, písmo bez polovičných veľkostí, stráž v `data/kontrola_webu.py` (dnes 0 odchýlok); porovnanie snímok 13 stránok bez rozbitia | commit 2efef1a, `DESIGN.md` kap. 5 a 6 |
| A4 Zvyšky šablóny | **hotové**: bez žltých čiarok na domove, diely na podlahe v „Čo budete potrebovať“, podklady ako biele listy (výkres s pečiatkou), Výber krok 1 s rendermi cez okraj karty, riadok spojok s výrezmi dielov | commit 766fcaa a ďalšie |
| Živý výrobok v štúdiu | **hotové**: pohyb za myšou a pás svetla v hlavách radov, systémov a Potrubí | `Hlava.astro` |
| Pohyb a správanie | **hotové**: plynulý filter tabuľky (FLIP), kotúč v CSS na časovej osi sekcie, rozmazané náhľady fotiek | `TabulkaVariantov.astro`, `Obraz.astro`, `data/nahlady_fotiek.py` |
| Hľadanie s obrázkami | **hotové**: render radu alebo výrez dielu pri každom výsledku (našepkávač aj stránka) | commit 7c6fc37 |
| B2 3D model | **na webe**: 12 radov (karty, katalóg, menu, Výber, hľadanie, náhľady na zdieľanie), 12 hláv radov a 5 systémov (čelný záber), hero DUO, rodina šiestich systémov (domov, Potrubia, článok), makrá v lupách, presný render všetkých 91 dimenzií pri živých kótach, rozložený rez všetkých 12 radov (domov a stránky radov). Biela PE-Xa (sanita, QUADRO) prerenderovaná 27. 10.: bola prepálená do čistej bielej a v reze splývala s pozadím | `data/blender`, `data/rendery_web.py`, `data/rozklad_web.py`, `DESIGN.md` kap. 7 |
| Rozložený rez na telefóne a tablete | **zmenené**: na obraze len bod práve odkrytej vrstvy vo farbe jej lupy, bez štítka (štítok peny ležal na plášti a štítok rúry na texte); názov a číslo sú v texte pod obrazom. Ak Juraj chce štítky, dajú sa dať pod obraz | `Rozklad.astro`, commit d8a4b71 |
| Model a skutočnosť, 2. kolo (pripomienky Juraja 27. 10.) | **na webe**: celá sada nanovo (hlavy, telá radov, hero, rodina, makrá, 91 dimenzií, rozložené rezy 12 radov); pena dvojvrstvová a bublinkatá (takmer čierne jadro okolo rúr, svetlejšie navinuté vrstvy), farby plášťa, peny a rúr zmerané na fotkách brožúry 2026 a zo stavby a rovnaké vo všetkých záberoch, produkty o štvrť clony tmavšie (hero o 0,7, bolo najsvetlejšie), žltý rez rúry, plochý kábel COOL, čierne chráničky HP; najvyššia kvalita: render v dvojnásobnej šírke webu (6,7 h) | `data/blender`, commit 43beebd, stránka Model a skutočnosť v galérii (`/realita`) |
| Novinky z 3D modelu (Juraj 28. 10.: „všetko sa mi páči, chcem to implementovať“) | **na webe** SK aj CS: 1 ohyb na najmenší polomer pri rolovaní, len na domove (DUO 160 s R 0,60 m; zo stránok radov zrušený 28. 10., lebo sekvencia ukazuje jednu dimenziu, nie celý rad; rendery 12 radov ostávajú pre reklamu), 2 prepínač Pohľad a Teplota v hlave 11 radov (termokamera, aj pri zmene dimenzie; strata na meter len z grafov katalógu s. 38 pre UNO, DUO a PRIMO; COOL s káblom bez tepla, výkon kábla nepoznáme), 3 kotúč 100 m sa pri rolovaní odvaľuje v pokládke na domove (kóta priemeru, potom zvyšných metrov) a záber kotúča v hlave článku Pokládka, 4 rodina na ťuknutie (domov, Potrubia), 5 všetky dimenzie radu v mierke nad tabuľkou variantov, 6 reklamné podklady a videá v `reklama/` (mimo gitu, popis v `reklama/README.md`). Pracovná stránka `/navrhy/` zrušená; živé okno Blendera ostáva (`data/blender/zive.py`) | `components/Ohyb.astro`, `TeploRezim.astro`, `TeploVrstva.astro`, `KotucSekvencia.astro`, `RodinaVyber.astro`, `Mierka.astro`, `data/novinky_web.py`, `data/reklama.py`, `data/blender/ohyb.py`, `teplo.py`, `video.py` |
| Plynulé sekvencie a centrovanie (Juraj 28. 10.: „pôsobia sekavo“, obsah nižšie, ako má byť) | **opravené**: rozložený rez, ohyb a kotúč majú spoločný prehrávač. Obraz dobieha rolovanie (časová konštanta 0,09 s), susedné snímky sa prelínajú a po zastavení stojí ostrý na celej snímke; snímky sú vopred dekódované (ImageBitmap, najviac okolo 240 MB na sekvenciu, ďaleko od okna sa uvoľnia). Pri koliesku myši 189 prekreslení namiesto 19, skok o 0,4 snímky namiesto 7. Obsah stojí v strede okna pod hlavičkou a vždy sa zmestí: rozložený rez na nízkom okne ukáže popis len pri aktívnej vrstve (stĺpec sa nehýbe), potom aj bez úvodného odseku; obraz ohybu už nie je roztiahnutý do šírky; na nízkom telefóne sa zmenší obraz. Hotový stav drží dlhšie, kým sekcia odíde | `lib/sekvencia.ts`, `Rozklad.astro`, `Ohyb.astro`, `KotucSekvencia.astro` |
| Posúdenie domova (ChatGPT, rozhodnutia Juraja 28. 10.) | **opravené**: kóty v úvode podľa zobrazeného DUO (Ø 160 mm, 2 × 32 mm 6 bar, polomer 0,60 m), pod akciami „Predaj a sklad Microflex na Slovensku: Inštalatérshop, Raková“; štítok kotúča sa neoreže; „až 60 t“ podľa katalógu s. 37 (smernica ATV-DVWK-A127), podmienka časov pri tvrdení o 40 minútach; rodina: nadpis bez počtu, klik na potrubie otvorí rad, karta je odkaz a počká na myš (aj cez iné potrubie), na telefóne prvé ťuknutie ukáže kartu a druhé otvorí rad; projekty: Považská Bystrica veľká so značkou „Naša dodávka“, Orange menší ako „Referencia výrobcu“, fotka a text spolu aj na telefóne; konfigurátor len tichá veta; päta s predajňou v Rakovej a sídlom firmy zvlášť, na telefóne kontakt hneď za značkou; opravené popisy obrázkov (úvod DUO, rodina). Úlohy pred spustením: `docs/PRED-SPUSTENIM.md` | `Domov.astro`, `RodinaVyber.astro`, `KotucSekvencia.astro`, `Paticka.astro`, `i18n/ui.ts` |
| Domov, kolo 3 (Juraj 28. 10.: „urob ho, súhlasím“) | **hotové**: na telefóne systémy ako zalomené voľby a jediný posuvný pás radov s bodkami polohy; spojky a príslušenstvo ako dva vstupy namiesto siedmich riadkov; ohyb a kotúč ako jedna kapitola o pokládke (kratšie dráhy 225 vh a 200 vh, kratšie kroky, odkaz na článok o pokládke); kratší odsek o certifikátoch s odkazom na vyhlásenia | `Katalog.astro`, `Domov.astro`, `Ohyb.astro`, `KotucSekvencia.astro`, `i18n/ui.ts` |
| Plynulosť animácií (Juraj 28. 10.) | **opravené**: hlavička sa pri rolovaní zmenší bez posunu obsahu (predtým skok o 14 px na každej stránke); štítky v rozloženom reze, ohybe a kotúči idú cez transform (plynulo aj o zlomky pixela, bez rozloženia stránky pri každom snímku) a bez rozmazania pozadia pod nimi; lesk v úvode cez transform; obraz rodiny má pri myši vlastnú vrstvu. Meranie: rolovanie 1 400 px/s bez snímky nad 20 ms (domov, rad, telefón), body kót presne na mieste (odchýlka 0 px) | `Hlavicka.astro`, `Rozklad.astro`, `Ohyb.astro`, `KotucSekvencia.astro`, `Domov.astro`, `RodinaVyber.astro` |
| Hlava radu s 3D renderom | **hotové**: výber dimenzie vľavo, render vpravo, na 1 440 × 900 výber aj celý rez s kótami naraz; kóty v prázdnom mieste, nie na plášti (aj mobil a hero) | `Hlava.astro`, `lib/koty.ts` |
| Hlavička | **opravené**: rozmazanie pod hlavičkou a navigáciou častí v Chrome a Firefoxe chýbalo (minifikátor nechal len `-webkit-`), stráž v `kontrola_webu.py` | `Hlavicka.astro`, `CastiStranky.astro` |
| B4 Skutočné náhľady dokumentov | **čaká na Watts**: automatické sťahovanie z watts.eu je zablokované, preto otázka č. 18 pre manažéra | |
| Meranie | Lighthouse mobil 27. 10. s rendermi 3D modelu: domov 92 (336 kB), rad DUO 93 až 94 (261 kB), CLS 0; pozornosť: `docs/POZORNOST.md` | |

## 8. Vlastný 3D model ako základ dizajnu (26. 10. 2026)

Juraj: „Urob naozaj ako reálne, čo najväčšia kvalita. Keď urobíme prvý model dobre, dáme ďalšie
a použijeme to ako dizajn pre stránku, dá nám to naozaj neobmedzené možnosti.“

**Postup:** najprv jeden model (Microflex DUO, MD16032C) na úroveň produktovej fotky, až potom ďalšie rady.
Ladí sa podľa **skutočných fotiek**, nie podľa renderov Watts: tie sú samy počítačová grafika. Vzory:
`podklady/watts/fotky-katalog/katalog-s06-x53.jpeg` (štúdiová fotka celej rodiny s rezmi: farba plášťa,
pena, rúry, svetlo), `katalog-s05-x46.jpeg` (makro plášťa: priesvitný HDPE, dvojitá stena, stopy po
vytláčaní), `web/src/assets/fotky/prierez-duo.jpg` (rez DUO zo stavby: hrubé steny rúr, potlač, otrep).
Skript `data/blender/potrubie.py` stavia model z `web/src/data/varianty.json`, ku každému renderu ukladá
polohy kľúčových bodov (stred rezu, okraj plášťa, rúry) pre automatické kóty. Postup s obrázkami:
`data/_3d/ukazka/postup.html` (len lokálne, obsahuje rendery Watts).

| # | Čo z modelu | Kde na webe | Prínos |
|---|---|---|---|
| 1 | Štúdiové zábery všetkých radov s celým telom v rovnakom svetle | hlavy 12 radov a 5 systémov, katalóg na domove, karty | jeden obrazový jazyk namiesto renderov s orezaným telom |
| 2 | Presný render ku každej dimenzii (91 variantov potrubia) | živé kóty: výber priemeru prepne obraz na presný prierez, kóty sa posunú samy | v odbore nikto; zákazník vidí svoju rúru |
| 3 | Rozložený rez (sekvencia snímok) | stránka radu „Z čoho je potrubie“ alebo domov | podpisový pohyb webu |
| 4 | Makrá plášťa, peny a rúry | lupy na domove a pri stavbe radu | skutočný detail namiesto dočasných výrezov |
| 5 | Kotúč z rozmerov katalógu (priemer, šírka) | pokládka, tabuľka variantov | rozmery kotúča ako kóty na obraze |
| 6 | Všetky rady v skutočnej mierke vedľa seba | Potrubia, porovnanie radov | rozdiel 75 a 200 mm vidno na prvý pohľad |
| 7 | Technická ilustrácia výkopu (lôžko, zásyp, páska podľa katalógu s. 37) | Poradňa, pokládka | návod v štýle výkresu, nie falošná fotka |
| 8 | Obrázky pre zdieľanie a Google Obrázky ku každému obj. číslu | OG náhľady, štruktúrované dáta | presný obraz pri vyhľadávaní obj. čísla |
| 9 | Model na otáčanie v prehliadači (neskôr, three.js) | konfigurátor trasy | interakcia, načítanie len na klik |

Výpočet: náhľad pod 1 s, štúdiový render 1 600 px asi 9 s na grafickej karte notebooku (RTX 5070 Laptop),
finálna kvalita viac. Rad 91 renderov teda trvá desiatky minút, nie dni.

## Zdroje

Overené 26. 10. 2026.

- Podpora v prehliadačoch: [webstatus.dev](https://webstatus.dev/),
  [Firefox 159](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/159) (pohyb viazaný na
  rolovanie od 27. 10. 2026), [CSS `linear()`](https://developer.chrome.com/docs/css-ui/css-linear-easing-function),
  [Linear Easing Generator](https://linear-easing-generator.netlify.app/), [Easing Wizard](https://easingwizard.com/).
- Knižnice: [Motion, zoznam zmien](https://github.com/motiondivision/motion/blob/main/CHANGELOG.md) (13.4.4
  a 13.5.0: rolovanie na hlavnom vlákne), [GSAP 3.13](https://gsap.com/blog/3-13/),
  [Lenis](https://github.com/darkroomengineering/lenis),
  [Thoughtworks Radar: Lenis](https://www.thoughtworks.com/radar/languages-and-frameworks/lenis),
  [Astro Fonts](https://docs.astro.build/en/guides/fonts/), [astro-lqip](https://www.npmjs.com/package/astro-lqip).
- Kontrola kvality: [Playwright, snímky](https://playwright.dev/docs/test-snapshots),
  [Argos](https://argos-ci.com/pricing), [Unlighthouse](https://unlighthouse.dev/),
  [Polypane](https://polypane.app/pricing/), [axe-core](https://github.com/dequelabs/axe-core).
- Obraz a 3D: [Blender 5.2](https://www.blender.org/releases/5-2/),
  [Cycles na GPU](https://docs.blender.org/manual/en/latest/render/cycles/gpu_rendering.html),
  [Poly Haven, licencia](https://polyhaven.com/license), [Topaz](https://www.topazlabs.com/pricing),
  [Magnific](https://www.magnific.com/pricing),
  [Photoshop Generative Upscale](https://helpx.adobe.com/photoshop/using/enhance-image-quality-with-generative-upscale.html),
  [Gemini API, ceny](https://ai.google.dev/gemini-api/docs/pricing),
  [Hunyuan3D, licencia](https://huggingface.co/tencent/Hunyuan3D-2/blob/main/LICENSE),
  [Depth Anything 3](https://github.com/ByteDance-Seed/Depth-Anything-3),
  [Apple Depth Pro, licencia](https://huggingface.co/apple/DepthPro/blob/main/LICENSE),
  [Spline](https://spline.design/pricing), [Runway](https://runway.com/pricing).
- AI Act: [čl. 50](https://artificialintelligenceact.eu/article/50/),
  [Orrick: povinnosti transparentnosti](https://www.orrick.com/en/Insights/2026/08/EU-AI-Act-Transparency-Obligations-for-AI-Generated-Content-Article-50).
- Overenie: [UXtweak](https://www.uxtweak.com/pricing), [Lyssna](https://lyssna.com/pricing),
  [Microsoft Clarity, súhlas](https://learn.microsoft.com/en-us/clarity/consent-mode).
