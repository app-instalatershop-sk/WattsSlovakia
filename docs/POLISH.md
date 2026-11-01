# Polish: kontrolný zoznam a nálezy (1. 11. 2026)

Juraj 1. 11. 2026: „Poďme urobiť polish, ale profesionálne… podľa koho a čoho?“ Polish tu znamená kontrolu podľa
overených pravidiel, meranie a test na ľuďoch, nie ďalší názor. Nadväzuje na `docs/DOLADENIE.md` (fázy A až C sú
hotové, zostáva fáza D: ľudia) a na pravidlá v `docs/DESIGN.md`, ktoré majú prednosť pred všeobecnými zdrojmi.

**Postup:** 1. kontrolný zoznam (táto stránka) → 2. kontrola po komponentoch (hlavička, tlačidlá, tabuľky, karty,
hlava radu, záver, päta), nie po stránkach, takže jedna oprava platí na všetkých 147 stránkach → 3. nálezy so
snímkou a závažnosťou, o zmenách vzhľadu rozhoduje Juraj → 4. opravy po dávkach, po každej porovnanie snímok,
axe a Lighthouse → 5. test s inštalatérmi v predajni → 6. `docs/PRED-SPUSTENIM.md`.

**Ako sa overuje:** *audit* = `data/polish-audit.mjs` a súhrn `data/polish_suhrn.py` (každá stránka SK aj CS,
počítač 1440 px a telefón 390 px 2×: axe, sadzba, dotykové ciele, ostrosť obrázkov, súpis štýlov; server
`snimky-stranok/_skripty/server.mjs` na porte 4330), *kontrola* = `data/kontrola_webu.py`,
*revízia* = kontrola chýb, odkazov a presahu na všetkých stránkach, *ručne* = snímky a skutočné zariadenia.

## Kontrolný zoznam

### Typografia a sadzba

| # | Pravidlo | Overenie | Zdroj |
|---|---|---|---|
| T1 | Písmo len zo škály: pevné 12 až 28 px, nadpisy plynulo cez `clamp()` | kontrola, súpis štýlov | DESIGN.md kap. 5 |
| T2 | Riadok súvislého textu najviac 70 znakov | audit (počítač) | DESIGN.md kap. 5; Bringhurst 45 až 75, Butterick 45 až 90 |
| T3 | Zarovnanie doľava, nikdy do bloku; na stred len prázdne stavy | audit | DESIGN.md kap. 5 |
| T4 | Nezlomiteľná medzera pred jednotkou (25 mm, 80 °C, 5 %), za Ø, okolo × medzi číslami a za jednopísmenovou predložkou alebo spojkou (v, s, z, k, o, a, i, u) | audit | STN 01 6910 |
| T5 | Úvodzovky „…“, rozsah slovom „až“ alebo pomlčkou (25 až 63 mm, 25–63 mm), tri bodky ako znak … | audit | STN 01 6910, Pravidlá slovenského pravopisu |
| T6 | V tabuľkách tabuľkové číslice zarovnané vpravo, jednotka v záhlaví stĺpca | ručne | IBM Carbon: data table; DESIGN.md |
| T7 | Žiadne verzálky v popiskoch a tlačidlách (názvy UNO, DUO, QUADRO áno) | audit | DESIGN.md kap. 5 |
| T8 | V jednej sekcii najviac tri úrovne textu (nadpis, text, popis) | ručne | Refactoring UI: hierarchia |

### Medzery, mriežka, tvar, hĺbka

| # | Pravidlo | Overenie | Zdroj |
|---|---|---|---|
| M1 | Medzery z jednej škály (návrh: základ 4 px, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128) | súpis štýlov | Refactoring UI: systém medzier; Material: mriežka 4 a 8 dp |
| M2 | Zaoblenie v štyroch stupňoch, vnorený prvok o stupeň menší | kontrola | DESIGN.md kap. 6 |
| M3 | Tieň v štyroch úrovniach, svetlo vždy zhora | kontrola | DESIGN.md kap. 6 |
| M4 | Rovnaký druh prvku vyzerá všade rovnako (prepínače, čipy, tlačidlá, karty, štítky) | súpis štýlov, ručne | NN/g heuristika 4 (konzistentnosť); IBM Carbon |
| M5 | Na obrazovke jedno hlavné (žlté) tlačidlo | ručne | Apple HIG, Material 3 |

### Farba a kontrast

