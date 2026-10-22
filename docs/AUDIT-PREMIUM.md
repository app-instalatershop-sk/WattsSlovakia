# Audit pre veľké projekty: prémiový dojem (22. 10. 2026)

Podnet od Juraja: „Začni dizajnom, urob veľký audit, kde dáš naozaj najlepšiu verziu, najlepšie
prechody, obrázky, rozdelenia, tak aby to naozaj zaujalo ako prémiová kvalitná značka pre ľudí,
ktorí chcú tieto produkty na veľké stavby. Nechaj iba jednu kartu voľnú niekde pre konfigurátor.“

**Výsledok:** web mal kvalitný základ (hero s kótami, katalóg, rez pod lupou, pokládka, zostup pod
zem), ale hovoril najmä k rodinnému domu a vnútorné stránky pôsobili ako šablóna: verzálkové
nadpisky, bodky medzi údajmi, čísla v zoznamoch vedľa obrázka, rovnaké biele karty. Pre veľké
projekty chýbal dôkaz mierky a cesta k projektu. V tejto etape dostal web jeden jazyk pre čísla
(kóty priamo na renderi a na fotkách zo stavieb, 40 stránok), sekciu Projekty, projektovú podporu
s miestom pre konfigurátor, prechody medzi stránkami, menu pre projekty a nové Referencie a Pre firmy.

Overené pri 1440 × 900 a 390 × 844 (SK aj CS), build 147 stránok, `data/kontrola_webu.py` bez chýb,
prechod karta → stránka radu bez chýb v konzole.

## 1. Pre koho

| Kto | Čo rozhoduje | Čo musí na webe nájsť |
|---|---|---|
| Projektant TZB | parametre, normy, výkresy, tepelné straty | podklady DWG a DXF, tabuľky, normy rúr, vyhlásenia, EPD |
| Generálny a montážny dodávateľ | celá trasa v termíne, rýchla montáž | materiál na celú trasu v jednej ponuke, dostupnosť, čas pokládky |
| Investor, správca areálu, obec | spoľahlivosť na desaťročia | stavby podobnej veľkosti s číslami, výrobca, certifikáty |
| Veľkoobchod | obj. čísla a dostupnosť | tabuľky s kopírovaním, dopyt |

## 2. Čo sme pozreli (22. 10. 2026)

