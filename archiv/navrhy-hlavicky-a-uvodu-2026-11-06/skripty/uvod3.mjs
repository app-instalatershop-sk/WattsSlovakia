// Úvod domova, 3. kolo: K3 Materiál podľa Juraja (6. 11. 2026): „pravú stranu daj tak, aby nepresahovala ľavú,
// predeľ našikmo sa mi páči, aj pravú stranu vyrovnaj predelom, aby spodná ľavá časť pravej časti začínala na
// výške, kde končí ľavá“ + „prípadne ešte jednu možnosť“. Stavba od cf27343 (skutočná hlavička A), úvod sa
// upraví v prehliadači ako v 2. kole (uvod2.mjs). Render sa umiestni výpočtom: tvar rúry z alfa kanála
// (duo-profil.json), predeľ je Bézierova krivka masky pásu; rúra ani štítky ho nesmú prekročiť.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawn } from 'node:child_process';
const require = createRequire('C:/Users/krist/Documents/FajnInstalater/audit/scripts/package.json');
const { chromium } = require('playwright');
const KOREN = 'C:/Users/krist/Documents/FajnInstalater/MicroflexWeb';
const CIEL = `${KOREN}/snimky-stranok/navrh-hlavicka-uvod/uvod-3-kolo`;
mkdirSync(CIEL, { recursive: true });
const PORT = 4355;
const PROFIL = readFileSync(new URL('./duo-profil.json', import.meta.url), 'utf8');

const POMOCKY = `
  window.$ = (s, r = document) => r.querySelector(s);
  window.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  window.css = (t) => { const s = document.createElement('style'); s.textContent = t; document.head.append(s); };
  window.h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  window.PIN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';
  window.PROFIL = ${PROFIL};
  // Predeľ: kubická Bézierova krivka v percentách pásu (šírka W, výška H), od pravého horného rohu dole doľava.
  window.KRIVKA = [[100, 0], [97, 38], [92, 70], [80, 100]];
  window.predelX = (y, W, H) => {
    const B = (t, i) => { const p = KRIVKA.map((b) => b[i]); const u = 1 - t; return u*u*u*p[0] + 3*u*u*t*p[1] + 3*u*t*t*p[2] + t*t*t*p[3]; };
    const cy = Math.max(0, Math.min(100, y / H * 100));
    let a = 0, b = 1; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (B(m, 1) < cy) a = m; else b = m; }
    return B((a + b) / 2, 0) / 100 * W;
  };
`;

// Spoločné pre úvod: partner preč (je v hlavičke), skratky preč, predaj ako jeden riadok (ako v 2. kole).
const ZAKLAD = () => {
  $('.hero-partner').outerHTML = `<p class="k-mikro">${PIN}<span>Predaj a sklad <a href="#">Inštalatérshop, Raková</a></span></p>`;
  $('.hero-skratky').style.display = 'none';
  css(`
    .hero .h1-kicker { font-size: 15px !important; font-weight: 600 !important; letter-spacing: 0 !important; }
    .k-mikro { margin-top: 28px; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; }
    .k-mikro svg { width: 16px; height: 16px; flex: none; }
    .k-mikro a { font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
    .hero-skratky { display: none !important; }`);
};

