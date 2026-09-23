# Audit prvého dojmu: nájde zákazník, čo hľadá? (23. 9. 2026)

Podnet od Juraja: „Urob audit prvého dojmu, keď zákazník príde na web a chce si niečo nájsť, či je
to jednoduché a intuitívne.“

**Výsledok:** prehliadanie funguje dobre. Menu, sprievodca výberom a tabuľky dovedú zákazníka
k obj. číslu na 3 až 4 kliky. Zlyháva hľadanie slovami a posledný krok do e-shopu. Tretina
skúšobných dotazov nevrátila nič a pri 309 z 352 obj. čísel končí „Do e-shopu“ prázdnym výsledkom.

Testované na lokálnom serveri (stav po commite 5951de2) pri 1440 × 900 a 390 × 844: šesť úloh
zákazníka, 98 dotazov do hľadania a všetkých 352 obj. čísel webu proti hľadaniu na instalatershop.sk.

## 1. Úlohy zákazníka

| Úloha | Cesta | Krokov | Výsledok |
|---|---|---|---|
| Potrubie na kúrenie z kotolne do domu, 20 kW | Výber potrubia → Vykurovanie → DUO → 20 kW | 4 | Dobré: MD12525C s odporúčaním, výkonom a polomerom ohybu |
| Pozná obj. číslo MD12532C | Hľadanie v hlavičke → Enter → výsledok → tabuľka radu | 3 | Stránku nájde, riadok v tabuľke musí hľadať znova (8 až 16 riadkov) |
| Píše slovami „potrubie na kúrenie“ | Hľadanie v hlavičke → Enter | 2 | 0 výsledkov |
| Spojky k potrubiu, ktoré má | Tabuľka variantov → „4 diely“ | 1 | Dobré: druh dielu, obj. číslo, počet kusov, odkaz na diel |
| Cena a dostupnosť | „Do e-shopu“ pri obj. čísle | 1 | Pri 309 z 352 obj. čísel e-shop nenájde nič |
| Zavolať alebo prísť do predajne | Menu | – | Kontakt v menu nie je; telefón je v tmavom páse na konci stránky, na domove len v pätičke |

## 2. Čo funguje

- Rozbaľovacie menu Potrubia: päť použití s obrázkom a radmi, pod nimi Spojky, Príslušenstvo, Celý katalóg a katalóg PDF.
- Sprievodca výberom: kroky sa odkrývajú postupne, stav je v adrese, výsledok má odporúčanie, výkon, e-shop a zoznam materiálu.
- Tabuľky variantov: filter podľa rúry a izolácie, kopírovanie obj. čísla, príslušenstvo k riadku; na mobile karty.
- Mobilné menu: hľadanie navrchu, päť použití s obrázkom, e-shop ako tlačidlo.
- Hľadanie podľa obj. čísla aj zápisu z objednávky: „MD12532C“, „md12532“, „125/32“, „2x32“, „DUO 2x25“, „32x2,9“, „MJ13032“, kód krytky alebo pevného bodu.
- Ctrl K skočí do hľadania, stránka 404 ponúka hľadanie a rozcestník.

## 3. Zistenia

### Vysoká priorita

| # | Zistenie | Dopad | Návrh |
|---|---|---|---|
| 1 | **„Do e-shopu“ končí prázdnym hľadaním.** Odkaz hľadá obj. číslo na instalatershop.sk. Nájde 43 z 352 obj. čísel: 17 z 83 potrubí, 26 z 269 dielov. Pri MIS ukáže obehové čerpadlá namiesto revíznej šachty. | Zákazník, ktorý chce kúpiť, príde do e-shopu a nevidí tovar. Posledný krok celej cesty zlyhá. | Priame odkazy na produkt z exportu e-shopu (otázka č. 6 pre manažéra, doplnená o tieto čísla). Dovtedy: „Do e-shopu“ len tam, kde e-shop tovar nájde, inde „Opýtať sa na obj. číslo“ (dopyt s vyplneným kódom) a telefón. |
| 2 | **Hľadanie vyžaduje zhodu každého slova.** 34 z 98 dotazov nevrátilo nič a asi 30 z nich má na webe odpoveď: „potrubie na kúrenie“, „pitná voda“, „TÚV“, „tepelné čerpadlo“ (web má „čerpadlá“), „chladenie“, „odbočka“, „koncová krytka“, „prechodka“, „izolácia spoja“, „technický list“, „cena“, „25x2.3“ (bodka), „DN 25“, „mikroflex“, „1″“. | Zákazník, ktorý nepozná názvy radov, skončí pri „Nič sme nenašli“ s jediným odkazom na kontakt. | Vynechať výplňové slová (na, pre, do, s, a, potrubie); synonymá (kúrenie → vykurovanie, TÚV a pitná → sanita, chladenie → COOL, odbočka → T-spojka a T-kus, priechodka → prestup, cena → e-shop); zhoda začiatku slova (čerpadlo = čerpadlá); bodka ako čiarka v rozmeroch, DN a závity v indexe. Keď nič, ukázať výsledky aspoň pre časť slov a návrhy. |
| 3 | **Hľadanie v hlavičke nič nenavrhuje.** Výsledky sú až po Enter na samostatnej stránke. Na mobile je hľadanie len v menu (2 ťuknutia). | Montážnik s obj. číslom nevie, či píše správne, kým neodošle. | Našepkávač pod poľom: 5 až 6 najlepších výsledkov počas písania (index má 6,5 KB po kompresii). Lupa v mobilnej hlavičke vedľa Menu. |
| 4 | **Výsledok hľadania a sprievodca vedú na tabuľku, nie na riadok.** Odkaz je `#varianty`, riadky nemajú vlastnú kotvu. | Kód, ktorý zákazník práve našiel, musí v tabuľke hľadať znova. | Kotva na riadok (napr. `#MD12532C`), riadok zvýrazniť a otvoriť jeho príslušenstvo. Rovnako v tabuľkách dielov. |

