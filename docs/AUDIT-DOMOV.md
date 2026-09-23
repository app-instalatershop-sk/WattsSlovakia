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

Odporúčanie bolo B na domov a A na stránku Potrubia.

**Ako to dopadlo:** Juraj si nevybral ani jeden z týchto štyroch a poslal vlastný návrh, ktorý je
teraz postavený (`web/src/components/Katalog.astro`). Záložky sú kategórie, v paneli sú veľké rendery
radov s názvom a počtom rúr v plášti, pod nimi riadok s vyhotoveniami PRIMO a odkaz na celý katalóg,
dole skupiny spojok a príslušenstva. Pracovná stránka s návrhmi je zmazaná.

Rozpočet obrázkov z kap. 4 tým nie je porušený: rendery sú síce späť, ale naraz sú viditeľné najviac
tri, líšia sa počtom rúr a sú veľké, takže nesú informáciu. Pravidlo z kap. 3 znelo „neopakovať ten
istý motív“, nie „nepoužívať rendery“. Preto rady, ktoré v dátach zdieľajú render so súrodencom
(PRIMO), dlaždicu nedostanú.

## 7. Otvorené (potrebujeme od Juraja alebo Watts)

- Fotky referencií v pôvodnom rozlíšení (aspoň 1 200 px) a fotka vojenskej základne; dovtedy
  sú referencie len zoznam s náhľadmi.
- Stránka Výber potrubia (/vyber/) je zástupná; odkaz „Sprievodca výberom v troch krokoch“ na ňu
  vedie. Sprievodca je fáza F2.

## 8. Domov v4: analýza a redizajn (23. 9. 2026)

Podnet (Juraj): „Navrhni čo najlepší a najpútavejší design, kľudne asymetrický, rôznorodý, nemusí
byť štvorec vedľa seba, ale akokoľvek po stránke. Urob analýzu a potom konaj.“ Meranie je zo stavu
po commitoch 712af41 a 33bba8b pri 1 440 × 900 a 390 × 844.

### 8.1 Zistenia

1. **Jednotvárne ukotvenie.** Päť zo šiestich sekcií malo text vľavo a obrázok vpravo. Pravidlo
   z kap. 5 („text vľavo, obrázok vpravo v celej stránke rovnako“) dalo poriadok, ale aj rytmus
   jedného opakovaného vzoru.
2. **Katalóg ako štvorce vedľa seba.** Dlaždice boli vycentrované, popisy na stred (brief kap. 5:
   text vždy vľavo), záložky roztiahnuté cez celú šírku s veľkými medzerami. Pri UNO a QUADRO bol
   vidieť rovný rez tela rúry na ľavom okraji renderu. Maska a tieň boli na tom istom obrázku
   (pasca z 21. 9.), takže tieň sa orezával.
3. **Nepravdivá veta.** „Rovnaká nosná rúra PE-Xa“ pri rodine neplatí: rady COOL majú nosnú rúru
   z PE 100 podľa EN ISO 12201 do 16 bar (katalóg s. 16 až 18). Spoločná je stavba, nie materiál.
4. **Neúplné číslo.** Pás pod hero hlásil tlak „6 / 10 bar“, lebo COOL nemal v dátach tlak.
5. **Akcie do prázdna.** Žlté tlačidlo viedlo na zástupnú stránku /vyber/, druhý odkaz na zástupnú
   /na-stiahnutie/ (zistené už v rozbore hero, /navrhy/hero/).
6. **Duplicita.** Veta o partnerstve v hero opakovala horný pás, ktorý hovorí to isté aj s logom.
7. **Premárnený obraz.** Kotúč, jediná fotka, ktorá ukazuje, ako sa potrubie dodáva, bol len
   odfarbenou textúrou pod blokom Pre firmy.
8. **Referencie.** Prvý náhľad bol rez rúry, nie stavba; ostatné náhľady boli z 300 px zdrojov.
9. **Chyba na mobile.** Render rodiny prekrýval posledný riadok úvodného textu.
10. **Chýbajúca odpoveď.** Montážnik aj majiteľ domu sa pýtajú, ako sa potrubie kladie a ako dlho to
    trvá. Katalóg výrobcu na to má čísla (s. 36 doba inštalácie, s. 37 zemné práce), web nie.

### 8.2 Koncept: z kotúča do zeme

Stránka ide po ceste výrobku: čo to je (hero), ktoré potrebujem (katalóg), z čoho je (rodina), ako
sa kladie (pokládka), kde už leží (referencie), čo majú profesionáli (Pre firmy). Tón ide od bielej
(povrch) cez svetlomodrú do tmavomodrej (podzemie). Každá sekcia je „dvojstrana“ s iným ukotvením
a jej hlavný obrázok prekračuje hranu: okraj obrazovky, švík pásu alebo šikmú hranu podzemia.
Výrazná vec je jedna, kotúč s nadpisom v jeho vnútri; ostatné je pokojné.

### 8.3 Rozhodnutia

