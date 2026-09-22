# Audit dizajnu a rozloženia domova (21. 9. 2026)

Podnet od Juraja: „Príde mi to ako moc obrázkov na kúsok stránky.“ Audit meria stav domova
pred úpravou, pomenuje pravidlá, podľa ktorých sa hodnotí, a zapisuje rozhodnutia, ktoré
z toho vyplynuli. Platí aj pre ďalšie stránky (kap. 5).

## 1. Podľa čoho hodnotíme

Nevymýšľame vlastné pravidlá. Používame štyri overené zdroje, ktoré sa dopĺňajú:

| Zdroj | Čo z neho berieme |
|---|---|
| **Massimo Vignelli, The Vignelli Canon** | Disciplína a primeranosť: málo prvkov, každý s jasným účelom. „Vizuálna sila“ vzniká z jedného silného prvku, nie z opakovania. Dva písma, málo veľkostí, mriežka. |
| **Josef Müller-Brockmann, Grid Systems** | Jedna stĺpcová mriežka pre celú stránku, všetky bloky na nej sedia. Konzistentný vertikálny rytmus (odstupy z jednej škály). |
| **Edward Tufte** | Pomer „dátový atrament / celkový atrament“: každý pixel má niesť informáciu; dekorácia a opakovanie idú preč. Čísla a tabuľky sú plnohodnotná grafika. |
| **Refactoring UI (Wathan, Schoger)** | Praktické pravidlá pre obrazovky: jedno ohnisko na sekciu; nepoužívať obrázok len preto, že ho máme; nekvalitná fotka škodí viac než žiadna; hierarchia váhou a farbou, nie len veľkosťou; popis patrí k nadpisu (blízkosť). |

Doplnkovo Gestalt (podobnosť, blízkosť) a Krug/Nielsen (jasne oddelené oblasti, minimalizmus).

## 2. Namerané pred úpravou (1440 × 900)

Výška stránky 4 649 px = 5,2 obrazovky. Obrázky širšie než 40 px:

| Sekcia | Obrázky | Druh |
|---|---|---|
| Hero | 1 render (818 × 559) | rez rúry DUO |
| Katalóg | 5 renderov (239 × 193) + 2 fotky dielov (104 × 80) | 5× rez rúry, spojka, koncovka |
| Rodina | 1 render (903 × 533) | 6 rúr v reze |
| Výber (tabuľka) | 0 | – |
| Referencie | 3 fotky (395 × 296) | rez rúry (!), škola, bytový dom |
| B2B | 1 textúra na pozadí | kotúč |

**Spolu 13 obrázkov, z toho 8 je ten istý motív: modrá vrúbkovaná rúra v reze.** V prvých dvoch
obrazovkách (do 1 800 px) je 9 obrázkov a 7 z nich je tá istá rúra. To je presne pocit „veľa
obrázkov“: nie počet sám, ale opakovanie jedného motívu. Podľa Gestaltu (podobnosť) oko číta päť
rovnakých kariet ako jednu textúru, nie ako päť volieb; rozlišovací znak systémov (farba jadra)
je v malom renderi na 239 px sotva viditeľný.

## 3. Zistenia

1. **Opakovanie motívu** (Vignelli, Refactoring UI). Rez rúry je v hero, päťkrát v katalógu,
   v rodine a ešte raz ako „fotka“ prvej referencie. Jeden silný render stačí; zvyšok mu berie silu.
2. **Dve navigačné sekcie po sebe** (Krug). Katalóg (karty kategórií) a Výber (tabuľka radov)
   vedú na tie isté miesta. Riadky tabuľky sú tie isté kategórie ako karty.
3. **Nadpis odtrhnutý od popisu** (blízkosť). `.section-head` dáva h2 vľavo a popis úplne vpravo,
   medzi nimi 600 px prázdna. Popis sa číta ako samostatný prvok.
4. **Nesedí na mriežke** (Müller-Brockmann). Pás faktov má 60 % (mriežka 12 stĺpcov nemá 60 %),
   tabuľka má prvý stĺpec 22 %, karty katalógu majú vlastný 5-stĺpcový raster. Každá sekcia
   si nesie inú mriežku.
5. **Nekvalitné fotky** (Refactoring UI). Fotky referencií majú 300 × 169 a 268 × 150 px,
   zobrazujú sa na 395 px, teda rozmazané. Prvá referencia nemá fotku vôbec a používa rez rúry,
   čo je zavádzajúce.
6. **Nepravidelný vertikálny rytmus.** Odstupy 64 / 96 / 176 / 200 / 230 px podľa toho, čo
   ktorá sekcia potrebovala pre presahy renderov. Škála má mať tri až štyri hodnoty.
7. **Čo funguje a ostáva:** hero s jedným renderom cez šikmú hranicu (jedno ohnisko), pás faktov
   z dát (Tufte), tabuľka výberu (dátový atrament), rodina ako jeden veľký render cez švík,
   tmavý B2B blok so šikmou hranou, alternácia bielych a modrých plôch.

## 4. Rozhodnutia (vykonané v tomto commite)

**Rozpočet obrázkov domova: tri veľké obrázky, každý iného druhu.** Render rezu (hero),
render rodiny (čo majú systémy spoločné), fotka z reálnej stavby (dôkaz). Drobné náhľady
referencií (112 × 84) sa nerátajú. Ten istý motív sa na stránke neopakuje.

