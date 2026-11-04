/**
 * Kontrola webu na hostingu po nasadení (docs/NASADENIE.md, krok 7). Overí presmerovania (http, www, lomka,
 * index.html), chybovú stránku 404, typy súborov, kompresiu, ukladanie v prehliadači, bezpečnostné hlavičky,
 * každú stránku z mapy webu (stav 200 a kanonická adresa) a odosielanie dopytu bez e-mailu (pasca na roboty,
 * zlé polia, cudzí pôvod).
 *
 * Použitie v priečinku web:
 *   npm run overit                           https://microflex.sk
 *   npm run overit -- https://iná.adresa      iná adresa (presmerovania http a www sa skúsia, ak existujú)
 *   npm run overit -- --skusobny-dopyt        navyše pošle jeden skutočný dopyt označený ako skúška
 */
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(dirname(fileURLToPath(import.meta.url))), 'dist');
const argumenty = process.argv.slice(2);
const SKUSOBNY_DOPYT = argumenty.includes('--skusobny-dopyt');
const adresa = (argumenty.find((a) => /^https?:\/\//.test(a)) ?? process.env.WEB_ADRESA ?? 'https://microflex.sk').replace(/\/+$/, '');
const { host, protocol } = new URL(adresa);
/** Kanonická adresa webu (astro.config.mjs → site), aj keď sa kontroluje iná adresa. */
const KANONICKA = 'https://microflex.sk';
const vysledky = [];

const ziskaj = (url, volby = {}) => fetch(url, {
  redirect: 'manual',
  ...volby,
  headers: { 'user-agent': 'microflex-overenie/1.0', 'accept-encoding': 'br, gzip', ...(volby.headers ?? {}) },
  signal: AbortSignal.timeout(30_000),
});

function zapis(ok, nazov, detail = '') {
  vysledky.push(ok);
  console.log(`${ok === null ? '–' : ok ? '✓' : '✗'} ${nazov}${detail ? `: ${detail}` : ''}`);
}

async function presmerovanie(nazov, z, na) {
  try {
    const r = await ziskaj(z);
    const kam = r.headers.get('location') ?? '';
    zapis([301, 308].includes(r.status) && kam === na, nazov, `${r.status} → ${kam || '(bez Location)'}`);
  } catch (e) {
    zapis(null, nazov, `preskočené, adresa neodpovedá (${e.cause?.code ?? e.message})`);
  }
}

/** Súbor daného typu z buildu (cesta od koreňa webu), aby sa kontrola netrafila mimo nasadené súbory. */
function vzorka(priecinok, pripona) {
  const koren = join(DIST, priecinok);
  if (!existsSync(koren)) return null;
  const prejdi = (p, rel) => {
    for (const z of readdirSync(p, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const r = `${rel}/${z.name}`;
      if (z.isFile() && z.name.endsWith(pripona)) return r;
      if (z.isDirectory()) { const v = prejdi(join(p, z.name), r); if (v) return v; }
    }
    return null;
  };
  return prejdi(koren, `/${priecinok}`);
}

async function subor(nazov, cesta, typ, cache, kompresia = false) {
  if (!cesta) return zapis(null, nazov, 'preskočené, v buildu taký súbor nie je');
  const r = await ziskaj(adresa + cesta);
  const t = r.headers.get('content-type') ?? '';
  const cc = r.headers.get('cache-control') ?? '';
  const ce = r.headers.get('content-encoding') ?? '';
  const zle = [];
  if (r.status !== 200) zle.push(`stav ${r.status}`);
  if (!t.startsWith(typ)) zle.push(`typ ${t || '?'}`);
  if (!cc.includes(cache)) zle.push(`cache-control „${cc}“`);
  if (kompresia && !/br|gzip/.test(ce)) zle.push('bez kompresie');
  zapis(!zle.length, nazov, zle.length ? `${cesta}: ${zle.join(', ')}` : `${t}; ${cc}${ce ? `; ${ce}` : ''}`);
  await r.arrayBuffer();
}

console.log(`Kontrola ${adresa}\n`);

// Úvodná stránka: typ, kompresia, ukladanie, hlavičky a kanonická adresa.
const domov = await ziskaj(`${adresa}/`);
const html = await domov.text();
const h = (n) => domov.headers.get(n) ?? '';
zapis(domov.status === 200 && h('content-type').includes('text/html') && /utf-8/i.test(h('content-type')), 'úvodná stránka', `${domov.status}, ${h('content-type')}`);
zapis(/br|gzip/.test(h('content-encoding')), 'kompresia HTML', h('content-encoding') || 'žiadna');
zapis(h('cache-control').includes('no-cache'), 'HTML sa overuje pri každej návšteve', h('cache-control') || 'bez cache-control');
zapis(html.includes(`<link rel="canonical" href="${KANONICKA}/">`), 'kanonická adresa úvodnej stránky', html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? 'chýba');
for (const [n, ma] of [['strict-transport-security', 'max-age='], ['x-content-type-options', 'nosniff'], ['referrer-policy', 'strict-origin'], ['x-frame-options', 'SAMEORIGIN'], ['content-security-policy', "frame-ancestors 'self'"], ['permissions-policy', 'camera=()']]) {
  zapis(h(n).includes(ma), `hlavička ${n}`, h(n) || 'chýba');
}
zapis(!h('x-robots-tag'), 'web sa smie indexovať', h('x-robots-tag') ? `X-Robots-Tag: ${h('x-robots-tag')} (nasadené s --neindexovat)` : '');

// Presmerovania na jednu adresu stránky.
if (protocol === 'https:') await presmerovanie('http → https', `http://${host}/`, `https://${host}/`);
if (!host.startsWith('www.')) await presmerovanie('www → bez www', `https://www.${host}/potrubia/`, `https://${host}/potrubia/`);
await presmerovanie('stránka bez lomky → s lomkou', `${adresa}/potrubia`, `https://${host}/potrubia/`);
await presmerovanie('/index.html → /', `${adresa}/index.html`, `https://${host}/`);

const chybna = await ziskaj(`${adresa}/neexistuje-kontrola-nasadenia/`);
const chybnaText = await chybna.text();
zapis(chybna.status === 404 && chybnaText.includes('Microflex'), 'chybová stránka 404', `${chybna.status}${chybnaText.includes('Microflex') ? ', stránka webu' : ', predvolená stránka servera'}`);

// Typy súborov a ukladanie v prehliadači.
const astro = (pripona) => html.match(new RegExp(`/_astro/[^"'\\s)]+\\.${pripona}`))?.[0] ?? vzorka('_astro', `.${pripona}`);
await subor('skript z buildu', astro('js'), 'text/javascript', 'immutable', true);
await subor('obrázok AVIF', astro('avif'), 'image/avif', 'immutable');
await subor('obrázok WebP', astro('webp'), 'image/webp', 'immutable');
await subor('písmo WOFF2', astro('woff2'), 'font/woff2', 'immutable');
await subor('snímka 3D sekvencie', vzorka('3d', '.avif'), 'image/avif', 'max-age=86400');
await subor('náhľad pre sociálne siete', html.match(/property="og:image" content="https?:\/\/[^/"]+(\/og\/[^"]+)"/)?.[1] ?? vzorka('og', '.jpg'), 'image/jpeg', 'max-age=86400');
await subor('dáta hľadania', '/hladat/index.json', 'application/json', 'no-cache', true);
await subor('robots.txt', '/robots.txt', 'text/plain', 'no-cache');

// Mapa webu: každá stránka 200 a kanonická adresa = adresa v mape.
const index = await (await ziskaj(`${adresa}/sitemap-index.xml`)).text();
const mapy = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const stranky = [];
for (const mapa of mapy) stranky.push(...[...(await (await ziskaj(mapa.replace(/^https?:\/\/[^/]+/, adresa))).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
const zle = [];
let dalsia = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (dalsia < stranky.length) {
    const loc = stranky[dalsia++];
    try {
      const r = await ziskaj(loc.replace(/^https?:\/\/[^/]+/, adresa));
      const t = await r.text();
      const kanonicka = t.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
      if (r.status !== 200) zle.push(`${loc} → ${r.status}`);
      else if (kanonicka !== loc) zle.push(`${loc}: kanonická ${kanonicka ?? 'chýba'}`);
    } catch (e) {
      zle.push(`${loc}: ${e.message}`);
    }
  }
}));
zapis(stranky.length > 0 && !zle.length, 'stránky z mapy webu', `${stranky.length - zle.length} z ${stranky.length} v poriadku${zle.length ? `\n    ${zle.slice(0, 10).join('\n    ')}` : ''}`);

// Dopyt: bez odoslania e-mailu (pasca, zlé polia, cudzí pôvod).
const dopyt = (polia, povod = adresa) => ziskaj(`${adresa}/api/dopyt.php`, {
  method: 'POST',
  headers: { accept: 'application/json', origin: povod, 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(polia),
});
const get = await ziskaj(`${adresa}/api/dopyt.php`);
zapis(get.status === 405, 'dopyt: GET odmietnutý', String(get.status));
const pasca = await dopyt({ jazyk: 'sk', meno: 'Robot', email: 'robot@example.com', web: 'http://spam.example' });
const pascaJson = await pasca.json().catch(() => null);
zapis(pasca.status === 200 && pascaJson?.ok === true, 'dopyt: pasca na roboty (nič sa neodoslalo)', pasca.status === 500 ? '500: chýba konfigurácia /konfig/dopyt.php' : `${pasca.status} ${JSON.stringify(pascaJson)}`);
const zlePolia = await dopyt({ jazyk: 'sk', meno: 'Kontrola nasadenia', email: 'toto-nie-je-adresa' });
const zlePoliaJson = await zlePolia.json().catch(() => null);
zapis(zlePolia.status === 422 && zlePoliaJson?.polia?.includes('email'), 'dopyt: zlý e-mail vráti chybu poľa', `${zlePolia.status} ${JSON.stringify(zlePoliaJson)}`);
const cudzi = await dopyt({ jazyk: 'sk', meno: 'Kontrola', email: 'kontrola@example.com' }, 'https://cudzia-stranka.example');
zapis(cudzi.status === 403, 'dopyt: formulár z cudzej stránky odmietnutý', String(cudzi.status));
await Promise.all([get, cudzi].map((r) => r.arrayBuffer()));

if (SKUSOBNY_DOPYT) {
  const r = await dopyt({
    jazyk: 'sk', meno: 'Skúška nasadenia', firma: 'Skúška webu microflex.sk (môžete zmazať)', email: 'web@microflex.sk',
    poznamka: `Skúšobný dopyt z kontroly nasadenia ${new Date().toLocaleString('sk-SK')}. Netreba odpovedať.`,
  });
  const j = await r.json().catch(() => null);
  zapis(r.status === 200 && j?.ok === true, 'dopyt: skutočné odoslanie e-mailu', `${r.status} ${JSON.stringify(j)}${r.status === 502 ? ' (SMTP: pozri /konfig/dopyt-stav/chyby.log)' : ''}`);
}

const chyby = vysledky.filter((v) => v === false).length;
console.log(`\n${chyby ? `✗ ${chyby} ${chyby === 1 ? 'kontrola neprešla' : chyby < 5 ? 'kontroly neprešli' : 'kontrol neprešlo'}` : '✓ Všetko v poriadku'} (${vysledky.filter(Boolean).length} v poriadku, ${vysledky.filter((v) => v === null).length} preskočených).`);
process.exit(chyby ? 1 : 0);
