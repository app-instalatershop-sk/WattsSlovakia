# Audit domovskej stránky 30. 10. 2026

Snímky domova pred zmenami z auditu a po nich. Audit robila samostatná relácia 30. 10., zmeny sú
commitnuté 3. 11. 2026 spolu s týmito snímkami.

| Snímka | Čo ukazuje |
|---|---|
| `01-pred-desktop.png` | hero na počítači |
| `02-pred-katalog.png` | katalóg „Každý projekt má svoje potrubie.“ so zvislým zoznamom použití |
| `03-pred-mobil.png` | hero na telefóne |
| `04-pred-mobil-katalog.png` | katalóg na telefóne, použitia ako zalomené voľby |
| `05-pred-technicka-sekcia.png` | rozložený rez „Z čoho je potrubie“, nezvýraznené vrstvy zosvetlené |
| `06-po-desktop.png` | hero so skratkami do sekcií (medzistav, skratky ešte s dlhšími názvami) |
| `07-po-mobil.png` | hero na telefóne so skratkami |
| `08-po-mobil-katalog.png` | katalóg „Vyberte potrubie podľa použitia.“, použitia v mriežke |

Čo sa zmenilo:

- **Hero:** skratky Potrubia, Konštrukcia, Pokládka a Referencie vedú na `#vyber`, `#konstrukcia`,
  `#pokladka` a `#projekty`. Hero je nižší.
- **Ukážky pri rolovaní:** rozložený rez, ohyb a kotúč majú na domove kratšiu dráhu. Text vrstiev
  a krokov je čitateľný aj pred zvýraznením.
- **Katalóg:** na tablete a telefóne sú použitia v mriežke namiesto posuvného pásu. Bodky pod radmi
  sú tlačidlá s popisom.
- **Kontrast:** sivá `#7a8494` je nahradená `var(--color-ink-soft)`, zdroj má 14 px a fokus
  v podzemí je žltý.
