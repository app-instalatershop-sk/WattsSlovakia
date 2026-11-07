# Návrhy stránky Referencie A, B, C a verzie A1 až A3 (6. a 7. 11. 2026)

Zadanie Juraja (6. 11.): „Daj mi 3 obrázkové možnosti na referencie stránku, išlo by o redesign, nekladiem ti medze,
urob 3 varianty, z ktorých pôjdeme ďalej bližšie k finálnemu výsledku.“ Potom (7. 11.): „Chcem smer A + 3 varianty.“
a „Postav verziu A1.“ **Postavená je A1**, ostatné sú tu na inšpiráciu. Pôvodný stav stránky je
v `../2026-11-07-referencie-pred-a1/`.

Návrhy boli vložené do hotovej stránky `/referencie/` (web/dist) skriptom `_skript/navrhy.mjs` (server na porte 4373,
`node navrhy.mjs [dnes A B C A1 A2 A3]`, snímky do `snimky-stranok/navrh-referencie/`), prehľad vedľa seba
`_skript/prehlad.py` (s argumentom `verzie-a` pre A1 až A3). Web sa nimi nemenil. Snímky sú tu zmenšené (JPEG).

## Smery (6. 11.)

| Návrh | Čo je to | Snímky |
|---|---|---|
| A Hlavná stavba (vybraný smer) | tmavý úvod s fotkou staveniska v Považskej Bystrici cez celú šírku, kóta „31 budov“, štítok Naša dodávka; príbeh stavby (kotolňa s kótou 2 × 350 kW, údaje, fotky s popisom, diely z dodávky); ostatné stavby ako karty | `A-*` |
| B Prehľad stavieb | všetky štyri stavby hore v dlaždiciach ako katalóg na domove (G2) a tmavá dlaždica dopytu; pod nimi rovnaký list každej stavby so všetkými fotkami | `B-*` |
| C Stavba a výrobok | tmavá hlava, biela tabuľka stavieb cez hranu; pri každej stavbe fotka s kótami a karta „Na stavbe leží“ s 3D renderom presného výrobku, obj. číslom a kúpou v e-shope | `C-*` |

Porovnanie: `00-prehlad-pc-prva-obrazovka.jpg`, `00-prehlad-pc-cela-stranka.jpg`, `00-prehlad-mobil.jpg`.

## Verzie smeru A (7. 11.), priečinok `verzie-a/`

| Verzia | Čo je to |
|---|---|
| A1 Tmavý pás s prehľadom (postavená) | A a pod úvodom biely pás so všetkými štyrmi stavbami (fotka, rozsah, typ), všetko na prvej obrazovke |
| A2 Príbeh v kapitolách | tmavý panel so šikmou hranou ako úvod domova, fotka cez hranu; Považská v štyroch kapitolách hadovito; ďalšie stavby ako široké riadky so všetkými údajmi |
| A3 Mozaika fotiek | svetlý úvod s mozaikou troch fotiek a bielou kartou cez jej spodok, údaje vpravo; ďalšie stavby ako tmavé karty |

Na inšpiráciu do budúcna: karta „Na stavbe leží“ z C (3D render presného variantu, obj. číslo, kúpa) by sa dala
pridať ku kartám stavieb v A1; kapitoly z A2 sa hodia, ak bude viac našich vlastných dodávok.
