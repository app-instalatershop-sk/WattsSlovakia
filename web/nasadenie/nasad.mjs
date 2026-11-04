/**
 * Nasadenie webu na hosting Websupport cez FTP so šifrovaním (FTPS, port 21). Prvé spustenie: docs/NASADENIE.md.
 *
 * 1. build (npm run build) a kontrola odkazov (python ../data/kontrola_webu.py),
 * 2. porovnanie web/dist so zoznamom odtlačkov z minulého nasadenia na serveri (/konfig/nasadenie.json),
 * 3. nahratie len zmenených súborov: najprv obrázky, skripty a dáta, potom stránky, nakoniec mapa webu,
 *    robots.txt a .htaccess (nový .htaccess sa najprv skúsi v pomocnom priečinku: chyba v ňom by zhodila web),
 * 4. zmazanie súborov, ktoré v novom builde nie sú (len tých, ktoré sem dal tento skript); súbory z _astro/
 *    až o 24 hodín: stránka uložená v pamäti servera (asi 10 minút) alebo otvorená v prehliadači na ne ešte odkazuje,
 * 5. nastavenie odosielania dopytu (nasadenie/dopyt.konfig.php → /konfig/dopyt.php) a nový zoznam odtlačkov.
 *
 * Použitie v priečinku web:
 *   npm run nasadit                    build, kontrola a nahratie
 *   npm run nasadit -- --skusobne      len vypíše, čo by nahral a zmazal; na serveri nič nemení
 *   npm run nasadit -- --bez-buildu    nahrá existujúci web/dist (build a kontrola už prebehli)
 *   npm run nasadit -- --neindexovat   vyhľadávače web zatiaľ neindexujú (hlavička X-Robots-Tag)
 *   npm run nasadit -- --bez-skusky    nahrá .htaccess bez skúšky (doména ešte neukazuje na hosting)
 * Prístup na FTP: nasadenie/.env (vzor nasadenie/env.vzor), mimo gitu. Po nasadení: npm run overit.
 */
