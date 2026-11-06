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


// =====================================================================================
// TRI VERZIE MRIEŽKY (Juraj 5. 11. 2026): domov len PREZENTUJE, čo máme – pekná mriežka s obrázkami
// a viditeľným príslušenstvom. Výber krok za krokom robí sprievodca /vyber/, na ktorý mriežka odkáže.
// =====================================================================================
const CIEL_G = `${KOREN}/snimky-stranok/navrh-katalog/verzie-mriezky`;
mkdirSync(CIEL_G, { recursive: true });
const produkty = json('produkty.json');
const NB = ' ';
function sadzba(t) {
  let s = t;
  for (let i = 0; i < 2; i++) s = s.replace(/(^|[\s(„])([aAiIkKoOsSuUvVzZ]) (?=\S)/g, `$1$2${NB}`);
  return s.replace(/(\d) (mm|m|bar|°C|kg|t)(?![\p{L}])/gu, `$1${NB}$2`).replace(/Ø /g, `Ø${NB}`).replace(/ × /g, `${NB}×${NB}`).replace(/DN (\d)/g, `DN${NB}$1`);
}
const sadzbaHtml = (h) => h.replace(/>([^<]+)</g, (m, t) => `>${sadzba(t).replace(/PE-X(a?)/g, '<span style="white-space:nowrap">PE-X$1</span>')}<`);
const vyrobkov = (n) => (n === 1 ? '1 výrobok' : n < 5 ? `${n} výrobky` : `${n} výrobkov`);
const celoImg = (r, cls = 'celo') => `<span class="${cls}"><img src="${celo(r)}" alt=""></span>`;
const SPOL_CSS = `.celo { flex: none; display: block; border-radius: 50%; overflow: hidden; background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.1); }
  .celo img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .nv-h2 { margin: 0; font-size: clamp(28px, 2.2vw + 14px, 42px); text-wrap: balance; }
  .nv-lead { margin: 0; font-size: 17px; line-height: 1.5; color: var(--color-ink-soft); max-width: 30em; }
  .nv-lead a, .nv-link { color: var(--color-blue-700); font-weight: 600; }
  .nv-link { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; white-space: nowrap; }`;
const kat = (id) => kategorie.find((k) => k.id === id);
const pocetProd = (k) => produkty.filter((p) => p.kategoria === k).length;
const POPIS1 = (k) => k.popis.split(/(?<=\.)\s/)[0];
const tlakRadu = (r) => fakty(r).tlak;
const SPOJKY_IMG = ['pe-x-spojka-kurenie-cool-6-16bar', '3-x-ohrev-spojky-pe-x-t', 'pe-x-x-pe-x-koleno-spojky-vykurovanie', 't-kus-z-bronzu'];
const PRISL_IMG = ['teplom-zmrstitelne-hlavice-pre-rurku-duo', 'izolovana-suprava-t-kusu', 'tesnenie-na-prienik-na-stenu-micro-press', 'vystrazna-paska'];
const LEAD = `Dvanásť radov pre päť použití a všetko, čo k nim patrí. Ak si nie ste istí, ktoré potrubie potrebujete, <a href="#">prevedie vás sprievodca výberom</a>.`;
// Na telefóne dve skupiny dielov s fotkami (Juraj 28. 10.: jeden vstup namiesto siedmich riadkov), na počítači všetkých sedem.
const dielySkupinyMobil = (cls) => `<ul class="${cls}">${[['spojky', SPOJKY_IMG], ['prislusenstvo', PRISL_IMG]].map(([id, imgs]) => `<li><a href="#"><span class="dm-t"><strong>${kat(id).kratky_nazov ?? kat(id).nazov}</strong><small>${vyrobkov(pocetProd(id))}</small></span><span class="dm-obr">${imgs.slice(0, 3).map((i) => `<img src="${A(`produkty/${i}.webp`)}" alt="">`).join('')}</span>${I.chevron}</a></li>`).join('')}</ul>`;
const DIELY_MOBIL_CSS = `
  .dm { display: none; }
  @media (max-width: 760px) {
    .dm { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    .dm a { display: grid; grid-template-columns: minmax(0, 1fr) auto 16px; align-items: center; gap: 8px; padding: 10px 12px 10px 14px; border-radius: var(--radius-l); background: rgb(255 255 255 / 0.92);
      box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.08), var(--elev-1); color: var(--color-ink); text-decoration: none; }
    .dm a svg { color: var(--color-blue-700); }
    .dm-t strong { display: block; font-size: 16px; font-weight: 600; }
    .dm-t small { display: block; font-size: 13px; color: var(--color-ink-soft); }
    .dm-obr { display: flex; }
    .dm-obr img { width: 48px; height: 44px; object-fit: contain; }
  }`;

// ---------------- G1: mriežka produktov s filtrom (spôsob e-shopu) ----------------
function navrhG1() {
  const vsetky = potrubia.flatMap(radyKat);
  const chips = [`<button class="g1-f je" type="button">Všetky <span>${vsetky.length}</span></button>`,
    ...potrubia.map((k) => `<button class="g1-f" type="button">${celoImg(rad(CELO_KAT[k.id]), 'celo g1-fc')}${k.kratky_nazov} <span>${radyKat(k).length}</span></button>`)].join('');
  const karty = potrubia.flatMap((k) => radyKat(k).map((r) => {
    const f = fakty(r);
    const sub = jePrimo(r) ? `${RURY[r.pocet_rur].replace(' v plášti', '')}, užší plášť` : RURY[r.pocet_rur];
    return `<li><a class="g1-k" href="#">
      <span class="g1-obr"><img src="${render(r)}" alt=""></span>
      <span class="g1-tag">${k.kratky_nazov} · ${f.tlak}</span>
      <strong>${model(r)}</strong>
      <span class="g1-sub">${sub}</span>
      <span class="g1-data">${dimenzii(f.n)}${f.plast ? `, plášť Ø ${az(...f.plast)}` : ''}</span>
    </a></li>`;
  })).join('');
  const html = `<div class="wrap nvg1">
    <div class="g1-hlava"><h2 class="nv-h2">${H2}</h2><p class="nv-lead">${LEAD}</p></div>
    <div class="g1-filtre" role="group" aria-label="Použitie">${chips}</div>
    <ul class="g1-mriezka">${karty}</ul>
    <div class="g1-diely">
      <div class="g1-dh"><h3>Spojky a príslušenstvo</h3><a class="nv-link" href="#">Všetkých ${pocetProd('spojky') + pocetProd('prislusenstvo')} dielov ${I.sipka}</a></div>
      <ul class="g1-polica">${diely.map((d) => `<li><a href="#"><span class="g1-dobr"><img src="${d.img}" alt=""></span><span>${d.nazov}</span></a></li>`).join('')}</ul>
      ${dielySkupinyMobil('dm')}
    </div>
  </div>`;
  const css = `${SPOL_CSS}${DIELY_MOBIL_CSS}
  .g1-hlava { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); column-gap: 48px; align-items: end; }
  .g1-filtre { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 8px; }
  .g1-f { all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; height: 48px; padding: 0 14px 0 16px; border-radius: var(--radius-m);
    background: rgb(255 255 255 / 0.9); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.1), var(--elev-1); font-size: 14px; font-weight: 600; color: var(--color-ink); white-space: nowrap; }
  .g1-f:has(.g1-fc) { padding-left: 6px; }
  .g1-fc { width: 34px; height: 34px; }
  .g1-f > span:last-child { font-size: 13px; font-weight: 500; color: var(--color-ink-soft); font-variant-numeric: tabular-nums; }
  .g1-f.je { background: var(--color-blue-900); color: #fff; box-shadow: var(--elev-2); padding-right: 8px; }
  .g1-f.je > span:last-child { min-width: 28px; height: 28px; padding: 0 8px; box-sizing: border-box; display: grid; place-items: center; border-radius: var(--radius-s); background: var(--color-yellow-500); color: var(--color-ink); font-weight: 600; }
  .g1-mriezka { list-style: none; margin: 24px 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
  .g1-k { box-sizing: border-box; height: 100%; display: flex; flex-direction: column; padding: 8px 8px 20px; border-radius: var(--radius-xl); background: #fff;
    box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-3); color: var(--color-ink); text-decoration: none; }
  .g1-obr { display: block; border-radius: var(--radius-l); background: radial-gradient(80% 75% at 50% 45%, #ffffff 0%, #f1f6fc 60%, #e6eef8 100%); }
  .g1-obr img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: contain; }
  .g1-tag { margin: 14px 12px 0; font-size: 13px; color: var(--color-ink-soft); }
  .g1-k strong { margin: 2px 12px 0; font-family: var(--font-display); font-stretch: 112.5%; font-weight: 650; font-size: 20px; line-height: 1.2; letter-spacing: -0.01em; }
  .g1-sub { margin: 2px 12px 0; font-size: 14px; color: var(--color-ink-soft); }
  .g1-data { margin: auto 12px 0; padding-top: 12px; font-size: 14px; font-weight: 500; font-variant-numeric: tabular-nums; color: var(--color-ink); }
  .g1-diely { margin-top: 56px; }
  .g1-dh { display: flex; justify-content: space-between; align-items: baseline; gap: 24px; margin-bottom: 16px; }
  .g1-dh h3 { margin: 0; font-family: var(--font-display); font-stretch: 112.5%; font-size: 24px; font-weight: 600; }
  .g1-polica { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 12px; }
  .g1-polica a { box-sizing: border-box; height: 100%; display: flex; flex-direction: column; gap: 10px; padding: 8px 8px 14px; border-radius: var(--radius-l); background: #fff;
    box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-1); color: var(--color-ink); font-size: 14px; font-weight: 600; line-height: 1.3; text-decoration: none; }
  .g1-polica a > span:last-child { padding: 0 6px; }
  .g1-dobr { display: grid; place-items: center; height: 104px; border-radius: var(--radius-m); background: radial-gradient(80% 75% at 50% 45%, #ffffff 0%, #f1f6fc 60%, #e6eef8 100%); }
  .g1-dobr img { max-width: 84%; max-height: 84px; object-fit: contain; }
  @media (max-width: 760px) {
    .g1-hlava { grid-template-columns: minmax(0, 1fr); row-gap: 12px; }
    .nv-lead { font-size: 15px; }
    .g1-filtre { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .g1-f { height: auto; min-height: 52px; padding-block: 8px; line-height: 1.3; white-space: normal; }
    .g1-f > span:last-child { margin-left: auto; }
    .g1-fc { width: 32px; height: 32px; }
    .g1-mriezka { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .g1-k { padding: 6px 6px 14px; border-radius: var(--radius-l); }
    .g1-tag { margin: 10px 8px 0; font-size: 12px; min-height: 2.7em; line-height: 1.35; }
    .g1-k strong { margin: 2px 8px 0; font-size: 16px; }
    .g1-sub { margin: 2px 8px 0; font-size: 13px; }
    .g1-data { margin: auto 8px 0; padding-top: 8px; font-size: 13px; }
    .g1-diely { margin-top: 36px; }
    .g1-dh { flex-direction: column; gap: 4px; }
    .g1-polica { display: none; }
  }`;
  return { html, css };
}

// ---------------- G2: bento podľa použitia (prezentácia, rôzne veľké dlaždice) ----------------
function navrhG2() {
  const uz = (id) => kat(id);
  const rr = (id) => radyKat(uz(id));
  const linky = (id) => `<ul class="g2-rady">${rr(id).map((r) => `<li><a href="#"><strong>${rr(id).length > 1 ? kratko(r) : model(r)}</strong><em>${dimenzii(fakty(r).n)}</em>${I.chevron}</a></li>`).join('')}</ul>`;
  const hlava = (id, r) => `<div class="g2-th">${celoImg(rad(CELO_KAT[id]))}<div><h3>${uz(id).kratky_nazov}</h3><em class="g2-th-s">${radov(rr(id).length)}${tlakRadu(r) ? ` · ${tlakRadu(r)}` : ''}</em></div></div>`;
  const dlazdica = (id, cls, obrazRad) => `<article class="g2-t ${cls}">
      <div class="g2-text">${hlava(id, obrazRad)}<p>${POPIS1(uz(id))}</p></div>
      <div class="g2-obr"><img src="${render(obrazRad)}" alt=""></div>
      <div class="g2-odk">${linky(id)}</div>
    </article>`;
  const dielT = (id, imgs) => `<a class="g2-t g2-diel" href="#">
      <div class="g2-dt"><h3>${kat(id).kratky_nazov ?? kat(id).nazov}</h3><em class="g2-pocet">${vyrobkov(pocetProd(id))}</em><p>${POPIS1(kat(id))}</p></div>
      <div class="g2-dobr">${imgs.map((i) => `<span><img src="${A(`produkty/${i}.webp`)}" alt=""></span>`).join('')}</div>
    </a>`;
  const html = `<div class="wrap nvg2">
    <div class="g2-hlava"><h2 class="nv-h2">${H2}</h2><p class="nv-lead">${LEAD}</p></div>
    <div class="g2-bento">
      ${dlazdica('vykurovanie', 'g2-vel', rad('microflex-duo-6-bar'))}
      ${dlazdica('sanita', 'g2-str', rad('microflex-duo-10-bar'))}
      ${dlazdica('vykurovanie-a-sanita', 'g2-mal', rad('microflex-quadro'))}
      ${dlazdica('studena-a-chladena-voda', 'g2-mal g2-cool', rad('microflex-cool-s-vyhrievacim-kablom'))}
      ${dlazdica('tepelne-cerpadla', 'g2-mal', rad('microflex-hp'))}
      ${dielT('spojky', SPOJKY_IMG)}
      ${dielT('prislusenstvo', PRISL_IMG)}
      <a class="g2-t g2-sprievodca" href="#"><span class="g2-sp-h">Neviete, ktoré potrubie?</span><span class="g2-sp-p">Sprievodca výberom vás prevedie od média po obj. číslo.</span><span class="g2-sp-cta">Sprievodca výberom ${I.sipka}</span></a>
    </div>
  </div>`;
  const css = `${SPOL_CSS}
  .g2-hlava { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); column-gap: 48px; align-items: end; }
  .g2-bento { margin-top: 32px; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px; }
  .g2-t { position: relative; box-sizing: border-box; display: grid; border-radius: var(--radius-xl); overflow: hidden; color: var(--color-ink); text-decoration: none;
    background: radial-gradient(90% 90% at 78% 62%, #ffffff 0%, rgb(255 255 255 / 0.95) 40%, #f2f6fc 100%); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-3); }
  .g2-text { position: relative; z-index: 2; display: flex; flex-direction: column; padding: 24px 24px 22px; }
  .g2-th { display: grid; grid-template-columns: 44px minmax(0, 1fr); align-items: center; gap: 12px; }
  .g2-th .celo { width: 44px; height: 44px; }
  .g2-th h3 { margin: 0; font-family: var(--font-display); font-stretch: 112.5%; font-weight: 650; font-size: 22px; line-height: 1.2; letter-spacing: -0.01em; }
  .g2-th-s { display: block; margin-top: 2px; font-style: normal; font-size: 13px; color: var(--color-ink-soft); }
  .g2-text > p { margin: 14px 0 0; font-size: 15px; line-height: 1.5; color: var(--color-ink-soft); max-width: 30em; }
  .g2-odk { position: relative; z-index: 2; padding: 0 24px 22px; }
  .g2-rady { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .g2-rady a { display: grid; grid-template-columns: minmax(0, 1fr) auto 16px; align-items: center; gap: 10px; min-height: 44px; padding: 0 10px 0 14px; border-radius: var(--radius-m);
    background: rgb(255 255 255 / 0.85); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.1); color: var(--color-ink); text-decoration: none; }
  .g2-rady strong { font-size: 15px; font-weight: 600; }
  .g2-rady em { font-style: normal; font-size: 13px; color: var(--color-ink-soft); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .g2-rady svg { color: var(--color-blue-700); }
  .g2-obr { position: relative; z-index: 1; display: grid; place-items: center; }
  .g2-obr img { display: block; width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: contain; }
  /* veľká: text a rady vľavo, výrobok vpravo cez celú výšku */
  .g2-vel { grid-column: span 7; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); grid-template-rows: auto 1fr; }
  .g2-vel .g2-text { grid-column: 1; grid-row: 1; }
  .g2-vel .g2-odk { grid-column: 1; grid-row: 2; align-self: end; }
  .g2-vel .g2-obr { grid-column: 2; grid-row: 1 / -1; padding: 16px 12px 16px 0; }
  /* stredná: hlavička cez celú šírku, pod ňou rady vľavo a výrobok vpravo */
  .g2-str { grid-column: span 5; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-rows: auto 1fr; }
  .g2-str .g2-text { grid-column: 1 / -1; grid-row: 1; }
  .g2-str .g2-odk { grid-column: 1; grid-row: 2; align-self: end; padding-right: 0; }
  .g2-str .g2-obr { grid-column: 2; grid-row: 2; padding: 0 12px 8px 4px; }
  /* malá: hlavička, výrobok, rady pod sebou */
  .g2-mal { grid-column: span 4; grid-template-rows: auto 1fr auto; }
  .g2-mal .g2-text { padding-bottom: 0; }
  .g2-mal .g2-obr { padding: 4px 32px; }
  .g2-mal .g2-obr img { max-width: 280px; }
  .g2-diel { grid-column: span 5; grid-template-columns: minmax(0, 1fr); padding: 24px; gap: 16px; background: linear-gradient(180deg, #ffffff 0%, #f4f8fd 100%); }
  .g2-dt h3 { display: inline; margin: 0; font-family: var(--font-display); font-stretch: 112.5%; font-weight: 650; font-size: 22px; }
  .g2-pocet { margin-left: 10px; font-style: normal; font-size: 13px; color: var(--color-ink-soft); }
  .g2-dt p { margin: 6px 0 0; font-size: 15px; line-height: 1.5; color: var(--color-ink-soft); }
  .g2-dobr { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .g2-dobr span { display: grid; place-items: center; height: 96px; border-radius: var(--radius-l); background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06); }
  .g2-dobr img { max-width: 80%; max-height: 76px; object-fit: contain; }
  .g2-sprievodca { grid-column: span 2; display: flex; flex-direction: column; gap: 10px; padding: 24px 20px; background: var(--color-blue-900); color: #fff; box-shadow: var(--elev-3); }
  .g2-sp-h { font-family: var(--font-display); font-stretch: 112.5%; font-size: 20px; font-weight: 650; line-height: 1.2; }
  .g2-sp-p { font-size: 14px; line-height: 1.45; color: var(--color-on-dark-muted); }
  .g2-sp-cta { margin-top: auto; display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: #fff; }
  @media (max-width: 760px) {
    .g2-hlava { grid-template-columns: minmax(0, 1fr); row-gap: 12px; }
    .nv-lead { font-size: 15px; }
    .g2-bento { margin-top: 24px; grid-template-columns: minmax(0, 1fr); gap: 12px; }
    .g2-t, .g2-vel, .g2-str, .g2-mal, .g2-diel, .g2-sprievodca { grid-column: 1; min-height: 0; }
    .g2-vel, .g2-str, .g2-mal { grid-template-columns: minmax(0, 1fr) 40%; grid-template-rows: auto auto; }
    .g2-vel .g2-text, .g2-str .g2-text, .g2-mal .g2-text { grid-column: 1; grid-row: 1; padding: 16px 8px 8px 16px; }
    .g2-vel .g2-obr, .g2-str .g2-obr, .g2-mal .g2-obr { grid-column: 2; grid-row: 1; align-self: center; padding: 8px 8px 0 0; }
    .g2-vel .g2-odk, .g2-str .g2-odk, .g2-mal .g2-odk { grid-column: 1 / -1; grid-row: 2; padding: 4px 16px 16px; }
    .g2-text > p { display: none; }
    .g2-th { grid-template-columns: 36px minmax(0, 1fr); gap: 10px; }
    .g2-th .celo { width: 36px; height: 36px; }
    .g2-th h3 { font-size: 18px; }
    .g2-diel { padding: 16px; }
    .g2-dobr span { height: 72px; }
    .g2-dobr img { max-height: 56px; }
    .g2-sprievodca { padding: 20px; }
  }`;
  return { html, css };
}

// ---------------- G3: prehľad v stĺpcoch (celý sortiment na jednu obrazovku) ----------------
function navrhG3() {
  const blok = (id) => { const k = kat(id); const rr = radyKat(k); return `<section class="g3-blok">
      <div class="g3-bh">${celoImg(rad(CELO_KAT[id]))}<div><h3>${k.kratky_nazov}</h3><span>${radov(rr.length)}</span></div></div>
      <p>${POPIS1(k)}</p>
      <ul>${rr.map((r) => { const f = fakty(r); return `<li><a href="#"><span class="g3-ro"><img src="${render(r)}" alt=""></span><span class="g3-rt"><strong>${kratko(r)}</strong><small>${f.tlak} · ${dimenzii(f.n)}</small></span>${I.chevron}</a></li>`; }).join('')}</ul>
    </section>`; };
  const html = `<div class="wrap nvg3">
    <div class="g3-hlava"><h2 class="nv-h2">${H2}</h2><p class="nv-lead">${LEAD}</p></div>
    <div class="g3-stlpce">
      <div class="g3-st">${blok('vykurovanie')}</div>
      <div class="g3-st">${blok('sanita')}</div>
      <div class="g3-st">${blok('vykurovanie-a-sanita')}${blok('tepelne-cerpadla')}</div>
      <div class="g3-st">${blok('studena-a-chladena-voda')}</div>
    </div>
    <div class="g3-diely">
      <div class="g3-dh"><h3>Spojky a príslušenstvo</h3><span>${vyrobkov(pocetProd('spojky') + pocetProd('prislusenstvo'))} na pripojenie, ukončenie a prestup stenou</span><a class="nv-link" href="#">Všetky diely ${I.sipka}</a></div>
      <ul class="g3-polica">${diely.map((d) => `<li><a href="#"><span class="g3-dobr"><img src="${d.img}" alt=""></span><span>${d.nazov}</span></a></li>`).join('')}</ul>
      ${dielySkupinyMobil('dm')}
    </div>
  </div>`;
  const css = `${SPOL_CSS}${DIELY_MOBIL_CSS}
  .g3-hlava { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); column-gap: 48px; align-items: end; }
  .g3-stlpce { margin-top: 32px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
  .g3-st { display: flex; flex-direction: column; gap: 16px; }
  .g3-blok { flex: 1; display: flex; flex-direction: column; gap: 12px; padding: 18px 14px 14px; border-radius: var(--radius-xl); background: rgb(255 255 255 / 0.9);
    box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-3); }
  .g3-bh { display: grid; grid-template-columns: 48px minmax(0, 1fr); align-items: center; gap: 12px; padding: 0 4px; }
  .g3-bh .celo { width: 48px; height: 48px; }
  .g3-bh h3 { margin: 0; font-family: var(--font-display); font-stretch: 112.5%; font-weight: 650; font-size: 19px; line-height: 1.2; }
  .g3-bh span { display: block; margin-top: 2px; font-size: 13px; color: var(--color-ink-soft); }
  .g3-blok > p { margin: 0; padding: 0 4px; font-size: 14px; line-height: 1.45; color: var(--color-ink-soft); }
  .g3-blok ul { list-style: none; margin: 4px 0 0; padding: 0; display: grid; gap: 6px; }
  .g3-blok li a { display: grid; grid-template-columns: 96px minmax(0, 1fr) 16px; align-items: center; gap: 10px; padding: 4px 10px 4px 4px; border-radius: var(--radius-l);
    background: var(--color-blue-50); color: var(--color-ink); text-decoration: none; }
  .g3-blok li svg { color: var(--color-blue-700); }
  .g3-ro { display: grid; place-items: center; height: 72px; border-radius: var(--radius-m); background: radial-gradient(80% 80% at 50% 45%, #ffffff 0%, #f6f9fd 70%, #eaf1f9 100%); }
  .g3-ro img { width: 92px; height: 69px; object-fit: contain; }
  .g3-rt strong { display: block; font-size: 15px; font-weight: 600; line-height: 1.25; }
  .g3-rt small { display: block; margin-top: 2px; font-size: 12px; color: var(--color-ink-soft); font-variant-numeric: tabular-nums; }
  .g3-diely { margin-top: 40px; }
  .g3-dh { display: flex; align-items: baseline; gap: 16px; margin-bottom: 14px; }
  .g3-dh h3 { margin: 0; font-family: var(--font-display); font-stretch: 112.5%; font-size: 22px; font-weight: 600; }
  .g3-dh span { font-size: 15px; color: var(--color-ink-soft); }
  .g3-dh a { margin-left: auto; }
  .g3-polica { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 10px; }
  .g3-polica a { box-sizing: border-box; height: 100%; display: grid; grid-template-columns: 56px minmax(0, 1fr); align-items: center; gap: 8px; padding: 6px 10px 6px 6px; border-radius: var(--radius-l);
    background: rgb(255 255 255 / 0.9); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.07), var(--elev-1); color: var(--color-ink); font-size: 13px; font-weight: 600; line-height: 1.3; text-decoration: none; }
  .g3-dobr { display: grid; place-items: center; width: 56px; height: 56px; border-radius: var(--radius-m); background: var(--color-blue-50); }
  .g3-dobr img { max-width: 48px; max-height: 44px; object-fit: contain; }
  @media (max-width: 760px) {
    .g3-hlava { grid-template-columns: minmax(0, 1fr); row-gap: 12px; }
    .nv-lead { font-size: 15px; }
    .g3-stlpce { margin-top: 24px; grid-template-columns: minmax(0, 1fr); gap: 12px; }
    .g3-st { gap: 12px; }
    .g3-blok { padding: 14px 10px 10px; }
    .g3-dh { flex-wrap: wrap; gap: 4px 16px; }
    .g3-dh span { display: none; }
    .g3-polica { display: none; }
  }`;
  return { html, css };
}

// ---------------- snímky ----------------
const NAVRHY_G = { G1: navrhG1, G2: navrhG2, G3: navrhG3 };
const MENA_G = { G1: 'G1-mriezka-s-filtrom', G2: 'G2-bento-podla-pouzitia', G3: 'G3-prehlad-v-stlpcoch' };
const ktore = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(NAVRHY_G);
const ZARIADENIA = [
  { meno: 'pc', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 },
  { meno: 'mobil', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
];
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
      const { html, css } = NAVRHY_G[n]();
      await page.evaluate(({ html, css }) => {
        const s = document.querySelector('#vyber');
        s.querySelector(':scope > .wrap').outerHTML = html;
        const st = document.createElement('style'); st.textContent = css; document.head.append(st);
      }, { html: sadzbaHtml(html), css });
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
      const subor = `${CIEL_G}/${MENA_G[n]}-${z.meno}.png`;
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
