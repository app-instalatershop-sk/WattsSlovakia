// Návrhy hlavičky (HA, HB, HC) a ľavej strany úvodu (UA, UB, UC), Juraj 6. 11. 2026.
// Web sa nemení: do domova z web/dist sa vloží iné usporiadanie a odfotí sa (počítač 1600, telefón 390).
// node navrhy.mjs [dnes HA HB HBo HC UA UB UC]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
const require = createRequire('C:/Users/krist/Documents/FajnInstalater/audit/scripts/package.json');
const { chromium } = require('playwright');
const KOREN = 'C:/Users/krist/Documents/FajnInstalater/MicroflexWeb';
const CIEL = `${KOREN}/snimky-stranok/navrh-hlavicka-uvod`;
mkdirSync(CIEL, { recursive: true });
const PORT = 4351;

// Spoločné pomôcky v prehliadači (posielajú sa ako text a spustia sa pred variantom).
const POMOCKY = `
  window.$ = (s, r = document) => r.querySelector(s);
  window.css = (t) => { const s = document.createElement('style'); s.textContent = t; document.head.append(s); };
  window.h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  window.IKONA = {
    hladat: document.querySelector('#hdr .search .icon svg')?.outerHTML ?? '',
    sipka: document.querySelector('.hero-actions .btn svg')?.outerHTML ?? '',
    dole: document.querySelector('.hero-skratky svg')?.outerHTML ?? '',
  };
  window.WATTS = document.querySelector('.hero-partner-logo')?.outerHTML ?? '';
`;

