# Nasadenie na Websupport (microflex.sk)

Web pôjde na hosting Websupport k doméne microflex.sk, ktorá je tam už registrovaná (rozhodnutie Juraja
4. 11. 2026). Stav k 4. 11. 2026: na strane webu je všetko pripravené a vyskúšané lokálne. Chýba hosting, prístup
na FTP a schránka na odosielanie dopytu; kroky 1 až 5 robí Juraj vo WebAdmine, nasadenie potom Claude.

## Ako to funguje

| Časť | Kde v repozitári → na serveri | Čo robí |
| --- | --- | --- |
| Stránky | `web/dist` → `/web` (koreň webu) | statický build Astra, asi 205 MB a 4 660 súborov |
| `.htaccess` | `web/public/.htaccess` → `/web/.htaccess` | jedna adresa stránky, chybová stránka, typy súborov, cache, bezpečnostné hlavičky |
| Dopyt | `web/public/api/dopyt.php` → `/web/api/dopyt.php` | formulár Pre firmy pošle cez schránku web@microflex.sk na dotazy@instalatershop.sk |
| Heslo schránky | `web/nasadenie/dopyt.konfig.php` (mimo gitu) → `/konfig/dopyt.php` | vedľa `/web`, z prehliadača nedostupné |
| Nasadenie | `npm run nasadit` v priečinku `web` | build, kontrola odkazov, nahratie zmien cez FTPS |
| Kontrola | `npm run overit` v priečinku `web` | presmerovania, hlavičky, cache, každá stránka z mapy webu, dopyt |

DNS ostáva na Websupporte a NS sa nemenia, preto DNSSEC netreba vypínať (to platilo len pre prechod na
Cloudflare). Pošta na microflex.sk je už nastavená: MX Websupport, SPF `include:_spf.m1.websupport.sk -all`,
DMARC `p=quarantine`. Dopyt odchádza cez SMTP Websupportu s podpisom DKIM, takže s nimi súhlasí.

## Kroky vo WebAdmine (Juraj, raz)

1. **Hosting.** Objednať webhosting; stačí najmenší balík (web zaberá asi 205 MB, treba PHP 8.2 alebo novšie).
2. **Priradiť doménu.** Služby → hosting → do poľa napísať `microflex.sk` → Priradiť doménu → Štandardná
   konfigurácia (web + mail) → Priradiť doménu. Websupport sám presmeruje DNS na hosting a parkovacia stránka
   zmizne; pri novom priradení to môže trvať do 24 hodín.
3. **HTTPS a PHP.** Certifikát Let's Encrypt sa zapne sám (Pokročilé nastavenia → SSL certifikáty, má pokrývať
   microflex.sk aj *.microflex.sk). Potom Web → Služby → Upraviť → zapnúť **Presmerovanie na HTTPS**; HTTP Cache
   nechať zapnutú. Verzia PHP 8.4 (8.2 až 8.5 sú v poriadku).
4. **FTP.** Služby → microflex.sk → Pokročilá konfigurácia → FTP účty. Hlavný účet, alebo nový s prístupom do
   hlavného priečinka (pole Sprístupniť adresár nemeniť), lebo skript potrebuje aj priečinok `/konfig` vedľa
   `/web`. Z Prihlasovacích údajov zapísať meno a heslo do `web/nasadenie/.env` (vzor `web/nasadenie/env.vzor`)
   a ako server `ftp.r6.websupport.sk`: na tento názov je vydaný certifikát FTP servera, microflex.sk ukazuje na
   ten istý server (37.9.175.196, overené 4. 11. 2026). Ak má FTP obmedzenie podľa krajiny alebo IP, povoliť Slovensko.
5. **Schránka na odosielanie.** E-maily → vytvoriť schránku `web@microflex.sk` so silným heslom. Skopírovať
   `web/nasadenie/dopyt.konfig.vzor.php` ako `dopyt.konfig.php`, doplniť heslo a ľubovoľný dlhý text ako soľ.
   SMTP server overiť v E-maily → Prihlasovacie údaje (vzor má `smtp.m1.websupport.sk`). Odporúčam presmerovať
   kópiu tejto schránky na vlastný e-mail: prídu sem vrátené správy, keby adresa dopytov prestala fungovať.

Heslá netreba písať do chatu: stačí ich zapísať do `.env` a `dopyt.konfig.php`. Do gitu z priečinka `web/nasadenie`
idú len štyri súbory skriptov a vzorov (`.gitignore`), všetko ostatné git ignoruje. Vzory `env.vzor` a
`dopyt.konfig.vzor.php` sú v gite, preto musia ostať prázdne; `npm run nasadit` s vyplneným vzorom odmietne bežať.

## Nasadenie (Claude na pokyn „nasaď“)

