# Návrhy katalógu na domove (5. 11. 2026)

Juraj 5. 11. 2026 chcel tri návrhy na sekciu „Vyberte potrubie podľa použitia.“. Návrhy sú makety: do domova
z `web/dist` sa vložil iný obsah sekcie a odfotil sa pri 1 440 px (počítač) a 390 px (telefón). Postavená bola
**G2 (bento podľa použitia)**, je na webe v `web/src/components/Katalog.astro`. Ostatné sú tu na inšpiráciu.

| Návrh | Snímka | Myšlienka | Rozhodnutie |
|---|---|---|---|
| A Štúdio s ovládaním | [počítač](obrazky/1-A-studio-s-ovladanim-pc.jpg) · [telefón](obrazky/1-A-studio-s-ovladanim-mobil.jpg) | pôvodný koncept, použitia ako tlačidlá s čelom rúry, karta s rozmermi, polica dielov | nie |
| B Celý sortiment naraz | [počítač](obrazky/2-B-cely-sortiment-pc.jpg) · [telefón](obrazky/2-B-cely-sortiment-mobil.jpg) | 12 kariet radov s filtrom použitia | nie |
| C Sprievodca | [počítač](obrazky/3-C-sprievodca-pc.jpg) · [telefón](obrazky/3-C-sprievodca-mobil.jpg) | dve otázky, jeden rad, mierka dimenzií, diely k nemu | najprv áno, potom zrušené: zdvojoval /vyber/ |
| C1 Konfigurátor | [počítač](obrazky/C1-konfigurator-pc.jpg) · [telefón](obrazky/C1-konfigurator-mobil.jpg) | pódium s výrobkom vľavo, voľby so zaškrtnutím vpravo | nie (s C) |
| C2 Dlaždice a produktový list | [počítač](obrazky/C2-dlazdice-a-produktovy-list-pc.jpg) · [telefón](obrazky/C2-dlazdice-a-produktovy-list-mobil.jpg) | zhora nadol, prepínače počtu rúr a plášťa | nie (s C) |
| C3 Výstavná sieň | [počítač](obrazky/C3-vystavna-sien-pc.jpg) · [telefón](obrazky/C3-vystavna-sien-mobil.jpg) | veľký výrobok, sklenený panel s voľbami | nie (s C) |
| G1 Mriežka s filtrom | [počítač](obrazky/G1-mriezka-s-filtrom-pc.jpg) · [telefón](obrazky/G1-mriezka-s-filtrom-mobil.jpg) | ako e-shop: 12 kariet a polica 7 dielov | nie |
| G3 Prehľad v stĺpcoch | [počítač](obrazky/G3-prehlad-v-stlpcoch-pc.jpg) · [telefón](obrazky/G3-prehlad-v-stlpcoch-mobil.jpg) | celý sortiment na jednu obrazovku s náhľadmi | nie |

Použiteľné časti, keby sme podobné niečo robili: mierka všetkých dimenzií so štítkami z `web/src/data/mierka.json`
(C, C1 až C3), diely k radu z `rady.suvisiace` (C), prepínače vlastností (C2), sklenený panel s voľbami (C3).

**Skripty** (`skripty/`): `navrhy.mjs` (A, B, C), `verzie-c.mjs` (C1 až C3), `mriezky.mjs` (G1 až G3). Funkcie
`navrh…()` vracajú HTML a CSS sekcie. Spustenie: `node archiv/navrhy-katalogu-2026-11-05/skripty/<súbor> [mená]`.
Potrebujú zostavený web (`npm run build` vo `web`), Playwright z `audit/scripts` a server
`snimky-stranok/_skripty/server.mjs`. Snímky ukladajú do `snimky-stranok/navrh-katalog/` (mimo gitu). Čelá rúr
berú z `web/src/assets/3d/cela` (`data/cela_rur.py`).