| # | Pravidlo | Overenie | Zdroj |
|---|---|---|---|
| F1 | Text aspoň 4,5 : 1, veľký text a ikony ovládania 3 : 1 | axe | WCAG 2.2: 1.4.3, 1.4.11 |
| F2 | Farby len z tokenov | súpis štýlov | DESIGN.md kap. 4 |
| F3 | Farba nikdy jediný nositeľ informácie (izolácia: bodka aj slovo) | ručne | WCAG 2.2: 1.4.1 |

### Ovládanie, stavy, dotyk, klávesnica

| # | Pravidlo | Overenie | Zdroj |
|---|---|---|---|
| O1 | Dotykový cieľ aspoň 24 × 24 px alebo s odstupom; hlavné ovládanie 44 × 44 px | audit (telefón) | WCAG 2.2: 2.5.8; Apple HIG 44 pt; Material 48 dp |
| O2 | Každý interaktívny prvok má stavy: prejdenie myšou (len myš), ohnisko, stlačené, vybrané, nedostupné | ručne, snímky | IBM Carbon, Material 3: states |
| O3 | Všetko ovládateľné klávesnicou, posuvné oblasti dosiahnuteľné klávesnicou | axe, ručne | WCAG 2.2: 2.1.1 |
| O4 | Lepiaca lišta neprekryje nadpis po skoku na kotvu ani prvok v ohnisku | skript | WCAG 2.2: 2.4.11 |
| O5 | Odozva na akciu (kopírovanie, filter, výber) do 0,1 s | ručne | NN/g: tri hranice odozvy |

### Pohyb

| # | Pravidlo | Overenie | Zdroj |
|---|---|---|---|
| P1 | Rozhranie 150 až 250 ms, dlhšie len hlavný pohyb; pohyb nezadržiava obsah | ručne | DESIGN.md kap. 8 a 16; Material 3: motion |
| P2 | Pri „obmedziť pohyb“ je obsah hneď a nič neskáče | skript | WCAG 2.2: 2.3.3; DESIGN.md |
| P3 | Žiadny posun rozloženia (CLS 0), pohyb cez transform a opacity | Lighthouse | web.dev: Core Web Vitals |

### Obsah a texty

| # | Pravidlo | Overenie | Zdroj |
|---|---|---|---|
| X1 | Každé tvrdenie doložené (katalóg, referencia); „každý“, „najčastejší“ len s oporou | ručne | Baymard: dôvera; NN/g |
| X2 | Jednotné pojmy: rad, systém, dimenzia, variant, obj. číslo | ručne | NN/g heuristika 4 |
| X3 | Číslo vždy s jednotkou alebo v stĺpci s jednotkou v záhlaví | ručne | Baymard: tabuľky parametrov |

### Stránka radu (výrobok)

| # | Pravidlo | Overenie | Zdroj |
|---|---|---|---|
| V1 | Výber variantu ukáže presné obj. číslo, rozmery a cestu k nákupu; odkaz na nákup vždy na zvolený variant | skript (hotové 1. 11.) | Baymard: výber variantu na stránke výrobku |
| V2 | Kľúčové parametre pri výbere, úplná tabuľka pre odborníka | ručne | Baymard: tabuľka parametrov |
| V3 | Porovnanie variantov bez myši (dotyk, klávesnica) | ručne | Baymard; WCAG |
| V4 | Podklady s formátom, jazykom a skutočným náhľadom | ručne (čaká na súbory z watts.eu) | Baymard: dokumentácia výrobku |
| V5 | Referencie s rolou (naša dodávka, referencia výrobcu) a skutočnými fotkami | ručne | Baymard: signály dôvery |

### Obraz

| # | Pravidlo | Overenie | Zdroj |
|---|---|---|---|
| I1 | Ostrý obrázok na displeji 2×: stiahnutý súbor aspoň 85 % potrebnej šírky | audit (telefón) | web.dev: responzívne obrázky |
| I2 | Rendery v jednom svetle, uhle a mierke; fotky len skutočné | ručne | DESIGN.md kap. 7 |
| I3 | Alternatívny text vecný, dekoratívny obrázok bez textu | axe, ručne | WCAG 2.2: 1.1.1 |

### Rýchlosť a technika