import { Client } from 'basic-ftp';
import { execSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { isIP } from 'node:net';
import { dirname, join, posix, relative, sep } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const TU = dirname(fileURLToPath(import.meta.url));
const WEB = dirname(TU);
const DIST = join(WEB, 'dist');
const VOLBY = ['--skusobne', '--bez-buildu', '--neindexovat', '--bez-skusky'];
const ARG = new Set(process.argv.slice(2));
const nezname = [...ARG].filter((a) => !VOLBY.includes(a));
if (nezname.length) koniec(`Neznáma voľba ${nezname.join(', ')}. Možnosti: ${VOLBY.join(', ')}.`);
const SKUSOBNE = ARG.has('--skusobne');
const NEINDEXOVAT = ARG.has('--neindexovat');

const NOINDEX = '\n# Dočasne bez indexovania (npm run nasadit -- --neindexovat). Bežné nasadenie tento blok vynechá.\n'
  + '<IfModule mod_headers.c>\n  Header always set X-Robots-Tag "noindex, nofollow"\n</IfModule>\n';
const ZAKAZ = '# Konfigurácia dopytu: z prehliadača nedostupná.\nRequire all denied\n';

if (existsSync(join(TU, '.env'))) process.loadEnvFile(join(TU, '.env'));
const c = {
  server: (process.env.FTP_SERVER ?? '').trim(),
  port: Number(process.env.FTP_PORT || 21),
  pouzivatel: (process.env.FTP_POUZIVATEL ?? '').trim(),
  heslo: process.env.FTP_HESLO ?? '',
  odtlacok: (process.env.FTP_ODTLACOK ?? '').toUpperCase().replace(/[^0-9A-F]/g, ''),
  web: (process.env.FTP_WEB || '/web').replace(/\/+$/, ''),
  konfig: (process.env.FTP_KONFIG || '/konfig').replace(/\/+$/, ''),
  adresa: (process.env.WEB_ADRESA || 'https://microflex.sk').replace(/\/+$/, ''),
  spojenia: Math.max(1, Math.min(8, Number(process.env.FTP_SPOJENIA || 4))),
};
// Git Bash prepisuje premennú prostredia „/web“ na cestu vo Windows (C:/Program Files/Git/web).
if (/^[A-Za-z]:|\\/.test(c.web + c.konfig) || !c.web.startsWith('/') || !c.konfig.startsWith('/')) {
  koniec(`FTP_WEB (${c.web}) a FTP_KONFIG (${c.konfig}) sú cesty na FTP, napríklad /web. Zapíš ich do nasadenie/.env, v Git Bash prípadne s MSYS_NO_PATHCONV=1.`);
}
const konfigVoWebe = c.konfig.startsWith(c.web + '/');
const zaciatok = Date.now();

if (!ARG.has('--bez-buildu') && !SKUSOBNE) {
  krok('Build');
  if (spawnSync('npm run build', { cwd: WEB, stdio: 'inherit', shell: true }).status !== 0) koniec('Build zlyhal, nič som nenahral.');
  krok('Kontrola odkazov a kotiev');
  const k = spawnSync(process.env.PYTHON || 'python', ['-X', 'utf8', join(WEB, '..', 'data', 'kontrola_webu.py')], { encoding: 'utf8' });
  process.stdout.write(k.stdout ?? '');
  process.stderr.write(k.stderr ?? '');
  const n = /chybné odkazy a kotvy: (\d+)/.exec(k.stdout ?? '');
  if (k.status !== 0 || !n) koniec('Kontrola webu nebežala (python ../data/kontrola_webu.py), nič som nenahral.');
  if (Number(n[1]) > 0) koniec(`Kontrola našla ${n[1]} chybných odkazov alebo kotiev, nič som nenahral.`);
}

if (!c.server || !c.pouzivatel || !c.heslo) {
  koniec('Chýba prístup na FTP: skopíruj nasadenie/env.vzor ako nasadenie/.env a doplň FTP_SERVER, FTP_POUZIVATEL a FTP_HESLO (docs/NASADENIE.md, krok 4).');
}
if (!existsSync(join(DIST, 'index.html')) || !existsSync(join(DIST, '.htaccess'))) {
  koniec('web/dist nie je úplný (chýba index.html alebo .htaccess). Spusti nasadenie bez --bez-buildu.');
}

// Súbory buildu s odtlačkami; .htaccess v pamäti (pri --neindexovat s blokom navyše).
const lokalne = new Map();
for (const cesta of zoznamSuborov(DIST)) {
  let obsah = readFileSync(join(DIST, cesta));
  if (cesta === '.htaccess' && NEINDEXOVAT) obsah = Buffer.concat([obsah, Buffer.from(NOINDEX)]);
  lokalne.set(cesta, { hash: odtlacok(obsah), velkost: obsah.length, obsah: cesta === '.htaccess' ? obsah : null });
}

let konfig = null;
const konfigSubor = join(TU, 'dopyt.konfig.php');
if (!existsSync(konfigSubor)) {
  varuj('Chýba nasadenie/dopyt.konfig.php: formulár dopytu bude hlásiť chybu a ponúkne e-mail (vzor dopyt.konfig.vzor.php).');
} else {
  const obsah = readFileSync(konfigSubor);
  if (/SEM-HESLO-SCHRANKY|ZMENTE-NA-NAHODNY-TEXT/.test(obsah.toString('utf8'))) varuj('V nasadenie/dopyt.konfig.php ostalo heslo alebo soľ zo vzoru, konfiguráciu dopytu nenahrám.');
  else konfig = { obsah, hash: odtlacok(obsah) };
}

const klienti = [];
let zmenyNaServeri = false;
try {
  krok(`Pripojenie na ${c.server}:${c.port} (FTPS)`);
  klienti.push(await pripoj());
  const hlavny = klienti[0];
  if (!SKUSOBNE) {
    try {
      await hlavny.ensureDir(c.konfig);
      await hlavny.cd('/');
    } catch (e) {
      throw new Error(`priečinok ${c.konfig} sa nedá vytvoriť (${e?.message ?? e}). Ak FTP účet nevidí priečinok vedľa ${c.web}, použi hlavný FTP účet domény, alebo nastav FTP_KONFIG=${c.web}/api/konfig.`);
    }
    // Priečinok konfigurácie vo webe (záloha, keď hosting nedovolí priečinok vedľa) musí byť z prehliadača zamknutý.
    if (konfigVoWebe) await hlavny.uploadFrom(Readable.from(Buffer.from(ZAKAZ)), `${c.konfig}/.htaccess`);
  }

  const text = await stiahniText(hlavny, `${c.konfig}/nasadenie.json`);
  const predosle = text ? JSON.parse(text) : { subory: {} };
  const stare = predosle.subory ?? {};
  if (!text) {
    console.log(`  Prvé nasadenie (na serveri nie je ${c.konfig}/nasadenie.json).`);
    const cudzie = (await hlavny.list(c.web)).map((z) => z.name)
      .filter((m) => !lokalne.has(m) && ![...lokalne.keys()].some((p) => p.startsWith(m + '/')));
    if (cudzie.length) varuj(`V ${c.web} sú súbory, ktoré tento skript nenahral ani nezmaže: ${cudzie.join(', ')}. Zástupnú stránku Websupportu zmaž cez WebFTP.`);
  } else {
    console.log(`  Na serveri je nasadenie z ${predosle.nasadene ?? '?'} (commit ${predosle.commit ?? '?'}).`);
  }

  const skupina = (p) => (p === '.htaccess' || p === 'robots.txt' || /^sitemap[^/]*\.xml$/.test(p) ? 3 : p.endsWith('.html') ? 2 : 1);
  // Súbory z _astro/, ktoré vypadli z buildu, ostanú na serveri 24 hodín (odložené), ostatné sa zmažú hneď.
  const teraz = Date.now();
  const odlozene = Object.fromEntries(Object.entries(predosle.odlozene ?? {}).filter(([p]) => !lokalne.has(p)));
  for (const p of Object.keys(stare)) {
    if (!lokalne.has(p) && p.startsWith('_astro/') && !odlozene[p]) odlozene[p] = { hash: stare[p], od: new Date(teraz).toISOString() };
  }
  const naServeri = (p) => stare[p] ?? predosle.odlozene?.[p]?.hash;
  const nahrat = [...lokalne.keys()].filter((p) => naServeri(p) !== lokalne.get(p).hash);
  const zmazat = [
    ...Object.keys(stare).filter((p) => !lokalne.has(p) && !odlozene[p]),
    ...Object.keys(odlozene).filter((p) => teraz - Date.parse(odlozene[p].od) > 24 * 3600 * 1000),
  ];
  for (const p of zmazat) delete odlozene[p];
  const zmenaKonfigu = konfig !== null && konfig.hash !== predosle.konfig;
  const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;
  const velkost = nahrat.reduce((s, p) => s + lokalne.get(p).velkost, 0);
  console.log(`  Nahrať ${suborov(nahrat.length)} (${mb(velkost)}), zmazať ${zmazat.length}, odložených na zmazanie ${Object.keys(odlozene).length}, konfigurácia dopytu: ${zmenaKonfigu ? 'nová' : 'bez zmeny'}.`);

  if (SKUSOBNE) {
    for (const [nazov, zoznam] of [['nahrať', nahrat], ['zmazať', zmazat]]) {
      if (zoznam.length) console.log(`  ${nazov}:\n    ${zoznam.slice(0, 25).join('\n    ')}${zoznam.length > 25 ? `\n    … a ďalších ${zoznam.length - 25}` : ''}`);
    }
    console.log('\nSkúšobne: na serveri som nič nezmenil.');
    process.exit(0);
  }
  if (!nahrat.length && !zmazat.length && !zmenaKonfigu && Object.keys(odlozene).length === Object.keys(predosle.odlozene ?? {}).length) {
    console.log('\nNa serveri je všetko aktuálne, nič som nenahral.');
    process.exit(0);
  }

  while (klienti.length < Math.min(c.spojenia, Math.max(1, nahrat.length))) klienti.push(await pripoj());

  zmenyNaServeri = true;
  const zname = new Set(priecinky(Object.keys(stare)));
  const nove = priecinky(nahrat).filter((d) => !zname.has(d));
  if (nove.length) krok(`Priečinky (${nove.length})`);
  for (const d of nove) await hlavny.sendIgnoringError(`MKD ${c.web}/${d}`);

  const nahraj = (k, p) => k.uploadFrom(lokalne.get(p).obsah ? Readable.from(lokalne.get(p).obsah) : join(DIST, p), `${c.web}/${p}`);
  for (const [n, nazov] of [[1, 'Obrázky, skripty a dáta'], [2, 'Stránky'], [3, 'Mapa webu, robots.txt a .htaccess']]) {
    const zoznam = nahrat.filter((p) => skupina(p) === n && p !== '.htaccess');
    if (zoznam.length || (n === 3 && nahrat.includes('.htaccess'))) krok(nazov);
    await paralelne(zoznam, nahraj, 'nahraté');
  }
  // Keď skúška .htaccess neprejde, ostatné sa dokončí a zapíše, .htaccess ostane na ďalšie spustenie.
  let chybaHtaccess = null;
  if (nahrat.includes('.htaccess')) {
    const s = ARG.has('--bez-skusky') ? null : await skusHtaccess(klienti[0], lokalne.get('.htaccess').obsah);
    if (!s) varuj('.htaccess nahrávam bez skúšky (--bez-skusky).');
    else if (s.ok) console.log(`  Skúška .htaccess v pomocnom priečinku: 200${s.hlavicky ? ', hlavičky áno' : ', hlavičky NIE (mod_headers?)'}.`);
    else {
      chybaHtaccess = s.stav === 500
        ? 'Nový .htaccess hosting nezobral (chyba 500 v pomocnom priečinku), v koreni ostal starý. Oprav web/public/.htaccess a nasaď znova.'
        : `Skúška .htaccess vrátila ${s.stav} namiesto 200: ${c.adresa} asi ešte neukazuje na tento hosting, alebo FTP_WEB nie je koreň webu. Ostatné súbory sú nahraté; .htaccess nahrá ďalšie spustenie (alebo --bez-skusky).`;
    }
    if (!chybaHtaccess) {
      await nahraj(klienti[0], '.htaccess');
      console.log('  .htaccess nahratý.');
    }
  }

  if (zmenaKonfigu) {
    krok('Odosielanie dopytu');
    await klienti[0].uploadFrom(Readable.from(konfig.obsah), `${c.konfig}/dopyt.php`);
    console.log(`  ${c.konfig}/dopyt.php nahratý${konfigVoWebe ? ' (priečinok vo webe chráni .htaccess)' : ''}.`);
  }

  if (zmazat.length) {
    krok('Mazanie starých súborov');
    await paralelne(zmazat, (k, p) => k.remove(`${c.web}/${p}`, true), 'zmazané');
    const ostanu = new Set(priecinky([...lokalne.keys(), ...Object.keys(odlozene)]));
    const prazdne = priecinky(zmazat).filter((d) => !ostanu.has(d)).sort((a, b) => b.split('/').length - a.split('/').length);
    for (const d of prazdne) await klienti[0].sendIgnoringError(`RMD ${c.web}/${d}`);
  }

  const zaznam = {
    verzia: 1,
    nasadene: new Date().toISOString(),
    commit: commit(),
    neindexovat: NEINDEXOVAT,
    konfig: zmenaKonfigu ? konfig.hash : predosle.konfig ?? null,
    subory: Object.fromEntries([...lokalne].map(([p, u]) => [p, u.hash])),
    odlozene,
  };
  if (chybaHtaccess) {
    if (stare['.htaccess']) zaznam.subory['.htaccess'] = stare['.htaccess'];
    else delete zaznam.subory['.htaccess'];
  }
  await klienti[0].uploadFrom(Readable.from(Buffer.from(JSON.stringify(zaznam))), `${c.konfig}/nasadenie.json`);
  if (chybaHtaccess) koniec(chybaHtaccess);

  const sekundy = Math.round((Date.now() - zaciatok) / 1000);
  console.log(`\nHotovo za ${Math.floor(sekundy / 60)} min ${sekundy % 60} s: ${c.adresa}/ (commit ${zaznam.commit}${NEINDEXOVAT ? ', BEZ indexovania' : ''}).`);
  console.log('Skontroluj: npm run overit. Websupport drží statické súbory v pamäti asi 10 minút, zmena sa môže ukázať s oneskorením.');
} catch (e) {
  koniec(`Nasadenie sa prerušilo: ${e?.message ?? e}${zmenyNaServeri ? '\nZoznam odtlačkov na serveri ostal starý, ďalšie spustenie nahrá chýbajúce súbory znova.' : ''}`);
} finally {
  for (const k of klienti) k.close();
}


/** Pripojí sa, zapne TLS, overí certifikát (alebo pripnutý odtlačok) a až potom pošle meno a heslo. */
async function pripoj() {
  const k = new Client(60_000);
  await k.connect(c.server, c.port);
  const tls = { host: c.server, rejectUnauthorized: !c.odtlacok, ...(isIP(c.server) ? {} : { servername: c.server }) };
  try {
    await k.useTLS(tls);
  } catch (e) {
    k.close();
    throw await chybaCertifikatu(e);
  }
  if (c.odtlacok) {
    const odtl = (k.ftp.socket.getPeerCertificate().fingerprint256 ?? '').replace(/:/g, '');
    if (odtl !== c.odtlacok) {
      k.close();
      throw new Error(`odtlačok certifikátu FTP servera ${odtl} nesedí s FTP_ODTLACOK v nasadenie/.env. Ak Websupport certifikát vymenil, over nový vo WebAdmine a zapíš ho.`);
    }
  }
  await k.sendIgnoringError('OPTS UTF8 ON');
  await k.login(c.pouzivatel, c.heslo);
  await k.useDefaultSettings();
  return k;
}

/** Pri neoverenom certifikáte ho zistí (bez prihlásenia), aby sa dal porovnať a pripnúť. */
async function chybaCertifikatu(povodna) {
  if (!/cert|altname|self.signed|issuer|verify/i.test(String(povodna?.message))) return povodna;
  const k = new Client(30_000);
  try {
    await k.connect(c.server, c.port);
    await k.useTLS({ host: c.server, rejectUnauthorized: false, ...(isIP(c.server) ? {} : { servername: c.server }) });
    const cert = k.ftp.socket.getPeerCertificate();
    return new Error([
      `certifikát FTP servera sa nepodarilo overiť (${povodna.message}).`,
      `Server ukázal certifikát pre ${cert.subject?.CN ?? '?'} (${cert.subjectaltname ?? 'bez ďalších mien'}), vydal ${cert.issuer?.O ?? cert.issuer?.CN ?? '?'}, platný do ${cert.valid_to}.`,
      'Ak sedí meno so serverom Websupportu, daj ho do FTP_SERVER v nasadenie/.env. Inak certifikát pripni:',
      `  FTP_ODTLACOK=${(cert.fingerprint256 ?? '').replace(/:/g, '')}`,
    ].join('\n'));
  } catch {
    return povodna;
  } finally {
    k.close();
  }
}

/** Úlohy rozdelí medzi otvorené spojenia; pri chybe spojenie obnoví a skúsi znova (spolu 3 pokusy). */
async function paralelne(ulohy, praca, nazov) {
  if (!ulohy.length) return;
  let dalsia = 0;
  let hotove = 0;
  let vypis = 0;
  const pracovnik = async (i) => {
    while (dalsia < ulohy.length) {
      const u = ulohy[dalsia++];
      for (let pokus = 1; ; pokus++) {
        try {
          await praca(klienti[i], u);
          break;
        } catch (e) {
          if (pokus === 3) throw new Error(`${u}: ${e?.message ?? e}`);
          klienti[i].close();
          klienti[i] = await pripoj();
        }
      }
      hotove++;
      if (Date.now() - vypis > 1000 || hotove === ulohy.length) {
        vypis = Date.now();
        process.stdout.write(`\r  ${nazov} ${hotove}/${ulohy.length}`);
      }
    }
  };
  await Promise.all(klienti.map((_, i) => pracovnik(i)));
  process.stdout.write('\n');
}

/** Nový .htaccess v pomocnom priečinku: ak by mal chybu, server vráti 500 len tam, nie na celom webe. */
async function skusHtaccess(k, obsah) {
  const meno = `_skuska-htaccess-${Date.now().toString(36)}`;
  const priecinok = `${c.web}/${meno}`;
  await k.sendIgnoringError(`MKD ${priecinok}`);
  try {
    await k.uploadFrom(Readable.from(obsah), `${priecinok}/.htaccess`);
    await k.uploadFrom(Readable.from(Buffer.from('<!doctype html><title>skuska</title><p>ok</p>\n')), `${priecinok}/index.html`);
    const odpoved = await fetch(`${c.adresa}/${meno}/`, { redirect: 'manual', signal: AbortSignal.timeout(20_000) });
    const telo = await odpoved.text();
    return { stav: odpoved.status, ok: odpoved.status === 200 && telo.includes('<p>ok</p>'), hlavicky: odpoved.headers.has('x-content-type-options') };
  } catch (e) {
    return { stav: `chybu spojenia (${e?.message ?? e})`, ok: false };
  } finally {
    await k.remove(`${priecinok}/.htaccess`, true);
    await k.remove(`${priecinok}/index.html`, true);
    await k.sendIgnoringError(`RMD ${priecinok}`);
  }
}

async function stiahniText(k, cesta) {
  const casti = [];
  const ciel = new Writable({ write(kus, _k, hotovo) { casti.push(kus); hotovo(); } });
  try {
    await k.downloadTo(ciel, cesta);
  } catch (e) {
    // Chýbajúci súbor hlási server kódom 550 (niektoré 551 alebo 450). Bez zoznamu sa nahrá všetko a nič sa nezmaže.
    if (e?.code >= 450 && e?.code < 600) {
      if (e.code !== 550) console.log(`  ${cesta} sa nedal načítať (${e.code} ${e.message}), beriem to ako prvé nasadenie.`);
      return null;
    }
    throw e;
  }
  return Buffer.concat(casti).toString('utf8');
}

function zoznamSuborov(koren) {
  const vysledok = [];
  const prejdi = (p) => {
    for (const z of readdirSync(p, { withFileTypes: true })) {
      if (z.isDirectory()) prejdi(join(p, z.name));
      else if (z.isFile()) vysledok.push(relative(koren, join(p, z.name)).split(sep).join('/'));
    }
  };
  prejdi(koren);
  return vysledok.sort();
}

/** Všetky nadradené priečinky súborov, rodičia pred deťmi. */
function priecinky(cesty) {
  const vysledok = new Set();
  for (const p of cesty) {
    for (let d = posix.dirname(p); d !== '.' && d !== '/'; d = posix.dirname(d)) vysledok.add(d);
  }
  return [...vysledok].sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b));
}

function odtlacok(obsah) {
  return createHash('sha256').update(obsah).digest('hex');
}

function commit() {
  try {
    const hash = execSync('git rev-parse --short HEAD', { cwd: WEB }).toString().trim();
    return execSync('git status --porcelain', { cwd: WEB }).toString().trim() ? `${hash} + necommitnuté zmeny` : hash;
  } catch {
    return '?';
  }
}

/** 1 súbor, 2 až 4 súbory, 0 alebo 5 a viac súborov. */
function suborov(n) {
  return `${n} ${n === 1 ? 'súbor' : n >= 2 && n <= 4 ? 'súbory' : 'súborov'}`;
}

function krok(text) {
  console.log(`\n== ${text}`);
}

function varuj(text) {
  console.log(`  POZOR: ${text}`);
}

function koniec(text) {
  console.error(`\n${text}`);
  process.exit(1);
}
