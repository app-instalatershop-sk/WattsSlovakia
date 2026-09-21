# Úpravy obrázkov (zadanie pre Photoshop alebo online nástroj)

Upravené súbory ukladať do tohto priečinka pod uvedeným názvom. Formát: PNG s priehľadnosťou (24-bit
+ alfa), farebný profil sRGB, orezané na obsah s okrajom asi 2 %, bez zapečeného tieňa, ak nie je uvedené inak.
Upscale: Photoshop „Super Zoom“ / „Preserve Details 2.0“ alebo Topaz Gigapixel, bez umelého doostrenia.

| # | Zdrojový súbor | Čo urobiť | Uložiť ako | Na čo to použijem |
|---|---|---|---|---|
| 1 | `podklady/watts/banner/microflex-banner-2025-09.jpg` (8000 × 3025) | vyrezať samotný rez potrubia (DUO s izoláciou) bez modrého pozadia, priehľadné pozadie, šírka aspoň 4000 px | `hero-rez-duo.png` | hero na domove: potrubie voľne položené na našom modrom poli, aj obrázok pre zdieľanie |
| 2 | `podklady/watts/fotky-katalog/katalog-s06-x53.jpeg` (1216 × 717) | odstrániť sivý tieň a pozadie, upscale 2× na približne 2400 px, priehľadné pozadie | `rodina-potrubi.png` | sekcia „Päť systémov, jedna rodina“ a hlavička stránky Potrubia |
| 3 | `podklady/watts/piktogramy/rad-*.png` (9 súborov, 250 až 350 px, už priehľadné) | upscale na 1200 px na dlhšej strane, zachovať priehľadnosť, rovnaké mená | `piktogramy/rad-*.png` | dlaždice použitia, hlavičky kategórií, karty radov |
| 4 | `web/src/assets/rady/microflex-uno-6-bar.jpg`, `microflex-duo-6-bar.jpg`, `microflex-uno-primo-6-bar.jpg`, `microflex-uno-10-bar.jpg`, `microflex-duo-10-bar.jpg`, `microflex-cool.png`, `microflex-cool-duo.png`, `microflex-cool-s-vyhrievacim-kablom.png`, `microflex-hp.png` (1000 px; originály s dlhšími názvami sú v `podklady/watts/fotky-rady/`) | odstrániť biele pozadie, priehľadné pozadie, veľkosť ponechať | `rady/<rovnaký názov>.png` | karty katalógu a galéria na stránke radu na radiálnej ploche |
| 5 | `web/src/assets/rady/microflex-quadro.png` (500 × 500) | upscale na 1200 px, odstrániť pozadie | `rady/microflex-quadro.png` | to isté, QUADRO je dnes jediný malý render |
| 6 | `podklady/watts/fotky/microflex-prierez-vykop.jpg` (500 × 500, skutočná fotka rezu DUO) | upscale 3× na 1500 px, potlačiť šum, nič neorezávať | `prierez-duo-1500.jpg` | referencie a mobilný hero, dnes je to naša jediná skutočná fotka rezu |
| 7 | `podklady/watts/fotky/microflex-vykop-spojky.jpg` (1600 × 1066) | upscale na 2400 px, jemne zjednotiť farby (modrá plášťa rovnaká ako na renderoch) | `vykop-spojky-2400.jpg` | fotka z výkopu v sekcii referencií a v poradni |
| 8 | `podklady/watts/fotky-referencie/referencia-skola.png` (300 × 169) a `referencia-povazska-bystrica.jpg` (268 × 150) | ideálne vypýtať originály od Watts; ak nie sú, upscale na 1200 px ako dočasné riešenie | `referencia-skola.jpg`, `referencia-povazska-bystrica.jpg` | karty referencií, dnes sú rozmazané |
| 9 | `podklady/watts/fotky-katalog/katalog-s01-x16943.jpeg` (2105 × 1641, kotúč) | vyrezať kotúč bez pozadia, priehľadné pozadie | `kotuc.png` | dekoratívny prvok do pozadia sekcií a pätičky |

Poradie podľa prínosu: 1, 2, 3, 4. Body 5 až 9 sú doplnky.

## Ak sa bude fotiť naživo (najväčší prínos)

Odrezky UNO, DUO, QUADRO, COOL a HP: čelný rez a rez pod 45°, na bielom a na tmavomodrom pozadí,
mäkké rozptýlené svetlo, aspoň 3000 px na dlhšej strane, formát RAW alebo JPEG v najvyššej kvalite.
Uložiť do `podklady/vlastne/`.