| Web | Čo robí dobre | Čo si berieme |
|---|---|---|
| [Brugg Pipes](https://www.bruggpipes.com/) | segmenty (lokálne a diaľkové teplo, priemysel), **konfigurátor v hlavnom menu**, video z kotúča | konfigurátor ako samostatný vstup (miesto v kap. 8) |
| [Logstor](https://www.logstor.com/) | fotky v mierke (stohy rúr, trasa v krajine), segmenty so striedanými fotkami | veľké fotky zo stavieb, striedanie strán |
| [Thermaflex](https://www.thermaflex.com/) | prípadové štúdie s číslom v nadpise (sieť 7 600 kW), poradenstvo, nástroje v hornej lište | číslo stavby v nadpise projektu |
| [isoplus](https://www.isoplus.org/) | vstup cez druh projektu (teplo, chlad, priemysel, poľnohospodárstvo) | podklad pre poradňu a SEO podľa druhu projektu |
| Uponor / GF | služby pre projektantov a montážnikov, BIM, centrum podkladov | podklady pre projektantov ako samostatná služba |
| [Apple, MacBook Pro](https://www.apple.com/macbook-pro/) | výrobok vo veľkej mierke pod svetlom, jedna veta, detail | render ako hrdina, kóty namiesto pásu čísel |
| [Porsche, Taycan](https://www.porsche.com/international/models/taycan/) | modely s číslami výkonu, konfigurátor stále na očiach | čísla pri výrobku, konfigurátor ako vstup |
| [Vipp](https://vipp.com/en) | redakčné, asymetrické skladby veľkých fotiek | asymetria 7 / 5 pri projektoch |
| [Teenage Engineering](https://teenage.engineering/products/op-1) | výrobok na neutrálnom poli, presná typografia | pokoj okolo výrobku |

Konkurencia vyzerá zastarane (karusely, lišty súhlasu cez celé okno, sociálne ikony na okraji),
prémiový dojem v odbore nikto nemá obsadený. REHAU, Austroflex, Geberit, Kingspan, Dyson, Vitra
a watts.eu automatický prehliadač zablokovali, tie sme nehodnotili.

## 3. Zistenia na našom webe (pred touto etapou) a čo sa s nimi stalo

| # | Zistenie | Dopad | Riešenie, stav |
|---|---|---|---|
| 1 | **Šablónové prvky:** 13 verzálkových nadpiskov s riedkym písmom („PREDIZOLOVANÉ POTRUBIA MICROFLEX®“, „VÝBER PODĽA POUŽITIA“, „VYKUROVANIE · DVE RÚRY“, „4 MIN ČÍTANIA“) a bodky medzi údajmi. DESIGN.md kap. 5 ich pritom zakazuje. | najčastejší znak generovaného dizajnu | **hotové:** veta namiesto verzálok, čiarky namiesto bodiek, 14 miest |
| 2 | **Čísla radu ako zoznam vedľa renderu** (médium, tlak, rúra, plášť, polomer) | text vedľa textu, číslo bez vzťahu k obrazu | **hotové:** kóty na renderi (plášť, nosná rúra s tlakom, polomer ohybu) na 12 radoch a 5 systémoch, SK aj CS |
| 3 | **Domov nemá dôkaz mierky.** Referencie boli zoznam štyroch miest na tmavom páse. | investor ani dodávateľ nevidí stavbu svojej veľkosti | **hotové:** sekcia Projekty: Orange (asi 800 m) a Považská Bystrica (31 budov, 2 × 350 kW) s kótami na fotke |
| 4 | **Chýba cesta pre veľký projekt.** Hero vedie na záložky a PDF, blok pre firmy bol zoznam podkladov. | firma nevie, čo jej ponúkame | **hotové:** hero „Vybrať potrubie“ (sprievodca) + „Dopyt na projekt“, nová sekcia projektovej podpory s kartou konfigurátora |
| 5 | **Referencie a Kontakt nie sú v menu** (audit prvého dojmu, č. 5 a 6) | projektant stavby nenájde | **hotové:** Referencie v menu, telefón a Kontakt v hornom páse, oboje v mobilnom menu |
| 6 | **Prechod medzi stránkami** je prebliknutie celého okna | pôsobí ako sled načítaní | **hotové:** hlavička stojí, obsah vystúpi, render preletí z karty do hlavy (kap. 6) |
| 7 | **Pre firmy:** tri rovnaké biele karty bez obrazu, bez dôkazu | dôvera len zo slov | **hotové:** skutočná fotka pri každej skupine, „Sieť pre 31 budov sme dodali sami“ s kótou, istota výrobcu |
| 8 | **Hlavička:** po pridaní Referencií sa pole hľadania pri 1180 až 1600 px nezmestilo („Obj. číslo, rad, d…“) | orezaný text vyzerá nedokončene | **hotové:** „Obj. číslo, rad“, Ctrl K od 1 500 px, v menu „Podklady“ namiesto „Na stiahnutie“ |
| 9 | **Fotky veľkých stavieb sú malé:** Orange 1 200 px, Považská Bystrica 895 px; detaily do líp sú stále výrezy z renderov | pri veľkom zobrazení mäkké | **čaká:** zoznam záberov v kap. 7, originály od Watts (otázka pre manažéra) |
| 10 | **Hlavné tlačidlo domova** viedlo na záložky, rovnomenná položka menu do sprievodcu (audit prvého dojmu, č. 7) | zákazník čaká sprievodcu | **hotové:** obe vedú do sprievodcu |

## 4. Koncept: čísla na skutočných veciach

1. **Kóta namiesto pásu čísel.** Číslo stojí pri tom, čo opisuje: bod na plášti, rúre alebo
   v kotolni, čiara, mliečny štítok (číslo v Archivo 118 % šírky, popis v Plex). Ten istý jazyk
   v hero domova, v hlavách radov a systémov a na fotkách zo stavieb. Nikto v odbore to nerobí
   a nie je to pás čísel s vlasovými čiarami, ktorý Juraj zamietol 23. 9.
2. **Mierka.** Veľké stavby ukazujeme veľké: fotka prvého projektu prechádza cez šikmú hranu do
   podzemia, projekty sa striedajú vpravo a vľavo (hadovito ako zvyšok domova), najväčšie prvé.
3. **Pohyb s významom.** Jeden vstup na stránku; prechod medzi stránkami nesie render ďalej;
   fotka projektu sa pri rolovaní „otvorí“ ako výkop; kóty prídu, keď je obraz v okne. Pri
   „obmedziť pohyb“ je všetko hneď na mieste.
4. **Materiál, nie čiary.** Bez verzálok a bodiek medzi údajmi, fakty stavby na plochách namiesto
   riadkov s čiarami, skutočné fotky pri skupinách zákazníkov namiesto prázdnych kariet.

Farby a písma ostávajú (Watts modrá, tmavomodré podzemie, žltá farba jadra len na hlavnú akciu
a značky). Nové tokeny netreba.

## 5. Čo sa zmenilo

| Súbor | Zmena |
|---|---|
| `components/Koty.astro`, `lib/koty.ts` | kóty ako spoločný komponent; body na 9 renderoch Watts (vypočítané z masiek farieb, overené obrazom, pri HP opravená rúra) |
| `components/Scena.astro` | fotka zo stavby s kótami (výrez pripravený v súbore, súradnice v percentách) |
| `components/Hlava.astro` | kóty na obraze hlavy, meno prechodu (`prechod`), obraz s prechodom bez vlastného vstupu |
| `templates/Rad.astro`, `Kategoria.astro` | kóty z dát (plášť, rúra s tlakom, polomer); zoznam faktov len keď sú kóty menej ako dve |
| `templates/Domov.astro` | hero akcie, sekcie Projekty a Projektová podpora s kartou konfigurátora, istota výrobcu |
| `content/referencie.ts` | `scena`: hlavná fotka a kóty každej stavby (jedna pravda pre domov, Referencie aj Pre firmy) |
| `templates/Referencie.astro` | poradie podľa veľkosti, hlavná fotka s kótou, galéria skryje kóty pri inej fotke, fakty na plochách |
| `templates/PreFirmy.astro` | fotky pri skupinách, dôkaz z vlastnej dodávky, istota výrobcu |
| `components/Hlavicka.astro` | Referencie v menu, „Podklady“, telefón a Kontakt v hornom páse aj v mobilnom menu, hľadanie |
| `layouts/Base.astro`, `styles/global.css` | prechody medzi stránkami |
| šablóny a hľadanie | verzálkové nadpisky a bodky preč (Hlava, Katalog, Rad, Referencie, Kontakt, Skupiny, Clanok, Hladat, Poradna, Vyber, `lib/hladanie.ts`) |
| `assets/referencie/orange-5-scena.jpg` | výrez orange-5 (bez horných a dolných 100 px) pre scénu s kótami |

## 6. Prechody

- **Medzi stránkami** (View Transitions cez `ClientRouter`): hlavička a horný pás majú vlastné meno
  a bez animácie, takže stoja. Obsah stránky zmizne za 160 ms a nový vystúpi o 14 px za 440 ms.
- **Spoločné rendery:** `rad-<id>` (katalóg na domove, karta na stránke systému, rad pri dieli,
  hlava radu) a `kat-<id>` (stránka Potrubia, hlava systému). Render preletí z karty na miesto
  v hlave novej stránky. Mená sú na stránke jedinečné; obrázky v rozbaľovacom menu meno nemajú,
  lebo by sa s hlavou stránky zdvojili.
- **Medzi sekciami:** šikmé hrany a zostup pod zem ostávajú; nové je otvorenie fotky projektu pri
  rolovaní (`animation-timeline: view()`, len kde to prehliadač vie).

## 7. Obrázky: zoznam záberov

| Záber | Na čo | Kam uložiť |
|---|---|---|
| Odrezok UNO, DUO, QUADRO, COOL a HP, čelný rez a rez pod 45°, biele pozadie, od 2 000 px | hlavy radov, Projekty, Google Obrázky | `podklady/upravene/odrezky/<rad>-celo.jpg`, `<rad>-45.jpg` |
| Makro plášťa, peny a nosnej rúry, štvorec od 1 200 px | lupy na domove a pri stavbe radu | prepísať `web/src/assets/detaily/vrstva-plast.jpg`, `vrstva-pena.jpg`, `vrstva-rura.jpg` |
| Predajňa a sklad v Rakovej: budova, regál s kotúčmi, kotúče na palete | Kontakt, Pre firmy | `podklady/upravene/predajna-*.jpg` |
| Považská Bystrica v plnom rozlíšení (výkop, šachty, kotolňa), ak ich máme | Projekty, Referencie | `podklady/watts/fotky-referencie/orig/` |
| Video rozvíjania kotúča, 10 s, 4K, statív (na neskôr) | sekcia pokládky | `podklady/upravene/video/` |

## 8. Miesto pre konfigurátor

- **Kde:** domov, sekcia projektovej podpory, karta „Konfigurátor trasy“ so stavom „Pripravujeme“
  (`[data-konfigurator]` v `Domov.astro`). Iné miesto na webe ho nemá.
- **Čo bude robiť** (Juraj 22. 10.): koľko materiálu treba, ako si ho človek navolí, a pripraví návrh.
- **Dovtedy** karta vedie na dopyt na projekt. Základ výpočtu už existuje: zoznam materiálu v kroku 4
  sprievodcu (`lib/material.ts`), pravidlá v `docs/PLAN-ZLEPSENIA.md` kap. 3.

## 9. Ďalej

1. Juraj prejde web (`npx astro dev`, http://localhost:4321) a povie pripomienky.
2. Fotky podľa kap. 7; potom väčšie lupy a fotka predajne v Kontakte.
3. Otázky pre manažéra: 10-ročná záruka (brožúra Watts 2026), rozsah projektovej podpory, originály fotiek.
4. Po rozhodnutí o hostingu: spustenie podľa plánu (SEO, technika, Search Console).

## Zdroje

- Katalóg Watts Microflex, slovenské vydanie (`podklady/watts/Microflex-katalog-SK.pdf`): s. 3 (Watts,
  ISO 9001), s. 4 (od roku 1994), s. 5 (rolky 100 m, projektový dozor, 235 kW pri poklese 0,2 °C),
  s. 34 (certifikáty), s. 41 (tlaková skúška ako podmienka záruky).
- Brožúra Watts Microflex EN 2026-05 (`podklady/watts/Microflex-brozura-EN-2026-05.pdf`), s. 2:
  „10-year warranty“, „Made in Italy“, „since 1994“, „large district heating networks“.
- Referencie na watts.eu (prečítané 23. 9. 2026), fakty v `web/src/content/referencie.ts`.
