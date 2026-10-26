# Plán zlepšení webu (23. 9. 2026)

Poradie podľa prínosu pre cieľ webu: prvé miesto vo vyhľadávaní a nákup na instalatershop.sk.
Po každom kroku commit (bez pushu), kontrola skriptom na `web/dist` a v prehliadači pri 1440 a 390 px.

## Krok 1: Google a zdieľanie

Stav: 148 stránok bez náhľadového obrázka, 27 titulkov nad 60 znakov, 80 popisov mimo 120 až 160 znakov.

1. **Náhľadové obrázky (Open Graph) 1200 × 630** pre každú stránku, generované pri builde
   (satori + @resvg/resvg-js, písma Archivo a IBM Plex zo Fontsource, nové závislosti len na build).
   Modrý podklad s diagonálou, render radu alebo fotka dielu, logo MICROFLEX, názov stránky
   a jeden riadok faktov (tlak, rúra, plášť) v jazyku stránky. Stránky bez vlastného obrazu dostanú
   rodinu potrubí.
2. **Titulky do 60 znakov:** pri dlhom názve skratka „| Microflex“ alebo bez prípony.
3. **Popisy 120 až 160 znakov:** skladá ich funkcia z krátkeho popisu a faktov (tlak, rúry, plášť,
   počet dimenzií alebo obj. čísel) a vety o nákupe na instalatershop.sk.
4. **Štruktúrované dáta:** obrázok ako zmenšená webp verzia, nie pôvodné PNG do 1,8 MB.

Hotovo, keď skript nájde 0 titulkov nad 60 znakov, 0 popisov mimo rozsahu a náhľad na všetkých stránkach.

**Hotové 23. 9.:** 146 náhľadov (JPEG, 50 až 90 kB), každá zo 147 stránok má `og:image`, popisy
všetkých stránok majú 120 až 160 znakov (`lib/seo.ts`), jeden titulok má 62 znakov (skrátením by vznikol
rovnaký titulok ako pri spojke pre sanitu). Kresby sa ukladajú do `node_modules/.cache/og`: prvý build
trvá ~3 min, ďalšie ~9 s. Pri čistom builde na serveri počítať s ~3 min.

## Krok 2: Príslušenstvo ku každému obj. číslu

Katalóg (s. 8 až 16 a 18) uvádza pri každej rúre zmršťovaciu krytku MK, pevný bod MFP so závitom,
protiprachovú krytku MS a gumovú krytku EPDM MG. Príklad: M9032C → MK2100, MFP44 (1″ M), MS9032, MG901840.

1. **Dáta:** `data/normalize.py` načíta tieto bloky a priradí ich k obj. číslu potrubia. COOL DUO
   (s. 17) vynechať: bloky príslušenstva tam patria k DUO vykurovaniu (chyba katalógu).
2. **Tabuľka variantov:** pri každom riadku rozbaľovacie „Príslušenstvo“ s obj. číslami, kopírovaním,
   odkazom na stránku dielu a do e-shopu. Na mobile v karte variantu.
3. **Stránky krytiek a pevného bodu:** gumové krytky EPDM (dnes bez obj. čísel) dostanú tabuľku
   z katalógu, všetky krytky a pevný bod stĺpec „Pre potrubie“.
4. **Hľadanie:** obj. číslo krytky nájde aj potrubia, ku ktorým patrí.

Hotovo, keď má príslušenstvo každý variant, ktorý katalóg uvádza, a náhodná kontrola 5 riadkov sedí s katalógom.

**Hotové 23. 9.:** `data/prislusenstvo.py` číta bloky katalógu; príslušenstvo má 62 z 91 variantov
potrubia (zvyšok katalóg v tabuľkách príslušenstva neuvádza: časť sanitárneho DUO, COOL s káblom, HP,
COOL DUO, QUADRO 200 mm). Sanitárne DUO má na watts.eu príponu SWI, v katalógu S (`kod_katalogu`).
Gumové krytky EPDM majú tabuľky 7, 3 a 1 obj. čísla, krytky a pevný bod stĺpec „Pre potrubie“.
Hľadanie kódu krytky nájde aj potrubia (MK2100 → 8 variantov). Opravená aj staršia chyba: klik do
riadku tabuľky variantov prepínal filter izolácie.

## Krok 3: Zoznam materiálu na trasu

