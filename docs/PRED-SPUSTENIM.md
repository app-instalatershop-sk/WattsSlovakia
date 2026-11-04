# Pred spustením

Čo musí byť hotové, kým web pôjde na microflex.sk. Stav k 4. 11. 2026; hotové položky odškrtnúť tu.
Postup nasadenia na hosting Websupport: `docs/NASADENIE.md`.

## 1. Odkazy do e-shopu (Juraj 28. 10. 2026: „urobíme pred spustením“)

Tlačidlá „Do e-shopu“ pri obj. číslach a „Kúpiť v e-shope“ dnes otvárajú hľadanie na instalatershop.sk
(`/vyhledavani/?string=<obj. číslo alebo rad>`). Pri kontrole 23. 9. 2026 hľadanie našlo 43 z 352 obj. čísel
(17 z 83 potrubí, 26 z 269 dielov), pri ostatných zákazník uvidí prázdny výsledok.

- [ ] Zobrať export produktov z e-shopu (Shoptet, XML feed: kód, názov, adresa produktu) a spárovať ho s obj. číslami.
- [ ] Spárované obj. čísla: odkaz priamo na produkt v e-shope, nie na hľadanie.
- [ ] Obj. čísla, ktoré e-shop nemá: namiesto prázdneho hľadania „Poslať dopyt na tento variant“ s vyplneným obj. číslom.
- [ ] S vedením rozhodnúť, či e-shop doplní chýbajúce produkty (otázka č. 6 v dokumente otázok pre manažéra).
- [ ] Veta v závere každej stránky je od 1. 11. 2026 opatrná: „Cenu a dostupnosť nájdete v e-shope. Ak tam obj. číslo
  nenájdete…“ (predtým „…každého obj. čísla“, posúdenie stránky radu 29. 10.). Keď e-shop bude mať všetky obj. čísla,
  dá sa vrátiť. Kde: `web/src/content/stranky.ts` → `zaver.text` (SK aj CS).
- [ ] Po spárovaní overiť „Kúpiť v e-shope“ v úvode radu: po výbere variantu berie adresu z jeho riadku tabuľky
  (`VolbaDimenzie.astro`), takže priamy odkaz na produkt sa tam prenesie sám.

Kde v kóde: `data/normalize.py` (`eshop_url`), `web/src/i18n/ui.ts` (`ESHOP`, `ESHOP_SEARCH`), `Rad.astro`, `Produkt.astro`,
`TabulkaVariantov.astro`, `Vyber.astro`.

## 2. Odosielanie dopytu

Formulár Dopyt na projekt (Pre firmy, aj so zoznamom zo sprievodcu) od 4. 11. 2026 posiela PHP skript na hostingu
(`web/public/api/dopyt.php`) cez schránku web@microflex.sk na dotazy@instalatershop.sk. Keď odoslanie zlyhá, stránka
ponúkne ten istý dopyt ako vyplnený e-mail (mailto) a telefón.

- [x] Odosielanie na serveri s potvrdením o prijatí a chybovým stavom, pasca na roboty a limit odoslaní
      (namiesto pôvodného návrhu Cloudflare Pages Function + Resend + Turnstile; vyskúšané lokálne, `docs/NASADENIE.md`).
- [ ] Schránka web@microflex.sk a `web/nasadenie/dopyt.konfig.php` s jej heslom (Juraj, `docs/NASADENIE.md` krok 5).
- [ ] Otestovať celú cestu až po prijatý e-mail: `npm run overit -- --skusobny-dopyt`.
- [ ] Informácia o spracúvaní osobných údajov pod formulárom: odkaz na zásady podľa odpovede na otázku č. 5
      v dokumente otázok pre manažéra (návrh: zásady instalatershop.sk doplnené o web a formulár).

## 3. Hosting a doména

- [x] Hosting: Websupport (Juraj 4. 11. 2026). Doména aj DNS ostávajú na Websupporte, NS sa nemenia, DNSSEC netreba vypínať.
- [x] Konfigurácia servera (`web/public/.htaccess`), skript nasadenia `npm run nasadit` a kontrola `npm run overit`.
- [ ] Vo WebAdmine: hosting, priradenie domény, HTTPS, FTP účet do `web/nasadenie/.env` (Juraj, `docs/NASADENIE.md` kroky 1 až 4).
- [ ] Prvé nasadenie a `npm run overit` bez chýb.
- [ ] Workflow GitHub Pages (`.github/workflows/astro.yml`) sa s Websupportom nepoužije a od 23. 9. zlyháva; zmazať, ak Juraj súhlasí.
- [ ] Firemný repozitár vrátiť na súkromný: GitHub Pages už netreba (otázka č. 1 v dokumente otázok pre manažéra).

## 4. Značka a texty

- [ ] Potvrdiť s Watts presné znenie partnerstva („oficiálny partner“ alebo „autorizovaný predajca“), `docs/DESIGN.md` kap. 14.
- [ ] Služby na stránke Pre firmy zladiť s tým, čo firma naozaj poskytuje.

## 5. Meranie a súkromie

- [ ] Meranie návštevnosti a cieľov (prechody do e-shopu, dopyty) a lišta súhlasu s cookies v našom dizajne.

## 6. Posledná kontrola

- [ ] Lighthouse na mobile aspoň 90 na každej stránke (`docs/RYCHLOST.md`).
- [ ] `python data/kontrola_webu.py` bez chýb (spúšťa ho aj `npm run nasadit`).
- [ ] `npm run overit` na ostrom serveri bez chýb.
- [ ] Push na oba repozitáre (len na pokyn „pushni“).
- [ ] Po spustení: Search Console, mapa stránok, Core Web Vitals (`docs/NASADENIE.md`, Po spustení).
