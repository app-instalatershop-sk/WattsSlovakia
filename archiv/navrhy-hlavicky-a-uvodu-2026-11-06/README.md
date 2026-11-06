# Návrhy hlavičky a úvodu domova (6. 11. 2026)

Juraj 6. 11. 2026 so snímkou domova: horná lišta pôsobí krátko, lebo pole hľadania je krátke (nad 1 500 px
malo 141 px, na text 45 px), a ľavá strana úvodu je „slabá, chaotická, veľa informácií, rôzne písma
a veľkosti“; chcel po tri možnosti ako obrázky. Návrhy sú makety: do domova z `web/dist` sa v prehliadači
vložil iný obsah a odfotil sa pri 1 600 px (počítač, @1,25) a 390 px (telefón, @2). Postavené sú
**hlavička A** (commit `cf27343`, `web/src/components/Hlavicka.astro`) a **úvod K3-A** (`web/src/templates/Domov.astro`).

## 1. kolo: hlavička a úvod

| Návrh | Snímka | Myšlienka | Rozhodnutie |
|---|---|---|---|
| Stav pred návrhmi | [počítač](obrazky/1-kolo-0-dnes-pc.jpg) · [telefón](obrazky/1-kolo-0-dnes-mobil.jpg) | tmavý horný pás, menu a krátke hľadanie v jednom riadku | |
| Hlavička A Hľadanie v strede | [počítač](obrazky/1-kolo-H1-A-hladanie-v-strede-pc.jpg) · [telefón](obrazky/1-kolo-H1-A-hladanie-v-strede-mobil.jpg) | ako e-shop: logo, široké pole, telefón, jazyk, E-shop; menu, Kontakt a partner v druhom riadku | **áno, postavená** |
| Hlavička B Jedna lišta | [počítač](obrazky/1-kolo-H2-B-jedna-lista-pc.jpg) · [telefón](obrazky/1-kolo-H2-B-jedna-lista-mobil.jpg) · otvorené: [počítač](obrazky/1-kolo-H2-B-jedna-lista-otvorene-hladanie-pc.jpg), [telefón](obrazky/1-kolo-H2-B-jedna-lista-otvorene-hladanie-mobil.jpg) | tlačidlo Hľadať s Ctrl K otvorí veľký panel, bez horného pásu | nie |
| Hlavička C Svetlý horný pás | [počítač](obrazky/1-kolo-H3-C-svetly-horny-pas-pc.jpg) · [telefón](obrazky/1-kolo-H3-C-svetly-horny-pas-mobil.jpg) | svetlý pás, logo v dvoch riadkoch, pole 380 px | nie |
| Úvod A Poriadok | [počítač](obrazky/1-kolo-U1-A-poriadok-pc.jpg) · [telefón](obrazky/1-kolo-U1-A-poriadok-mobil.jpg) | tri štýly textu, dôvera v jednom riadku, skratky ako čipy | nie |
| Úvod B Dôvera v karte | [počítač](obrazky/1-kolo-U2-B-dovera-v-karte-pc.jpg) · [telefón](obrazky/1-kolo-U2-B-dovera-v-karte-mobil.jpg) | Watts a predaj v jednej karte, bez skratiek | nie |
| Úvod C Hľadanie v úvode | [počítač](obrazky/1-kolo-U3-C-hladanie-v-uvode-pc.jpg) · [telefón](obrazky/1-kolo-U3-C-hladanie-v-uvode-mobil.jpg) | veľké pole s príkladmi obj. čísiel | nie |
| Odporúčané A + B | [počítač](obrazky/1-kolo-9-odporucane-hlavicka-A-uvod-B-pc.jpg) · [telefón](obrazky/1-kolo-9-odporucane-hlavicka-A-uvod-B-mobil.jpg) | | hlavička áno, úvod „chcem inak, zmeň aj grafiku a dizajn“ |

## 2. kolo: úvod inak (všetky už s hlavičkou A)

Spoločné: partner preč z úvodu (je v hlavičke), skratky preč, predaj ako jeden riadok.