Nový krok sprievodcu výberom: rad a dimenzia, dĺžka trasy, počet koncov, odbočiek, priamych spojov
pod zemou a prestupov stenou → tabuľka položiek s obj. číslami a množstvom, kopírovanie, tlač
a odoslanie ako dopyt (predvyplnený formulár Pre firmy).

**Pravidlá výpočtu, ktoré musí pred stavbou potvrdiť Juraj:**

| Položka | Návrh pravidla | Zdroj |
|---|---|---|
| Potrubie | dĺžka trasy + rezerva na napojenie; celé rolky 100 m alebo metráž | katalóg s. 5 (rolky), rezerva ❔ |
| Koniec trasy | na každú rúru prechodová spojka PE-X s vonkajším závitom | ❔ |
| Koniec trasy | koncová krytka: zmršťovacia MK alebo gumová EPDM MG, ktorá z nich | katalóg s. 8 až 18, voľba ❔ |
| Koniec trasy | pevný bod MFP na každú rúru pri vykurovaní (pri DUO dva) | katalóg s. 8, 15, 17 |
| Odbočka | T-spojka na každú rúru + izolačná sada T-kusu podľa plášťa | katalóg s. 31 až 33, počty ❔ |
| Spoj pod zemou | spojka PE-X × PE-X na každú rúru + izolačná sada priameho spoja | ❔ |
| Prestup stenou | tesnenie MICRO PRESS podľa plášťa, pre tlakovú vodu MICRO SEAL | katalóg s. 30, voľba ❔ |
| Výstražná páska | dĺžka trasy | katalóg s. 37 |

**Hotové 23. 9.** ako krok 4 sprievodcu výberom (`lib/material.ts`, `templates/Vyber.astro`). Juraj
potvrdil: rezerva 1 m na každý koniec, krytka na výber (zmršťovacia MK alebo gumová EPDM), odbočky
a spoje so spojkami aj izolačnými sadami. Čo patrí na konce trasy, nevie: zákazník si to zaškrtne sám,
nič nie je predvolené (otázka č. 14 pre manažéra). Počet koncov = 2 + počet odbočiek. Spojky sa vyberajú
podľa rúry a SDR, izolačné sady a MICRO PRESS podľa plášťa, krytky a pevné body z katalógu. Pri
sanitárnych T-spojkách poznámka „overíme pri dopyte“ (v tabuľke výrobcu nesedia obj. čísla s rozmermi,
otázka č. 11). Zoznam sa pošle ako dopyt (vyplní poznámku formulára Pre firmy), skopíruje alebo vytlačí;
celé zadanie je v adrese.

## Krok 4: Cena a dostupnosť z e-shopu

Otázka pre manažéra (dokument „Microflex Slovensko: otázky pre manažéra“): povoliť cenu a dostupnosť
pri obj. číslach z exportu e-shopu. Rozhodnutie z 21. 9. je „fáza 1 bez cien“.

**Hotové 23. 9.:** otázka č. 9 v dokumente pre manažéra.

## Krok 5: Hlava stránky podľa merania pozornosti

Juraj 26. 10. 2026 odsúhlasil úpravy A a C z porovnania variantov (nástroj pozornosti, `docs/POZORNOST.md`);
úpravu B (väčší nadpis na podstránkach) nie, pridala by len plochu. Implementácia, keď ju Juraj spustí.
Čísla v zátvorkách sú odhad pozornosti v prvých 3 s z testu variantov.

### A. Väčšie hlavné tlačidlo v hlave stránky

1. **Trieda `.btn-lg` v `web/src/styles/global.css`** hneď pri `.btn`: výška 56 px, vnútorný okraj 0 30 px,
   písmo 18 px s hrúbkou 600, ikonka 18 px ostane. Pre `.btn-yellow.btn-lg` jemný žltý tieň
   `0 12px 24px -12px rgb(176 138 0 / 0.65)` popri dnešnom `inset 0 1px 0 rgb(255 255 255 / 0.35)`,
   pri prejdení myšou o niečo silnejší. Farba, rohy (`--radius-s`) a šípka ostanú.
2. **`btn-lg` dostane len hlavné tlačidlo v hlave stránky**, 9 miest: Domov (Vybrať potrubie,
   `Domov.astro`), Potrubia (Sprievodca výberom), Kategória (Rady a obj. čísla), Rad (Vybrať dimenziu), Produkt
   (Obj. čísla, pri dieli bez tabuľky Otvoriť katalóg; obe vetvy), Pre firmy (Dopyt na projekt), Na stiahnutie
   (Stiahnuť katalóg PDF), Poradňa (Články). Ostatné žlté tlačidlá ostanú: záver Do e-shopu, formuláre (dopyt, hľadanie, 404),
   výsledky sprievodcu výberom a tlačidlá v tele stránky.
