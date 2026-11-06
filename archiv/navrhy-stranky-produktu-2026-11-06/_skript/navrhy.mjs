// Návrhy stránky produktu (Juraj 6. 11. 2026: „potrebujem nové rozloženie a design stránky produktov. Nech to má
// hlavu a pätu, mysli ako profesionálny senior grafik a developer“). Vkladá HTML a CSS do hotovej stránky radu
// z web/dist, web sa nemení. Prvky stránky sa len presúvajú, preto výber dimenzie, teplota aj kóty v návrhu fungujú.
// Spustenie: node navrhy.mjs [dnes A B C cela]   (bez argumentu všetko)
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawn } from 'node:child_process';
const require = createRequire('C:/Users/krist/Documents/FajnInstalater/audit/scripts/package.json');
const { chromium } = require('playwright');
const KOREN = 'C:/Users/krist/Documents/FajnInstalater/MicroflexWeb';
const CIEL = `${KOREN}/snimky-stranok/navrh-stranka-produktu`;
mkdirSync(CIEL, { recursive: true });
const PORT = 4371;
const UNO = '/potrubia/sanita/microflex-uno-10-bar/';
const DUO = '/potrubia/vykurovanie/microflex-duo-6-bar/';

// Ikony len originálne z Lucide (DESIGN.md kap. 6).
const IKONY = Object.fromEntries(['map-pin', 'phone', 'arrow-down', 'arrow-right', 'external-link', 'eye', 'thermometer', 'send', 'chevron-right'].map((n) => [n,
  readFileSync(`${KOREN}/web/node_modules/lucide-static/icons/${n}.svg`, 'utf8').replace(/<!--[\s\S]*?-->/, '').replace(/\s+/g, ' ').trim()]));
const PRODUKTY = Object.fromEntries(JSON.parse(readFileSync(`${KOREN}/web/src/data/produkty.json`, 'utf8')).flatMap((p) => [[p.slug, p.id], [p.slug_cs, p.id]]));

function POMOCKY(ikony, produkty) {
  window.$ = (s, r = document) => r.querySelector(s);
  window.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  window.css = (t) => { const s = document.createElement('style'); s.textContent = t; document.head.append(s); };
  window.h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  window.PRODUKTY = produkty;
  window.ik = (n, v = 18) => ikony[n].replace(/width="24"/, `width="${v}"`).replace(/height="24"/, `height="${v}"`).replace('<svg', '<svg aria-hidden="true"');
}

