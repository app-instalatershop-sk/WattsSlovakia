# Podklady

Materiály výrobcu a vlastné podklady pre web Microflex Slovensko.

## podklady/watts

Podklady výrobcu Watts stiahnuté zo slovenskej verzie watts.eu 21. 9. 2026. **Použitie so súhlasom
Watts** (dlhodobá spolupráca, popredný e-shop pre ich produkty; potvrdil Juraj 21. 9. 2026).
Zdrojové adresy každého súboru sú v `watts/manifest.json`.

| Priečinok / súbor | Čo je to |
|---|---|
| `Microflex-katalog-SK.pdf` | Katalóg Microflex po slovensky, 44 strán, vydanie december 2022, 19 MB. Hlavný zdroj technických údajov. |
| `Microflex-brozura-EN-2026-05.pdf` | Brožúra Pre-insulated flexible pipes Microflex, anglicky, máj 2026, 1 MB. Novšie texty a fotky. |
| `loga/watts-logo.png` | Logo Watts z hlavičky webu, 571 × 108 px, priehľadné PNG. |
| `loga/watts-logo-4c.eps` | Logo Watts vo vektore (4C), originál výrobcu. |
| `loga/microflex-logo.svg` | Oficiálne logo MICROFLEX® vo vektore, farba #074EA2. Vytiahnuté z katalógu `Microflex-katalog-SK.pdf`, s. 3 (PyMuPDF `get_drawings`, výplne v modrej loga nad heslom), bez hesla „Flexibility, all the way.“. Overené proti vykresleniu PDF. |
| `banner/microflex-banner-2025-09.jpg` | Hero banner Microflex z domovskej stránky watts.eu, 8000 × 3025 px (render rezu potrubia na modrej). |
| `fotky/microflex-prierez-vykop.jpg` | Skutočná fotka rezu DUO na kotúči, 500 × 500 px. Použitá v makete hero s popiskami. |
| `fotky/microflex-vykop-spojky.jpg` | Skutočná fotka výkopu s potrubím a spojkami, 1600 × 1066 px, originál 1 MB. Hero fotka makety. |
| `fotky-kategorie/` | Obrázky kategórií z prehľadovej stránky (200 px, len náhľady). |
| `fotky-rady/` | Obrázky radov z listingov a hlavné fotky radov z galérií (do 1000 px). Súbory `*-hlavna` sú z galérie stránky radu. |
| `fotky-referencie/` | Náhľady referencií (škola, Považská Bystrica), malé. Väčšie verzie treba vypýtať od Watts. |
| `fotky-katalog/` | Veľké obrázky vytiahnuté z PDF katalógu: kotúč (2105 px), rodina potrubí UNO/DUO/QUADRO/COOL (`s06`), rendery montáže a prestupu stenou (`s35`), rez výkopom s uložením (`s37`), graf tlakovej skúšky (`s41`). |

**Logo Microflex existuje** (oprava 23. 9. 2026): je na s. 3 katalógu, nad heslom „Flexibility, all the
way.“. Na obale katalógu je „Microflex - Katalóg“ len textom, preto sa 21. 9. prehliadlo. Web používa
toto oficiálne logo s doplnkom „Slovensko“.

**Ako podklady obnoviť alebo doplniť:** HTML stránky watts.eu vracajú skriptom chybu 403, sťahovanie ide
cez prehliadač (Playwright, `fetch` v kontexte stránky). Originál obrázka dostaneme, keď v adrese
`/dfsmedia/<id>-<rendition>/<čas>` nahradíme číslo renditionu slovom `source`. PDF sa dajú stiahnuť
priamo (curl).

## Čo ešte potrebujeme

- Vlastné makro fotky odrezkov UNO, DUO, QUADRO, COOL a HP (čelný rez, rez pod 45°, na bielej a na
  tmavomodrej). Najunikátnejší obsah webu.
- Fotky z montáží od našich zákazníkov a montážnych firiem, so súhlasom na zverejnenie.
- Od Watts: referenčné fotky vo veľkom rozlíšení, prípadne produktové fotky nad 1000 px.