const VARIANTY = {
  dnes: () => {},

  // ---------- Hlavička A: hľadanie v strede (e-shop), menu v druhom riadku, bez tmavého pásu ----------
  HA: () => {
    $('.topbar').style.display = 'none';
    const hdr = $('#hdr'); const hin = $('.hdr-in', hdr);
    const nav = $('#nav'); const search = $('.search', hin); const eshop = $('.eshop', hin);
    const tel = $('.topbar-tel').cloneNode(true); tel.classList.add('m-tel');
    const langs = $('.topbar .langs').cloneNode(true); langs.classList.add('m-langs');
    hin.insertBefore(tel, eshop); hin.insertBefore(langs, eshop);
    $('input', search).placeholder = 'Hľadajte obj. číslo, rad alebo rozmer';
    const r2 = h('<div class="m-r2"><div class="wrap m-r2-in"></div></div>');
    hin.after(r2);
    $('.m-r2-in', r2).append(nav);
    const kont = nav.querySelector('a.nav-link').cloneNode(true); kont.textContent = 'Kontakt'; kont.removeAttribute('aria-current'); nav.append(kont);
    const partner = h(`<span class="m-partner">${WATTS}<span>Jediný oficiálny partner pre Česko a Slovensko</span></span>`);
    $('.m-r2-in', r2).append(partner);
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
  },

  // ---------- Hlavička B: jedna lišta, hľadanie ako tlačidlo (otvorí veľký panel), bez horného pásu ----------
  HB: () => {
    $('.topbar').style.display = 'none';
    const hin = $('.hdr-in'); const eshop = $('.eshop', hin);
    $('.search', hin).style.display = 'none';
    const btn = h(`<button class="m-hladat" type="button">${IKONA.hladat}<span>Hľadať</span><kbd>Ctrl K</kbd></button>`);
    const langs = $('.topbar .langs').cloneNode(true); langs.classList.add('m-langs');
    hin.insertBefore(btn, eshop); hin.insertBefore(langs, eshop);
    css(`
      #hdr .nav { margin-left: auto !important; margin-right: 8px !important; }
      #hdr .m-hladat { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; height: 44px; padding: 0 8px 0 16px; border-radius: 999px; background: #f1f5fa; box-shadow: inset 0 0 0 1px rgb(10 42 94 / .08); color: var(--color-ink); font: 500 15px var(--font-text); white-space: nowrap; flex: none; }
      #hdr .m-hladat svg { width: 18px; height: 18px; color: #6b7686; }
      #hdr .m-hladat kbd { padding: 4px 8px; border-radius: 4px; background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / .14); font: 500 12px var(--font-text); color: #6b7686; }
      #hdr .m-langs { display: inline-flex; align-items: center; gap: 8px; flex: none; }
      #hdr .m-langs a { color: var(--color-ink-soft) !important; font-weight: 600; font-size: 14px; letter-spacing: .04em; padding: 4px 0; }
      #hdr .m-langs a[aria-current] { color: var(--color-ink) !important; box-shadow: inset 0 -2px 0 var(--color-yellow-500); }
      #hdr .m-langs .sep { width: 1px; height: 12px; background: rgb(10 42 94 / .2); }
      @media (max-width: 760px) { #hdr .m-hladat, #hdr .m-langs { display: none !important; } }`);
  },

  // Hlavička B s otvoreným hľadaním: celá šírka, veľké pole, výsledky so skutočnými obj. číslami.
  HBo: () => {
    VARIANTY_TEXT.HB();
    const hdr = $('#hdr');
    const panel = h(`<div class="m-panel"><div class="wrap m-panel-in">
      <div class="m-pole">${IKONA.hladat}<span class="m-text">MD160</span><span class="m-kurzor"></span><kbd>Esc</kbd></div>
      <div class="m-vysl">
        <p class="m-sk">Obj. čísla</p>
        <a><b>MD16025C</b><span>Microflex DUO, vykurovanie 6 bar · plášť Ø 160 mm, rúry 2 × Ø 25 mm</span></a>
        <a class="je"><b>MD16032C</b><span>Microflex DUO, vykurovanie 6 bar · plášť Ø 160 mm, rúry 2 × Ø 32 mm</span></a>
        <a><b>MD16040C</b><span>Microflex DUO, vykurovanie 6 bar · plášť Ø 160 mm, rúry 2 × Ø 40 mm</span></a>
        <a><b>MD16050C</b><span>Microflex DUO, vykurovanie 6 bar · plášť Ø 160 mm, rúry 2 × Ø 50 mm</span></a>
        <p class="m-sk">Rady</p>
        <a><b>Microflex DUO, vykurovanie 6 bar</b><span>8 dimenzií, plášť Ø 125 až 200 mm</span></a>
      </div>
      <p class="m-tipy">Často hľadané: <a>MD16032C</a><a>DUO 160</a><a>QUADRO</a><a>COOL s káblom</a></p>
    </div></div>`);
    hdr.append(panel);
    const zaclona = h('<div class="m-zaclona"></div>'); document.body.append(zaclona);
    css(`
      #hdr .m-panel { position: absolute; left: 0; right: 0; top: 100%; background: #fff; box-shadow: var(--elev-3); }
      #hdr .m-panel-in { padding-block: 24px 28px; max-width: 920px !important; }
      #hdr .m-pole { display: flex; align-items: center; gap: 14px; height: 64px; padding: 0 16px 0 20px; border-radius: var(--radius-l); background: #fff; box-shadow: inset 0 0 0 2px var(--color-blue-700), 0 0 0 6px rgb(0 93 185 / .12); font-size: 22px; color: var(--color-ink); }
      #hdr .m-pole svg { width: 22px; height: 22px; color: var(--color-blue-700); }
      #hdr .m-pole .m-kurzor { width: 2px; height: 28px; background: var(--color-ink); margin-left: -12px; }
      #hdr .m-pole kbd { margin-left: auto; padding: 4px 8px; border-radius: 4px; box-shadow: inset 0 0 0 1px rgb(10 42 94 / .14); font: 500 12px var(--font-text); color: #6b7686; }
      #hdr .m-vysl { margin-top: 12px; display: grid; gap: 2px; }
      #hdr .m-sk { margin: 12px 12px 4px; font-size: 12px; font-weight: 600; color: var(--color-ink-soft); }
      #hdr .m-vysl a { display: grid; grid-template-columns: 200px 1fr; gap: 12px; padding: 10px 12px; border-radius: var(--radius-m); color: var(--color-ink); font-size: 15px; }
      #hdr .m-vysl a.je { background: var(--color-blue-50); }
      #hdr .m-vysl b { font-family: var(--font-display); font-stretch: 112.5%; font-weight: 600; color: var(--color-blue-900); }
      #hdr .m-vysl span { color: var(--color-ink-soft); }
      #hdr .m-tipy { margin-top: 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 14px; color: var(--color-ink-soft); }
      #hdr .m-tipy a { padding: 6px 12px; border-radius: 999px; background: #f1f5fa; color: var(--color-ink); font-weight: 500; }
      #hdr .m-hladat { background: var(--color-blue-900) !important; color: #fff !important; }
      #hdr .m-hladat svg { color: #fff !important; }
      .m-zaclona { position: fixed; inset: 0; z-index: 15; background: rgb(11 27 51 / .35); }`);
  },

  // ---------- Hlavička C: svetlý horný pás, logo v dvoch riadkoch, široké pole ----------
  HC: () => {
    const top = $('.topbar');
    const p = $('.partner', top); const biele = p.querySelector('svg'); if (biele) biele.outerHTML = WATTS;
    $('.brand').classList.add('m-stack');
    $('#hdr .search input').placeholder = 'Obj. číslo, rad alebo rozmer';
    css(`
      .topbar { background: #f3f7fc !important; color: var(--color-ink-soft) !important; }
      .topbar .partner { color: var(--color-ink) !important; font-weight: 500; flex-direction: row-reverse; }
      .topbar .partner svg { height: 14px; width: auto; }
      .topbar .topbar-kontakt a { color: var(--color-ink-soft) !important; }
      .topbar .topbar-tel { color: var(--color-ink) !important; }
      .topbar .langs a { color: var(--color-ink-soft) !important; }
      .topbar .langs a[aria-current] { color: var(--color-ink) !important; }
      .topbar .langs .sep { background: rgb(10 42 94 / .2) !important; }
      .topbar .topbar-kontakt + .langs { border-left-color: rgb(10 42 94 / .15) !important; }
      .topbar .langs a[aria-current] { border-bottom-color: var(--color-yellow-500) !important; }
      #hdr .brand.m-stack { flex-direction: column; align-items: flex-start; gap: 4px; }
      #hdr .brand.m-stack .brand-sub { border-left: 0 !important; padding-left: 0 !important; font-size: 12px !important; letter-spacing: .01em; }
      #hdr .nav-link { padding: 0 10px !important; }
      #hdr .search { flex: 1 1 auto !important; max-width: 380px !important; margin-left: auto !important; height: 46px !important; }
      #hdr .search input { width: 100% !important; max-width: none !important; padding-right: 72px !important; }
      #hdr .search .search-kbd { display: inline-block !important; }
      @media (max-width: 760px) { #hdr .brand.m-stack { flex-direction: row; align-items: center; gap: 8px; } #hdr .search .search-kbd { display: none !important; } }`);
  },

  // ---------- Úvod A: poriadok – rovnaký obsah, tri štýly textu, jeden rytmus ----------
  UA: () => {
    const odk = $('.hero-odkaz'); odk.className = 'btn btn-secondary btn-lg m-sek';
    const p = $('.hero-partner');
    p.outerHTML = `<div class="m-dovera">
      <span class="m-d">${WATTS}<span>Jediný oficiálny partner pre Česko a Slovensko</span></span>
      <span class="m-d m-d2"><span>Predaj a sklad <a href="#">Inštalatérshop, Raková</a></span></span></div>`;
    css(`
      .hero .h1-kicker { font-size: 15px !important; margin-bottom: 12px !important; }
      .hero .lead { margin-top: 24px !important; font-size: 18px !important; }
      .hero-actions { margin-top: 32px !important; gap: 12px !important; }
      .hero-actions .m-sek { font-size: 18px; font-weight: 600; padding: 0 28px; border-width: 1.5px; }
      .m-dovera { margin-top: 40px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px 28px; font-size: 14px; line-height: 1.4; color: var(--color-ink-soft); }
      .m-d { display: inline-flex; align-items: center; gap: 10px; }
      .m-d svg { height: 15px; width: auto; display: block; }
      .m-d a { color: var(--color-ink); font-weight: 600; text-decoration: underline; text-decoration-color: rgb(10 42 94 / .3); text-underline-offset: 3px; }
      .hero-skratky ul { display: flex !important; flex-wrap: wrap; gap: 8px !important; }
      .hero-skratky li { border: 0 !important; padding: 0 !important; }
      .hero-skratky li a { height: 40px !important; min-height: 0 !important; padding: 0 14px !important; border: 0 !important; border-radius: var(--radius-m); background: var(--sklo-2); box-shadow: inset 0 0 0 1px rgb(10 42 94 / .1); display: inline-flex !important; gap: 8px; font-size: 14px !important; font-weight: 500; }
      .hero-skratky li a::before, .hero-skratky li a::after { display: none !important; }
      @media (max-width: 760px) { .m-dovera { flex-direction: column; align-items: flex-start; gap: 8px; } .hero-actions .m-sek { font-size: 16px; padding: 0 20px; } }`);
  },

  // ---------- Úvod B: posolstvo, akcia a dôvera v karte; skratky preč (katalóg je hneď pod úvodom) ----------
  UB: () => {
    const p = $('.hero-partner');
    p.outerHTML = `<div class="m-karta">
      <div class="m-k1">${WATTS}<p>Jediný oficiálny partner Watts pre Microflex v Česku a na Slovensku</p></div>
      <div class="m-k2"><span>Predaj a sklad</span><strong>Inštalatérshop, Raková</strong><a href="#">Kontakt ${IKONA.sipka}</a></div></div>`;
    $('.hero-skratky').style.display = 'none';
    css(`
      .hero .h1-kicker { font-size: 15px !important; margin-bottom: 12px !important; }
      .hero .lead { margin-top: 24px !important; }
      .hero-actions { margin-top: 32px !important; }
      .m-karta { margin-top: 44px; width: 100%; max-width: 420px; display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 24px; padding: 16px 20px; border-radius: var(--radius-l); background: var(--sklo-3); box-shadow: inset 0 0 0 1px rgb(10 42 94 / .06), var(--elev-2); }
      .m-k1 { display: flex; flex-direction: column; gap: 8px; }
      .m-k1 svg { height: 16px; width: auto; display: block; }
      .m-k1 p { font-size: 14px; line-height: 1.45; color: var(--color-ink); font-weight: 500; }
      .m-k2 { display: flex; flex-direction: column; gap: 2px; padding-left: 24px; box-shadow: inset 1px 0 0 rgb(10 42 94 / .08); }
      .m-k2 span { font-size: 13px; color: var(--color-ink-soft); }
      .m-k2 strong { font-size: 15px; font-weight: 600; color: var(--color-ink); }
      .m-k2 a { margin-top: 4px; display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; }
      .m-k2 a svg { width: 14px; height: 14px; }
      @media (max-width: 760px) { .m-karta { grid-template-columns: minmax(0, 1fr); gap: 12px; } .m-k2 { padding-left: 0; box-shadow: none; } }`);
  },

  // ---------- Úvod C: hľadanie v úvode (nástroj pre toho, kto pozná obj. číslo) ----------
  UC: () => {
    const act = $('.hero-actions');
    act.outerHTML = `<div class="m-hladaj">
      <form class="m-pole" onsubmit="return false">${IKONA.hladat}<input placeholder="Hľadajte obj. číslo, rad alebo rozmer"><a class="btn btn-yellow">Hľadať</a></form>
      <p class="m-tipy">Napríklad <a>MD16032C</a><a>DUO 160</a><a>QUADRO</a><a>COOL s káblom</a></p>
      <p class="m-alebo"><a class="m-a1">Neviete obj. číslo? Vybrať potrubie podľa použitia ${IKONA.sipka}</a><a class="m-a2">Dopyt na projekt</a></p></div>`;
    if (innerWidth < 500) $('.m-pole input').placeholder = 'Obj. číslo, rad, rozmer';
    const p = $('.hero-partner');
    p.outerHTML = `<div class="m-dovera"><span class="m-d">${WATTS}<span>Jediný oficiálny partner pre Česko a Slovensko</span></span><span class="m-d"><span>Predaj a sklad <a href="#">Inštalatérshop, Raková</a></span></span></div>`;
    $('.hero-skratky').style.display = 'none';
    css(`
      .hero .h1-kicker { font-size: 15px !important; margin-bottom: 12px !important; }
      .hero .lead { margin-top: 24px !important; }
      .m-hladaj { margin-top: 32px; width: 100%; max-width: 560px; }
      .m-pole { display: flex; align-items: center; gap: 12px; height: 64px; padding: 0 8px 0 20px; border-radius: var(--radius-l); background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / .14), var(--elev-2); }
      .m-pole svg { width: 22px; height: 22px; color: #6b7686; flex: none; }
      .m-pole input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; font: 400 17px var(--font-text); color: var(--color-ink); }
      .m-pole input::placeholder { color: #6b7686; }
      .m-pole .btn { height: 48px; padding: 0 22px; font-weight: 600; }
      .m-tipy { margin-top: 12px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 14px; color: var(--color-ink-soft); }
      .m-tipy a { padding: 6px 12px; border-radius: 999px; background: var(--sklo-2); box-shadow: inset 0 0 0 1px rgb(10 42 94 / .1); color: var(--color-ink); font-weight: 500; font-variant-numeric: tabular-nums; }
      .m-alebo { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 8px 24px; font-size: 16px; }
      .m-alebo a { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
      .m-alebo a svg { width: 16px; height: 16px; }
      .m-alebo .m-a2 { font-weight: 500; text-decoration: underline; text-underline-offset: 4px; }
      .m-dovera { margin-top: 40px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px 28px; font-size: 14px; color: var(--color-ink-soft); }
      .m-d { display: inline-flex; align-items: center; gap: 10px; }
      .m-d svg { height: 15px; width: auto; display: block; }
      .m-d a { color: var(--color-ink); font-weight: 600; text-decoration: underline; text-decoration-color: rgb(10 42 94 / .3); text-underline-offset: 3px; }
      @media (max-width: 760px) { .m-pole { height: 56px; padding-left: 14px; } .m-pole .btn { padding: 0 14px; } .m-dovera { flex-direction: column; align-items: flex-start; gap: 8px; } }`);
  },
};
// Odporúčaná kombinácia: hlavička A a úvod B. Partner je na domove v karte úvodu, v druhom riadku hlavičky
// by sa opakoval, preto ho tam na domove skryť (na ostatných stránkach ostane).
VARIANTY.KOMBO = () => {
  VARIANTY_TEXT.HA(); VARIANTY_TEXT.UB();
  css('#hdr .m-partner { display: none !important; }');
};
// Kombinované varianty volajú iné: v prehliadači sú funkcie dostupné ako text.
const VARIANTY_TEXT_JS = `window.VARIANTY_TEXT = { HB: ${VARIANTY.HB.toString()}, HA: ${VARIANTY.HA.toString()}, UB: ${VARIANTY.UB.toString()} };`;

