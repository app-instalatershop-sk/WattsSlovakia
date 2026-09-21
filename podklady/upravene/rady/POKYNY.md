# Rendery radov na úpravu (bod 4 a 5)

V tomto priečinku sú zdrojové rendery radov s bielym pozadím. Pri každom:

- odstrániť biele pozadie, uložiť ako PNG s priehľadnosťou (24-bit + alfa), sRGB,
- veľkosť ponechať (1000 px), pri `microflex-quadro.png` (500 px) upscale na 1200 px,
- uložiť do tohto priečinka s rovnakým názvom a koncovkou `.png` (napr. `microflex-uno-6-bar.png`),
- pôvodný súbor s bielym pozadím môže ostať, web si vezme verziu `.png`, ak existuje.

Web ich načíta pri ďalšom `python data/normalize.py`.

## Navyše: dva obrázky kategórií dielov

`spojky-kategoria.png` (T-kus, 200 px) a `prislusenstvo-kategoria.png` (revízna šachta, 500 px): odstrániť
pozadie, upscale na aspoň 800 px, uložiť pod rovnakým názvom. Idú do riadkov „Spojky“ a „Príslušenstvo“
na domove, dnes majú viditeľné svetlé pozadie.
