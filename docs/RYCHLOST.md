# Rýchlosť webu

Stav 22. 10. 2026. Google pri hodnotení používa rýchlosť reálnych návštevníkov (Core Web Vitals z prehliadača
Chrome, CrUX). Tie budú až po spustení, v Search Console v časti Core Web Vitals. Dovtedy meriame laboratórne:
Lighthouse 13.5, mobil (simulovaný pomalý 4G a štvornásobne pomalší procesor) aj desktop, 11 typických
stránok, medián z troch behov, lokálny server s kompresiou brotli ako na Cloudflare Pages.

## Výsledok

| Stránka | Mobil pred → po | LCP mobil (s) | Desktop pred → po | Prenesené na mobile (kB) |
|---|---|---|---|---|
| Domov | 81 → 92 | 4,07 → 2,86 | 99 → 100 | 693 → 441 |
| Potrubia | 86 → 95 | 3,47 → 2,56 | 99 → 100 | 675 → 348 |
| Vykurovanie (kategória) | 80 → 92 | 4,28 → 2,86 | 99 → 100 | 626 → 324 |
| UNO 6 bar (rad) | 84 → 94 | 3,62 → 2,56 | 99 → 100 | 433 → 256 |
| Referencie | 76 → 97 | 5,18 → 2,48 | 99 → 100 | 893 → 679 |
| Pre firmy | 84 → 94 | 3,62 → 2,79 | 99 → 100 | 659 → 442 |
| T-kus z bronzu (diel) | 93 → 96 | 2,56 → 2,41 | 100 → 100 | 527 → 375 |
| Izolačná sada T-kusu | 88 → 97 | 3,16 → 2,18 | 100 → 100 | 522 → 361 |
| Na stiahnutie | 86 → 94 | 3,39 → 2,56 | 100 → 100 | 513 → 335 |
| Výber potrubia | 88 → 92 | 3,85 → 3,01 | 99 → 100 | 627 → 456 |
| Článok v poradni | 86 → 96 | 3,46 → 2,41 | 100 → 100 | 416 → 257 |

Domov po oprave masky odlesku (posledný riadok zmien nižšie) zmeraný zvlášť, ostatné stránky v jednom behu.
CLS je všade 0 a blokovanie hlavného vlákna (TBT) 0 ms.

## Čo brzdilo a čo sa zmenilo

1. **Render v hlave sa zjavoval z nulovej priehľadnosti.** Prehliadač započíta najväčší prvok (LCP) až vtedy,
   keď je viditeľný, takže na mobile čakal aj na písma a obrázky pod ním. Render teraz len dosadne pohybom
   (Domov `settle`, Hlava `hlava-obraz` a `hlava-studio`). Pravidlo: na prvku LCP nikdy neanimovať `opacity` od 0.
2. **Štýly v samostatných súboroch blokovali prvé vykreslenie** (Lighthouse odhadol 1,8 s). Teraz sú priamo
   v HTML (`build.inlineStylesheets: 'always'`), po kompresii 20 až 23 kB na stránku (celé HTML 30 až 37 kB).
3. **Písma 289 kB → 154 kB na slovenskú stránku.** Fontsource posielal celé bloky znakov pri každej hrúbke.
   `data/pisma.py` z tých istých súborov vyreže len znaky slovenčiny, češtiny a susedov (tvary aj osi
   Archiva ostali), výsledok je vo `web/src/fonts` a `web/src/styles/pisma.css`. Znak mimo podmnožiny
   vykreslí záložné písmo; pri novom jazyku alebo symbole stačí doplniť rozsah a skript spustiť znova.
4. **Obrázky AVIF so záložným WebP** cez `web/src/components/Obraz.astro` (náhrada `<Image>`). AVIF má na našich
   obrázkoch 36 až 79 % veľkosti WebP. Kvalita: fotky 60 (zachová textúru zeminy a plášťa), rendery a
   vyrezané diely 50 (rozdiel okom nevidno, porovnanie pri dvojnásobnom zväčšení).
5. **Hero sa sťahoval dvakrát** (AVIF na obrázok, WebP na masku odlesku). Maska je teraz ten istý súbor AVIF.
6. **Ostrejšie fotky bez spomalenia.** AI zväčšenie (`data/vylepsi_obrazky.py`) zväčší len zdroj; Astro z neho
   robí iba šírky, ktoré stránka pýta podľa `sizes`, takže telefón stiahne rovnako malý súbor ako predtým
   a ostrejší obraz dostane len displej s vysokou hustotou.

## Čo zostáva a prečo to nevadí

- Prvé vykreslenie na mobile 2,1 až 2,4 s v laboratóriu: Lighthouse pri simulácii počíta písma (najvyššia
  priorita) a moduly JavaScriptu v hlavičke, akoby blokovali vykreslenie. Skutočný prehliadač text vykreslí
  hneď záložným písmom (`font-display: swap`) a moduly sa spúšťajú až po načítaní stránky.
- `content-visibility` na sekciách pod okrajom by ušetrilo prácu procesora, ale sekcie domova sa zámerne
  prekrývajú (šikmé hrany, fotka cez hranu záveru) a ich obsah by sa orezal.
- Knižnica Motion (asi 20 kB) by sa dala nahradiť vlastným kódom; dnes neblokuje vykreslenie, prínos by bol malý.

## Pravidlá, aby web ostal rýchly

- Obrázky vždy cez `Obraz.astro` s presným `sizes` (šírka, v akej sa obrázok naozaj zobrazí).
- Obrázok v hlave stránky: `loading="eager"` a `fetchpriority="high"`, ostatné nechať lenivé (predvolené).
- Žiadne animácie priehľadnosti na obrázku alebo nadpise v prvej obrazovke.
- Nové písmo alebo hrúbka: doplniť `data/pisma.py`, nepridávať import z fontsource do CSS.
- Pred spustením a po väčšej zmene zmerať Lighthouse na mobile, cieľ je 90 a viac na každej stránke.
