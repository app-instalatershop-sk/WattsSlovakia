# Plán stavby webu Microflex Slovensko (Astro)

Verzia 1, 21. 9. 2026. Nadväzuje na `DESIGN.md` (vzhľad) a dopĺňa ho o techniku, dáta, adresy,
fázy a rozhodnutia. Rozhodnuté body sú bez značky, otvorené majú ❔ a sú zhrnuté v kapitole 9.

---

## 1. Stack a prečo

| Vrstva | Voľba | Prečo |
|---|---|---|
| Framework | **Astro 7** (statický výstup, ostrovy) | nula JS na stránkach s obsahom, výborné SEO a rýchlosť, React len tam, kde treba interakciu |
| Štýly | **Tailwind CSS v4** cez `astro add tailwind` | tokeny z DESIGN.md ako `@theme` premenné, žiadna cudzia téma |
| Interaktívne diely | **React 19** ostrovy + **shadcn/ui** (Radix) | paleta hľadania (cmdk), sprievodca výberom, filter variantov, dialógy, akordeón |
| Pohyb | **Motion** (`motion`) | jeden vstup + odozvy na akcie podľa DESIGN.md kap. 16.1; prechody stránok natívne cez `<ClientRouter />` |
| Hľadanie | **MiniSearch** | index sa vyrobí pri builde z dát, beží v prehliadači, bez servera, odstránená diakritika |
| Obrázky | `astro:assets` (Sharp) | AVIF/WebP, responzívne veľkosti, rozmery známe dopredu (CLS 0); neskôr thumbhash |
| Ikony | **Lucide** (`lucide-react` v ostrovoch, `lucide-static` v .astro) | rozhodnutie 21. 9.: len originálne súbory knižnice |
| Písma | **Fontsource** (Archivo variabilné, IBM Plex Sans) | vlastný hosting, GDPR, `preload` |
| Dáta | JSON v `web/src/data/`, načítané cez content collections (`file()` loader, Zod schéma) | typová kontrola pri builde, jedna pravda o katalógu |
| SEO | `@astrojs/sitemap`, JSON-LD v layoute, `robots.txt` | základ z DESIGN.md kap. 13 |
| Kvalita | Playwright (snímky, e2e), Lighthouse CI, axe | brána pred nasadením |
| Hosting | ❔ Cloudflare Pages (odporúčanie) | zadarmo, rýchle v SK, formuláre cez Pages Functions + Turnstile, náhľady pre každú vetvu |

Prostredie: Node 24, npm 11 (overené 21. 9. 2026). Verzie balíkov v čase založenia: astro 7.3.3,
@astrojs/react 6.0.6, tailwindcss 4.3.3, motion 13.4.0, minisearch 7.2.0.

**Čo nepoužijeme:** Bootstrap, šablóny, efektové knižnice, Mantine/MUI, GSAP (kým nebude
choreografia pri rolovaní), jQuery, Google Fonts za behu (písma sú lokálne).

---

## 2. Štruktúra repozitára

```
WattsSlovakia/
  docs/            DESIGN.md, PLAN-STAVBA.md, ďalšie dokumenty
  data/            zdrojové dáta zo watts.eu (microflex-watts-sk.json) + normalize.py
  podklady/        podklady výrobcu (katalóg, logá, fotky, piktogramy)
  makety/          HTML makety (referencia vzhľadu, už sa ďalej nevyvíjajú)
  web/             Astro projekt = samotný web
    src/
      data/        kategorie.json, rady.json, varianty.json, suvisiace.json (generuje data/normalize.py)
      content.config.ts
      styles/global.css        @import "tailwindcss" + @theme tokeny + základ z tokens.css
      layouts/Base.astro       hlava, hlavička, pätička, ClientRouter, JSON-LD
      components/              .astro diely (Karta, PasParametrov, TabulkaVariantov, Subory…)
      islands/                 React: Hladanie.tsx, Sprievodca.tsx, FilterVariantov.tsx
      pages/                   adresy podľa kapitoly 4
      assets/                  obrázky pre astro:assets (kópie z podklady/)
    public/                    favicony, robots.txt, statické súbory
```

Makety ostávajú v repe ako referencia. Od tejto chvíle sa vzhľad vyvíja v `web/`.

---

## 3. Dátový model

Zdroj pravdy je katalóg Watts (scrapnutý `data/microflex-watts-sk.json`, 21. 9. 2026). Skript
`data/normalize.py` z neho vyrobí čisté JSON so slovenskými názvami a slugmi:

**kategorie.json** – 7 záznamov: `id`, `slug`, `nazov`, `kratky_nazov`, `popis`, `poradie`,
`typ` (potrubie | spojky | prislusenstvo), `piktogram` (súbor renderu), `rady` (zoznam id).

**rady.json** – 18 záznamov (11 potrubí + 7 skupín spojok/príslušenstva): `id`, `slug`,
`kategoria`, `nazov` (náš, napr. „Microflex UNO, vykurovanie 6 bar“), `nazov_watts` (originál),
`popis` (náš text), `medium`, `tlak_bar`, `pocet_rur`, `piktogram`, `fotky[]`, `subory[]`
(názov, typ, jazyk, adresa), `suvisiace[]` (id produktov), `zdroj_url`.

