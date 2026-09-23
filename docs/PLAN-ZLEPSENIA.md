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

## Krok 4: Cena a dostupnosť z e-shopu

Otázka pre manažéra (dokument „Microflex Slovensko: otázky pre manažéra“): povoliť cenu a dostupnosť
pri obj. číslach z exportu e-shopu. Rozhodnutie z 21. 9. je „fáza 1 bez cien“.