// Tmavý pás z plášťa (K3 z 2. kola): rebrovanie z makra, ohnutý predeľ.
const PAS = (svetly = false) => {
  const hero = $('.hero');
  hero.prepend(h('<div class="k-pas" aria-hidden="true"></div>'));
  const HRANA = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0 0H100C97 38 92 70 80 100H0Z'/%3E%3C/svg%3E\")";
  const SPODOK = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0 0H100V84C62 92 30 100 0 100Z'/%3E%3C/svg%3E\")";
  css(`
    @media (min-width: 761px) { .hero .hero-in { grid-template-columns: minmax(0, 46fr) minmax(0, 54fr) !important; } }
    .k-pas { position: absolute; z-index: 0; left: 0; top: 0; bottom: 0; width: var(--k-sirka, 50%); pointer-events: none;
      background:
        linear-gradient(90deg, rgb(5 20 48 / .96) 0%, rgb(8 30 72 / .9) 46%, rgb(10 42 94 / .5) 76%, rgb(10 42 94 / .12) 100%),
        linear-gradient(180deg, rgb(5 20 48 / .55) 0%, rgb(5 20 48 / 0) 40%),
        url('/navrh-assets/src/3d/makra/plast.webp') right -40px top 22% / auto 125% no-repeat,
        #0a2a5e;
      -webkit-mask: ${HRANA} 0 0 / 100% 100% no-repeat; mask: ${HRANA} 0 0 / 100% 100% no-repeat; }
    .hero .hero-text { color: #fff; }
    .hero h1 { font-size: clamp(36px, 2.2vw + 20px, 60px) !important; }
    .hero .h1-kicker { color: rgb(255 255 255 / .7) !important; margin-bottom: 16px !important; }
    .hero .h1-a { color: #fff !important; }
    .hero .h1-b { color: #8fc1ff !important; }
    .hero .lead { color: rgb(255 255 255 / .84) !important; margin-top: 24px !important; max-width: 25em !important; }
    .hero-actions { margin-top: 36px !important; }
    .hero-odkaz { color: #fff !important; }
    .k-mikro { color: rgb(255 255 255 / .72) !important; }
    .k-mikro svg { color: var(--color-yellow-500) !important; }
    .k-mikro a { color: #fff !important; text-decoration-color: rgb(255 255 255 / .4) !important; }
    @media (max-width: 760px) {
      .k-pas { width: 100%; bottom: auto; height: var(--k-vyska, 60%); -webkit-mask: ${SPODOK} 0 0 / 100% 100% no-repeat; mask: ${SPODOK} 0 0 / 100% 100% no-repeat;
        background:
          linear-gradient(180deg, rgb(5 20 48 / .95) 0%, rgb(8 30 72 / .88) 60%, rgb(10 42 94 / .7) 100%),
          url('/navrh-assets/src/3d/makra/plast.webp') right -60px top 10% / auto 120% no-repeat, #0a2a5e; }
      .hero .hero-text { padding-bottom: 32px !important; }
    }`);
  const H = hero.getBoundingClientRect(), T = $('.hero-text').getBoundingClientRect();
  if (innerWidth > 760) hero.style.setProperty('--k-sirka', `${Math.round(T.right - H.left + 150)}px`);
  else hero.style.setProperty('--k-vyska', `${Math.round((T.bottom - H.top) / 0.84 + 8)}px`);
};

// Render voľne v hero (počítač): ľavý okraj, horný okraj a šírka v px voči hero. Štítok rúr ide doprava,
// aby nesmeroval do pásu.
const RENDER_VOLNE = () => { if (innerWidth > 760) $('.hero').append($('.hero-product')); css(`
  @media (min-width: 761px) {
    .hero .hero-product { position: absolute !important; z-index: 2; margin: 0 !important; left: var(--rx) !important; top: var(--ry) !important; width: var(--rw) !important; animation: none !important; }
    /* Pri obmedzenom pohybe má web prechody 0,01 ms: poloha by sa prepočítala až o snímku neskôr. */
    .hero .hero-product, .hero .hero-product * { transition: none !important; }
    .hero .hero-stage { max-width: none !important; margin: 0 !important; transform: none !important; }
    .hero .popis-rura .stitok { left: -0.75px !important; right: auto !important; align-items: flex-start !important; text-align: left !important; border-radius: clamp(8px, 0.9cqw, 12px) !important; border-top-left-radius: 2px !important; }
  }`); };

// Najmenší posun doprava, aby rúra (profil z alfa kanála) aj štítky a body boli za predelom s medzerou.
const ZA_PREDEL = (medzera) => {
  const hero = $('.hero'), pas = $('.k-pas');
  const H = hero.getBoundingClientRect(), P = pas.getBoundingClientRect();
  const W = P.width, HH = P.height;
  const prod = $('.hero-product');
  let posun = 0;
  for (let kolo = 0; kolo < 4; kolo++) {
    const R = prod.getBoundingClientRect();
    const rw = R.width, rh = rw * PROFIL.pomer;
    let treba = -Infinity;
    PROFIL.lavy.forEach((lx, yp) => {
      if (lx == null) return;
      const x = R.left - H.left + lx / 100 * rw, y = R.top - H.top + yp / 100 * rh;
      if (y < 0 || y > HH) return;
      treba = Math.max(treba, predelX(y, W, HH) + medzera - x);
    });
    $$('.hero .stitok, .hero .bod').forEach((el) => {
      const b = el.getBoundingClientRect();
      for (let s = 0; s <= 4; s++) {
        const y = b.top - H.top + (b.height * s) / 4;
        if (y < 0 || y > HH) continue;
        treba = Math.max(treba, predelX(y, W, HH) + medzera - (b.left - H.left));
      }
    });
    (window.__log ??= []).push({ kolo, treba: Math.round(treba), rx: getComputedStyle(hero).getPropertyValue('--rx'), R: Math.round(R.left - H.left), W: Math.round(W), HH: Math.round(HH) });
    if (!Number.isFinite(treba) || Math.abs(treba) < 0.5) break;
    posun += treba;
    hero.style.setProperty('--rx', `${parseFloat(getComputedStyle(hero).getPropertyValue('--rx')) + treba}px`);
  }
  return posun;
};