**varianty.json** – riadky tabuliek (≈ 300): `obj_cislo`, `rad`, `plast_mm`, `rura` (`{d, s}`),
`hmotnost_kg_m`, `izolacia` (standard | zosilnena), `polomer_ohybu_m`, `kotuc` (`{d, sirka}`),
`eshop_url` (❔ mapovanie na produkt v instalatershop.sk, zatiaľ hľadanie podľa obj. čísla).

**produkty.json** – 42 spojok a príslušenstva (druhá úroveň) s vlastnými tabuľkami.

Pravidlá: čísla ako čísla (nie text), jednotky v názve poľa, cyrilské „х“ v rozmeroch opravené,
každý záznam má `zdroj_url` a `stiahnute` (dátum). Naše slovenské názvy radov schvaľuje Juraj ❔
(návrh v `data/nazvy-radov.md` po normalizácii).

---

## 4. Adresy (URL)

Slovenčina bez jazykového prefixu. Čeština, ak príde, dostane prefix `/cs/` (Astro i18n,
`prefixDefaultLocale: false`). Slugy po slovensky bez diakritiky, koncová lomka.

| Adresa | Stránka |
|---|---|
| `/` | domov |
| `/potrubia/` | prehľad kategórií potrubí |
| `/potrubia/vykurovanie/` | kategória (aj `sanita`, `vykurovanie-a-sanita`, `studena-a-chladena-voda`, `tepelne-cerpadla`) |
| `/potrubia/vykurovanie/microflex-uno-6-bar/` | rad s tabuľkou variantov |
| `/spojky/`, `/spojky/pe-x-spojky-vykurovanie-a-cool/`, `/spojky/.../t-spojka-pe-x-vykurovanie/` | spojky a ich produkty |
| `/prislusenstvo/…` | príslušenstvo rovnako |
| `/vyber/` | sprievodca výberom (stav v adrese `?pouzitie=…&rury=…&dimenzia=…`) |
| `/na-stiahnutie/` | všetky podklady na jednom mieste |
| `/pre-firmy/` | B2B: podklady, dopyt, kontakt |
| `/poradna/` a `/poradna/<slug>/` | články |
| `/referencie/` | referencie |
| `/kontakt/`, `/o-webe/` | kontakt a prevádzkovateľ |
| `/hladat/?q=` | výsledky hľadania pre ľudí bez JS a pre zdieľanie |

---

## 5. Stránky a diely podľa makiet

Makety v3 sú záväzný vzhľad. Diely, ktoré z nich vzniknú:

- **Layout Base**: hlavička (nápis, navigácia, hľadanie, e-shop, menu na mobile), pätička
  (rebrovaný pás, 4 stĺpce), `<ClientRouter />`, `<ViewTransitions>` pre fotku radu
  (`transition:name="rad-<id>"`), JSON-LD Organization + BreadcrumbList.
- **Domov**: Hero (fotka, text, prierez s popiskami), PouzitieDlazdice, KatalogMriezka,
  PrecoMicroflex, Referencie, PreFirmy.
- **Kategória**: HlavaKategorie (piktogram, pás parametrov), Filtre (ostrov), KartaRadu,
  PorovnanieRadov (z dát), Otazky.
- **Rad**: Galeria (ostrov len pre prepínanie), Suhrn + PasParametrov, Podnavigacia (lepkavá,
  plynulé podčiarknutie), TabulkaVariantov + FilterVariantov (ostrov, FLIP), TechnickeUdaje,
  Subory, Referencie, Suvisiace.
- **Hľadanie**: ostrov Hladanie (cmdk + MiniSearch), skupiny Rady / Varianty / Články, klávesy.
- **Sprievodca**: ostrov v 3 krokoch, výsledok = KartaRadu + tlačidlá.

Pohyb podľa DESIGN.md kap. 16.1, jedna krivka `--ease: cubic-bezier(.2,.7,.2,1)`, trvania
150/200/250 ms, `prefers-reduced-motion` vypne všetko okrem zmien farby.

---

## 6. SEO a výkon (základ od prvého nasadenia)

- Jedna H1, `<title>` do 60 znakov, popis 140–160 (podľa pravidiel obsahu e-shopu).
- JSON-LD: Organization, BreadcrumbList, Product + Offer (odkaz na e-shop, bez ceny vo fáze 1),
  FAQPage na kategóriách, Article v poradni.
- Sitemap, `robots.txt`, kanonické adresy, `lang="sk"`, OG obrázky (render radu na modrej).
- Rozpočet: LCP < 2 s na mobile, CLS 0, JS na stránke bez ostrovov 0 kB, s hľadaním < 60 kB.
- Lighthouse CI v GitHub Actions pri každom pull requeste; prah 95/100/100/100.

---

## 7. Fázy

