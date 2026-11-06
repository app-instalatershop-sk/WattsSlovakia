// Úvod domova, 2. kolo (Juraj 6. 11. 2026: „úvod chcem inak, zmeň aj grafiku a dizajn, ako profík,
// zaujímavým štýlom, jasne a stručne“). Všetky s hlavičkou A. Obsah úvodu zredukovaný: nadpis, veta,
// akcia, jeden riadok o predaji. Partner je v hlavičke, skratky preč (katalóg je hneď pod úvodom).
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawn } from 'node:child_process';
const require = createRequire('C:/Users/krist/Documents/FajnInstalater/audit/scripts/package.json');
const { chromium } = require('playwright');
const KOREN = 'C:/Users/krist/Documents/FajnInstalater/MicroflexWeb';
const CIEL = `${KOREN}/snimky-stranok/navrh-hlavicka-uvod/uvod-2-kolo`;
// 0-dnes je zo stavby pred hlavičkou A (f3327ba); ostatné od cf27343 so skutočnou hlavičkou A.
mkdirSync(CIEL, { recursive: true });
const PORT = 4353;

const POMOCKY = `
  window.$ = (s, r = document) => r.querySelector(s);
  window.css = (t) => { const s = document.createElement('style'); s.textContent = t; document.head.append(s); };
  window.h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  window.IKONA = { hladat: document.querySelector('#hdr .search .icon svg')?.outerHTML ?? '', sipka: document.querySelector('.hero-actions .btn svg')?.outerHTML ?? '' };
  window.PIN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';
  window.WATTS = document.querySelector('.hero-partner-logo')?.outerHTML ?? '';
`;

// Hlavička A (vybraná 6. 11.): hľadanie v strede, menu v druhom riadku s partnerom.
const HA = () => {
  if (!document.querySelector('.topbar')) return; // od cf27343 je hlavička A v stavbe
  $('.topbar').style.display = 'none';
  const hdr = $('#hdr'); const hin = $('.hdr-in', hdr);
  const nav = $('#nav'); const search = $('.search', hin); const eshop = $('.eshop', hin);
  const tel = $('.topbar-tel').cloneNode(true); tel.classList.add('m-tel');
  const langs = $('.topbar .langs').cloneNode(true); langs.classList.add('m-langs');
  hin.insertBefore(tel, eshop); hin.insertBefore(langs, eshop);
  $('input', search).placeholder = 'Hľadajte obj. číslo, rad alebo rozmer';
  const r2 = h('<div class="m-r2"><div class="wrap m-r2-in"></div></div>'); hin.after(r2);
  $('.m-r2-in', r2).append(nav);
  const kont = nav.querySelector('a.nav-link').cloneNode(true); kont.textContent = 'Kontakt'; kont.removeAttribute('aria-current'); nav.append(kont);
  $('.m-r2-in', r2).append(h(`<span class="m-partner">${WATTS}<span>Jediný oficiálny partner pre Česko a Slovensko</span></span>`));
  css(`
    #hdr .hdr-in { gap: 24px !important; min-height: 76px !important; }
    #hdr .search { flex: 1 1 auto !important; max-width: 600px !important; margin: 0 auto 0 32px !important; height: 48px !important; }
    #hdr .search input { width: 100% !important; max-width: none !important; padding-right: 72px !important; }
    #hdr .search .search-kbd { display: inline-block !important; }
    #hdr .m-tel { display: inline-flex; align-items: center; gap: 8px; color: var(--color-ink) !important; font-weight: 600; font-size: 15px; white-space: nowrap; font-variant-numeric: tabular-nums; }
    #hdr .m-tel svg { opacity: .65; }
    #hdr .m-langs { display: inline-flex; align-items: center; gap: 8px; }
    #hdr .m-langs a { color: var(--color-ink-soft) !important; font-weight: 600; font-size: 14px; letter-spacing: .04em; padding: 4px 0; }
    #hdr .m-langs a[aria-current] { color: var(--color-ink) !important; box-shadow: inset 0 -2px 0 var(--color-yellow-500); }
    #hdr .m-langs .sep { width: 1px; height: 12px; background: rgb(10 42 94 / .2); }
    #hdr .m-r2 { background: #f4f7fb; }
    #hdr .m-r2-in { display: flex; align-items: center; justify-content: space-between; min-height: 48px; }
    #hdr .m-r2 .nav { margin-left: -12px !important; }
    #hdr .m-r2 .nav-link { height: 48px !important; }
    #hdr .m-r2 .nav-ind { display: none !important; }
    #hdr .m-partner { display: inline-flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; color: var(--color-ink-soft); white-space: nowrap; }
    #hdr .m-partner svg { height: 14px; width: auto; display: block; }
    @media (max-width: 760px) {
      #hdr .hdr-in { flex-wrap: wrap; row-gap: 4px; padding-bottom: 12px; }
      #hdr .search { display: flex !important; order: 10; flex: 1 1 100% !important; max-width: none !important; margin: 0 !important; }
      #hdr .search input { padding-right: 16px !important; }
      #hdr .search .search-kbd { display: none !important; }
      #hdr .hl-btn, #hdr .m-tel, #hdr .m-langs, #hdr .m-r2 { display: none !important; }
      #hdr .menu-btn { margin-left: auto !important; }
    }`);
};