const VARIANTY = {
  // ---------- A: ako to chápem: rúra celá vpravo od predelu, jej čelo dole na výške, kde končí pás ----------
  A: () => {
    ZAKLAD(); PAS(); RENDER_VOLNE();
    const hero = $('.hero');
    const H = hero.getBoundingClientRect();
    if (innerWidth > 760) {
      const pas = $('.k-pas').getBoundingClientRect();
      // Veľkosť rúry ako doteraz (šírka štúdia), spodok čela (83,4 % výšky obrázka) na spodku pásu.
      const rw = Math.min(1180, Math.max(640, innerWidth * 0.62));
      const rh = rw * PROFIL.pomer;
      hero.style.setProperty('--rw', `${rw}px`);
      hero.style.setProperty('--ry', `${pas.height - 0.834 * rh}px`);
      hero.style.setProperty('--rx', `${pas.width * 0.8}px`);
      ZA_PREDEL(28);
    }
  },

  // ---------- B (ešte jedna možnosť): „vyrovnaný“ úvod: obe strany končia na jednej rovnej čiare, pás katalógu
  // začína rovno pod ňou (bez šikmej hrany), rúra je celá vo svetlej časti a v nej aj všetky kóty ----------
  B: () => {
    ZAKLAD(); PAS(); RENDER_VOLNE();
    const hero = $('.hero');
    css(`
      .hero { background-size: 100% 100% !important; }
      .katalog::before { -webkit-mask: none !important; mask: none !important; }
      .katalog { margin-top: 0 !important; padding-top: 96px !important; }
      @media (min-width: 761px) { .hero { min-height: 560px !important; } .hero .popis-plast { --l: 7cqw !important; } }`);
    if (innerWidth > 760) {
      const pas = $('.k-pas').getBoundingClientRect();
      const HH = pas.height;
      const rw = Math.min(1000, Math.max(620, innerWidth * 0.56)), rh = rw * PROFIL.pomer;
      hero.style.setProperty('--rw', `${rw}px`);
      // Spodok čela 96 px nad spodnou čiarou: pod ním je štítok rúr a celý ostane v úvode.
      hero.style.setProperty('--ry', `${HH - 96 - 0.834 * rh}px`);
      hero.style.setProperty('--rx', `${pas.width * 0.8}px`);
      ZA_PREDEL(40);
    }
  },
};
const MENA = { A: 'K3-A-ako-to-chapem', B: 'K3-B-rovny-spodok' };
const ktore = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(MENA);
const server = spawn(process.execPath, [`${KOREN}/snimky-stranok/_skripty/server.mjs`, `${KOREN}/web/dist`, String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const [z, vp, dsf, vyska] of [['pc', { width: 1600, height: 900 }, 1.25, 900], ['mobil', { width: 390, height: 844 }, 2, 1250]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf, reducedMotion: 'reduce' });
    await ctx.route('**/navrh-assets/**', async (route) => {
      const rel = decodeURIComponent(new URL(route.request().url()).pathname.replace(/^\/navrh-assets\/src\//, ''));
      const subor = join(KOREN, 'web/src/assets', rel);
      await route.fulfill({ status: 200, contentType: { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' }[extname(subor)], body: readFileSync(subor) });
    });
    for (const n of ktore) {
      const page = await ctx.newPage();
      await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(POMOCKY);
      const pomocne = { ZAKLAD, PAS, RENDER_VOLNE, ZA_PREDEL };
      const kod = Object.entries(pomocne).map(([k, f]) => `window.${k} = ${f.toString()};`).join('\n');
      await page.evaluate(kod);
      await page.evaluate(`(${VARIANTY[n].toString()})()`);
      await page.waitForTimeout(700);
      if (process.env.LADIT) console.log(n, z, JSON.stringify(await page.evaluate(() => window.__log)));
      await page.screenshot({ path: `${CIEL}/${MENA[n]}-${z}.png`, clip: { x: 0, y: 0, width: vp.width, height: vyska }, fullPage: true });
      console.log('ok', MENA[n], z);
      await page.close();
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