1. `npm run nasadit -- --skusobne`: overí prístup na FTP a vypíše, čo by nahral. Keď certifikát FTP servera nesedí
   s jeho adresou (pri IP adrese zvyčajne), skript vypíše odtlačok certifikátu; porovnať s WebAdminom a zapísať
   ako `FTP_ODTLACOK` do `.env`.
2. `npm run nasadit`: prvé nasadenie nahrá celý web, ďalšie len zmenené súbory. Zástupnú stránku Websupportu
   (napríklad `index.php`) skript nezmaže, len ohlási; zmazať ju cez WebFTP.
3. `npm run overit`: všetky kontroly musia mať ✓.
4. `npm run overit -- --skusobny-dopyt`: pošle jeden skutočný dopyt označený ako skúška na dotazy@instalatershop.sk.
   Juraj overí, že prišiel (nie do spamu) a že Odpovedať mieri na zákazníka.
5. Juraj prejde web na telefóne a na počítači.

Mäkké spustenie (voliteľné): `npm run nasadit -- --neindexovat` pridá hlavičku `X-Robots-Tag: noindex, nofollow`.
Web je vidieť, ale vyhľadávače ho nezaradia. Ostré spustenie je bežné `npm run nasadit`.

## Po spustení

- [ ] Google Search Console: vlastníctvo typu Doména pre microflex.sk, overenie TXT záznamom (WebAdmin → microflex.sk
      → DNS), odoslať `https://microflex.sk/sitemap-index.xml`. Pridať aj servisný účet claude-seo ako používateľa,
      aby sa dalo merať cez API ako pri instalatershop.sk.
- [ ] Bing Webmaster Tools: import z Search Console.
- [ ] Lighthouse a Core Web Vitals na ostrom serveri (`docs/RYCHLOST.md`); kompresiu Brotli a HTTP/3 robí Websupport.

## Podrobnosti nastavenia

**.htaccess.** `www.microflex.sk` → `microflex.sk`, stránka bez lomky → s lomkou (rovno na https, Apache za nginx
by inak poslal na http), `/…/index.html` → `/…/`; všetko 301. Z http na https presmeruje Websupport. Chyba 404
ukáže stránku webu `/404.html`, zoznam súborov v priečinku je vypnutý, index len `index.html`.

| Súbory | Cache-Control | Prečo |
| --- | --- | --- |
| `/_astro/…` | `public, max-age=31536000, immutable` | odtlačok obsahu v názve, nikdy sa nemenia |
| `/3d/…`, `/og/…` | `public, max-age=86400, stale-while-revalidate=604800` | bez odtlačku v názve |
| HTML, JSON, XML, TXT | `no-cache` | po nasadení hneď nový obsah, nezmenený súbor sa nesťahuje znova |

Websupport navyše drží statické súbory asi 10 minút v pamäti servera (HTTP Cache). Hlavičky: HSTS na rok (bez
subdomén), `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, CSP
`frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'` a Permissions-Policy bez kamery,
mikrofónu, polohy, platieb a USB. Typy súborov: AVIF, WebP, WOFF2, SVG, JSON a JS v UTF-8.

**Dopyt (`api/dopyt.php`).**
- Zo stránky ho pošle skript (fetch, odpoveď JSON); bez JavaScriptu ho odošle prehliadač a skript vráti 303 na
  `#dopyt-odoslany` alebo `#dopyt-chyba`, ktoré stránka ukáže cez `:target`.
- Prijme len POST z microflex.sk (inak 403). Skryté pole je pasca: robot dostane „ok“ a nič sa nepošle. Meno 2 až
  120 znakov a platný e-mail sú povinné (inak 422 s poliami), ostatné polia majú rovnaké dĺžky ako `maxlength`.
- Limit: 5 dopytov za 10 minút a 20 za deň z jednej adresy, 200 za deň spolu (429). Adresa sa ukladá len ako
  odtlačok so soľou v `/konfig/dopyt-stav/limity.json`; za proxy nginx sa berie `X-Real-IP`.
- E-mail: odosielateľ „Web Microflex Slovensko“ <web@microflex.sk>, Odpovedať na zákazníka, predmet „Dopyt
  Microflex – firma alebo meno“ (z českej stránky s „(CZ)“), text v UTF-8 s poliami v poradí formulára.
- Keď SMTP zlyhá: 502 a záznam v `/konfig/dopyt-stav/chyby.log` (bez hesla a osobných údajov); stránka ponúkne
  ten istý dopyt ako vyplnený e-mail a telefón. Záloha, keby SMTP z hostingu nešlo: `'sposob' => 'mail'`.

**Skript nasadenia (`web/nasadenie/nasad.mjs`).**
- FTPS na porte 21; certifikát servera je overený alebo pripnutý odtlačkom a heslo ide až potom.
- FTP Websupportu má vpredu smerovač (`ing.r6.websupport.sk`, pozdrav `220 ftp.websupport.sk`): po `AUTH TLS` čaká
  hneď `USER` a každý iný príkaz pred prihlásením spojenie zavrie. Výpis protokolu: `FTP_LADENIE=1` (heslo zakryté).