| # | Pravidlo | Overenie | Zdroj |
|---|---|---|---|
| R1 | Lighthouse na mobile 90 a viac, CLS 0; po spustení LCP pod 2,5 s a INP pod 200 ms v teréne | Lighthouse, Search Console | web.dev: Core Web Vitals; docs/RYCHLOST.md |
| R2 | Bez chýb v konzole, rozbitých odkazov a obrázkov, bez vodorovného presahu od 320 px | revízia, kontrola | WCAG 2.2: 1.4.10 |
| R3 | Safari (WebKit) bez rozdielov oproti Chrome | snímky WebKit | ručne |

### Ľudia

| # | Pravidlo | Overenie | Zdroj |
|---|---|---|---|
| L1 | Päťsekundový test a tri úlohy s 5 až 8 inštalatérmi v predajni (fáza D v DOLADENIE.md) | test | NN/g: stačí 5 používateľov |

## Nálezy (1. kolo, 1. 11. 2026)

Audit: 146 stránok SK aj CS × počítač a telefón, stav commitu 9e39d24 s rozpracovaným auditom domova z 30. 10.
v pracovnom priečinku. Safari (WebKit 26.6) a Chrome na 8 hlavných stránkach. Lighthouse na jednej stránke
z každej šablóny (16).

### Priorita 1: opraviť hneď (nemení vzhľad, len kvalitu)

| # | Nález | Rozsah | Oprava | Pravidlo |
|---|---|---|---|---|
| 1 | Slovenská sadzba: jednopísmenová predložka alebo spojka na konci riadku (2 052 miest), číslo oddelené od jednotky (638), Ø a × bez nezlomiteľnej medzery (160). Pravidlá máme v `lib/sadzba.ts`, ale platia len na vybrané texty v 20 súboroch. V článku o pokládke sa „125 mm“ v tabuľke láme na dva riadky (v Safari aj „75 mm“) | všetkých 146 stránok | pravidlá zo `sadzba()` použiť pri builde na celý text stránky (mimo skriptov, kódu a atribútov), doplniť kg/m, W/m·K, min, Ø a × | T4 |
| 2 | Jednotky v záhlaví tabuliek (mm, kW, kg/m pod názvom stĺpca): kontrast 3,77 : 1 pri 10,4 px | 82 stránok | farba `--ink-soft` (7,4 : 1) a 12 px zo škály | F1, T1 |
| 3 | Posuvné pásy nedosiahnuteľné klávesnicou: porovnanie rezov na telefóne, tabuľky v článkoch | 26 stránok | zaostriteľný pás s názvom (`tabindex`, `role="region"`, `aria-label`) | O3 |
| 4 | Horný pás (partner Watts, telefón, jazyky) mimo orientačných oblastí stránky | všetky stránky | pás ako pomenovaná oblasť | O3 (axe region) |
| 5 | Dve oblasti s rovnakým názvom: „Stavba a montáž“ na radoch (obal aj rozložený rez), hľadanie na stránke Hľadať | 26 stránok | obal bez vlastnej oblasti, formuláre hľadania s rozdielnym názvom | O3 (axe landmark-unique) |
| 6 | Neostré obrázky na telefóne 2×: porovnanie rezov sa sťahuje v 1 200 px namiesto 2 000 px (pás má aspoň 760 px, `sizes` počíta so šírkou displeja), náhľad článku v Poradni | 26 stránok | správne `sizes` | I1 |
| 7 | Riadok nad 70 znakov: úvody sekcií až 94 znakov (rady PRIMO, Spojky, Príslušenstvo, kategórie v CS), odsek o histórii na CS domove 101, odseky článku o tlakovej skúške 76 až 80 | 16 miest | obmedziť šírku textu na 70 znakov | T2 |
| 8 | Odkaz radu v tabuľke Na stiahnutie 30 × 18 px bez odstupu | 1 stránka | väčšia plocha | O1 (WCAG 2.5.8) |
| 9 | Hľadanie: posun rozloženia CLS 0,43, výsledky sa vykreslia až po načítaní a posunú telo stránky | stránka Hľadať (SK aj CS) | miesto pre výsledky vopred alebo výsledky už pri vykreslení | P3, R1 |
| 10 | Lighthouse na mobile pod 90: Referencie 82 (LCP 4,4 s, 683 kB), Poradňa 86 (LCP 3,8 s, 502 kB), Pre firmy 88 (LCP 3,3 s) | 3 šablóny | zistiť prvok LCP, zmenšiť a odložiť fotky pod prvou obrazovkou | R1 |

### Priorita 2: väčšia dotyková plocha bez zmeny vzhľadu