| Bolo | Je |
|---|---|
| Katalóg: 5 kariet s rendermi + 2 karty dielov s fotkami | **Katalóg Microflex = jedna tabuľka bez obrázkov.** Riadok = systém (kategória) s médiom a tlakom z dát, stĺpec = 1 / 2 / 4 rúry v plášti, bunka = štítky radov (označenie výrobcu + počet dimenzií). Pod tým skupina „Spojky a príslušenstvo“: riadok = kategória, bunka cez celú šírku = skupiny s počtom produktov. Jedna tabuľka nahrádza karty aj samostatný Výber. |
| Samostatná sekcia Výber podľa použitia | zlúčená do katalógovej tabuľky (bola to tá istá navigácia) |
| Rodina: render + 3 fakty | ostáva; je to jediné miesto, kde je vidieť všetky systémy naraz |
| Referencie: 3 veľké rozmazané fotky | **zoznam 3 referencií s malými náhľadmi** (ostré aj z 300 px zdroja) vľavo, vpravo jedna ostrá fotka z výkopu (1600 px), jediná fotka zo stavby na domove |
| `.section-head` h2 vľavo, popis vpravo | popis pod nadpisom, prípadný odkaz vpravo na riadku nadpisu |
| Pás faktov 60 % | 7 z 12 stĺpcov (58,3 %), rovnaká deliaca čiara ako hero 5 / 7 |
| Tabuľka: prvý stĺpec 22 % | 25 %, teda 3 + 3 + 3 + 3 stĺpce mriežky |

Poradie domova: hero → pás faktov → Katalóg (tabuľka, modrý pás) → Rodina (render cez švík, biela)
→ Referencie (zoznam + fotka, svetlý pás) → B2B (tmavý). Bloky sa striedajú biela / modrá,
obrázok / text, takže žiadne dve susedné sekcie nemajú rovnakú formu.

Počet obrázkov po úprave: 2 rendery + 1 fotka + 3 náhľady + 1 textúra = 7 (bolo 13),
motív rezu rúry 2× (bolo 8×).

## 5. Čo z toho platí pre ďalšie stránky

- Jedno ohnisko na sekciu. Ak sekcia potrebuje obrázok, má jeden; ak má tabuľku, nemá obrázok.
- Render kategórie sa na jednej stránke ukáže raz (na stránke kategórie v hlavičke).
- Fotky pod 800 px šírky len ako náhľady do 160 px. Väčšie zobrazenie čaká na originály.
- Všetko na mriežke 12 stĺpcov s delením 5 / 7, 6 / 6, 3 × 4 alebo 4 × 3. Žiadne percentá mimo nej.
- Odstupy sekcií z jednej škály: 64 px (bežná sekcia), 96 px (sekcia s presahom), 24 / 32 px vnútri.
- Nadpis a jeho popis sú pri sebe, popis do 44 em.
- Text vľavo, obrázok vpravo, v celej stránke rovnako.

## 6. Návrhy katalógovej sekcie (22. 9. 2026)

Juraj po prestavbe: „katalóg nie je dobrý“. Tabuľka z kap. 4 má tri vady, ktoré audit nezachytil,
lebo vznikli až zlúčením: sedem z pätnástich polí je prázdnych, slovo Microflex sa opakuje
dvanásťkrát a diely majú v tej istej tabuľke iný tvar riadku (bunka cez celú šírku).

Štyri návrhy sú postavené naživo zo skutočných dát na `/navrhy/katalog/` (noindex, mimo sitemap,
po rozhodnutí sa zmaže). Každý stojí na jednom zo zdrojov z kap. 1:

| Návrh | Zdroj | Podstata | Riziko |
|---|---|---|---|
| **A Register** | Müller-Brockmann | Žiadna matica. Rad = riadok na mriežke, stĺpce rúry / nosná rúra / plášť / tlak / dimenzie. Značka raz v nadpise. | Bez obrazu, pôsobí ako cenník. |
| **B Rezy v mierke** | Tufte | Rez ku každému radu, kreslený z katalógových čísel v jednej mierke: plášť 160 mm je naozaj dvakrát väčší než 80 mm. Farba jadra = médium. Obraz bez fotky a bez opakovania motívu. | Kreslená grafika, hoci nie je ozdoba ale údaj. Treba overiť u Juraja. |
| **C Médium a rady** | Refactoring UI | Vľavo médiá ako register s počtami, vpravo rady. Hierarchia váhou písma. | Dva zoznamy vedľa seba, na mobile sa rozpadne na jeden. |
| **D Katalógový index** | tlačený katalóg, Tufte | Vodiace bodky, čísla v stĺpci. Celý sortiment na jednej obrazovke. | Najhustejší, pre laika málo pozývavý. |

Kresba v návrhu B nie je kreslená ikona v zmysle zákazu z DESIGN.md kap. 6. Je to rez odvodený
z katalógových rozmerov (`plast_mm`, priemer nosnej rúry), spoločná mierka 1 jednotka = 1 mm,
čiarkovaný obrys pri rade bez stiahnutej tabuľky. Kreslí sa zo základnej (najmenšej) veľkosti radu.

Odporúčanie: **B na domov, A na stránku Potrubia.** D ako doplnok na Na stiahnutie, C až keď
pribudne filter.

## 7. Otvorené (potrebujeme od Juraja alebo Watts)

- Fotky referencií v pôvodnom rozlíšení (aspoň 1 200 px) a fotka vojenskej základne; dovtedy
  sú referencie len zoznam s náhľadmi.
- Stránka Výber potrubia (/vyber/) je zástupná; odkaz „Sprievodca výberom v troch krokoch“ na ňu
  vedie. Sprievodca je fáza F2.