const MENA = { dnes: '0-dnes', HA: 'H1-A-hladanie-v-strede', HB: 'H2-B-jedna-lista', HBo: 'H2-B-jedna-lista-otvorene-hladanie', HC: 'H3-C-svetly-horny-pas', UA: 'U1-A-poriadok', UB: 'U2-B-dovera-v-karte', UC: 'U3-C-hladanie-v-uvode', KOMBO: '9-odporucane-hlavicka-A-uvod-B' };
const ktore = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(MENA);
const server = spawn(process.execPath, [`${KOREN}/snimky-stranok/_skripty/server.mjs`, `${KOREN}/web/dist`, String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const [z, vp, dsf, vyska] of [['pc', { width: 1600, height: 900 }, 1.25, 900], ['mobil', { width: 390, height: 844 }, 2, null]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf, reducedMotion: 'reduce' });
    for (const n of ktore) {
      const page = await ctx.newPage();
      await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(POMOCKY + VARIANTY_TEXT_JS);
      await page.evaluate(`(${VARIANTY[n].toString()})()`);
      await page.waitForTimeout(500);
      let clip;
      if (z === 'pc') clip = { x: 0, y: 0, width: vp.width, height: vyska };
      else {
        // telefón: pri hlavičke horná časť, pri úvode prvá a kúsok druhej obrazovky
        const h = n.startsWith('U') || n === 'dnes' || n === 'KOMBO' ? 1300 : 460;
        clip = { x: 0, y: 0, width: vp.width, height: h };
      }
      await page.screenshot({ path: `${CIEL}/${MENA[n]}-${z}.png`, clip, fullPage: true });
      console.log('ok', MENA[n], z);
      await page.close();
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
