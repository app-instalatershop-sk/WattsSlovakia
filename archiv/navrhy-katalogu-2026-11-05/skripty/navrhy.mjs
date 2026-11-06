// Návrhy sekcie „Vyberte potrubie podľa použitia.“ (Juraj 5. 11. 2026): tri smery ako snímky.
// Web sa nemení: do domova z web/dist sa vloží iný obsah sekcie #vyber a odfotí sa (počítač 1440, telefón 390).
// node navrhy.mjs [dnes|A|B|C ...]
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawn } from 'node:child_process';

const require = createRequire('C:/Users/krist/Documents/FajnInstalater/audit/scripts/package.json');
const { chromium } = require('playwright');

const KOREN = 'C:/Users/krist/Documents/FajnInstalater/MicroflexWeb';
const WEB = `${KOREN}/web`;
const SP = 'C:/Users/krist/Documents/FajnInstalater/MicroflexWeb/snimky-stranok/navrh-katalog/_skript';
const CIEL = `${KOREN}/snimky-stranok/navrh-katalog`;
const PORT = 4337;
const B = `http://127.0.0.1:${PORT}`;
mkdirSync(CIEL, { recursive: true });

// ---------- dáta (tie isté súbory ako web) ----------
const json = (f) => JSON.parse(readFileSync(join(WEB, 'src/data', f), 'utf8'));
const kategorie = json('kategorie.json').sort((a, b) => a.poradie - b.poradie);
const rady = json('rady.json');
const varianty = json('varianty.json');
const mierka = json('mierka.json');