- Porovná SHA-256 súborov so zoznamom `/konfig/nasadenie.json` z minulého nasadenia. Poradie: obrázky, skripty a
  dáta, potom stránky, mapa webu a robots.txt, nakoniec `.htaccess`.
- Nový `.htaccess` najprv skúsi v pomocnom priečinku `_skuska-htaccess-…`; chyba v ňom by inak zhodila celý web.
- Maže len súbory, ktoré sám nahral, a súbory z `_astro/` až po 24 hodinách: stránka v pamäti servera alebo
  v otvorenom okne na ne ešte môže odkazovať. Prerušené nasadenie dokončí ďalšie spustenie.

## Keď niečo nejde

| Príznak | Čo s tým |
| --- | --- |
| Certifikát FTP servera sa nepodarilo overiť | server zadať názvom z certifikátu (`ftp.r6.websupport.sk`), inak porovnať certifikát s WebAdminom a zapísať `FTP_ODTLACOK` |
| FTP `530 Login incorrect` | meno alebo heslo nesedí s WebAdminom (FTP účty → Prihlasovacie údaje), alebo účet obmedzuje IP; neskúšať opakovane, server môže adresu zablokovať |
| SMTP `535 authentication failed` | heslo schránky web@microflex.sk nesedí (meno je celá adresa, server smtp.m1.websupport.sk:465 podľa automatickej konfigurácie Websupportu) |
| Skúška `.htaccess` vrátila 404 alebo parkovaciu stránku | doména ešte neukazuje na hosting (krok 2), alebo `FTP_WEB` nie je koreň webu |
| Skúška `.htaccess` vrátila 500 | hosting nedovolí niektorý príkaz; v koreni ostal starý, opraviť `web/public/.htaccess` |
| Celý web vracia 500 | zmazať `/web/.htaccess` cez WebFTP a nasadiť znova |
| Dopyt hlási, že sa nepodaril | `/konfig/dopyt-stav/chyby.log` cez WebFTP: 535 = zlé heslo schránky, chyba spojenia = SMTP z hostingu nejde (`'sposob' => 'mail'`) |
| `npm run overit`: dopyt 500 | chýba `/konfig/dopyt.php`: vyplniť `dopyt.konfig.php` a nasadiť |

## Overené 4. 11. 2026

- PHP skript v PHP 8.4 (php-wasm; windows.php.net blokuje bezpečnostný DNS filter poskytovateľa) s falošným SMTP
  serverom: 27 kontrol vrátane prihlásenia, kódovania predmetu a mena, bodky na začiatku riadku, 303 bez
  JavaScriptu, limitu, adresy za proxy, chýb SMTP a chýbajúcej konfigurácie.
- Formulár v Chrome (počítač 1440 px, telefón 390 px, bez JavaScriptu, čeština): 17 kontrol, axe bez porušení,
  konzola bez chýb.
- Nasadenie proti lokálnemu FTPS serveru s vlastným certifikátom: 4 658 súborov (205 MB) za 1 min 20 s, obsah
  zhodný s buildom; opakované nasadenie, mazanie hneď a po 24 hodinách, konfigurácia so zabudnutým heslom zo
  vzoru, `--neindexovat` a späť, `--skusobne`.
- SMTP Websupportu `smtp.m1.websupport.sk:465`: TLS 1.3, certifikát *.m1.websupport.sk (Let's Encrypt), AUTH PLAIN
  aj LOGIN.
- Overí až ostrý hosting (`npm run overit`): `.htaccess` na Apache Websupportu, PHP a prihlásenie do schránky na
  hostingu, kompresia.

Zdroje (Websupport, otvorené 4. 11. 2026): [technická špecifikácia](https://www.websupport.sk/webhosting/specifikacia/)
(Apache + nginx, PHP 8.2 až 8.5, HTTP/3, Brotli, 300 e-mailov za hodinu zo schránky),
[FTP klienti a priečinky web, sub, logs](https://www.websupport.sk/podpora/kb/ftp-klienti/),
[absolútna cesta](https://www.websupport.sk/podpora/kb/absolutna-cesta/),
[priradenie domény](https://www.websupport.sk/podpora/kb/priradenie-domeny-na-hosting/),
[Let's Encrypt](https://www.websupport.sk/podpora/kb/lets-encrypt/),
[presmerovanie na HTTPS](https://www.websupport.sk/podpora/kb/https-presmerovanie/),
[vyrovnávacia pamäť](https://www.websupport.sk/podpora/kb/vyrovnavacia-pamat-na-hostingu/),
[poštové protokoly](https://www.websupport.sk/podpora/kb/postove-protokoly/).