// Spoločné pre všetky nové úvody: partner preč (je v hlavičke), skratky preč, predaj ako jeden riadok.
const ZAKLAD = () => {
  $('.hero-partner').outerHTML = `<p class="k-mikro">${PIN}<span>Predaj a sklad <a href="#">Inštalatérshop, Raková</a></span></p>`;
  $('.hero-skratky').style.display = 'none';
  css(`
    .hero .h1-kicker { font-size: 15px !important; font-weight: 600 !important; letter-spacing: 0 !important; color: var(--color-ink-soft) !important; }
    .k-mikro { margin-top: 28px; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: var(--color-ink-soft); }
    .k-mikro svg { width: 16px; height: 16px; color: var(--color-blue-700); flex: none; }
    .k-mikro a { color: var(--color-ink); font-weight: 600; text-decoration: underline; text-decoration-color: rgb(10 42 94 / .3); text-underline-offset: 3px; }
    .hero-skratky { display: none !important; }`);
};

const VARIANTY = {
  dnes: () => {},
  hlavickaA: () => { HA(); },

  // ---------- K1 Veľký titul: redakčný štýl, obrovský nadpis, ťažký a ľahký rez, nič navyše ----------
  K1: () => {
    HA(); ZAKLAD();
    css(`
      @media (min-width: 761px) { .hero .hero-in { grid-template-columns: minmax(0, 52fr) minmax(0, 48fr) !important; } }
      .hero .hero-text { max-width: none !important; padding-block: 40px !important; }
      .hero h1 { font-size: clamp(46px, 4.6vw + 12px, 98px) !important; line-height: .95 !important; letter-spacing: -.045em !important; text-wrap: wrap !important; }
      .hero .h1-kicker { margin-bottom: 24px !important; line-height: 1.4 !important; letter-spacing: 0 !important; }
      .hero .h1-b { color: var(--color-blue-700) !important; font-weight: 300 !important; }
      .hero .lead { font-size: 20px !important; line-height: 1.5 !important; max-width: 26em !important; margin-top: 32px !important; }
      .hero-actions { margin-top: 36px !important; }
      @media (max-width: 760px) { .hero h1 { font-size: 46px !important; } .hero .lead { font-size: 17px !important; } }`);
  },

  // ---------- K2 Žlté jadro: žltá akcia vedie čiarou priamo do žltého jadra rúry ----------
  K2: () => {
    HA(); ZAKLAD();
    css(`
      .hero .h1-b { color: var(--color-ink) !important; }
      .hero h1 { font-size: clamp(40px, 2.6vw + 20px, 66px) !important; }
      .hero .h1-kicker { margin-bottom: 16px !important; }
      .hero .lead { margin-top: 24px !important; max-width: 27em !important; }
      .hero-actions { margin-top: 36px !important; flex-direction: column; align-items: flex-start !important; gap: 16px !important; }
      .k-jadro { position: absolute; z-index: 6; height: 6px; border-radius: 3px; background: linear-gradient(90deg, var(--color-yellow-500), #f8d123); box-shadow: 0 8px 16px -8px rgb(176 138 0 / .7); transform-origin: 0 50%; pointer-events: none; }
      .k-jadro::before { content: ""; position: absolute; left: -3px; top: 50%; width: 12px; height: 12px; margin-top: -6px; border-radius: 50%; background: var(--color-yellow-500); }`);
    const hero = $('.hero'), text = $('.hero-text'), btn = $('.hero-actions .btn-yellow'), bod = $('.popis-rura .bod');
    const mobil = innerWidth <= 760;
    // Telefón: výrobok je pod textom, čiara by križovala odkazy; tam ostáva len žltá akcia a žlté jadro.
    if (mobil) return;
    let b = btn.getBoundingClientRect(); const d = bod.getBoundingClientRect();
    // Na počítači sa blok textu posunie tak, aby stred žltého tlačidla ležal presne vo výške jadra (dva kroky,
    // druhý doladí zaokrúhlenie), čiara je potom vodorovná.
    if (!mobil) {
      let posun = 0;
      for (let i = 0; i < 3; i++) { b = btn.getBoundingClientRect(); posun += (d.top + d.height / 2) - (b.top + b.height / 2); text.style.top = `${posun}px`; }
      b = btn.getBoundingClientRect();
    }
    const H = hero.getBoundingClientRect();
    const x2 = d.left + d.width / 2 - H.left, y2 = d.top + d.height / 2 - H.top;
    const x1 = mobil ? b.left + 32 - H.left : b.right + 14 - H.left;
    const y1 = mobil ? b.bottom + 12 - H.top : y2;
    const dlzka = Math.hypot(x2 - x1, y2 - y1), uhol = Math.atan2(y2 - y1, x2 - x1);
    const ciara = h('<span class="k-jadro"></span>'); hero.append(ciara);
    Object.assign(ciara.style, { left: `${x1}px`, top: `${y1 - 3}px`, width: `${dlzka}px`, transform: `rotate(${uhol}rad)` });
  },

  // ---------- K3 Materiál: ľavá strana je tmavý pás z plášťa HDPE (skutočné rebrovanie z makra), s ohnutou
  // hranou ako šikmé hrany webu; render prechádza cez hranu pred pásom ----------
  K3: () => {
    HA(); ZAKLAD();
    const hero = $('.hero'), text = $('.hero-text');
    $('.hero-odkaz').classList.add('k-svetly');
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
      .hero .hero-product { z-index: 2; }
      .hero h1 { font-size: clamp(36px, 2.2vw + 20px, 60px) !important; }
      .hero .h1-kicker { color: rgb(255 255 255 / .7) !important; margin-bottom: 16px !important; }
      .hero .h1-a { color: #fff !important; }
      .hero .h1-b { color: #8fc1ff !important; }
      .hero .lead { color: rgb(255 255 255 / .84) !important; margin-top: 24px !important; max-width: 25em !important; }
      .hero-actions { margin-top: 36px !important; }
      .hero-odkaz.k-svetly { color: #fff !important; }
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
    // Šírka pásu: po pravý okraj textu a ešte kus (hrana sa ohýba doľava, spodok končí pri texte).
    const H = hero.getBoundingClientRect(), T = text.getBoundingClientRect();
    if (innerWidth > 760) hero.style.setProperty('--k-sirka', `${Math.round(T.right - H.left + 150)}px`);
    // Telefón: spodok pásu je šikmý (vpravo 84 % výšky), celý text musí byť nad šikmou časťou.
    else hero.style.setProperty('--k-vyska', `${Math.round((T.bottom - H.top) / 0.84 + 8)}px`);
  },
};
const MENA = { dnes: '0-dnes', hlavickaA: '1-len-hlavicka-A', K1: 'K1-velky-titul', K2: 'K2-zlte-jadro', K3: 'K3-material' };
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
      await page.evaluate(`(${VARIANTY[n].toString().replace(/\bHA\(\)/g, `(${HA.toString()})()`).replace(/\bZAKLAD\(\)/g, `(${ZAKLAD.toString()})()`)})()`);
      await page.waitForTimeout(700);
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