### Stredná priorita

| # | Zistenie | Dopad | Návrh |
|---|---|---|---|
| 5 | **Kontakt nie je v menu** (počítač ani mobil). Na kontakt vedie len horný pás „Oficiálny partner Watts…“, čo nikto nečaká. Na domove je telefón len v pätičke. | Montážnik, ktorý chce volať, musí posúvať na koniec stránky. | „Kontakt“ do hlavného aj mobilného menu, v mobilnom menu telefón ako odkaz na volanie. |
| 6 | **Referencie nie sú v menu ani v pätičke.** Vedie na ne len domov a stránky radov. | Projektant, ktorý chce vidieť stavby, stránku nenájde. | Referencie do pätičky a do menu (napr. vedľa Pre firmy). |
| 7 | **Dve rôzne veci s rovnakým názvom.** Hlavné tlačidlo domova „Vybrať potrubie“ posunie na záložky na domove, položka menu „Výber potrubia“ vedie do sprievodcu. | Zákazník čaká sprievodcu, dostane prehľad. | Hlavné tlačidlo domova viesť do sprievodcu, ktorý končí obj. číslom. |
| 8 | **Prvý krok sprievodcu ukazuje len názvy radov** (UNO, DUO, PRIMO, HP). DUO sa odporúča „pre prípojku domu alebo tepelného čerpadla“, vedľa je samostatné použitie Tepelné čerpadlá. | Laik nevie, či s tepelným čerpadlom zvoliť Vykurovanie alebo Tepelné čerpadlá. | Pod názov použitia jednu vetu z popisu kategórie (texty na webe už sú); pri Tepelných čerpadlách „prepojenie vonkajšej jednotky s domom“. |
| 9 | **Mobil, domov: z piatich záložiek použitia sú vidieť dve.** Ostatné sú mimo obrazovky bez náznaku, že pokračujú. | Chladenie a tepelné čerpadlá na mobile nikto neuvidí. | Záložky zalomiť do dvoch riadkov alebo pridať prechod do strany so šípkou. |

### Nízka priorita

| # | Zistenie | Návrh |
|---|---|---|
| 10 | V pätičke „Katalóg Microflex (PDF, 19 MB)“ otvorí stránku, nie PDF; štyri odkazy z Podkladov vedú na tú istú stránku bez kotvy. | Kotvy na časti stránky Na stiahnutie (`#h-kat`, `#vykresy`, `#h-dalsie`), pri katalógu priamo PDF. |
| 11 | Cena nie je nikde na webe (rozhodnutie z 21. 9.). | Otázka č. 9 pre manažéra: cena a „skladom“ z exportu e-shopu. |
| 12 | Dopyt otvára e-mailový program. Na mobile bez nastavenej pošty sa nestane nič. | Skutočné odosielanie po rozhodnutí o hostingu (otázky č. 1 až 3). |

Tmavý panel s ikonami dole na snímkach je vývojový panel Astra; na ostrom webe nie je. Prázdne
plochy pri snímke celej stránky vznikajú animáciami pri posune, pri skutočnom posune sa všetko zobrazí.

## 4. Odporúčané poradie

1. Hľadanie (č. 2 a 3): synonymá, výplňové slová, zhoda začiatku slova, našepkávač, lupa na mobile. Najväčší vplyv, všetko na našej strane.
2. Kotva na riadok (č. 4), aby hľadanie aj sprievodca končili pri konkrétnom obj. čísle.
3. Kontakt a Referencie v menu a pätičke (č. 5 a 6), hlavné tlačidlo domova do sprievodcu (č. 7).
4. E-shop (č. 1): dočasne dopyt pri kódoch, ktoré e-shop nenájde; natrvalo priame odkazy z exportu, keď odpovie manažér.
5. Sprievodca a mobil (č. 8 a 9), potom nízka priorita.
