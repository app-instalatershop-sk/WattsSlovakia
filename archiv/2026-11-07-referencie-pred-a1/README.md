# Stránka Referencie pred verziou A1

Odložené 7. 11. 2026. Posledný stav na webe: commit `f171766` (súbor `Referencie.astro` v tomto priečinku je z neho).

## Čo to bolo

`web/src/templates/Referencie.astro` (SK `/referencie/`, CS `/cs/reference/`): Hlava v rozložení „vedľa“ s fotkou
z vojenskej základne v Orange (`orange-4.jpg`), potom štyri stavby ako rovnaké bloky striedavo vľavo a vpravo
(hadovito): hlavná fotka s kótami (`Scena`), pod ňou náhľady, ktoré prepínali hlavnú fotku (skript v šablóne),
vedľa miesto a dátum, nadpis, perex, fakty v mliečnych riadkoch, realizácia, odkaz na rad a na watts.eu.
Prvá stavba (Považská Bystrica, naša dodávka) ukazovala kotolňu, nie potrubie.

Snímky: `referencie-pc.jpg`, `referencie-mobil.jpg` (prvé obrazovky), `referencie-cela-stranka-pc.jpg`,
`referencie-cela-stranka-mobil.jpg`.

## Prečo preč

Juraj 6. 11. 2026: „Daj mi 3 obrázkové možnosti na referencie stránku, išlo by o redesign, nekladiem ti medze.“
Z návrhov A, B, C vybral smer A „Hlavná stavba“ a z jeho verzií A1 až A3 verziu A1 („Postav verziu A1“). Nálezy
na starej stránke: fotka v hlave z Francúzska, hoci prvá stavba je naša dodávka zo Slovenska; naša dodávka nebola
nijako odlíšená; štyri rovnaké bloky dávali dlhú, jednotvárnu stránku; menšie stavby boli až po dlhom rolovaní;
fotky sa dali vidieť len klikaním na náhľady. Návrhy sú v `../navrhy-referencii-2026-11-06/`.

## Ako to vrátiť

1. `Referencie.astro` z tohto priečinka skopírovať do `web/src/templates/` (alebo
   `git show f171766:web/src/templates/Referencie.astro`).
2. Dáta v `web/src/content/referencie.ts` stará šablóna nepotrebuje meniť: nové polia (`typ`, `mesto`, `rok`,
   `rozsah`, `potrubie`, `popisy`) len nepoužije. Poradie fotiek Orange sa zmenilo (orange-6 pred orange-4), na starej
   stránke to mení len poradie náhľadov.
3. `Scena.astro` (vlastnosť `orez`) a `Koty.astro` (štítok bez prázdneho popisu) sú spätne kompatibilné, netreba ich vracať.
