# Pred spustením

Čo musí byť hotové, kým web pôjde na microflex.sk. Stav k 28. 10. 2026; hotové položky odškrtnúť tu.

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

Formulár Dopyt na projekt (Pre firmy) a dopyt zo sprievodcu dnes len pripravia e-mail na dotazy@instalatershop.sk
(mailto), web nemá server.

- [ ] Po výbere hostingu odosielať na serveri (návrh: Cloudflare Pages Function, e-mail cez Resend, ochrana Turnstile),
      s potvrdením o prijatí a chybovým stavom.
- [ ] Otestovať celú cestu až po prijatý e-mail.

## 3. Hosting a doména

- [ ] Rozhodnúť hosting (návrh: Cloudflare Pages).
- [ ] microflex.sk (Websupport, DNSSEC zapnutý): pri prechode na Cloudflare najprv vypnúť DNSSEC, počkať, až potom zmeniť NS.

## 4. Značka a texty

- [ ] Potvrdiť s Watts presné znenie partnerstva („oficiálny partner“ alebo „autorizovaný predajca“), `docs/DESIGN.md` kap. 14.
- [ ] Služby na stránke Pre firmy zladiť s tým, čo firma naozaj poskytuje.

## 5. Meranie a súkromie

- [ ] Meranie návštevnosti a cieľov (prechody do e-shopu, dopyty) a lišta súhlasu s cookies v našom dizajne.

## 6. Posledná kontrola

- [ ] Lighthouse na mobile aspoň 90 na každej stránke (`docs/RYCHLOST.md`).
- [ ] `python data/kontrola_webu.py` bez chýb.
- [ ] Push na oba repozitáre (len na pokyn „pushni“).
- [ ] Po spustení: Search Console, mapa stránok, Core Web Vitals.
