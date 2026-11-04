/**
 * Oznámi stránky webu vyhľadávačom cez IndexNow (Bing, Seznam, Yandex, Naver a ďalší; Google IndexNow nepoužíva,
 * tomu stačí mapa webu v Search Console). Spúšťať po ostrom nasadení bez --neindexovat a po väčšej zmene obsahu.
 *
 *   npm run indexnow                všetky adresy z web/dist/sitemap-*.xml
 *   npm run indexnow -- /a/ /b/     len vybrané stránky
 *
 * Kľúč je verejný súbor web/public/<kľúč>.txt (IndexNow ním overí, že adresy oznamuje vlastník webu).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = dirname(dirname(fileURLToPath(import.meta.url)));
const HOST = 'microflex.sk';
const kluc = readdirSync(join(WEB, 'public')).find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.slice(0, -4);
if (!kluc) { console.error('Chýba kľúč IndexNow (web/public/<32 hex znakov>.txt).'); process.exit(1); }

const vybrane = process.argv.slice(2);
const adresy = vybrane.length
  ? vybrane.map((c) => new URL(c, `https://${HOST}`).href)
  : readdirSync(join(WEB, 'dist')).filter((f) => /^sitemap-\d+\.xml$/.test(f))
    .flatMap((f) => [...readFileSync(join(WEB, 'dist', f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
if (!adresy.length) { console.error('Žiadne adresy (najprv npm run build).'); process.exit(1); }

// Kľúčový súbor musí byť na webe, inak IndexNow oznámenie odmietne.
const subor = await fetch(`https://${HOST}/${kluc}.txt`, { signal: AbortSignal.timeout(20_000) });
if (!subor.ok || (await subor.text()).trim() !== kluc) { console.error(`Kľúč nie je na https://${HOST}/${kluc}.txt (stav ${subor.status}); najprv nasadiť.`); process.exit(1); }

const odpoved = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: kluc, keyLocation: `https://${HOST}/${kluc}.txt`, urlList: adresy }),
  signal: AbortSignal.timeout(30_000),
});
// 200 = prijaté, 202 = prijaté, kľúč sa ešte overuje; 403 = kľúč nesedí; 422 = adresy nepatria k webu; 429 = priveľa.
console.log(`IndexNow: ${adresy.length} adries, odpoveď ${odpoved.status} ${odpoved.statusText}${[200, 202].includes(odpoved.status) ? ' (prijaté)' : ''}`);
process.exit([200, 202].includes(odpoved.status) ? 0 : 1);