3. **Mobil:** šírka podľa textu ako dnes. Pri 360 px skontrolovať riadok s odkazom vedľa tlačidla (Dopyt
   na projekt, Kúpiť v e-shope, Hľadať v e-shope); ak sa nezmestí, zalomí sa pod tlačidlo ako dnes.

Hotovo, keď má 9 hláv väčšie tlačidlo pri 1440 aj 390 px, ostatné tlačidlá sa nezmenili, CLS ostane 0
a meranie pozornosti dá podobné čísla ako test (mobil domov okolo 7 % namiesto 4,7 %, desktop 1,3 až 2,0 %).

### C. Kratšie drobčeky na mobile

1. **Len CSS v `global.css` pri `.crumbs`**, do šírky 760 px: zobraziť iba predposlednú položku (stránku
   o úroveň vyššie) a namiesto lomky pred ňou „‹“ (`::before`, znak U+2039 je v podmnožine písma).
   Pravidlo pokryje drobčeky v hlave (`Hlava.astro`, rozloženie vedľa aj štúdio) aj drobčeky stránok bez hlavy
   (`Base.astro`). Diel: „‹ Príslušenstvo spojok“, rad: „‹ Vykurovanie“, stránka s jednou úrovňou: „‹ Domov“.
2. **Dotyková plocha** odkazu na mobile aspoň 44 px na výšku: vnútorný okraj vyrovnaný rovnako veľkým
   záporným okrajom, aby sa hlava neposunula.
3. **Bez zmeny:** desktop (celá cesta), štruktúrované dáta BreadcrumbList v `Base.astro`, texty položiek
   a označenie „Kde ste“. Skryté položky čítačka obrazovky na mobile nečíta, rovnako ako ich nevidno.

Hotovo, keď majú stránky dielov, radov, kategórií a podstránky pri 390 px jeden riadok „‹ …“, desktop sa
na snímkach pred a po nezmenil a meranie pozornosti na stránke dielu na mobile dá na drobčekoch okolo
11 % (dnes 15,3 %).

### Overenie po A a C

1. `npm run build` a `python data/kontrola_webu.py` (0 chybných odkazov), slovenská aj česká verzia.
2. Snímky hláv pri 1440 a 390 px pred a po: domov, Potrubia, Vykurovanie, DUO 6 bar, T-kus z bronzu,
   Pre firmy, Na stiahnutie, Poradňa a jeden článok.
3. `data/pozornost.py` na tých istých stránkach, výsledok do `docs/POZORNOST.md`.
4. Lighthouse na mobile pre domov a stránku dielu (čakám bez zmeny, 90 a viac).
5. Pravidlá do `docs/DESIGN.md` (veľkosť hlavného tlačidla, drobčeky na mobile), sem „Hotové“ s dátumom,
   commit bez pushu.

**Hotové 26. 10.:** `.btn-lg` v `global.css` a na 9 hlavných tlačidlách v hlave (Produkt v oboch vetvách),
drobčeky na mobile v `global.css` pri `.crumbs`. Pri revízii pred stavbou dve zmeny oproti plánu: ostatné
položky drobčekov sú na mobile len vizuálne skryté (čítačka prečíta celú cestu, nie `display: none`)
a „‹“ má prázdny alternatívny text; k prechodom tlačidla pribudol tieň, aby pri prejdení myšou neskočil.
Overené pri 1440, 390 a 360 px: tlačidlá 56 px, druhé tlačidlo Stiahnuť katalóg PDF v tele ostalo 48 px,
desktop drobčeky bez zmeny, na mobile jeden riadok (diel a článok 79 → 50 px, hlava dielu o 29 px vyššie),
nič nepreteká. Pri 360 px sa na dieli odkaz Hľadať v e-shope zalomí pod tlačidlo (pri 390 px nie).
Pozornosť po stavbe: tlačidlo na mobile 4,4–6,7 % → 5,7–8,2 % (domov 4,7 → 7,2 %, diel 2,9 → 4,9 %),
na desktope +0,4 až 0,7 bodu, drobčeky na dieli na mobile 15,3 → 10,6 %. Lighthouse mobil: domov 92,
diel 93, ten istý diel bez kroku 5 tiež 93 (rovnaké FCP aj LCP), CLS 0. Kontrola webu: 0 chybných odkazov.
