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
- [x] Schránka web@microflex.sk a `web/nasadenie/dopyt.konfig.php` s jej heslom (prihlásenie overené 4. 11. 2026).
- [x] Skúšobný dopyt z ostrého webu: server ho prijal a odoslal (4. 11. 2026, `npm run overit -- --skusobny-dopyt`).
- [x] Skúšobný dopyt prišiel na dotazy@instalatershop.sk (Juraj 4. 11. 2026).
- [x] Veta o spracúvaní osobných údajov pod tlačidlom s odkazom na https://www.instalatershop.sk/gdpr/ (Juraj 4. 11. 2026).
- [ ] Firma doplní web a formulár do podmienok ochrany osobných údajov (otázka č. 5 pre manažéra).

## 3. Hosting a doména

- [x] Hosting: Websupport (Juraj 4. 11. 2026). Doména aj DNS ostávajú na Websupporte, NS sa nemenia, DNSSEC netreba vypínať.
- [x] Konfigurácia servera (`web/public/.htaccess`), skript nasadenia `npm run nasadit` a kontrola `npm run overit`.
- [x] Vo WebAdmine: hosting, priradenie domény, FTP účet do `web/nasadenie/.env` (4. 11. 2026).
- [ ] Vo WebAdmine zapnúť Presmerovanie na HTTPS (Web → Služby → Upraviť); http://microflex.sk zatiaľ vracia 200.
- [x] Prvé nasadenie, zatiaľ bez indexovania (`--neindexovat`, 4. 11. 2026, `docs/NASADENIE.md`).
- [ ] `npm run overit` bez chýb po zapnutí HTTPS, potom ostré nasadenie bez `--neindexovat` (na pokyn Juraja).
- [ ] Workflow GitHub Pages (`.github/workflows/astro.yml`) sa s Websupportom nepoužije a od 23. 9. zlyháva; zmazať, ak Juraj súhlasí.
- [ ] Firemný repozitár vrátiť na súkromný: GitHub Pages už netreba (otázka č. 1 v dokumente otázok pre manažéra).

## 4. Značka a texty

- [x] Názov webu „Microflex Česko a Slovensko“, pri logu „Česko a Slovensko“, na telefóne „CZ · SK“ (Juraj 4. 11. 2026).
- [x] Na webe „Jediný oficiálny partner Watts pre Microflex v Česku a na Slovensku“: horný pás (užšie „Jediný partner
      pre CZ a SK“), úvod domova s logom Watts, pätička, Kontakt, popisy pre vyhľadávače, náhľady OG (Juraj 4. 11. 2026).
- [ ] Watts potvrdí toto znenie vrátane slova „jediný“ (otázka č. 10 pre manažéra; ak výhradnosť nie je v zmluve, vypustiť ho).
- [ ] Doména microflex.cz patrí tretej strane (do 15. 1. 2027), otázka č. 21 pre manažéra.
- [ ] Služby na stránke Pre firmy zladiť s tým, čo firma naozaj poskytuje.

## 5. Meranie a súkromie

Rozhodnutie Juraja 4. 11. 2026: bez cookies a bez lišty. Hľadanosť v Search Console, prechody do e-shopu v jeho
štatistikách (zdroj microflex.sk), dopyty v e-maile.

- [x] Značky UTM pri všetkých odkazoch do e-shopu (`web/integrations/utm.mjs`, 2 114 odkazov; štruktúrované dáta bez UTM).
- [ ] Search Console: vlastníctvo Doména microflex.sk overené TXT záznamom vo WebAdmine (nastaví šéf Juraja,
      postup v `docs/NASADENIE.md`, Po spustení), po spustení mapa webu.
- [ ] Overiť v štatistikách e-shopu, že sa zdroj microflex.sk zobrazuje (po prvých prechodoch).

## 6. SEO pred spustením (4. 11. 2026)

- [x] Titulky s hľadanými slovami: domov SK a CS, Spojky, Referencie, Poradňa, Na stiahnutie, Kontakt (nadpisy ostali).
- [x] Štruktúrované dáta WebSite (názov webu v Google) a Organization s údajmi firmy; články s dátumom.
- [x] Mapa webu bez stránok hľadania (noindex), 144 adries; IndexNow pripravený (`npm run indexnow`).
- [ ] Odkazy na microflex.sk z instalatershop.sk a od Watts (otázka č. 20 pre manažéra).
- [ ] Pri spustení: nasadiť bez `--neindexovat`, `npm run overit`, `npm run indexnow`, v Search Console odoslať mapu
      webu a požiadať o indexovanie hlavných stránok, Bing Webmaster Tools (import zo Search Console).

## 7. Nápady a úlohy (TODO)

- [ ] Animácie viazané na rolovanie zmeniť na automatické pri zobrazení (Juraj 4. 11. 2026): „Z čoho je potrubie“
      (rozložený rez, domov aj rady), „Ohne sa okolo prekážky“ (ohyb, 225 vh) a kotúč pri pokládke (200 vh).
      **Urobené, čaká na výber návrhu.** Sekcie sú len také vysoké ako obsah, pohyb sa spustí sám, keď stred obrazu
      príde do horných 70 % okna; pri obmedzenom pohybe a bez skriptu stojí hotový stav. Domov sa skrátil na počítači
      z 12,5 na 8,9 okna, na telefóne zo 14,9 na 12,1 (B 11,6). Tri návrhy (dočasne `?animacie=a|b|c`, predvolený B):
      A raz plynulo, B po vrstvách so zastávkou a vrstvy či kroky sa dajú vybrať, C raz a potom ťahaním.
      Videá a porovnanie: `snimky-stranok/navrh-animacie/porovnanie.html`. Po výbere ostane jeden režim, prepínač
      zmizne a pravidlo pohybu sa zapíše do `docs/DESIGN.md` kap. 8.
- [x] Pás „Do zeme. Bez lisu a zvárania.“ pod úvodom domova so skutočnou fotkou výkopu (Juraj 4. 11. 2026, variant B).
- [ ] Odkazy do e-shopu spárovať po exporte produktov zo Shoptetu (export dodá Juraj, bod 1).

## 8. Posledná kontrola

- [ ] Lighthouse na mobile aspoň 90 na každej stránke (`docs/RYCHLOST.md`).
- [ ] `python data/kontrola_webu.py` bez chýb (spúšťa ho aj `npm run nasadit`).
- [ ] `npm run overit` na ostrom serveri bez chýb.
- [ ] Push na oba repozitáre (len na pokyn „pushni“).
- [ ] Po spustení: Search Console, mapa stránok, Core Web Vitals (`docs/NASADENIE.md`, Po spustení).