const cs = (x) => String(x).replace('.', ',');
const az = (a, b, j = 'mm') => (a === b ? `${cs(a)} ${j}` : `${cs(a)} až ${cs(b)} ${j}`);
const dimenzii = (n) => (n === 1 ? '1 dimenzia' : n < 5 ? `${n} dimenzie` : `${n} dimenzií`);
const radov = (n) => (n === 1 ? '1 rad' : n < 5 ? `${n} rady` : `${n} radov`);
const RURY = { 1: 'Jedna rúra v plášti', 2: 'Dve rúry v plášti', 4: 'Štyri rúry v plášti' };
const model = (r) => r.nazov.split(',')[0].trim();
const kratko = (r) => model(r).replace(/^Microflex\s+/, '');
const zoznam = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} a ${xs.at(-1)}`);
const jePrimo = (r) => /PRIMO/.test(model(r));

const potrubia = kategorie.filter((k) => k.typ === 'potrubie');
const radyKat = (k) => rady.filter((r) => r.kategoria === k.id).sort((a, b) => a.poradie - b.poradie);

function fakty(r) {
  const vv = varianty.filter((v) => v.rad === r.id);
  const plast = vv.map((v) => v.plast_mm).filter(Number.isFinite);
  const d = vv.flatMap((v) => (Array.isArray(v.rura) ? v.rura : v.rura ? [v.rura] : []).map((x) => x.d)).filter(Number.isFinite);
  const dn = vv.flatMap((v) => String(v.dn ?? '').match(/\d+/g) ?? []).map(Number);
  const ohyb = vv.map((v) => v.polomer_ohybu_m).filter(Number.isFinite);
  const mm = (a) => (a.length ? [Math.min(...a), Math.max(...a)] : null);
  return { n: vv.length, plast: mm(plast), rura: mm(d), dn: mm(dn), ohyb: ohyb.length ? Math.min(...ohyb) : null, tlak: r.tlak_text ?? (r.tlak_bar ? `${r.tlak_bar} bar` : null), vv };
}

// Obrázky: vlastné rendery 3D modelu a fotky dielov zo src/assets, čelá rúr z prípravy v scratchpade.
const A = (p) => `/navrh-assets/src/${p}`;
const render = (r) => A(`3d/rady/${r.id}.webp`);
const celo = (r) => `/navrh-assets/cela/${r.id}.webp`;
const rad = (id) => rady.find((r) => r.id === id);
// Čelo, ktoré použitie najlepšie ukáže (farba nosných rúr podľa média).
const CELO_KAT = { vykurovanie: 'microflex-duo-6-bar', sanita: 'microflex-duo-10-bar', 'vykurovanie-a-sanita': 'microflex-quadro', 'studena-a-chladena-voda': 'microflex-cool', 'tepelne-cerpadla': 'microflex-hp' };
// Krátka veta pre laika: z popisov kategórií v dátach.
const KEDY = {
  vykurovanie: 'Z kotolne alebo tepelného čerpadla do domu, medzi budovami',
  sanita: 'Pitná voda medzi budovami a k vzdialeným odberom',
  'vykurovanie-a-sanita': 'Vykurovanie, teplá voda aj cirkulácia v jednom výkope',
  'studena-a-chladena-voda': 'Studená, chladená aj odpadová voda',
  'tepelne-cerpadla': 'Vonkajšia jednotka s domom, s chráničkami na kábel',
};
// Skupiny dielov a ich typický výrez (ako Katalog.astro, TYPICKY).
const TYPICKY = {
  'pe-x-spojky-vykurovanie-a-cool': 'pe-x-x-pe-x-spojka-kurenie', 'pe-x-spojky-sanita': 'sanitarne-spojky-microflex-pe-x',
  'prislusenstvo-spojok': 't-kus-z-bronzu', 'koncovky-a-redukcie': 'teplom-zmrstitelne-hlavice-pre-uno-rurku',
  'izolacne-sady': 'izolovana-suprava-t-kusu', 'opravne-a-vystrazne-pasky': 'vystrazna-paska', 'prestupy-stenou': 'tesnenie-na-prienik-na-stenu-micro-press',
};
const diely = kategorie.filter((k) => k.typ !== 'potrubie').flatMap((k) => radyKat(k)).map((r) => ({ nazov: r.nazov, img: A(`produkty/${TYPICKY[r.id]}.webp`) }));

const svg = (p, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I = { sipka: svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'), chevron: svg('<path d="m9 18 6-6-6-6"/>', 16) };
const H2 = 'Vyberte potrubie podľa použitia.';

// ======================= A: štúdio, ktoré sa dá ovládať =======================
function navrhA() {
  const k = potrubia[0];
  const rr = radyKat(k);
  const zaklad = rr.filter((r) => !jePrimo(r));
  const primo = (r) => rr.find((p) => jePrimo(p) && p.pocet_rur === r.pocet_rur);
  const produkty = zaklad.map((r) => {
    const f = fakty(r); const p = primo(r);
    return `<article class="nvA-p">
      <div class="nvA-obr"><img src="${render(r)}" alt=""></div>
      <div class="nvA-karta">
        <h3 class="nvA-meno">${model(r)}</h3>
        <p class="nvA-sub">${RURY[r.pocet_rur]}, ${f.tlak}</p>
        <dl class="nvA-stitok">
          <div><dt>Dimenzie</dt><dd>${f.n}</dd></div>
          <div><dt>Plášť</dt><dd>Ø ${az(...f.plast)}</dd></div>
          ${f.rura ? `<div><dt>${r.pocet_rur > 1 ? 'Nosné rúry' : 'Nosná rúra'}</dt><dd>${r.pocet_rur > 1 ? `${r.pocet_rur} × ` : ''}Ø ${az(...f.rura)}${f.dn ? `<small>DN ${az(...f.dn, '').trim()}</small>` : ''}</dd></div>` : ''}
        </dl>
        <a class="nvA-cta" href="#">Vybrať dimenziu ${I.sipka}</a>
        ${p ? `<a class="nvA-vyh" href="#"><span class="nvA-vyh-celo"><img src="${celo(p)}" alt=""></span><span class="nvA-vyh-t"><small>Aj v užšom plášti</small><strong>${model(p)}</strong></span>${I.chevron}</a>` : ''}
      </div>
    </article>`;
  }).join('');
  const volby = potrubia.map((kk, i) => {
    const r2 = radyKat(kk);
    return `<button class="nvA-v${i === 0 ? ' je' : ''}" type="button"><span class="nvA-celo"><img src="${celo(rad(CELO_KAT[kk.id]))}" alt=""></span><span class="nvA-vt"><strong>${kk.kratky_nazov}</strong><small>${radov(r2.length)}: ${zoznam(r2.map(kratko))}</small></span>${I.chevron}</button>`;
  }).join('');
  const html = `<div class="wrap nvA">
    <div class="nvA-grid">
      <div class="nvA-studio"><div class="nvA-produkty">${produkty}</div><div class="nvA-bodky" aria-hidden="true"><span class="je"></span><span></span></div></div>
      <div class="nvA-panel">
        <h2>${H2}</h2>
        <div class="nvA-volby">${volby}</div>
        <p class="nvA-popis">${k.popis}</p>
        <a class="nvA-vsetko" href="#">Celý katalóg potrubí ${I.sipka}</a>
      </div>
    </div>
    <div class="nvA-diely">
      <div class="nvA-dh"><div><h3>Spojky a príslušenstvo</h3><p>Všetko na pripojenie, ukončenie a prestup stenou.</p></div><a href="#">Všetky spojky a príslušenstvo ${I.sipka}</a></div>
      <ul class="nvA-polica">${diely.map((d) => `<li><a href="#"><span class="nvA-dobr"><img src="${d.img}" alt=""></span><span class="nvA-dn">${d.nazov}</span></a></li>`).join('')}</ul>
      <ul class="nvA-polica nvA-polica-m">
        <li><a href="#"><span class="nvA-dobr"><img src="${A('produkty/pe-x-x-pe-x-spojka-kurenie.webp')}" alt=""></span><span class="nvA-dn">Spojky</span></a></li>
        <li><a href="#"><span class="nvA-dobr"><img src="${A('produkty/teplom-zmrstitelne-hlavice-pre-rurku-duo.webp')}" alt=""></span><span class="nvA-dn">Príslušenstvo</span></a></li>
      </ul>
    </div>
  </div>`;
  const css = `
  .nvA-grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); column-gap: 64px; align-items: start; }
  .nvA-studio { position: relative; grid-column: 1; grid-row: 1; padding-top: 40px; }
  .nvA-studio::before { content: ""; position: absolute; inset: -60px -6% -40px calc(-1 * var(--bleed)); background: radial-gradient(50% 50% at 55% 34%, #fff 0%, rgb(255 255 255 / 0.55) 46%, rgb(255 255 255 / 0) 76%); pointer-events: none; }
  .nvA-produkty { position: relative; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px; align-items: stretch; }
  .nvA-p { position: relative; display: flex; flex-direction: column; }
  .nvA-obr { position: relative; z-index: 2; margin: 0 -8px -84px; pointer-events: none; }
  .nvA-obr img { display: block; width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: contain; object-position: center bottom; }
  .nvA-karta { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; padding: 100px 24px 20px; border-radius: var(--radius-xl);
    background: linear-gradient(180deg, rgb(255 255 255 / 0.97) 0%, rgb(255 255 255 / 0.84) 100%); box-shadow: inset 0 1px 0 #fff, inset 0 0 0 1px rgb(10 42 94 / 0.07), var(--elev-3); }
  .nvA-meno { font-family: var(--font-display); font-stretch: 112.5%; font-weight: 650; font-size: 24px; line-height: 1.15; letter-spacing: -0.01em; color: var(--color-ink); margin: 0; }
  .nvA-sub { margin: 4px 0 0; font-size: 15px; color: var(--color-ink-soft); }
  .nvA-stitok { margin: 16px 0 0; padding: 12px 16px; display: grid; gap: 8px; border-radius: var(--radius-l); background: var(--color-blue-50); box-shadow: inset 0 1px 2px rgb(10 42 94 / 0.1); }
  .nvA-stitok div { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .nvA-stitok dt { font-size: 14px; color: var(--color-ink-soft); }
  .nvA-stitok dd { margin: 0; font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--color-ink); text-align: right; }
  .nvA-stitok dd small { display: block; font-size: 12px; font-weight: 500; color: var(--color-ink-soft); }
  .nvA-cta { margin-top: 16px; display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; font-size: 16px; font-weight: 600; color: var(--color-blue-700); text-decoration: none; }
  .nvA-vyh { margin-top: 16px; display: flex; align-items: center; gap: 12px; padding: 8px 12px 8px 8px; border-radius: var(--radius-l); background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.1), var(--elev-1); color: var(--color-ink); text-decoration: none; }
  .nvA-vyh-celo { flex: none; width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: var(--color-blue-50); }
  .nvA-vyh-celo img, .nvA-celo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .nvA-vyh-t { flex: 1; display: flex; flex-direction: column; }
  .nvA-vyh-t small { font-size: 12px; color: var(--color-ink-soft); }
  .nvA-vyh-t strong { font-size: 15px; font-weight: 600; }
  .nvA-vyh svg { color: var(--color-blue-700); flex: none; }
  .nvA-panel { grid-column: 2; grid-row: 1; position: relative; z-index: 2; }
  .nvA-panel h2 { font-size: clamp(28px, 2.2vw + 14px, 42px); margin: 0 0 24px; }
  .nvA-volby { display: grid; gap: 8px; }
  .nvA-v { all: unset; box-sizing: border-box; cursor: pointer; position: relative; display: grid; grid-template-columns: 48px minmax(0, 1fr) 16px; align-items: center; gap: 16px; padding: 10px 16px 10px 10px; border-radius: var(--radius-l);
    background: var(--sklo-2); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.09), var(--elev-1); color: var(--color-ink); }
  .nvA-celo { width: 48px; height: 48px; border-radius: 50%; overflow: hidden; background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.1); }
  .nvA-vt strong { display: block; font-family: var(--font-display); font-stretch: 112.5%; font-weight: 600; font-size: 18px; line-height: 1.25; }
  .nvA-vt small { display: block; margin-top: 2px; font-size: 13px; line-height: 1.35; color: var(--color-ink-soft); }
  .nvA-v svg { color: var(--color-blue-700); }
  .nvA-v.je { background: var(--color-blue-900); color: #fff; box-shadow: var(--elev-2); }
  .nvA-v.je .nvA-celo { box-shadow: 0 0 0 3px var(--color-yellow-500); }
  .nvA-v.je small { color: var(--color-on-dark-muted); }
  .nvA-v.je svg { color: #fff; }
  .nvA-popis { margin: 24px 0 0; font-size: 16px; line-height: 1.55; color: var(--color-ink-soft); max-width: 32em; }
  .nvA-vsetko { margin-top: 16px; display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: var(--color-blue-700); text-decoration: none; }
  .nvA-diely { margin-top: 72px; }
  .nvA-dh { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 16px; }
  .nvA-dh h3 { font-family: var(--font-display); font-stretch: 112.5%; font-size: 22px; font-weight: 600; margin: 0; }
  .nvA-dh p { margin: 4px 0 0; color: var(--color-ink-soft); font-size: 15px; }
  .nvA-dh a { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: var(--color-blue-700); white-space: nowrap; text-decoration: none; }
  .nvA-polica { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 12px; }
  .nvA-polica a { height: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px; padding: 12px 14px 16px; border-radius: var(--radius-l); background: var(--sklo-2); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.07), var(--elev-1); color: var(--color-ink); text-decoration: none; }
  .nvA-dobr { position: relative; display: grid; place-items: center; height: 96px; }
  .nvA-dobr::after { content: ""; position: absolute; left: 20%; right: 20%; bottom: 2px; height: 10px; border-radius: 50%; background: radial-gradient(closest-side, rgb(10 42 94 / 0.24), rgb(10 42 94 / 0)); }
  .nvA-dobr img { position: relative; z-index: 1; max-width: 100%; max-height: 88px; object-fit: contain; }
  .nvA-dn { font-size: 14px; font-weight: 600; line-height: 1.3; }
  .nvA-polica-m, .nvA-bodky { display: none; }
  @media (max-width: 760px) {
    .nvA-grid { grid-template-columns: minmax(0, 1fr); row-gap: 8px; }
    .nvA-panel { grid-column: 1; grid-row: 1; }
    .nvA-studio { grid-column: 1; grid-row: 2; padding-top: 16px; }
    .nvA-studio::before { display: none; }
    /* Telefón: jeden posuvný pás s viditeľnou polohou (ako dnes, Juraj 28. 10.), ďalšia karta vykúka. */
    .nvA-produkty { grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: 84%; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;
      margin-inline: calc(-1 * var(--gutter)); padding: 0 var(--gutter) 24px; scroll-padding-inline: var(--gutter); }
    .nvA-p { scroll-snap-align: start; }
    .nvA-obr { margin: 0 4% -64px; }
    .nvA-karta { padding: 76px 16px 16px; }
    .nvA-meno { font-size: 21px; }
    .nvA-bodky { display: flex; justify-content: center; gap: 8px; margin-top: 0; }
    .nvA-bodky span { width: 8px; height: 8px; border-radius: 999px; background: var(--color-ink-soft); }
    .nvA-bodky span.je { width: 22px; background: var(--color-blue-900); }
    .nvA-polica { display: none; }
    .nvA-polica.nvA-polica-m { display: grid; }
    .nvA-popis { font-size: 15px; }
    .nvA-v { grid-template-columns: 44px minmax(0, 1fr) 16px; gap: 12px; }
    .nvA-celo { width: 44px; height: 44px; }
    .nvA-diely { margin-top: 48px; }
    .nvA-dh { flex-direction: column; align-items: start; gap: 8px; }
    .nvA-polica { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }`;
  return { html, css };
}

// ======================= B: celý sortiment naraz =======================
function navrhB() {
  const vsetky = potrubia.flatMap(radyKat);
  const chips = [`<button class="nvB-f je" type="button">Všetky <span>${vsetky.length}</span></button>`,
    ...potrubia.map((k) => `<button class="nvB-f" type="button"><span class="nvB-fc"><img src="${celo(rad(CELO_KAT[k.id]))}" alt=""></span>${k.kratky_nazov} <span>${radyKat(k).length}</span></button>`)].join('');
  const tiles = potrubia.flatMap((k) => radyKat(k).map((r) => {
    const f = fakty(r);
    const sub = jePrimo(r) ? `${RURY[r.pocet_rur].replace(' v plášti', '')}, užší plášť` : RURY[r.pocet_rur];
    return `<li class="nvB-t"><a href="#">
      <span class="nvB-tag">${k.kratky_nazov}${f.tlak ? ` · ${f.tlak}` : ''}</span>
      <span class="nvB-obr"><img src="${render(r)}" alt=""></span>
      <strong class="nvB-meno">${model(r)}</strong>
      <span class="nvB-sub">${sub}</span>
      <span class="nvB-fakty"><b>${dimenzii(f.n)}</b>${f.plast ? `<span>plášť Ø ${az(...f.plast)}</span>` : ''}</span>
      <span class="nvB-sip">${I.sipka}</span>
    </a></li>`;
  })).join('');
  const kat = (id) => kategorie.find((k) => k.id === id);
  const dielTile = (k, imgs) => `<li class="nvB-t nvB-diel"><a href="#">
      <span class="nvB-diel-t"><strong class="nvB-meno">${k.kratky_nazov ?? k.nazov}</strong><span class="nvB-sub">${k.popis}</span></span>
      <span class="nvB-diel-obr">${imgs.map((i) => `<span><img src="${A(`produkty/${i}.webp`)}" alt=""></span>`).join('')}</span>
      <span class="nvB-sip">${I.sipka}</span>
    </a></li>`;
  const html = `<div class="wrap nvB">
    <div class="nvB-hlava">
      <h2>${H2}</h2>
      <p>Všetkých ${vsetky.length} radov na jednom mieste. Vyberte použitie alebo rovno rad, ktorý poznáte.</p>
    </div>
    <div class="nvB-filtre" role="group" aria-label="Použitie">${chips}</div>
    <ul class="nvB-mriezka">${tiles}
      ${dielTile(kat('spojky'), ['pe-x-x-pe-x-spojka-kurenie', 'sanitarne-spojky-microflex-pe-x', 't-kus-z-bronzu'])}
      ${dielTile(kat('prislusenstvo'), ['teplom-zmrstitelne-hlavice-pre-rurku-duo', 'izolovana-suprava-t-kusu', 'tesnenie-na-prienik-na-stenu-micro-press'])}
    </ul>
  </div>`;
  const css = `
  .nvB-hlava { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); column-gap: 64px; align-items: end; }
  .nvB-hlava h2 { font-size: clamp(28px, 2.2vw + 14px, 42px); margin: 0; }
  .nvB-hlava p { margin: 0 0 4px; font-size: 17px; line-height: 1.5; color: var(--color-ink-soft); max-width: 30em; }
  .nvB-filtre { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 8px; }
  .nvB-f { all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; height: 48px; padding: 0 14px 0 16px; border-radius: var(--radius-m);
    background: var(--sklo-2); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.1), var(--elev-1); font-size: 14px; font-weight: 600; color: var(--color-ink); white-space: nowrap; }
  .nvB-f:has(.nvB-fc) { padding-left: 6px; }
  .nvB-fc { flex: none; width: 34px; height: 34px; border-radius: 50%; overflow: hidden; background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.1); }
  .nvB-fc img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .nvB-f > span:last-child { font-size: 13px; font-weight: 500; font-variant-numeric: tabular-nums; color: var(--color-ink-soft); }
  .nvB-f.je { background: var(--color-blue-900); color: #fff; box-shadow: var(--elev-2); padding-right: 8px; }
  .nvB-f.je > span:last-child { min-width: 28px; height: 28px; padding: 0 8px; box-sizing: border-box; display: grid; place-items: center; border-radius: var(--radius-s); background: var(--color-yellow-500); color: var(--color-ink); font-weight: 600; }
  .nvB-mriezka { list-style: none; margin: 24px 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
  .nvB-t a { position: relative; box-sizing: border-box; height: 100%; display: flex; flex-direction: column; padding: 16px 20px 20px; border-radius: var(--radius-xl);
    background: linear-gradient(180deg, #fff 0%, rgb(255 255 255 / 0.78) 100%); box-shadow: inset 0 1px 0 #fff, inset 0 0 0 1px rgb(10 42 94 / 0.07), var(--elev-3); color: var(--color-ink); text-decoration: none; overflow: hidden; }
  .nvB-tag { font-size: 13px; font-weight: 500; color: var(--color-ink-soft); }
  .nvB-obr { position: relative; margin: 4px -12px 8px; }
  .nvB-obr::before { content: ""; position: absolute; left: 6%; right: 6%; top: 8%; bottom: 4%; background: radial-gradient(closest-side, rgb(217 231 245 / 0.9), rgb(217 231 245 / 0)); }
  .nvB-obr img { position: relative; display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: contain; }
  .nvB-meno { font-family: var(--font-display); font-stretch: 112.5%; font-weight: 650; font-size: 20px; line-height: 1.2; letter-spacing: -0.01em; }
  .nvB-sub { margin-top: 2px; font-size: 14px; line-height: 1.4; color: var(--color-ink-soft); }
  .nvB-fakty { margin-top: auto; padding-top: 12px; padding-right: 44px; display: flex; flex-direction: column; font-size: 14px; line-height: 1.4; font-variant-numeric: tabular-nums; color: var(--color-ink); }
  .nvB-fakty b { font-weight: 600; }
  .nvB-sip { position: absolute; right: 16px; bottom: 16px; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--color-blue-700); color: #fff; box-shadow: var(--elev-1); }
  .nvB-sip svg { width: 16px; height: 16px; }
  .nvB-diel { grid-column: span 2; }
  .nvB-diel a { flex-direction: row; align-items: center; gap: 20px; padding: 16px 68px 16px 24px; }
  .nvB-diel-t { flex: 1; display: flex; flex-direction: column; }
  .nvB-diel-obr { display: flex; gap: 8px; }
  .nvB-diel-obr span { position: relative; width: 84px; height: 84px; display: grid; place-items: center; }
  .nvB-diel-obr span::after { content: ""; position: absolute; left: 18%; right: 18%; bottom: 2px; height: 9px; border-radius: 50%; background: radial-gradient(closest-side, rgb(10 42 94 / 0.24), rgb(10 42 94 / 0)); }
  .nvB-diel-obr img { position: relative; z-index: 1; max-width: 84px; max-height: 76px; object-fit: contain; }
  .nvB-diel .nvB-sip { top: 50%; bottom: auto; transform: translateY(-50%); }
  @media (max-width: 760px) {
    .nvB-hlava { grid-template-columns: minmax(0, 1fr); row-gap: 12px; }
    .nvB-hlava p { font-size: 15px; }
    .nvB-filtre { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .nvB-f { height: auto; min-height: 52px; padding-block: 8px; font-size: 14px; line-height: 1.3; white-space: normal; }
    .nvB-f > span:last-child { margin-left: auto; }
    .nvB-fc { width: 32px; height: 32px; }
    .nvB-mriezka { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .nvB-t a { padding: 12px 12px 14px; border-radius: var(--radius-l); }
    .nvB-tag { font-size: 12px; line-height: 1.35; min-height: 2.7em; }
    .nvB-obr { margin: 0 -8px 4px; }
    .nvB-meno { font-size: 16px; }
    .nvB-sub { font-size: 13px; }
    .nvB-fakty { padding-right: 0; font-size: 13px; }
    .nvB-fakty span { display: none; }
    .nvB-sip { display: none; }
    .nvB-diel { grid-column: span 2; }
    .nvB-diel a { flex-direction: column; align-items: start; padding: 14px; gap: 8px; }
    .nvB-diel-obr span { width: 64px; height: 64px; }
    .nvB-diel-obr img { max-width: 64px; max-height: 58px; }
  }`;
  return { html, css };
}

// ======================= C: sprievodca s výsledkom =======================
function navrhC() {
  const k = potrubia[0];
  const rr = radyKat(k);
  const vybrany = rad('microflex-duo-6-bar');
  const f = fakty(vybrany);
  const m = mierka[vybrany.id];
  const popisRezu = (obj) => { const v = f.vv.find((x) => x.obj_cislo === obj); return v ? { p: v.plast_mm, r: v.rura?.d } : null; };
  const stitky = m.systemy.map((s, i) => { const p = popisRezu(s.obj); return p ? `<span class="nvC-mi-s" style="left:${s.bod[0]}%"><b>${p.p}</b>${p.r ? `<i>2 × ${p.r}</i>` : ''}</span>` : ''; }).join('');
  const moznosti = potrubia.map((kk, i) => `<button class="nvC-m${i === 0 ? ' je' : ''}" type="button"><span class="nvC-celo"><img src="${celo(rad(CELO_KAT[kk.id]))}" alt=""></span><span class="nvC-mt"><strong>${kk.kratky_nazov}</strong><small>${KEDY[kk.id]}</small></span></button>`).join('');
  const POPIS_VYH = { 'microflex-uno-6-bar': 'Jedna rúra', 'microflex-duo-6-bar': 'Prívod aj spiatočka', 'microflex-uno-primo-6-bar': 'Jedna rúra, užší plášť', 'microflex-primo-duo-6-bar': 'Dve rúry, užší plášť' };
  const vyhotovenia = rr.map((r) => `<button class="nvC-o${r.id === vybrany.id ? ' je' : ''}" type="button"><span class="nvC-celo"><img src="${celo(r)}" alt=""></span><span class="nvC-mt"><strong>${kratko(r)}</strong><small>${POPIS_VYH[r.id]}</small></span></button>`).join('');
  const ktomu = [
    ['Spojky PE-X', 'pe-x-x-pe-x-spojka-kurenie'],
    ['Koncové krytky', 'teplom-zmrstitelne-hlavice-pre-rurku-duo'],
    ['Prestupy stenou', 'tesnenie-na-prienik-na-stenu-micro-press'],
    ['Izolačné sady', 'izolovana-suprava-t-kusu'],
  ].map(([n, i]) => `<li><a href="#"><span class="nvC-kobr"><img src="${A(`produkty/${i}.webp`)}" alt=""></span><span>${n}</span>${I.chevron}</a></li>`).join('');
  const html = `<div class="wrap nvC">
    <div class="nvC-grid">
      <div class="nvC-vysledok">
        <div class="nvC-scena"><img src="${render(vybrany)}" alt=""></div>
        <div class="nvC-karta">
          <p class="nvC-pre">Vaše potrubie</p>
          <h3>${vybrany.nazov}</h3>
          <p class="nvC-veta">${vybrany.kratky_popis}</p>
          <div class="nvC-mierka">
            <div class="nvC-mi-obr" style="aspect-ratio:${m.pomer}"><img src="${A(`3d/mierka/${vybrany.id}.webp`)}" alt=""></div>
            <div class="nvC-mi-stitky">${stitky}</div>
            <p class="nvC-mi-pop">${dimenzii(f.n)} v skutočnom pomere: plášť Ø ${az(...f.plast)}, nosné rúry 2 × Ø ${az(...f.rura)} (DN ${az(...f.dn, '').trim()}), polomer ohybu od ${cs(f.ohyb.toFixed(2))} m</p>
          </div>
          <div class="nvC-akcie"><a class="btn btn-yellow btn-lg" href="#">Vybrať dimenziu ${I.sipka}</a><a class="nvC-detail" href="#">Všetko o rade DUO</a></div>
        </div>
        <div class="nvC-ktomu"><h4>K DUO budete potrebovať</h4><ul>${ktomu}</ul></div>
      </div>
      <div class="nvC-otazky">
        <h2>${H2}</h2>
        <div class="nvC-q"><p class="nvC-ot">Na čo potrubie potrebujete?</p><div class="nvC-moznosti">${moznosti}</div></div>
        <div class="nvC-q"><p class="nvC-ot">Koľko rúr v jednom plášti?</p><div class="nvC-vyh">${vyhotovenia}</div></div>
        <p class="nvC-pomoc">Nie ste si istí? <a href="#">Poradíme s výberom</a> alebo si pozrite <a href="#">celý katalóg potrubí</a>.</p>
      </div>
    </div>
  </div>`;
  const css = `
  .nvC-grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); column-gap: 64px; align-items: start; }
  .nvC-vysledok { grid-column: 1; grid-row: 1; position: relative; }
  .nvC-vysledok::before { content: ""; position: absolute; inset: -60px -4% auto calc(-1 * var(--bleed)); height: 620px; background: radial-gradient(48% 50% at 52% 46%, #fff 0%, rgb(255 255 255 / 0.55) 46%, rgb(255 255 255 / 0) 76%); pointer-events: none; }
  .nvC-scena { position: relative; z-index: 2; width: 78%; margin: 0 auto -88px; pointer-events: none; }
  .nvC-scena img { display: block; width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: contain; }
  .nvC-karta { position: relative; z-index: 1; padding: 80px 32px 28px; border-radius: var(--radius-xl); background: linear-gradient(180deg, rgb(255 255 255 / 0.97) 0%, rgb(255 255 255 / 0.86) 100%);
    box-shadow: inset 0 1px 0 #fff, inset 0 0 0 1px rgb(10 42 94 / 0.07), var(--elev-3); }
  .nvC-pre { margin: 0; font-size: 14px; font-weight: 600; color: var(--color-blue-700); }
  .nvC-karta h3 { margin: 4px 0 0; font-family: var(--font-display); font-stretch: 112.5%; font-weight: 650; font-size: 28px; line-height: 1.15; letter-spacing: -0.01em; }
  .nvC-veta { margin: 8px 0 0; font-size: 16px; line-height: 1.5; color: var(--color-ink-soft); max-width: 36em; }
  .nvC-mierka { margin-top: 20px; padding: 16px 16px 12px; border-radius: var(--radius-l); background: var(--color-blue-50); box-shadow: inset 0 1px 2px rgb(10 42 94 / 0.1); }
  .nvC-mi-obr img { display: block; width: 100%; height: 100%; object-fit: contain; }
  .nvC-mi-stitky { position: relative; height: 38px; margin-top: 4px; }
  .nvC-mi-s { position: absolute; top: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; line-height: 1.15; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .nvC-mi-s b { font-size: 13px; font-weight: 600; color: var(--color-ink); }
  .nvC-mi-s i { font-style: normal; font-size: 11px; color: var(--color-ink-soft); }
  .nvC-mi-pop { margin: 8px 0 0; font-size: 13px; line-height: 1.45; color: var(--color-ink-soft); }
  .nvC-akcie { margin-top: 20px; display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
  .nvC-akcie .btn svg { width: 20px; height: 20px; }
  .nvC-detail { font-weight: 600; color: var(--color-blue-700); text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1px; }
  .nvC-ktomu { margin-top: 28px; }
  .nvC-ktomu h4 { margin: 0 0 12px; font-family: var(--font-text); font-size: 16px; font-weight: 600; }
  .nvC-ktomu ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
  .nvC-ktomu a { box-sizing: border-box; height: 100%; display: grid; grid-template-columns: 52px minmax(0, 1fr) 16px; align-items: center; gap: 8px; padding: 8px 10px 8px 6px; border-radius: var(--radius-l); background: var(--sklo-2);
    box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.08), var(--elev-1); color: var(--color-ink); font-size: 13px; font-weight: 600; line-height: 1.3; text-decoration: none; }
  .nvC-ktomu a svg { color: var(--color-blue-700); }
  .nvC-kobr { position: relative; width: 52px; height: 52px; display: grid; place-items: center; }
  .nvC-kobr img { max-width: 48px; max-height: 46px; object-fit: contain; }
  .nvC-otazky { grid-column: 2; grid-row: 1; position: relative; z-index: 2; }
  .nvC-otazky h2 { font-size: clamp(28px, 2.2vw + 14px, 42px); margin: 0 0 28px; }
  .nvC-q + .nvC-q { margin-top: 28px; }
  .nvC-ot { margin: 0 0 12px; font-family: var(--font-display); font-stretch: 112.5%; font-size: 20px; font-weight: 600; color: var(--color-ink); }
  .nvC-moznosti { display: grid; gap: 8px; }
  .nvC-vyh { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .nvC-m, .nvC-o { all: unset; box-sizing: border-box; cursor: pointer; position: relative; display: grid; grid-template-columns: 44px minmax(0, 1fr); align-items: center; gap: 14px; padding: 8px 14px 8px 8px; border-radius: var(--radius-l);
    background: var(--sklo-2); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.09), var(--elev-1); color: var(--color-ink); }
  .nvC-celo { width: 44px; height: 44px; border-radius: 50%; overflow: hidden; background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.1); }
  .nvC-celo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .nvC-mt strong { display: block; font-size: 16px; font-weight: 600; line-height: 1.3; }
  .nvC-mt small { display: block; margin-top: 1px; font-size: 13px; line-height: 1.35; color: var(--color-ink-soft); }
  .nvC-m.je, .nvC-o.je { background: var(--color-blue-900); color: #fff; box-shadow: var(--elev-2); }
  .nvC-m.je .nvC-celo, .nvC-o.je .nvC-celo { box-shadow: 0 0 0 3px var(--color-yellow-500); }
  .nvC-m.je small, .nvC-o.je small { color: var(--color-on-dark-muted); }
  .nvC-pomoc { margin: 24px 0 0; font-size: 15px; line-height: 1.5; color: var(--color-ink-soft); }
  .nvC-pomoc a { color: var(--color-blue-700); font-weight: 600; }
  @media (max-width: 760px) {
    .nvC-grid { grid-template-columns: minmax(0, 1fr); row-gap: 32px; }
    .nvC-otazky { grid-column: 1; grid-row: 1; }
    .nvC-vysledok { grid-column: 1; grid-row: 2; }
    .nvC-vysledok::before { display: none; }
    .nvC-scena { width: 88%; margin-bottom: -64px; }
    .nvC-karta { padding: 64px 16px 20px; }
    .nvC-karta h3 { font-size: 22px; }
    .nvC-veta { font-size: 15px; }
    .nvC-mierka { padding: 12px 8px 10px; }
    .nvC-mi-s i { display: none; }
    .nvC-mi-s b { font-size: 11px; }
    .nvC-mi-stitky { height: 18px; }
    .nvC-akcie .btn { width: 100%; justify-content: center; }
    .nvC-ktomu ul { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .nvC-vyh { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    .nvC-m, .nvC-o { gap: 10px; padding-right: 10px; }
  }`;
  return { html, css };
}

// ---------- záznam faktov na kontrolu ----------
for (const k of potrubia) for (const r of radyKat(k)) { const f = fakty(r); console.log(k.kratky_nazov.padEnd(24), model(r).padEnd(36), f.n, f.plast, f.rura, f.dn, f.ohyb, f.tlak); }

// ---------- snímky ----------
const NAVRHY = { A: navrhA, B: navrhB, C: navrhC };
const ktore = process.argv.slice(2).length ? process.argv.slice(2) : ['dnes', 'A', 'B', 'C'];
const ZARIADENIA = [
  { meno: 'pc', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 },
  { meno: 'mobil', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
];
const PORADIE = { dnes: '0-dnes', A: '1-A-studio-s-ovladanim', B: '2-B-cely-sortiment', C: '3-C-sprievodca' };

const server = spawn(process.execPath, [`${KOREN}/snimky-stranok/_skripty/server.mjs`, `${WEB}/dist`, String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const z of ZARIADENIA) {
    const ctx = await browser.newContext({ viewport: z.viewport, deviceScaleFactor: z.deviceScaleFactor, reducedMotion: 'reduce' });
    await ctx.route('**/navrh-assets/**', async (route) => {
      const rel = decodeURIComponent(new URL(route.request().url()).pathname.replace(/^\/navrh-assets\//, ''));
      const subor = rel.startsWith('cela/') ? join(WEB, 'src/assets/3d', rel) : join(WEB, 'src/assets', rel.replace(/^src\//, ''));
      const typ = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' }[extname(subor)] ?? 'application/octet-stream';
      await route.fulfill({ status: 200, contentType: typ, body: readFileSync(subor) });
    });
    for (const n of ktore) {
      const page = await ctx.newPage();
      await page.goto(`${B}/`, { waitUntil: 'load' });
      if (n !== 'dnes') {
        const { html, css } = NAVRHY[n]();
        await page.evaluate(({ html, css }) => {
          const s = document.querySelector('#vyber');
          s.querySelector(':scope > .wrap').outerHTML = html;
          const st = document.createElement('style'); st.textContent = css; document.head.append(st);
        }, { html, css });
      }
      await page.evaluate(() => document.querySelectorAll('#vyber img').forEach((i) => { i.loading = 'eager'; }));
      await page.waitForFunction(() => [...document.querySelectorAll('#vyber img')].filter((i) => i.offsetParent).every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const box = await page.evaluate(() => {
        const s = document.querySelector('#vyber'); const w = s.querySelector(':scope > .wrap');
        const r = s.getBoundingClientRect(); const rw = w.getBoundingClientRect();
        const presah = parseFloat(getComputedStyle(s).getPropertyValue('--presah-hero')) || 0;
        return { top: r.top + scrollY + presah * 0.35, bottom: rw.bottom + scrollY + 56, width: document.documentElement.clientWidth };
      });
      const subor = `${CIEL}/${PORADIE[n]}-${z.meno}.png`;
      await page.screenshot({ path: subor, fullPage: true, clip: { x: 0, y: box.top, width: box.width, height: box.bottom - box.top } });
      console.log('ok', subor, Math.round(box.bottom - box.top), 'px');
      await page.close();
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