| Sekcia | Bolo | Je |
|---|---|---|
| Hero | predloha Juraja, tlačidlo na zástupnú stránku, veta o partnerstve | predloha ostáva; väčší render cez okraj; prvý riadok nadpisu sa pri načítaní roztiahne po osi šírky písma; žlté tlačidlo na výber pod ním (`#vyber`), odkaz priamo na katalóg PDF s veľkosťou; veta o partnerstve preč |
| Pás čísel | 6 / 10 bar | 6 / 10 / 16 bar (COOL doplnený v `data/normalize.py` podľa katalógu) |
| Katalóg | záložky cez šírku, vycentrované dlaždice | register vľavo so žltou značkou a počtom radov, popis kategórie pod ním; štúdio vpravo so spoločnou podlahou, popisy vľavo na jednej linke, pod názvom počet dimenzií a rozsah plášťa z dát; doznenie renderu aj zľava |
| Rodina | render + tri rovnaké stĺpce faktov | render cez švík a za okraj; stavba potrubia ako tri vrstvy vnorené do seba, linky vo farbe vrstiev; opravená veta o materiáloch |
| Pokládka | nebola | nová: kotúč cez ľavý okraj, text v jeho vnútri, „Sto metrov za štyridsať minút.“, štyri kroky zo s. 37 s rúrou, ktorá sa pri rolovaní rozvinie, zaťaženie až 60 t, zdroj a odkaz na s. 37 |
| Referencie | zoznam s náhľadmi (5) + fotka (7) na svetlom páse | tmavé podzemie so šikmou hranou, fotka z výkopu hranu prekračuje, zoznam bez náhľadov |
| Pre firmy | tmavý blok s textúrou kotúča a šikmou hranou | pokračovanie podzemia bez textúry, spodok nadväzuje na pätičku bez schodu |

Obrázky na domove: render rezu, rendery radov v štúdiu (naraz 1 až 3), render rodiny, fotka kotúča,
fotka z výkopu. Každý v inej úlohe a v inej sekcii, na obrazovku pripadá najviac jeden veľký.

Technické poznámky pre ďalšie stránky:
- Premenná `--bleed` (global.css) je vzdialenosť od okraja mriežky k okraju obrazovky. Prvok, ktorý
  má dobehnúť za okraj, ju použije ako záporný okraj; sekcia potrebuje `overflow-x: clip`.
- Fotka s čisto bielym pozadím môže byť „voľný objekt“ ako priehľadný render: `mix-blend-mode:
  multiply` na obale (nie na obrázku v samostatnej vrstve), biela potom splynie s pásom.
- Pseudoprvok, ktorý presahuje sekciu (svetlo štúdia), na tablete spôsobil vodorovné rolovanie;
  sekcia s takým prvkom má mať `overflow-x: clip`.
- Rady v štúdiu zarovnáva podmriežka (`grid-template-rows: subgrid`), nie pevná výška názvu.

### 8.4 Otvorené pre Juraja

- Nadpis hero ostal podľa predlohy („Flexibilné potrubie. Precízne riešenie.“). Z rozboru hero ostáva
  návrh „Potrubie, ktoré sa ohne okolo prekážky.“; rozhodnutie je na Jurajovi.
- Pracovnú stránku `/navrhy/hero/` treba po schválení zmazať; body 2A, 3A, 4 (kotva na výber), 5B,
  6C, 7A, 8A a 9A z nej sú v domove.
- Tlak pre QUADRO (6 bar vykurovacie a 10 bar sanitárne rúry) a HP (nie je v slovenskom katalógu)
  v dátach chýba; pás čísel ich nezapočítava.

## 9. Pripomienky k v4 a úpravy (23. 9. 2026)

| Pripomienka Juraja | Príčina | Úprava |
|---|---|---|
| Katalóg: „niekde sú 4 rady, ukázané sú len 2“ | vyhotovenia PRIMO boli len v riadku textu | každý rad má v štúdiu vlastný riadok s názvom a odkazom; PRIMO pod renderom základného radu s odlišnosťou „užší plášť pri tej istej rúre“ |
| Hero: „grafika veľmi jednoduchá, ničím nezaujme“ | jeden render na svetlom poli bez ďalšej vrstvy | technické popisy pri renderi, sústredné kružnice za rezom, odlesk po plášti, jemný pohyb za myšou |
| Pás čísel: „vyzerá neprofesionálne, netuším, aký má zmysel“ | čísla bez vzťahu k tomu, čo opisujú | pás zrušený, čísla sú popisy s bodom priamo na mieste, ktoré opisujú |
| Rodina: „balenie je rozumná voľba, grafika slabá, tri čiarky“ | vnorenie ukazovali len tri farebné čiary | vnorené plochy vo farbách vrstiev so skutočnými detailmi materiálu, na počítači zľava doprava ako rez |
| Navigácia: „vyzerá ako AI z minulého roka“ | text vedľa textu, ťažké modré tlačidlo hľadania | znak M, panel Potrubia s rendermi piatich systémov, klzná žltá značka, pole hľadania so skratkou, E-shop ako tlačidlo |

Nájdené pri tom: na tablete (760 až 1 100 px) navigácia zmizla a tlačidlo Menu sa neukázalo; tlačidlo
Menu po otvorení stratilo ikonu a nezmenilo text. Obe chyby sú opravené.

Doplnok 23. 9.: kóty v hero boli pri širšej obrazovke na plášti a zle čitateľné, lebo dĺžky čiar boli
v pevných pixeloch, zatiaľ čo render rástol. Teraz rastú s obrázkom a štítky majú podklad. Kružnice
a tieň rúry sa orezávali na spodnej hrane hero, ktorá ležala cez šikmý pás katalógu; hero už zvislo
neorezáva a kružnice doznejú nad pásom.