| Návrh | Snímka | Myšlienka | Rozhodnutie |
|---|---|---|---|
| K1 Veľký titul | [počítač](obrazky/2-kolo-K1-velky-titul-pc.jpg) · [telefón](obrazky/2-kolo-K1-velky-titul-mobil.jpg) | redakčný štýl, nadpis až 98 px, druhý riadok tenký modrý | nie |
| K2 Žlté jadro | [počítač](obrazky/2-kolo-K2-zlte-jadro-pc.jpg) · [telefón](obrazky/2-kolo-K2-zlte-jadro-mobil.jpg) | žltá čiara od tlačidla do žltej nosnej rúry (len počítač) | nie (nápad na neskôr) |
| K3 Materiál | [počítač](obrazky/2-kolo-K3-material-pc.jpg) · [telefón](obrazky/2-kolo-K3-material-mobil.jpg) | tmavý pás z plášťa HDPE (rebrovanie z makra 3D modelu), ohnutý predeľ, render cez hranu | **áno**, s úpravou |

## 3. kolo: K3 podľa Juraja

„Pravú stranu daj tak, aby nepresahovala ľavú, predeľ našikmo sa mi páči, aj pravú stranu vyrovnaj predelom,
aby spodná ľavá časť pravej časti začínala na výške, kde končí ľavá.“ Dva výklady:

| Návrh | Snímka | Myšlienka | Rozhodnutie |
|---|---|---|---|
| K3-A Ako to chápem | [počítač](obrazky/3-kolo-K3-A-ako-to-chapem-pc.jpg) · [telefón](obrazky/3-kolo-K3-A-ako-to-chapem-mobil.jpg) | rúra celá vpravo od predelu, spodok čela na výške, kde končí pás | **áno, postavený** („Použi A.“) |
| K3-B Rovný spodok | [počítač](obrazky/3-kolo-K3-B-rovny-spodok-pc.jpg) · [telefón](obrazky/3-kolo-K3-B-rovny-spodok-mobil.jpg) | obe strany končia na jednej rovnej čiare, pás katalógu bez šikmej hrany, rúra v strede | nie |

## 4. kolo: úvod K3-A na telefóne

Juraj 6. 11. 2026 po stavbe: „Na telefóne to nevyzerá moc pekne, ten vrch silno modrý, nedá sa tam fotka upraviť,
aby bola vidno lepšie?“ Na telefóne bol pás bez fotky (len tmavý prechod). Skúšky fotky plášťa v páse pri 390 px:

| Variant | Snímka | Myšlienka | Rozhodnutie |
|---|---|---|---|
| Stav po stavbe | [telefón](obrazky/4-kolo-telefon-dnes.jpg) | tmavomodrý pás bez fotky | nie |
| M1 Fotka hore | [telefón](obrazky/4-kolo-telefon-M1.jpg) | fotka hore, prechod do tmavej; výrez na rozmazané vrchy rebier | nie (zlý výrez) |
| M1b Prierezy rebier | [telefón](obrazky/4-kolo-telefon-M1b.jpg) | fotka hore, výrez na rad prierezov rebier v tvare U, plné rozlíšenie | **áno, postavený** |
| M1c Širší pohľad | [telefón](obrazky/4-kolo-telefon-M1c.jpg) | to isté, viac a menších rebier | nie |
| M2 Fotka za celým pásom | [telefón](obrazky/4-kolo-telefon-M2.jpg) | fotka presvitá cez polopriesvitnú modrú | nie (stále „silno modrý“) |
| M3 Fotka vpravo dole | [telefón](obrazky/4-kolo-telefon-M3.jpg) | odkrýva sa smerom k spodku ako pri predele na počítači | nie (svetelné pruhy pôsobia náhodne) |

**Skripty** (`skripty/`): `navrhy.mjs` (1. kolo; vkladá zmeny do stavby pred `cf27343`, s tmavým horným pásom),
`uvod2.mjs` (2. kolo), `uvod3.mjs` (3. kolo; render umiestni výpočtom z `duo-profil.json` a krivky predelu), `uvod-mobil.mjs` (4. kolo),
`predel_rura.py` (obrys rúry z alfa kanála renderu a najmenšia vzdialenosť od predelu: 7,18 u, v Domov.astro
7,2 u + 28 px). Spustenie: `node archiv/navrhy-hlavicky-a-uvodu-2026-11-06/skripty/<súbor> [mená]`; potrebujú
zostavený web (`npm run build` vo `web`), Playwright z `audit/scripts` a server `snimky-stranok/_skripty/server.mjs`.
Snímky ukladajú do `snimky-stranok/navrh-hlavicka-uvod/` (mimo gitu). PASCA pri maketách s výpočtom polohy:
pri obmedzenom pohybe má web prechody 0,01 ms, poloha sa v tej istej slučke neprepočíta, treba
`transition: none`; absolútne umiestnený prvok mriežky s `grid-area` sa ráta od svojej oblasti mriežky.