// Spoločné pre všetky návrhy: časti hlavy, nové úlohy tlačidiel, výber bez „Všetky“ v mriežke bez osamelého
// posledného priemeru, prepínač pohľadu s ikonami. Poradie a vzhľad robí až návrh.
function ROZOBER() {
  const sec = $('section.hlava-studio');
  const H = window.H = {
    sec, crumbs: $('.crumbs', sec), pred: $('.hlava-pred', sec), h1: $('h1', sec), lead: $('.hs-bok .lead', sec),
    akcie: $('.hlava-akcie', sec), cta: $('[data-cta]', sec), eshop: $('[data-eshop]', sec), sestry: $('.hlava-sestry', sec),
    volba: $('[data-volba]', sec), seg: $('[data-seg]', sec), seg2: $('[data-seg2]', sec), vysledok: $('[data-vysledok]', sec),
    meno: $('.volba-meno', sec), hint: $('[data-hint]', sec), obj: $('.volba-obj', sec),
    trSeg: $('.tr-seg', sec), trLeg: $('.tr-legenda', sec), stage: $('.hs-stage', sec),
    tel: $('a[href^="tel:"]'), dopyt: $('.zaver a[href*="pre-firmy"]')?.getAttribute('href') ?? '/pre-firmy/',
  };
  // Hlavná akcia je kúpa v e-shope (žltá), tabuľka a dopyt sú odkazy.
  H.eshop.className = 'btn btn-yellow btn-lg';
  H.eshop.removeAttribute('data-astro-cid');
  H.cta.className = 'odkaz';
  H.cta.querySelector('[data-cta-text]').textContent = 'Všetky rozmery v tabuľke';
  H.akcie.append(h(`<a class="odkaz" href="${H.dopyt}"><span>Poslať dopyt</span>${ik('send', 16)}</a>`));
  // Výber priemeru: popis s jednotkou, bez tlačidla „Všetky“ (späť vedie odkaz, keď je niečo vybrané).
  const hl = h('<div class="pk-volba-hlava"></div>');
  H.meno.before(hl);
  H.meno.innerHTML = 'Priemer nosnej rúry <small>Ø v mm, pod ním DN</small>';
  const spat = h('<button type="button" class="pk-spat">Všetky rozmery</button>');
  spat.addEventListener('click', () => $('button[data-k=""]', H.seg).click());
  hl.append(H.meno, spat);
  H.hint.textContent = 'Vyberte priemer: ukážeme obj. číslo a rez v presnom rozmere.';
  const tn = [...H.obj.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  if (tn) { const s = document.createElement('span'); s.className = 'pk-obj-popis'; s.textContent = tn.textContent.trim(); tn.replaceWith(s); }
  // Najviac 5 v riadku, riadky čo najrovnomernejšie (8 = 4 + 4, 5 = 5, 10 = 5 + 5).
  const n = $$('button[data-k]:not([data-k=""])', H.seg).length;
  H.seg.style.setProperty('--cols', String(Math.ceil(n / Math.ceil(n / 5))));
  // Izolácia (dva plášte pri jednej rúre) ako vlastný riadok výberu, nie v riadku výsledku.
  H.iz = h('<div class="pk-izolacia"><span class="pk-iz-meno">Izolácia</span></div>');
  H.iz.append(H.seg2);
  $('.volba-riadok', H.volba).after(H.iz);
  // Prepínač pohľadu: ikona a text, oba stavy rovnakým jazdcom (stupnica farieb je v legende, nie na tlačidle).
  const [bP, bT] = $$('button', H.trSeg);
  bP.innerHTML = `${ik('eye', 16)}<span>Pohľad</span>`;
  bT.innerHTML = `${ik('thermometer', 16)}<span>Teplota</span>`;
  H.nastroje = h('<div class="pk-nastroje"></div>');
  H.nastroje.append(H.trSeg, H.trLeg);
  H.dovera = h(`<ul class="pk-dovera">
    <li>${ik('map-pin')}<span>Predaj a sklad: <a href="/kontakt/">Inštalatérshop, Raková</a></span></li>
    <li>${ik('phone')}<span>Poradíme s výberom: <a href="${H.tel?.getAttribute('href') ?? 'tel:+421414220422'}">${H.tel?.textContent.trim() || '+421 41 422 0422'}</a></span></li>
  </ul>`);
  css(`
    .hlava-studio > .hs-hore, .hlava-studio > .hs-studio { display: none !important; }
    .pk-volba-hlava { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .pk-volba-hlava .volba-meno { display: flex; flex-direction: column; gap: 2px; font-size: 15px !important; font-weight: 600; color: var(--color-ink) !important; }
    .pk-volba-hlava .volba-meno small { font-size: 13px; font-weight: 400; color: var(--color-ink-soft); }
    .pk-spat { display: none; padding: 4px 0; border: 0; background: none; font: 500 14px/1.2 var(--font-text); color: var(--color-blue-700); cursor: pointer; border-bottom: 1px solid currentColor; }
    .volba:has([data-seg] button:not([data-k=""])[aria-pressed="true"]) .pk-spat { display: inline-block; }
    .volba-seg[data-seg] button[data-k=""] { display: none !important; }
    .pk-izolacia { margin-top: 16px; }
    .pk-izolacia:has([data-seg2][hidden]) { display: none; }
    .pk-iz-meno { display: block; margin-bottom: 8px; font-size: 15px; font-weight: 600; color: var(--color-ink); }
    .pk-obj-popis { font-size: 13px; color: var(--color-ink-soft); }
    .pk-nastroje .tr-seg { display: inline-flex; flex: none; }
    .pk-nastroje .tr-seg button { display: inline-flex !important; align-items: center; justify-content: center; gap: 8px; min-width: 0 !important; height: 40px !important; padding: 0 16px !important; font: 600 15px/1 var(--font-display) !important; font-stretch: 112.5% !important; }
    .pk-nastroje .tr-seg button[aria-pressed="true"] { background: linear-gradient(180deg, #123a7a 0%, var(--color-blue-900) 100%) !important; color: #fff !important; }
    .pk-nastroje .tr-seg svg { flex: none; opacity: 0.85; }
    .pk-nastroje .tr-legenda { margin: 0 !important; }
    .pk-nastroje .tr-legenda p { font-size: 13px !important; line-height: 1.45 !important; }
    .pk-nastroje .tr-stupnica { height: 8px !important; margin-top: 6px !important; }
    .pk-nastroje .tr-osi { font-size: 12px !important; }
    .pk-dovera { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; font-size: 14px; color: var(--color-ink-soft); }
    .pk-dovera li { display: flex; align-items: center; gap: 10px; }
    .pk-dovera svg { flex: none; color: var(--color-blue-700); }
    .pk-dovera a { font-weight: 600; color: var(--color-ink); }
    .hlava-akcie .odkaz svg { flex: none; }
    .hlava-akcie .btn { order: -1; }
    .hlava-akcie .odkaz { font-size: 15px; }
  `);
}

// ---------- A: Produktová karta (obraz vľavo, nákupný panel vpravo) ----------
function A() {
  ROZOBER();
  const pk = h('<div class="wrap pk"><div class="pk-titul"></div><div class="pk-stage"></div><div class="pk-karta"></div></div>');
  H.sec.prepend(pk);
  pk.prepend(H.crumbs);
  $('.pk-titul', pk).append(H.pred, H.h1, H.lead, ...(H.sestry ? [H.sestry] : []));
  $('.pk-stage', pk).append(H.stage, H.nastroje);
  $('.pk-karta', pk).append(H.volba, H.akcie);
  pk.append(H.dovera);
  css(`
    .hlava-studio { padding: 12px 0 64px !important; }
    .pk { position: relative; z-index: 3; display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
      grid-template-areas: "crumbs crumbs" "stage titul" "stage karta" "stage dovera" "stage ."; grid-template-rows: auto auto auto auto 1fr;
      column-gap: clamp(32px, 4.5vw, 72px); }
    .pk > .crumbs { grid-area: crumbs; padding: 0 0 12px !important; }
    .pk-titul { grid-area: titul; padding-top: 8px; }
    .pk-stage { grid-area: stage; position: relative; }
    .pk-karta { grid-area: karta; margin-top: 24px; padding: 20px 20px 22px; border-radius: var(--radius-xl); background: #fff;
      box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.07), var(--elev-3); }
    .pk > .pk-dovera { grid-area: dovera; margin: 20px 4px 0; }
    /* Spodok záberu je prázdna podlaha pod kótami: prepínač pohľadu ide k nej, nie pod ňu. */
    .pk-stage .hs-stage { width: 100% !important; max-width: 700px !important; margin: 0 0 -48px !important; padding: 0 !important; }
    .pk-stage .pk-nastroje { position: relative; z-index: 4; display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; min-height: 48px; }
    .pk-stage .tr-legenda { flex: 1 1 260px; max-width: 440px; }
    .pk-titul .hlava-pred { margin: 0 0 10px !important; font-size: 15px !important; font-weight: 600 !important; }
    .pk-titul h1 { font-size: clamp(32px, 1.3vw + 21px, 42px) !important; line-height: 1.04 !important; letter-spacing: -0.028em !important; max-width: 12em !important; }
    .pk-titul .lead { margin-top: 12px !important; max-width: 31em !important; font-size: 16px !important; line-height: 1.55 !important; }
    .pk-titul .hlava-sestry { margin-top: 8px !important; font-size: 14px !important; }
    .pk-karta .volba-riadok { display: block !important; }
    .pk-karta .pk-volba-hlava .volba-meno { flex-direction: row; align-items: baseline; gap: 10px; }
    .pk-karta .pk-izolacia:not(:has([data-seg2][hidden])) { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 16px; }
    .pk-karta .pk-iz-meno { margin: 0; }
    .pk-karta .volba-seg[data-seg] { display: grid !important; grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr)); gap: 6px !important; padding: 0 !important;
      border-radius: 0 !important; background: none !important; box-shadow: none !important; overflow: visible !important; }
    .pk-karta .volba-seg button { width: auto !important; min-width: 0 !important; border-radius: var(--radius-m) !important; background: var(--color-blue-50) !important;
      box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.08) !important; }
    .pk-karta .volba-seg[data-seg] button { height: 56px !important; font-size: 18px !important; }
    .pk-karta .volba-seg button[aria-pressed="true"] { background: transparent !important; box-shadow: none !important; }
    .pk-karta .volba-seg[data-seg] .volba-jazdec { height: 56px !important; }
    .pk-karta .volba-seg-2 { display: grid !important; grid-template-columns: 1fr 1fr; gap: 6px !important; padding: 0 !important; background: none !important; box-shadow: none !important; }
    .pk-karta .volba-seg-2[hidden] { display: none !important; }
    .pk-karta .volba-seg-2 button { height: 44px !important; font: 600 15px/1 var(--font-text) !important; }
    .pk-karta .volba-seg-2 .volba-jazdec { height: 44px !important; }
    .pk-karta .volba-vysledok { display: block !important; min-height: 0 !important; margin-top: 16px !important; padding: 14px 16px; border-radius: var(--radius-l);
      background: linear-gradient(180deg, #f6f9fd 0%, var(--color-blue-50) 100%); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06); }
    .pk-karta .volba-hint { font-size: 14px !important; line-height: 1.45; }
    .pk-karta .volba-detail:not([hidden]) { display: flex !important; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 16px; }
    .pk-karta .volba-obj { display: inline-flex !important; align-items: center; gap: 10px; }
    .pk-karta .volba-obj strong { font-size: 24px !important; letter-spacing: 0.01em; }
    .pk-karta .volba-fakty { display: block !important; font-size: 14px !important; }
    .pk-karta .hlava-akcie { display: flex !important; flex-wrap: wrap; align-items: center; gap: 14px 28px !important; margin-top: 18px !important; }
    .pk-karta .hlava-akcie .btn { flex: 1 1 100%; justify-content: center; }
    @media (max-width: 900px) {
      .pk { grid-template-columns: minmax(0, 1fr); grid-template-areas: "crumbs" "titul" "stage" "karta" "dovera"; grid-template-rows: none; }
      /* Štítok plášťa visí nad záberom: odstup od textu nad ním. */
      .pk-stage { margin: 40px calc(-1 * var(--gutter)) 0; }
      .pk-stage .hs-stage { margin-bottom: 8px !important; }
      .pk-stage .hs-stage { max-width: none !important; }
      .pk-stage .pk-nastroje { padding: 0 var(--gutter); margin-top: 0; }
      .pk-karta { margin-top: 16px; padding: 16px; }
      .pk-titul h1 { font-size: 34px !important; }
    }
  `);
  window.dispatchEvent(new Event('resize'));
}

// ---------- B: Poriadok v dnešnom rozložení (text vľavo, render vpravo, jeden stĺpec rozhodnutí) ----------
function B() {
  ROZOBER();
  const pk = h('<div class="wrap pkb"><div class="pkb-titul"></div><div class="pkb-volba"></div><div class="pkb-akcie"></div><div class="pkb-stage"></div></div>');
  H.sec.prepend(pk);
  pk.prepend(H.crumbs);
  $('.pkb-titul', pk).append(H.pred, H.h1, H.lead);
  $('.pkb-volba', pk).append(H.volba);
  $('.pkb-akcie', pk).append(H.akcie, H.dovera, ...(H.sestry ? [H.sestry] : []));
  // B ostáva čo najbližšie dnešku: bez dopytu v hlave (je v závere stránky).
  $('.odkaz[href*="pre-firmy"]', H.akcie)?.remove();
  $('.pkb-stage', pk).append(H.stage, H.nastroje);
  css(`
    .hlava-studio { padding: 12px 0 64px !important; }
    .pkb { position: relative; z-index: 3; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
      grid-template-areas: "crumbs crumbs" "titul stage" "volba stage" "akcie stage" ". stage"; grid-template-rows: auto auto auto auto 1fr;
      column-gap: clamp(32px, 4.5vw, 72px); }
    .pkb > .crumbs { grid-area: crumbs; padding: 0 0 12px !important; }
    .pkb-titul { grid-area: titul; padding-top: 12px; }
    .pkb-volba { grid-area: volba; margin-top: 32px; }
    .pkb-akcie { grid-area: akcie; margin-top: 24px; }
    .pkb-stage { grid-area: stage; position: relative; }
    .pkb-stage .hs-stage { width: 100% !important; max-width: 700px !important; margin: 0 0 -48px auto !important; padding: 0 !important; }
    .pkb-stage .pk-nastroje { position: relative; z-index: 4; display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; margin: 0 0 0 auto; max-width: 700px; min-height: 48px; }
    .pkb-stage .tr-legenda { flex: 1 1 260px; max-width: 440px; }
    .pkb-titul .hlava-pred { margin: 0 0 12px !important; font-size: 16px !important; font-weight: 600 !important; }
    .pkb-titul h1 { font-size: clamp(36px, 2vw + 20px, 56px) !important; line-height: 1.02 !important; letter-spacing: -0.03em !important; max-width: 10em !important; }
    .pkb-titul .lead { margin-top: 18px !important; max-width: 30em !important; font-size: 17px !important; line-height: 1.55 !important; }
    .pkb .volba-riadok { display: block !important; }
    .pkb .volba-seg[data-seg] { display: grid !important; grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr)); gap: 2px !important; overflow: visible !important; }
    .pkb .volba-seg[data-seg] button { width: auto !important; min-width: 0 !important; height: 52px !important; font-size: 17px !important; }
    .pkb .volba-seg[data-seg] .volba-jazdec { height: 52px !important; }
    .pkb .volba-vysledok { display: block !important; min-height: 0 !important; margin-top: 12px !important; padding: 12px 16px; border-radius: var(--radius-l);
      background: var(--sklo-1); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06); }
    .pkb .volba-hint { font-size: 14px !important; }
    .pkb .volba-detail:not([hidden]) { display: flex !important; flex-wrap: wrap; align-items: baseline; gap: 4px 20px; }
    .pkb .volba-obj { display: inline-flex !important; align-items: center; gap: 10px; }
    .pkb .volba-obj strong { font-size: 20px !important; }
    .pkb .volba-fakty { display: inline !important; font-size: 14px !important; }
    .pkb-akcie .hlava-akcie { display: flex !important; flex-wrap: wrap; align-items: center; gap: 14px 28px !important; margin: 0 !important; }
    .pkb-akcie .pk-dovera { margin-top: 24px; }
    .pkb-akcie .hlava-sestry { margin-top: 16px !important; font-size: 14px !important; }
    @media (max-width: 900px) {
      .pkb { grid-template-columns: minmax(0, 1fr); grid-template-areas: "crumbs" "titul" "stage" "volba" "akcie"; grid-template-rows: none; }
      .pkb-stage { margin: 40px calc(-1 * var(--gutter)) 0; }
      .pkb-stage .hs-stage { max-width: none !important; margin-bottom: 8px !important; }
      .pkb-stage .pk-nastroje { padding: 0 var(--gutter); margin: 0; }
      .pkb-volba { margin-top: 20px; }
      .pkb-titul h1 { font-size: 34px !important; }
    }
  `);
  window.dispatchEvent(new Event('resize'));
}

// ---------- C: Štúdio s lištou (výrobok v strede, voľby a kúpa v jednej lište pod ním) ----------
function C() {
  ROZOBER();
  const pk = h(`<div class="pkc">
    <div class="wrap pkc-hore"><div class="pkc-titul"></div><div class="pkc-bok"></div></div>
    <div class="pkc-stage"></div>
    <div class="wrap pkc-obal"><div class="pkc-lista"><div class="pkc-volba"></div><div class="pkc-vysledok"></div><div class="pkc-akcie"></div></div></div>
  </div>`);
  H.sec.prepend(pk);
  $('.pkc-titul', pk).append(H.crumbs, H.pred, H.h1);
  $('.pkc-bok', pk).append(H.lead, ...(H.sestry ? [H.sestry] : []));
  $('.pkc-stage', pk).append(H.stage, H.nastroje);
  $('.pkc-volba', pk).append(H.volba);
  $('.pkc-vysledok', pk).append(H.vysledok);
  // Izolácia (DUO) patrí k výsledku, v lište nie je miesto na tretí riadok volieb.
  $('[data-detail]', H.vysledok).prepend(H.seg2);
  H.iz.remove();
  $('.pkc-akcie', pk).append(H.akcie);
  css(`
    .hlava-studio { padding: 12px 0 0 !important; }
    .pkc { position: relative; z-index: 3; }
    .pkc-hore { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); column-gap: 56px; align-items: end; }
    .pkc-titul .crumbs { padding: 0 0 20px !important; }
    .pkc-titul .hlava-pred { margin: 0 0 10px !important; font-size: 16px !important; font-weight: 600 !important; }
    .pkc-titul h1 { font-size: clamp(34px, 1.4vw + 20px, 44px) !important; line-height: 1.04 !important; letter-spacing: -0.028em !important; max-width: none !important; }
    .pkc-bok { padding-bottom: 6px; }
    .pkc-bok .lead { margin: 0 !important; max-width: 30em !important; font-size: 17px !important; line-height: 1.55 !important; }
    .pkc-bok .hlava-sestry { margin-top: 10px !important; font-size: 14px !important; }
    .pkc-stage { position: relative; max-width: var(--container-site); margin: 0 auto; padding: 0 var(--gutter); }
    .pkc-stage .hs-stage { width: min(540px, 72vw) !important; margin: 0 auto -36px !important; padding: 0 !important; }
    .pkc-stage .pk-nastroje { position: absolute; z-index: 4; left: var(--gutter); top: 32px; display: flex; flex-direction: column; align-items: flex-start; gap: 12px; width: 270px; }
    .pkc-obal { position: sticky; bottom: 16px; z-index: 20; padding-bottom: 40px; }
    .pkc-lista { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px 32px; padding: 12px 12px 12px 20px; border-radius: var(--radius-xl);
      background: var(--sklo-3); -webkit-backdrop-filter: blur(16px) saturate(1.4); backdrop-filter: blur(16px) saturate(1.4);
      box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.08), var(--elev-4); }
    .pkc .volba-riadok { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 16px !important; flex-wrap: nowrap !important; }
    .pkc .pk-volba-hlava { margin: 0; }
    .pkc .pk-volba-hlava .volba-meno small, .pkc .pk-spat { display: none !important; }
    .pkc .volba-seg[data-seg] { flex-wrap: nowrap !important; overflow: visible !important; }
    .pkc .volba-seg[data-seg] button { height: 52px !important; min-width: 52px !important; font-size: 17px !important; }
    .pkc .volba-seg[data-seg] .volba-jazdec { height: 52px !important; }
    .pkc-vysledok .volba-vysledok { margin: 0 !important; min-height: 0 !important; padding-left: 28px; box-shadow: inset 1px 0 0 rgb(10 42 94 / 0.1); }
    .pkc-vysledok .volba-hint { font-size: 14px !important; max-width: 22em; }
    .pkc-vysledok .volba-detail:not([hidden]) { display: flex !important; flex-wrap: wrap; align-items: center; gap: 6px 16px; }
    .pkc-vysledok .volba-obj { display: inline-flex !important; align-items: center; gap: 10px; }
    .pkc-vysledok .volba-obj strong { font-size: 22px !important; }
    .pkc-vysledok .volba-fakty { display: inline !important; font-size: 14px !important; }
    .pkc-vysledok .volba-seg-2 { flex-wrap: nowrap !important; }
    .pkc-akcie .hlava-akcie { display: flex !important; flex-direction: column; align-items: stretch; gap: 8px !important; margin: 0 !important; }
    .pkc-akcie .hlava-akcie .odkaz { align-self: center; font-size: 14px; }
    .pkc-akcie .hlava-akcie .odkaz[href*="pre-firmy"] { display: none; }
    @media (max-width: 900px) {
      .pkc-hore { grid-template-columns: minmax(0, 1fr); row-gap: 16px; }
      .pkc-stage { padding: 0; margin-top: 40px; }
      .pkc-stage .hs-stage { width: 100% !important; margin-bottom: 8px !important; }
      .pkc-stage .pk-nastroje { position: relative; top: auto; left: auto; flex-direction: row; flex-wrap: wrap; width: auto; padding: 0 var(--gutter); }
      .pkc-obal { position: static; margin-top: 16px; }
      .pkc-lista { grid-template-columns: minmax(0, 1fr); padding: 16px; }
      .pkc .volba-riadok { flex-direction: column !important; align-items: stretch !important; }
      .pkc .volba-seg[data-seg] { display: grid !important; grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr)); gap: 2px !important; }
      .pkc .volba-seg[data-seg] button { min-width: 0 !important; }
      .pkc-vysledok .volba-vysledok { padding-left: 0; box-shadow: none; }
      .pkc-titul h1 { font-size: 34px !important; }
    }
  `);
  window.dispatchEvent(new Event('resize'));
}

// ---------- Celá stránka pre A: lišta produktu, poradie častí, diely s fotkami ----------
function CELA() {
  const nazov = $('.pk-titul h1').textContent.trim();
  const obr = $('.hs-tien img').currentSrc || $('.hs-tien img').src;
  const dat = JSON.parse($('[data-volba-data]').textContent);
  const pocet = dat.skupiny.length;
  const rozsah = ($('.hlava [data-koty] .k-rura .stitok strong')?.dataset.povodna ?? $('.hlava [data-koty] .k-rura .stitok strong')?.textContent ?? '').trim();
  const zaklad = `${pocet} ${pocet >= 5 ? 'rozmerov' : 'rozmery'}, nosná rúra ${rozsah}`;
  const casti = [['varianty', 'Rozmery'], ['suvisiace', 'Diely'], ['stavba', 'Stavba a montáž'], ['referencie', 'Referencie'], ['stiahnut', 'Na stiahnutie']].filter(([id]) => document.getElementById(id));
  const lista = h(`<div class="pk-lista"><div class="wrap pk-lista-in">
    <img class="pk-lista-obr" src="${obr}" alt="">
    <div class="pk-lista-nazov"><strong>${nazov}</strong><span data-lista-vyber>${zaklad}</span></div>
    <nav class="pk-lista-nav" aria-label="Časti stránky">${casti.map(([id, t], i) => `<a href="#${id}"${i === 0 ? ' class="on"' : ''}>${t}</a>`).join('')}</nav>
    <a class="btn btn-yellow pk-lista-btn" href="${$('[data-eshop]').getAttribute('href')}" target="_blank" rel="noopener"><span data-lista-btn>Kúpiť v e-shope</span>${ik('external-link', 16)}</a>
  </div></div>`);
  $('.telo .casti').replaceWith(lista);
  document.addEventListener('mfx:variant', (e) => {
    const obj = e.detail.obj;
    const v = obj ? dat.skupiny.flatMap((g) => g.vs).find((x) => x.obj === obj) : null;
    $('[data-lista-vyber]').textContent = v ? `${v.kr}, ${v.obj}` : zaklad;
    $('[data-lista-btn]').textContent = v ? `Kúpiť ${v.obj}` : 'Kúpiť v e-shope';
  });
  // Poradie podľa nákupu: rozmery → diely k nim → stavba a montáž → referencie → podklady → záver.
  // Podklady pred záverom: fotka referencie by sa inak stretla s fotkou záveru.
  const rel = $('#suvisiace');
  $('#varianty').after(rel);
  if ($('#referencie') && $('#stiahnut')) $('#stiahnut').before($('#referencie'));
  $('#h-var').textContent = 'Rozmery a obj. čísla';
  // Diely ako výrobky s fotkou (skupina nad názvom), nie zoznam odkazov v kartách.
  const diely = $$('.rel-skupina', rel).flatMap((g) => $$('li a', g).map((a) => ({ href: a.getAttribute('href'), nazov: a.textContent.trim(), skupina: $('h3', g).textContent.trim() })));
  const mriezka = h(`<ul class="dl-mriezka">${diely.map((d) => {
    const id = PRODUKTY[d.href.split('/').filter(Boolean).pop()];
    return `<li><a class="dl-diel" href="${d.href}"><span class="dl-foto">${id ? `<img src="/navrh-assets/src/produkty/${id}.webp" alt="" loading="eager">` : ''}</span>
      <span class="dl-skupina">${d.skupina}</span><span class="dl-nazov">${d.nazov}</span><span class="dl-sipka">${ik('arrow-right', 16)}</span></a></li>`;
  }).join('')}</ul>`);
  $('.rel', rel).replaceWith(mriezka);
  // Označenie výrobcu patrí medzi parametre, nie ako osamelý riadok pred záverom.
  const oz = $('.oznacenie'); const par = $('.parametre');
  if (oz && par) {
    const t = oz.textContent.split(':'); const riadok = par.lastElementChild.cloneNode(true);
    riadok.querySelector('dt').textContent = t[0].trim(); riadok.querySelector('dd').textContent = t.slice(1).join(':').trim();
    par.append(riadok); oz.remove();
  }
  css(`
    .pk-lista { position: sticky; top: 62px; z-index: 12; margin: -8px 0 48px; background: var(--sklo-3);
      -webkit-backdrop-filter: saturate(1.5) blur(14px); backdrop-filter: saturate(1.5) blur(14px); box-shadow: 0 1px 0 rgb(10 42 94 / 0.08), var(--elev-2); }
    .pk-lista-in { display: flex; align-items: center; gap: 16px; min-height: 64px; }
    .pk-lista-obr { flex: none; width: 56px; height: 49px; object-fit: contain; }
    .pk-lista-nazov { display: grid; min-width: 0; line-height: 1.3; }
    .pk-lista-nazov strong { font-family: var(--font-display); font-stretch: 112.5%; font-weight: 600; font-size: 16px; color: var(--color-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pk-lista-nazov span { font-size: 13px; color: var(--color-ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pk-lista-nav { display: flex; align-self: stretch; margin-left: auto; }
    .pk-lista-nav a { position: relative; display: flex; align-items: center; padding: 0 14px; font-size: 15px; font-weight: 500; color: var(--color-ink-soft); white-space: nowrap; }
    .pk-lista-nav a.on { color: var(--color-ink); }
    .pk-lista-nav a.on::after { content: ""; position: absolute; left: 14px; right: 14px; bottom: 0; height: 2px; border-radius: 2px; background: var(--color-blue-700); }
    .pk-lista-btn { flex: none; height: 44px !important; padding: 0 18px !important; font-size: 15px !important; gap: 8px; }
    .dl-mriezka { display: grid; grid-template-columns: repeat(auto-fill, minmax(208px, 1fr)); gap: 16px; margin: 0; padding: 0; list-style: none; }
    .dl-diel { position: relative; display: grid; height: 100%; padding: 12px 12px 18px; border-radius: var(--radius-xl); background: #fff;
      box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-3); color: var(--color-ink); }
    /* Diel stojí na podlahe štúdia ako v kartách dielov: fotky s bielym pozadím sa násobením stratia v ploche,
       tieň dopadu je elipsa pod dielom. */
    .dl-foto { position: relative; display: block; aspect-ratio: 4 / 3; border-radius: var(--radius-l); overflow: hidden;
      background: radial-gradient(70% 60% at 50% 42%, #ffffff 0%, #f3f6fa 70%, #eaf0f7 100%); }
    .dl-foto::after { content: ""; position: absolute; left: 22%; right: 22%; bottom: 9%; height: 10%; border-radius: 50%;
      background: radial-gradient(closest-side, rgb(10 42 94 / 0.2), rgb(10 42 94 / 0)); }
    .dl-foto img { position: absolute; z-index: 1; left: 13%; top: 8%; width: 74%; height: 78%; object-fit: contain; mix-blend-mode: multiply; }
    /* Pod rozloženým rezom: veta ako úvod, parametre a montáž ako dva rovnocenné stĺpce (nie odsek osamote vľavo). */
    .stavba-pod { display: block !important; }
    .stavba-pod .stavba-popis { max-width: 44em; margin-top: 0 !important; }
    .stavba-pod .stavba-zoznamy { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 56px; align-items: start; margin-top: 28px; }
    .stavba-pod .stavba-zoznamy > :nth-child(1) { grid-column: 1; grid-row: 1; }
    .stavba-pod .stavba-zoznamy > :nth-child(2) { grid-column: 1; grid-row: 2; }
    .stavba-pod .stavba-zoznamy > :nth-child(3) { grid-column: 2; grid-row: 1; margin-top: 0 !important; }
    .stavba-pod .stavba-zoznamy > :nth-child(4) { grid-column: 2; grid-row: 2; }
    .stavba-pod .stavba-zoznamy > :nth-child(5) { grid-column: 2; grid-row: 3; }
    @media (max-width: 900px) { .stavba-pod .stavba-zoznamy { display: block; } .stavba-pod .stavba-zoznamy > :nth-child(3) { margin-top: 28px !important; } }
    .dl-skupina { margin: 14px 4px 0; font-size: 13px; color: var(--color-ink-soft); }
    .dl-nazov { margin: 2px 28px 0 4px; font-size: 16px; font-weight: 600; line-height: 1.3; }
    .dl-sipka { position: absolute; right: 16px; bottom: 18px; color: var(--color-blue-700); }
    @media (max-width: 900px) { .pk-lista-nav { display: none; } .pk-lista-in { gap: 12px; } .pk-lista { top: 64px; } }
    @media (max-width: 760px) { .pk-lista-obr { width: 44px; height: 38px; } .pk-lista-btn { padding: 0 14px !important; } .dl-mriezka { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; } .dl-nazov { font-size: 15px; margin-right: 4px; } .dl-sipka { display: none; } }
  `);
}

const MENA = { dnes: '0-dnes', A: 'A-produktova-karta', B: 'B-poriadok-v-dnesnom-rozlozeni', C: 'C-studio-s-listou' };
const ktore = process.argv.slice(2).length ? process.argv.slice(2) : ['dnes', 'A', 'B', 'C', 'cela'];
const server = spawn(process.execPath, [`${KOREN}/snimky-stranok/_skripty/server.mjs`, `${KOREN}/web/dist`, String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));
const browser = await chromium.launch({ channel: 'chrome' });

const priprav = async (page, url, v) => {
  await page.goto(`http://127.0.0.1:${PORT}${url}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(`(${POMOCKY})(${JSON.stringify(IKONY)}, ${JSON.stringify(PRODUKTY)}); window.ROZOBER = ${ROZOBER}; window.A = ${A}; window.B = ${B}; window.C = ${C}; window.CELA = ${CELA};`);
  if (v !== 'dnes') await page.evaluate(`${v}()`);
  await page.waitForTimeout(400);
};
const vyberAteplo = async (page) => {
  await page.locator('[data-seg] button[data-k="1"]').click();
  await page.waitForTimeout(1500);
  await page.locator('[data-rezim="termo"]').click();
  await page.waitForFunction(() => { const i = document.querySelector('.tv-obr img'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 15000 });
  await page.waitForTimeout(900);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
};
const nacitajVsetko = async (page) => {
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 600) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(50); }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(500);
};

try {
  for (const [z, vp, dsf] of [['pc', { width: 1600, height: 900 }, 1.25], ['mobil', { width: 390, height: 844 }, 2]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf, reducedMotion: 'reduce' });
    await ctx.route('**/navrh-assets/**', async (route) => {
      const rel = decodeURIComponent(new URL(route.request().url()).pathname.replace(/^\/navrh-assets\/src\//, ''));
      const subor = join(KOREN, 'web/src/assets', rel);
      await route.fulfill({ status: 200, contentType: { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' }[extname(subor)], body: readFileSync(subor) });
    });
    for (const v of ktore.filter((x) => x !== 'cela')) {
      const page = await ctx.newPage();
      const chyby = [];
      page.on('pageerror', (e) => chyby.push(String(e)));
      await priprav(page, UNO, v);
      if (z === 'pc') await page.screenshot({ path: `${CIEL}/${MENA[v]}-pc.png` });
      else await page.screenshot({ path: `${CIEL}/${MENA[v]}-mobil.png`, fullPage: true, clip: { x: 0, y: 0, width: vp.width, height: 1500 } });
      await priprav(page, DUO, v);
      await vyberAteplo(page);
      if (z === 'pc') await page.screenshot({ path: `${CIEL}/${MENA[v]}-pc-duo-32-teplota.png` });
      else await page.screenshot({ path: `${CIEL}/${MENA[v]}-mobil-duo-32-teplota.png`, fullPage: true, clip: { x: 0, y: 0, width: vp.width, height: 1650 } });
      console.log('ok', v, z, chyby.length ? `CHYBY: ${chyby.join(' | ')}` : '');
      await page.close();
    }
    await ctx.close();
  }
  if (ktore.includes('cela')) {
    for (const [z, vp] of [['pc', { width: 1600, height: 900 }], ['mobil', { width: 390, height: 844 }]]) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: z === 'pc' ? 1 : 1, reducedMotion: 'reduce' });
      await ctx.route('**/navrh-assets/**', async (route) => {
        const rel = decodeURIComponent(new URL(route.request().url()).pathname.replace(/^\/navrh-assets\/src\//, ''));
        await route.fulfill({ status: 200, contentType: 'image/webp', body: readFileSync(join(KOREN, 'web/src/assets', rel)) });
      });
      const page = await ctx.newPage();
      await priprav(page, DUO, 'A');
      await page.evaluate('CELA()');
      await nacitajVsetko(page);
      await page.screenshot({ path: `${CIEL}/A-cela-stranka-${z}.jpg`, fullPage: true, type: 'jpeg', quality: 80 });
      if (z === 'pc') {
        // Lišta produktu počas čítania: vybraný rozmer a časť Diely.
        await page.locator('[data-seg] button[data-k="1"]').click();
        await page.waitForTimeout(800);
        await page.evaluate(() => { const y = document.querySelector('#suvisiace').getBoundingClientRect().top + scrollY - 150; scrollTo(0, y); });
        await page.waitForTimeout(600);
        await page.evaluate(() => { document.querySelectorAll('.pk-lista-nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#suvisiace')); });
        await page.screenshot({ path: `${CIEL}/A-lista-produktu-pc.png` });
      }
      console.log('ok cela', z);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  server.kill();
}