| Fáza | Obsah | Hotovo, keď |
|---|---|---|
| **F0 Základ** | Astro projekt, Tailwind, tokeny, písma, Base layout, hlavička, pätička, normalizované dáta, content collections | `npm run build` prejde, domov s hero a katalógom zo živých dát, Lighthouse 95+ |
| **F1 Katalóg** | 7 kategórií, 18 radov, tabuľky variantov, spojky a príslušenstvo, súbory na stiahnutie, porovnanie radov, otázky | každá stránka z makiet existuje z dát, prechody stránok, odkazy do e-shopu |
| **F2 Hľadanie a výber** | paleta hľadania, stránka `/hladat/`, sprievodca výberom, filter variantov s FLIP, kopírovanie obj. čísla | človek nájde variant podľa obj. čísla do 2 s, sprievodca vedie na správny rad |
| **F3 Obsah a B2B** | Pre firmy s dopytovým formulárom, referencie, poradňa (3 prvé články), kontakt, 404, OG obrázky | formulár doručí dopyt, články indexovateľné |
| **F4 Nasadenie a meranie** | hosting, doména, HTTPS, Lighthouse CI, meranie návštevnosti, Search Console, sitemap odoslaná | web naostro, prvé dáta vo vyhľadávači |
| **F5 Po štarte** | vlastné fotky odrezkov, thumbhash, živá cena z e-shopu (ak sa rozhodne), čeština (ak sa rozhodne) | podľa rozhodnutí |

F0 začína 21. 9. 2026.

---

## 8. Pravidlá práce v `web/`

- Commit po každom uzavretom kroku, správa po slovensky, čo to znamená pre web.
- Žiadne ručne kreslené SVG; ikony Lucide, piktogramy rendery výrobcu.
- Texty spisovne, čísla s jednotkami, zdroj pod tabuľkami.
- Každá stránka sa pred commitom pozrie v prehliadači pri 1440 px a 400 px.
- Dáta sa nemenia ručne v `web/src/data/`; mení sa `data/normalize.py` alebo zdroj.

---

## 9. Rozhodnutia, ktoré ešte ovplyvnia dizajn

Zoradené podľa toho, ako skoro ich potrebujeme. Pri každom je moje odporúčanie, aby sa dalo
rozhodnúť jednou vetou.

1. **Názov webu a doména** (F0, ovplyvní nápis v hlavičke, adresy, e-maily). Odporúčam značkový
   názov „Microflex Slovensko“ a doménu microflex.sk, ak je voľná; inak microflex-potrubie.sk.
   Generická doména (predizolovane-potrubie.sk) sa hodí skôr na poradňu, nie na značkový web.
2. **Cena a dostupnosť na webe** (F1, ovplyvní tabuľku variantov a karty). Odporúčam fázu 1 bez
   ceny s tlačidlom „Cena a dostupnosť v e-shope“, živú cenu z dát e-shopu až vo F5.
3. **Rozsah sortimentu a mapovanie na e-shop** (F1, ovplyvní tlačidlá Kúpiť / Na dopyt).
   Odporúčam celý katalóg (42 radov a produktov) v štruktúre webu; čo e-shop drží, má „Kúpiť“,
   ostatné „Na dopyt“. Potrebujem k tomu zoznam obj. čísel, ktoré e-shop reálne ponúka.
4. **Označenie partnerstva s Watts** (F0, text v hlavičke a pätičke, logo Watts kde). Odporúčam
   vetu „Oficiálny partner Watts pre Microflex na Slovensku“ po potvrdení znenia od Watts, logo
   Watts v pätičke a na stránke O webe.
5. **Hosting a formuláre** (F3, ovplyvní dopytový formulár, ochranu proti spamu a to, kam dopyty
   chodia). Odporúčam Cloudflare Pages + Pages Functions + Turnstile (neviditeľná ochrana, žiadne
   obrázky s dopravnými značkami) a doručenie dopytu e-mailom na adresu, ktorú určíte.
6. **Meranie návštevnosti** (F4, ovplyvní, či web potrebuje lištu na cookies). Odporúčam Plausible
   alebo Umami bez cookies: žiadna lišta, čistejší prvý dojem. GA4 by lištu vyžadovala.
7. **B2B hĺbka** (F3). Odporúčam fázu 1 s dopytovým formulárom a podkladmi, prihlásenie
   a veľkoobchodný cenník až po štarte.
8. **Slovenské názvy radov** (F0). Navrhnem zoznam (napr. „Microflex UNO, vykurovanie 6 bar“
   namiesto „Jednoduché predizolované potrubie MICROFLEX UNO Kúrenie 6 bar“), schválite ho.
9. **Čeština** (ovplyvní prepínač jazyka v hlavičke). Odporúčam pripraviť adresy tak, aby sa
   dala pridať bez presunov (už v pláne), prepínač pridať až keď bude obsah.
10. **Vlastné fotky odrezkov** (kedy, kto). Hero a piktogramy zatiaľ z podkladov Watts.

Bez odpovedí na 1, 4 a 8 vieme stavať F0 aj F1 s pracovnými hodnotami (nápis „Microflex
Slovensko“, bez vety o partnerstve, navrhnuté názvy). Menia sa potom na jednom mieste.