Na telefóne je 6 583 cieľov pod 44 px (odporúčanie Apple a Material; norma WCAG 2.5.8 je 24 px a tú okrem bodu 8
spĺňajú). Najčastejšie: odkazy v päte a menu (2 544), kopírovanie obj. čísla (720), Do e-shopu v tabuľkách (720),
prepínač SK/CS (292), čipy filtra (170), výber priemeru (154), partner Watts a telefón v hornom páse (292).
Plochu zväčší neviditeľný presah (pseudoprvok alebo vnútorné odsadenie s rovnakým záporným okrajom), vzhľad
ostane. V hustých tabuľkách sa plochy susedných tlačidiel nesmú prekryť.

### Priorita 3: na rozhodnutie (mení vzhľad alebo systém)

| # | Nález | Návrh |
|---|---|---|
| 1 | Medzery: 59 rôznych hodnôt, násobky 4 px len 46 % výskytov (najčastejšie 13, 14, 10 a 6 px). Pevnú škálu medzier DESIGN.md nemá | tokeny medzier 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px a postupný prevod od odsadení sekcií a kariet; zmeny väčšinou o 1 až 3 px, web dostane jednotný rytmus (M1) |
| 2 | Farby mimo tokenov: dve sivé (#3f4b5e v štítkoch kót, #7a8494 v poznámkach a jednotkách); 17 rôznych polopriesvitných bielych plôch (0,3 až 0,94) | sivé zlúčiť do `--ink-soft`, biele plochy do troch úrovní skla (F2) |
| 3 | Prepínače s rovnakým významom vyzerajú inak: výber priemeru v hlave radu (biela koľajnica, tmavomodrý jazdec) a filtre tabuľky (samostatné modré čipy); pripomienka aj z posúdenia stránky 04 | jeden vzhľad pre oba (M4) |
| 4 | Písmo mimo škály z relatívnych veľkostí: 12,6 px a 11,6 px (Plex 500) | zaokrúhliť na 12 a 13 px (T1) |

### V poriadku

- Zarovnanie: žiadny odsek do bloku ani na stred, žiadne verzálky cez `text-transform` (T3, T7).
- Úvodzovky a tri bodky bez chýb; „spojovníky v rozsahu“ sú len označenia noriem (DIN 1988-2, EN 15632-1), tie sú správne (T5).
- Farby textu: 9 hodnôt, 7 z tokenov; zaoblenia a tiene v tokenoch, `kontrola_webu.py` bez odchýlok (M2, M3).
- Safari (WebKit): bez chýb skriptov a bez vodorovného presahu, rozloženie zhodné s Chrome okrem tabuľky v článku (bod 1) (R3).
- Skryté odkazy rodiny potrubí (1 × 1 px) sú zámerne len pre klávesnicu, pri ohnisku sa ukážu (O1 ich hlási ako malé, ale nie sú na dotyk).
- Revízia 1. 11.: 146 stránok × 2 zariadenia bez chýb (R2).
- Lighthouse (mobil, 16 šablón): prístupnosť a odporúčané postupy 100 všade; SEO 100 okrem Hľadania (69, zámerne
  `noindex`); výkon 90 až 94 okrem bodu 10; CLS 0 okrem bodu 9 (R1, P3).

### Ďalej

- Ručne po opravách priority 1: stavy prvkov (O2), ovládanie klávesnicou (O3), lepiaca lišta a kotvy (O4), pohyb (P1, P2).
- Test s inštalatérmi v predajni (L1): zadanie a záznamový hárok pripravím.

## Zdroje

- [Baymard Institute: Product Page UX](https://baymard.com/research/product-page) (výskum stránok výrobku; časť zadarmo, celý výskum platený)
- [NN/g: 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/),
  [Why You Only Need to Test with 5 Users](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/),
  [Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
- [IBM Carbon: Data table](https://carbondesignsystem.com/components/data-table/usage/),
  [Typography](https://carbondesignsystem.com/elements/typography/overview/) (písmo IBM Plex, ktoré používame)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/), [Material Design 3](https://m3.material.io/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [2.5.8 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  [2.4.11 Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), [axe-core](https://github.com/dequelabs/axe-core)
- [Refactoring UI](https://www.refactoringui.com/) (Wathan, Schoger), [Butterick’s Practical Typography](https://practicaltypography.com/),
  R. Bringhurst: The Elements of Typographic Style
- STN 01 6910 Pravidlá písania a úpravy písomností; Pravidlá slovenského pravopisu (JÚĽŠ SAV)
- [web.dev: Core Web Vitals](https://web.dev/articles/vitals)
