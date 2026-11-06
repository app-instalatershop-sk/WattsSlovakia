# Stránka produktu pred návrhom A (rad potrubia a diel)

Odložené 6. 11. 2026. Posledný stav na webe: commit `2ac3575` (súbory v tomto priečinku sú z neho).

## Čo to bolo

- **Stránka radu** (`Rad.astro`): hlava v rozložení „štúdio“ (Hlava `rozlozenie="studio"`): nadpis vľavo, popis
  a žlté „Vybrať dimenziu“ vpravo nad renderom, výber priemeru (`VolbaDimenzie.astro`, lišta s tlačidlom
  „Všetky“) a prepínač Pohľad/Teplota (`TeploRezim.astro`, tlačidlo Teplota v dúhových farbách) v ľavom
  stĺpci, render vpravo. Teplota mala tmavú obrazovku za výrobkom. Pod hlavou plávajúci pás častí
  (`CastiStranky.astro`, ten ostáva na stránkach skupín), poradie: varianty, stavba, na stiahnutie,
  referencie, spojky a príslušenstvo (karty skupín so zoznamom odkazov), osamelý riadok „Označenie výrobcu“.
- **Stránka dielu** (`Produkt.astro`): hlava vedľa seba (text vľavo, fotka vpravo), žlté „Obj. čísla ↓“,
  „Hľadať v e-shope“ ako odkaz.

Snímky: `rad-uno-pc.jpg`, `rad-uno-mobil.jpg`, `rad-duo-pc-teplota-s-panelom.jpg`, `rad-uno-cela-stranka-pc.jpg`,
`rad-duo-cela-stranka-mobil.jpg`, `spojka-pc.jpg`, `spojka-mobil.jpg`.

## Prečo preč

Juraj 6. 11. 2026: „Teplotná mapa nemá mať pozadie… potrebujem nové rozloženie a design stránky produktov.
Nech to má hlavu a pätu.“ Z návrhov A, B, C vybral A „Produktová karta“ („Chcem A verziu, nech to aj na mobile
vyzerá super“). Rozbor starého stavu: oko skákalo cik-cak (nadpis vľavo, tlačidlá vpravo, výber vľavo), žlté
tlačidlo len skočilo do tabuľky a kúpa bola odkaz, priemer 110 visel osamote, na telefóne sa väčšie priemery
schovali za okraj, prepínač teploty bol ďaleko od obrazu. Návrhy sú v `../navrhy-stranky-produktu-2026-11-06/`.

## Ako to vrátiť

1. `Rad.astro` a `Produkt.astro` skopírovať do `web/src/templates/`, `VolbaDimenzie.astro` a `TeploRezim.astro`
   do `web/src/components/`. Pozor: `Rad.astro` tu ešte nemá teplotu bez tmavej obrazovky a štítky tepla mimo
   výrobku (`kotyTepla`), tú zmenu z novej verzie treba preniesť, ak má ostať.
2. Texty v `web/src/content/stranky.ts` (rad, SK / CS): `vybrat: 'Vybrať dimenziu'` / `'Vybrat dimenzi'`,
   `volbaPlast: 'Plášť a izolácia'` / `'Plášť a izolace'`, `volbaHint: 'Vyberte priemer, kóty na reze sa
   prepočítajú.'` / `'Vyberte průměr, kóty na řezu se přepočítají.'`, `navVarianty: 'Varianty'`,
   `navRel: 'Spojky a príslušenstvo'` / `'Spojky a příslušenství'`; v `web/src/i18n/ui.ts`
   `variantyH2: 'Varianty a obj. čísla'` (SK aj CS).
3. Hlava rozloženie „studio“ ostalo v `Hlava.astro` (používa ho kategória a Potrubia), netreba ho vracať.
