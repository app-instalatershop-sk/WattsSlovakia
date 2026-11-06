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
// TRI VERZIE SMERU C (Juraj 5. 11. 2026: „urob 3 verzie pre C, profesionálny moderný design“)
// Spoločné: sprievodca dvoma otázkami → jeden rad, mierka všetkých dimenzií, diely z dát (rady.suvisiace),
// žltá len na hlavnom tlačidle, bez nadnadpisov (DESIGN.md kap. 5), bez vlasových čiar, len viditeľné tlačidlá.
// =====================================================================================
const CIEL_C = `${KOREN}/snimky-stranok/navrh-katalog/verzie-c`;
mkdirSync(CIEL_C, { recursive: true });
const produkty = json('produkty.json');
const NB = ' ';
function sadzba(t) {
  let s = t;
  for (let i = 0; i < 2; i++) s = s.replace(/(^|[\s(„])([aAiIkKoOsSuUvVzZ]) (?=\S)/g, `$1$2${NB}`);
  return s.replace(/(\d) (mm|m|bar|°C|kg|t)(?![\p{L}])/gu, `$1${NB}$2`).replace(/Ø /g, `Ø${NB}`).replace(/ × /g, `${NB}×${NB}`)
    .replace(/DN (\d)/g, `DN${NB}$1`);
}
// PE-X sa na spojovníku nedelí (inak „PE-“ / „X“ na dvoch riadkoch).
const sadzbaHtml = (h) => h.replace(/>([^<]+)</g, (m, t) => `>${sadzba(t).replace(/PE-X(a?)/g, '<span style="white-space:nowrap">PE-X$1</span>')}<`);
I.check = svg('<path d="M20 6 9 17l-5-5"/>', 14);

// Vybraný stav pre snímku: Vykurovanie → DUO (najčastejšia voľba podľa popisu radu).
const KAT = potrubia[0];
const RADY_KAT = radyKat(KAT);
const VYB = rad('microflex-duo-6-bar');
const F = fakty(VYB);
const MI = mierka[VYB.id];
const POPIS_VYH = { 'microflex-uno-6-bar': 'Jedna rúra v plášti', 'microflex-duo-6-bar': 'Prívod aj spiatočka', 'microflex-uno-primo-6-bar': 'Jedna rúra, užší plášť', 'microflex-primo-duo-6-bar': 'Dve rúry, užší plášť' };
const NAZOV_SKUPINY = Object.fromEntries(rady.filter((r) => ['spojky', 'prislusenstvo'].includes(r.kategoria)).map((r) => [r.id, r.nazov]));
// Diely k radu z dát (rady.suvisiace) – štyri typické: spojka, odbočka, ukončenie plášťa, prestup stenou.
const KTOMU = ['pe-x-spojka-kurenie-cool-6-16bar', '3-x-ohrev-spojky-pe-x-t', 'teplom-zmrstitelne-hlavice-pre-rurku-duo', 'tesnenie-na-prienik-na-stenu-micro-press']
  .map((id) => { const p = produkty.find((x) => x.id === id); return { nazov: p.nazov.split(',')[0], skupina: NAZOV_SKUPINY[p.skupina] ?? '', img: A(`produkty/${id}.webp`) }; });
const POCET_DIELOV = VYB.suvisiace.length;

const faktyVyb = [
  ['Dimenzie', `${F.n}`, ''],
  ['Plášť', `Ø ${az(...F.plast)}`, ''],
  ['Nosné rúry', `2 × Ø ${az(...F.rura)}`, `DN ${az(...F.dn, '').trim()}`],
  ['Polomer ohybu', `od ${cs(F.ohyb.toFixed(2))} m`, ''],
];
const mierkaStitky = (kratke = false) => MI.systemy.map((s) => {
  const v = F.vv.find((x) => x.obj_cislo === s.obj);
  return v ? `<span class="mi-s" style="left:${s.bod[0]}%"><b>${v.plast_mm}</b>${kratke ? '' : `<i>2 × ${v.rura.d}</i>`}</span>` : '';
}).join('');
const mierkaHtml = (cls, kratke) => `<div class="${cls}">
  <div class="mi-hlava"><strong>Všetkých ${F.n} dimenzií v skutočnom pomere</strong><span>plášť / nosné rúry, mm</span></div>
  <div class="mi-obr" style="aspect-ratio:${MI.pomer}"><img src="${A(`3d/mierka/${VYB.id}.webp`)}" alt=""></div>
  <div class="mi-stitky">${mierkaStitky(kratke)}</div>
</div>`;
const MIERKA_CSS = `
  .mi-hlava { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; }
  .mi-hlava strong { font-size: 14px; font-weight: 600; color: var(--color-ink); }
  .mi-hlava span { font-size: 13px; color: var(--color-ink-soft); white-space: nowrap; }
  .mi-obr { margin-top: 4px; }
  .mi-obr img { display: block; width: 100%; height: 100%; object-fit: contain; }
  .mi-stitky { position: relative; height: 34px; margin-top: 2px; }
  .mi-s { position: absolute; top: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; line-height: 1.2; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .mi-s b { font-size: 13px; font-weight: 600; color: var(--color-ink); }
  .mi-s i { font-style: normal; font-size: 11px; color: var(--color-ink-soft); }
  @media (max-width: 760px) { .mi-hlava span { display: none; } .mi-s b { font-size: 11px; } .mi-s i { display: none; } .mi-stitky { height: 18px; } }`;
const celoImg = (r, cls = 'celo') => `<span class="${cls}"><img src="${celo(r)}" alt=""></span>`;
const CELO_CSS = `.celo { flex: none; display: block; border-radius: 50%; overflow: hidden; background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.1); }
  .celo img { display: block; width: 100%; height: 100%; object-fit: cover; }`;
const BTN = `<a class="btn btn-yellow btn-lg nv-cta" href="#">Vybrať dimenziu ${I.sipka}</a>`;

// ---------------- C1: konfigurátor (výrobok na pódiu vľavo, voľby so zaškrtnutím vpravo) ----------------
function navrhC1() {
  const pouzitia = potrubia.map((k, i) => `<button class="c1-o${i === 0 ? ' je' : ''}" type="button">${celoImg(rad(CELO_KAT[k.id]))}<span class="c1-t"><strong>${k.kratky_nazov}</strong><small>${KEDY[k.id]}</small></span><span class="c1-ind">${I.check}</span></button>`).join('');
  const vyh = RADY_KAT.map((r) => `<button class="c1-o${r.id === VYB.id ? ' je' : ''}" type="button">${celoImg(r)}<span class="c1-t"><strong>${kratko(r)}</strong><small>${POPIS_VYH[r.id]}</small></span><span class="c1-ind">${I.check}</span></button>`).join('');
  const html = `<div class="wrap nvc1">
    <div class="c1-grid">
      <div class="c1-stage">
        <img class="c1-render" src="${A(`3d/hlavy/${VYB.id}.webp`)}" alt="">
        ${mierkaHtml('c1-mierka')}
      </div>
      <div class="c1-panel">
        <h2>${H2}</h2>
        <div class="c1-q"><p class="c1-ot">Na čo potrubie potrebujete?</p><div class="c1-list">${pouzitia}</div></div>
        <div class="c1-q"><p class="c1-ot">Koľko rúr v jednom plášti?</p><div class="c1-list c1-dva">${vyh}</div></div>
        <div class="c1-suhrn">
          <h3>${VYB.nazov}</h3>
          <p>${VYB.kratky_popis.split('.')[0]}.</p>
          <dl class="c1-fakty">${faktyVyb.map(([l, v, m]) => `<div><dt>${l}</dt><dd>${v}${m ? `<small>${m}</small>` : ''}</dd></div>`).join('')}</dl>
          ${BTN}
          <div class="c1-dalsie"><a href="#">Všetko o rade DUO</a><a href="#">Poradíme s výberom</a></div>
        </div>
      </div>
    </div>
    <div class="c1-ktomu">
      <div class="c1-ktomu-h"><h3>K DUO budete potrebovať</h3><a href="#">Všetkých ${POCET_DIELOV} dielov k DUO ${I.sipka}</a></div>
      <ul>${KTOMU.map((d) => `<li><a href="#"><span class="c1-kobr"><img src="${d.img}" alt=""></span><span class="c1-kt"><strong>${d.nazov}</strong><small>${d.skupina}</small></span>${I.chevron}</a></li>`).join('')}</ul>
    </div>
  </div>`;
  const css = `${CELO_CSS}${MIERKA_CSS}
  .c1-grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); column-gap: 48px; align-items: stretch; }
  .c1-stage { grid-column: 1; grid-row: 1; position: relative; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; padding: 24px 28px; border-radius: var(--radius-xl);
    background: radial-gradient(70% 48% at 50% 40%, #ffffff 0%, rgb(255 255 255 / 0.92) 35%, rgb(241 246 252 / 0.95) 70%, rgb(228 237 248) 100%);
    box-shadow: inset 0 1px 0 #fff, inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-3); overflow: hidden; }
  .c1-render { display: block; width: 100%; margin: auto; height: auto; aspect-ratio: 1800 / 1574; object-fit: contain; }
  .c1-mierka { padding: 16px 20px 10px; border-radius: var(--radius-l); background: rgb(255 255 255 / 0.72); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06); }
  .c1-panel { grid-column: 2; grid-row: 1; }
  .c1-panel h2 { font-size: clamp(28px, 2.2vw + 14px, 42px); margin: 0 0 28px; text-wrap: balance; }
  .c1-q + .c1-q { margin-top: 28px; }
  .c1-ot { margin: 0 0 12px; font-family: var(--font-display); font-stretch: 112.5%; font-size: 19px; font-weight: 600; line-height: 1.3; color: var(--color-ink); }
  .c1-list { display: grid; gap: 8px; }
  .c1-dva { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .c1-o { all: unset; box-sizing: border-box; cursor: pointer; display: grid; grid-template-columns: 44px minmax(0, 1fr) 22px; align-items: center; gap: 14px; min-height: 64px; padding: 10px 14px 10px 10px;
    border-radius: var(--radius-l); background: rgb(255 255 255 / 0.94); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.12); color: var(--color-ink); }
  .c1-o .celo { width: 44px; height: 44px; }
  .c1-dva .c1-o { grid-template-columns: 40px minmax(0, 1fr) 22px; gap: 12px; }
  .c1-dva .c1-o .celo { width: 40px; height: 40px; }
  .c1-t strong { display: block; font-size: 16px; font-weight: 600; line-height: 1.3; }
  .c1-t small { display: block; margin-top: 2px; font-size: 13px; line-height: 1.35; color: var(--color-ink-soft); }
  .c1-ind { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; box-shadow: inset 0 0 0 2px var(--color-grey-300); color: #fff; }
  .c1-ind svg { opacity: 0; }
  .c1-o.je { background: #fff; box-shadow: inset 0 0 0 2px var(--color-blue-700), var(--elev-1); }
  .c1-o.je .c1-ind { background: var(--color-blue-700); box-shadow: none; }
  .c1-o.je .c1-ind svg { opacity: 1; }
  .c1-suhrn { margin-top: 28px; padding: 24px; border-radius: var(--radius-xl); background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-3); }
  .c1-suhrn h3 { margin: 0; font-family: var(--font-display); font-stretch: 112.5%; font-weight: 650; font-size: 24px; line-height: 1.2; letter-spacing: -0.01em; text-wrap: balance; }
  .c1-suhrn > p { margin: 6px 0 0; font-size: 15px; line-height: 1.5; color: var(--color-ink-soft); }
  .c1-fakty { margin: 16px 0 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .c1-fakty div { padding: 10px 12px; border-radius: var(--radius-m); background: var(--color-blue-50); }
  .c1-fakty dt { font-size: 13px; color: var(--color-ink-soft); }
  .c1-fakty dd { margin: 2px 0 0; font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--color-ink); }
  .c1-fakty dd small { display: block; font-size: 13px; font-weight: 500; color: var(--color-ink-soft); }
  .nv-cta { margin-top: 20px; width: 100%; justify-content: center; }
  .nv-cta svg { width: 20px; height: 20px; }
  .c1-dalsie { margin-top: 14px; display: flex; justify-content: space-between; gap: 16px; font-size: 15px; }
  .c1-dalsie a { color: var(--color-blue-700); font-weight: 600; text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1px; }
  .c1-ktomu { margin-top: 48px; }
  .c1-ktomu-h { display: flex; justify-content: space-between; align-items: baseline; gap: 24px; margin-bottom: 16px; }
  .c1-ktomu-h h3 { margin: 0; font-family: var(--font-display); font-stretch: 112.5%; font-size: 22px; font-weight: 600; }
  .c1-ktomu-h a { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: var(--color-blue-700); text-decoration: none; white-space: nowrap; }
  .c1-ktomu ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
  .c1-ktomu li a { box-sizing: border-box; height: 100%; display: grid; grid-template-columns: 72px minmax(0, 1fr) 16px; align-items: center; gap: 14px; padding: 12px 14px 12px 12px; border-radius: var(--radius-l);
    background: rgb(255 255 255 / 0.92); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.08), var(--elev-1); color: var(--color-ink); text-decoration: none; }
  .c1-ktomu li svg { color: var(--color-blue-700); }
  .c1-kobr { width: 72px; height: 72px; border-radius: var(--radius-m); background: var(--color-blue-50); display: grid; place-items: center; }
  .c1-kobr img { max-width: 60px; max-height: 56px; object-fit: contain; }
  .c1-kt strong { display: block; font-size: 14px; font-weight: 600; line-height: 1.3; }
  .c1-kt small { display: block; margin-top: 2px; font-size: 13px; line-height: 1.3; color: var(--color-ink-soft); }
  @media (max-width: 760px) {
    .c1-grid { grid-template-columns: minmax(0, 1fr); row-gap: 24px; }
    .c1-panel { display: contents; }
    .c1-panel h2 { order: 1; margin-bottom: 0; }
    .c1-q { order: 2; }
    .c1-q + .c1-q { order: 3; margin-top: 0; }
    .c1-stage { order: 4; grid-row: auto; padding: 16px 12px 12px; }
    .c1-suhrn { order: 5; margin-top: -8px; padding: 20px 16px; }
    .c1-dva .c1-o { grid-template-columns: 36px minmax(0, 1fr); padding-right: 10px; }
    .c1-dva .c1-ind { display: none; }
    .c1-dva .c1-o .celo { width: 36px; height: 36px; }
    .c1-ktomu { margin-top: 32px; }
    .c1-ktomu-h { flex-direction: column; gap: 6px; }
    .c1-ktomu ul { grid-template-columns: minmax(0, 1fr); gap: 8px; }
    .c1-ktomu li a { grid-template-columns: 56px minmax(0, 1fr) 16px; padding: 8px 12px 8px 8px; }
    .c1-kobr { width: 56px; height: 56px; }
    .c1-kobr img { max-width: 48px; max-height: 44px; }
  }`;
  return { html, css };
}

// ---------------- C2: dlaždice a produktový list (zhora nadol: voľba → presný výsledok) ----------------
function navrhC2() {
  const pouzitia = potrubia.map((k, i) => `<button class="c2-u${i === 0 ? ' je' : ''}" type="button">${celoImg(rad(CELO_KAT[k.id]))}<strong>${k.kratky_nazov}</strong><small>${radov(radyKat(k).length)}: ${zoznam(radyKat(k).map(kratko))}</small>${i === 0 ? `<span class="c2-ok">${I.check}</span>` : ''}</button>`).join('');
  const seg = (moznosti, je) => `<div class="c2-seg" role="radiogroup">${moznosti.map(([t, r], i) => `<button type="button" class="${i === je ? 'je' : ''}">${r ? celoImg(r, 'celo c2-sc') : ''}${t}</button>`).join('')}</div>`;
  const html = `<div class="wrap nvc2">
    <div class="c2-hlava">
      <h2>${H2}</h2>
      <p>Odpovedzte na dve otázky. Ukážeme vám presný rad, všetky jeho dimenzie a diely, ktoré k nemu budete potrebovať.</p>
    </div>
    <p class="c2-ot">Na čo potrubie potrebujete?</p>
    <div class="c2-pouzitia">${pouzitia}</div>
    <div class="c2-atr">
      <div class="c2-atr-p"><span>Počet rúr v plášti</span>${seg([['Jedna rúra', rad('microflex-uno-6-bar')], ['Dve rúry', rad('microflex-duo-6-bar')]], 1)}</div>
      <div class="c2-atr-p"><span>Plášť</span>${seg([['Štandardný', null], ['Užší, PRIMO', null]], 0)}</div>
    </div>
    <article class="c2-list">
      <div class="c2-hore">
        <div class="c2-scena"><img src="${render(VYB)}" alt=""></div>
        <div class="c2-text">
          <h3>${VYB.nazov}</h3>
          <p>${VYB.kratky_popis}</p>
          <dl class="c2-fakty">${faktyVyb.map(([l, v, m]) => `<div><dt>${l}</dt><dd>${v}${m ? `<small>${m}</small>` : ''}</dd></div>`).join('')}</dl>
          <div class="c2-akcie">${BTN}<a class="c2-link" href="#">Všetko o rade DUO</a></div>
        </div>
      </div>
      ${mierkaHtml('c2-mierka')}
      <div class="c2-ktomu">
        <div class="c2-ktomu-h"><h4>K DUO budete potrebovať</h4><a href="#">Všetkých ${POCET_DIELOV} dielov ${I.sipka}</a></div>
        <ul>${KTOMU.map((d) => `<li><a href="#"><span class="c2-kobr"><img src="${d.img}" alt=""></span><span><strong>${d.nazov}</strong><small>${d.skupina}</small></span></a></li>`).join('')}</ul>
      </div>
    </article>
  </div>`;
  const css = `${CELO_CSS}${MIERKA_CSS}
  .c2-hlava { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); column-gap: 48px; align-items: end; }
  .c2-hlava h2 { margin: 0; font-size: clamp(28px, 2.2vw + 14px, 42px); text-wrap: balance; }
  .c2-hlava p { margin: 0 0 4px; font-size: 17px; line-height: 1.5; color: var(--color-ink-soft); max-width: 30em; }
  .c2-ot { margin: 40px 0 12px; font-family: var(--font-display); font-stretch: 112.5%; font-size: 19px; font-weight: 600; color: var(--color-ink); }
  .c2-pouzitia { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
  .c2-u { all: unset; box-sizing: border-box; cursor: pointer; position: relative; display: flex; flex-direction: column; gap: 4px; padding: 16px 16px 18px; min-height: 172px; border-radius: var(--radius-l);
    background: rgb(255 255 255 / 0.94); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.1), var(--elev-1); color: var(--color-ink); }
  .c2-u .celo { width: 64px; height: 64px; margin-bottom: 12px; }
  .c2-u strong { font-family: var(--font-display); font-stretch: 112.5%; font-size: 17px; font-weight: 600; line-height: 1.25; }
  .c2-u small { font-size: 13px; line-height: 1.4; color: var(--color-ink-soft); }
  .c2-u.je { background: var(--color-blue-900); color: #fff; box-shadow: var(--elev-2); }
  .c2-u.je small { color: var(--color-on-dark-muted); }
  .c2-u.je .celo { box-shadow: 0 0 0 3px rgb(255 255 255 / 0.9); }
  .c2-ok { position: absolute; top: 14px; right: 14px; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: #fff; color: var(--color-blue-700); }
  .c2-atr { margin-top: 20px; display: flex; flex-wrap: wrap; align-items: center; gap: 16px 40px; }
  .c2-atr-p { display: flex; align-items: center; gap: 14px; }
  .c2-atr-p > span { font-size: 15px; font-weight: 600; color: var(--color-ink); }
  .c2-seg { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--radius-l); background: rgb(10 42 94 / 0.07); box-shadow: inset 0 1px 2px rgb(10 42 94 / 0.1); }
  .c2-seg button { all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 18px; border-radius: var(--radius-m); font-size: 15px; font-weight: 500; color: var(--color-ink-soft); }
  .c2-seg button:has(.c2-sc) { padding-left: 8px; }
  .c2-sc { width: 28px; height: 28px; }
  .c2-seg button.je { background: #fff; color: var(--color-ink); font-weight: 600; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-1); }
  .c2-list { margin-top: 28px; border-radius: var(--radius-xl); background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-3); overflow: hidden; }
  .c2-hore { display: grid; grid-template-columns: minmax(0, 6fr) minmax(0, 6fr); }
  .c2-scena { display: grid; place-items: center; padding: 24px 24px 8px; background: radial-gradient(70% 70% at 50% 46%, #ffffff 0%, #f3f7fc 52%, #e5edf8 100%); }
  .c2-scena img { display: block; width: 100%; max-width: 560px; height: auto; aspect-ratio: 4 / 3; object-fit: contain; }
  .c2-text { display: flex; flex-direction: column; padding: 36px 40px 32px; }
  .c2-text h3 { margin: 0; font-family: var(--font-display); font-stretch: 112.5%; font-weight: 650; font-size: 30px; line-height: 1.15; letter-spacing: -0.01em; text-wrap: balance; }
  .c2-text > p { margin: 10px 0 0; font-size: 16px; line-height: 1.55; color: var(--color-ink-soft); max-width: 34em; }
  .c2-fakty { margin: 24px 0 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .c2-fakty div { padding: 12px 16px; border-radius: var(--radius-m); background: var(--color-blue-50); }
  .c2-fakty dt { font-size: 13px; color: var(--color-ink-soft); }
  .c2-fakty dd { margin: 2px 0 0; font-family: var(--font-display); font-stretch: 112.5%; font-size: 19px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--color-ink); }
  .c2-fakty dd small { display: block; font-family: var(--font-text); font-stretch: 100%; font-size: 13px; font-weight: 500; color: var(--color-ink-soft); }
  .c2-akcie { margin-top: auto; padding-top: 28px; display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
  .c2-akcie .nv-cta { margin-top: 0; width: auto; }
  .nv-cta svg { width: 20px; height: 20px; }
  .c2-link { font-weight: 600; color: var(--color-blue-700); text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1px; }
  .c2-mierka { padding: 22px 40px 12px; background: linear-gradient(180deg, #f2f6fc 0%, #edf3fa 100%); box-shadow: inset 0 14px 18px -18px rgb(10 42 94 / 0.35); }
  .c2-mierka .mi-obr, .c2-mierka .mi-stitky { width: 78%; margin-inline: auto; }
  .c2-ktomu { padding: 18px 40px 26px; background: #e9f0f9; }
  .c2-ktomu-h { display: flex; justify-content: space-between; align-items: baseline; gap: 24px; margin-bottom: 12px; }
  .c2-ktomu-h h4 { margin: 0; font-family: var(--font-text); font-size: 16px; font-weight: 600; color: var(--color-ink); }
  .c2-ktomu-h a { display: inline-flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: var(--color-blue-700); text-decoration: none; }
  .c2-ktomu ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
  .c2-ktomu li a { box-sizing: border-box; height: 100%; display: grid; grid-template-columns: 56px minmax(0, 1fr); align-items: center; gap: 12px; padding: 8px 12px 8px 8px; border-radius: var(--radius-l);
    background: #fff; box-shadow: var(--elev-1); color: var(--color-ink); text-decoration: none; }
  .c2-kobr { width: 56px; height: 56px; display: grid; place-items: center; }
  .c2-kobr img { max-width: 52px; max-height: 48px; object-fit: contain; }
  .c2-ktomu strong { display: block; font-size: 14px; font-weight: 600; line-height: 1.3; }
  .c2-ktomu small { display: block; margin-top: 2px; font-size: 12px; line-height: 1.3; color: var(--color-ink-soft); }
  @media (max-width: 760px) {
    .c2-hlava { grid-template-columns: minmax(0, 1fr); row-gap: 12px; }
    .c2-hlava p { font-size: 15px; }
    .c2-ot { margin-top: 28px; }
    .c2-pouzitia { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .c2-u { min-height: 0; padding: 12px; }
    .c2-u:last-child { grid-column: 1 / -1; }
    .c2-u .celo { width: 44px; height: 44px; margin-bottom: 8px; }
    .c2-u strong { font-size: 15px; }
    .c2-u small { display: none; }
    .c2-ok { top: 10px; right: 10px; width: 22px; height: 22px; }
    .c2-atr { flex-direction: column; align-items: stretch; gap: 12px; }
    .c2-atr-p { flex-direction: column; align-items: stretch; gap: 8px; }
    .c2-seg { display: grid; grid-template-columns: 1fr 1fr; }
    .c2-seg button { justify-content: center; padding: 0 8px; }
    .c2-hore { grid-template-columns: minmax(0, 1fr); }
    .c2-text { padding: 20px 16px 20px; }
    .c2-text h3 { font-size: 22px; }
    .c2-text > p { font-size: 15px; }
    .c2-fakty div { padding: 10px 12px; }
    .c2-fakty dd { font-family: var(--font-text); font-stretch: 100%; font-size: 15px; }
    .c2-akcie .nv-cta { width: 100%; justify-content: center; }
    .c2-mierka { padding: 16px 12px 8px; }
    .c2-ktomu { padding: 16px 12px 16px; }
    .c2-ktomu-h { flex-direction: column; gap: 4px; }
    .c2-ktomu ul { grid-template-columns: minmax(0, 1fr); gap: 8px; }
  }`;
  return { html, css };
}

// ---------------- C3: výstavná sieň (veľký výrobok na pozadí, plávajúci sklenený panel s voľbami) ----------------
function navrhC3() {
  const pouzitia = potrubia.map((k, i) => `<button class="c3-o${i === 0 ? ' je' : ''}" type="button">${celoImg(rad(CELO_KAT[k.id]))}<span>${k.kratky_nazov}</span><span class="c3-pocet">${radyKat(k).length}</span></button>`).join('');
  const vyh = RADY_KAT.map((r) => `<button class="c3-v${r.id === VYB.id ? ' je' : ''}" type="button"><strong>${kratko(r)}</strong><small>${POPIS_VYH[r.id]}</small></button>`).join('');
  const html = `<div class="wrap nvc3">
    <div class="c3-grid">
      <div class="c3-stage">
        <h2>${H2}</h2>
        <div class="c3-render"><img src="${A(`3d/hlavy/${VYB.id}.webp`)}" alt=""></div>
        <div class="c3-meno">
          <h3>${VYB.nazov}</h3>
          <p>${VYB.kratky_popis}</p>
          <dl class="c3-fakty">${faktyVyb.map(([l, v, m]) => `<div><dd>${v}</dd><dt>${l}${m ? `, ${m}` : ''}</dt></div>`).join('')}</dl>
        </div>
      </div>
      <aside class="c3-panel">
        <p class="c3-ot">Na čo potrubie potrebujete?</p>
        <div class="c3-pouzitia">${pouzitia}</div>
        <p class="c3-ot">Koľko rúr v jednom plášti?</p>
        <div class="c3-vyh">${vyh}</div>
        <div class="c3-suhrn">${celoImg(VYB)}<span><strong>${model(VYB)}</strong><small>${dimenzii(F.n)}, plášť Ø ${az(...F.plast)}</small></span></div>
        ${BTN}
        <p class="c3-pomoc"><a href="#">Všetko o rade DUO</a> · <a href="#">Poradíme s výberom</a></p>
      </aside>
    </div>
    <div class="c3-spodok">
      ${mierkaHtml('c3-mierka')}
      <div class="c3-ktomu"><h4>K DUO budete potrebovať</h4>
        <ul>${KTOMU.map((d) => `<li><a href="#"><span class="c3-kobr"><img src="${d.img}" alt=""></span><span>${d.nazov}</span></a></li>`).join('')}</ul>
        <a class="c3-vsetky" href="#">Všetkých ${POCET_DIELOV} dielov k DUO ${I.sipka}</a>
      </div>
    </div>
  </div>`;
  const css = `${CELO_CSS}${MIERKA_CSS}
  .c3-grid { display: grid; grid-template-columns: minmax(0, 8fr) minmax(0, 4fr); column-gap: 40px; align-items: start; }
  .c3-stage { grid-column: 1; grid-row: 1; position: relative; }
  .c3-stage h2 { position: relative; z-index: 2; margin: 0; font-size: clamp(28px, 2.2vw + 14px, 42px); text-wrap: balance; }
  .c3-render { position: relative; z-index: 1; max-width: 700px; margin: -8px 0 0 calc(-0.5 * var(--bleed)); }
  .c3-render::before { content: ""; position: absolute; inset: -6% -4% 4% -10%; background: radial-gradient(46% 50% at 52% 50%, #ffffff 0%, rgb(255 255 255 / 0.7) 38%, rgb(255 255 255 / 0) 72%); }
  .c3-render img { position: relative; display: block; width: 100%; height: auto; aspect-ratio: 1800 / 1574; object-fit: contain; }
  .c3-meno { position: relative; z-index: 2; margin-top: -56px; max-width: 760px; }
  .c3-meno h3 { margin: 0; font-family: var(--font-display); font-stretch: 112.5%; font-weight: 650; font-size: 40px; line-height: 1.1; letter-spacing: -0.015em; text-wrap: balance; }
  .c3-meno > p { margin: 12px 0 0; font-size: 17px; line-height: 1.55; color: var(--color-ink-soft); max-width: 36em; }
  .c3-fakty { margin: 28px 0 0; display: flex; flex-wrap: wrap; gap: 20px 44px; }
  .c3-fakty dd { margin: 0; font-family: var(--font-display); font-stretch: 112.5%; font-size: 24px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--color-ink); white-space: nowrap; }
  .c3-fakty dt { margin-top: 2px; font-size: 13px; color: var(--color-ink-soft); }
  .c3-spodok { margin-top: 56px; display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); column-gap: 40px; align-items: start; }
  .c3-mierka { padding: 18px 20px 8px; border-radius: var(--radius-xl); background: rgb(255 255 255 / 0.6); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06); }
  .c3-ktomu h4 { margin: 0 0 12px; font-family: var(--font-text); font-size: 16px; font-weight: 600; }
  .c3-ktomu ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .c3-ktomu li a { box-sizing: border-box; height: 100%; display: grid; grid-template-columns: 56px minmax(0, 1fr); align-items: center; gap: 12px; padding: 8px 12px 8px 8px; border-radius: var(--radius-l); background: rgb(255 255 255 / 0.8);
    box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.07), var(--elev-1); color: var(--color-ink); font-size: 14px; font-weight: 600; line-height: 1.3; text-decoration: none; }
  .c3-kobr { width: 56px; height: 56px; display: grid; place-items: center; border-radius: var(--radius-m); background: var(--color-blue-50); }
  .c3-kobr img { max-width: 48px; max-height: 44px; object-fit: contain; }
  .c3-vsetky { margin-top: 14px; display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: var(--color-blue-700); text-decoration: none; }
  .c3-panel { grid-column: 2; grid-row: 1; position: sticky; top: 96px; z-index: 3; margin-top: 88px; padding: 24px; border-radius: var(--radius-xl);
    background: rgb(255 255 255 / 0.72); -webkit-backdrop-filter: blur(18px) saturate(1.4); backdrop-filter: blur(18px) saturate(1.4);
    box-shadow: inset 0 1px 0 #fff, inset 0 0 0 1px rgb(10 42 94 / 0.08), var(--elev-4); }
  .c3-ot { margin: 0 0 10px; font-family: var(--font-display); font-stretch: 112.5%; font-size: 17px; font-weight: 600; color: var(--color-ink); }
  .c3-ot + div { margin-bottom: 22px; }
  .c3-pouzitia { display: grid; gap: 6px; }
  .c3-o { all: unset; box-sizing: border-box; cursor: pointer; display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; align-items: center; gap: 12px; min-height: 52px; padding: 7px 14px 7px 8px;
    border-radius: var(--radius-l); background: rgb(255 255 255 / 0.75); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.1); font-size: 15px; font-weight: 600; color: var(--color-ink); }
  .c3-o .celo { width: 36px; height: 36px; }
  .c3-pocet { min-width: 24px; height: 24px; padding: 0 7px; box-sizing: border-box; display: grid; place-items: center; border-radius: var(--radius-s); background: var(--color-blue-50); font-size: 12px; font-weight: 600; color: var(--color-ink-soft); font-variant-numeric: tabular-nums; }
  .c3-o.je { background: var(--color-blue-900); color: #fff; box-shadow: var(--elev-2); }
  .c3-o.je .c3-pocet { background: rgb(255 255 255 / 0.16); color: #fff; }
  .c3-vyh { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
  .c3-v { all: unset; box-sizing: border-box; cursor: pointer; display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: var(--radius-l); background: rgb(255 255 255 / 0.75); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.1); color: var(--color-ink); }
  .c3-v strong { font-size: 15px; font-weight: 600; }
  .c3-v small { font-size: 12px; line-height: 1.35; color: var(--color-ink-soft); }
  .c3-v.je { background: var(--color-blue-900); color: #fff; box-shadow: var(--elev-2); }
  .c3-v.je small { color: var(--color-on-dark-muted); }
  .c3-suhrn { display: grid; grid-template-columns: 44px minmax(0, 1fr); align-items: center; gap: 12px; padding: 12px; border-radius: var(--radius-l); background: var(--color-blue-50); }
  .c3-suhrn .celo { width: 44px; height: 44px; }
  .c3-suhrn strong { display: block; font-size: 16px; font-weight: 600; color: var(--color-ink); }
  .c3-suhrn small { display: block; font-size: 13px; color: var(--color-ink-soft); }
  .nv-cta { margin-top: 12px; width: 100%; justify-content: center; }
  .nv-cta svg { width: 20px; height: 20px; }
  .c3-pomoc { margin: 14px 0 0; font-size: 14px; color: var(--color-ink-soft); }
  .c3-pomoc a { color: var(--color-blue-700); font-weight: 600; }
  @media (max-width: 760px) {
    .c3-grid { grid-template-columns: minmax(0, 1fr); }
    .c3-stage { display: contents; }
    .c3-stage h2 { order: 1; }
    .c3-render { order: 2; margin: 0 calc(-1 * var(--gutter)) 0; }
    .c3-meno { order: 3; margin-top: -24px; }
    .c3-meno h3 { font-size: 26px; }
    .c3-meno > p { font-size: 15px; }
    .c3-fakty { gap: 14px 28px; }
    .c3-fakty dd { font-size: 18px; }
    .c3-panel { order: 4; grid-column: 1; grid-row: auto; position: static; margin-top: 28px; padding: 16px; }
    .c3-spodok { margin-top: 28px; grid-template-columns: minmax(0, 1fr); row-gap: 28px; }
    .c3-mierka { padding: 12px 10px 6px; }
    .c3-ktomu ul { grid-template-columns: minmax(0, 1fr); gap: 8px; }
  }`;
  return { html, css };
}

// ---------------- snímky ----------------
const NAVRHY_C = { C1: navrhC1, C2: navrhC2, C3: navrhC3 };
const MENA_C = { C1: 'C1-konfigurator', C2: 'C2-dlazdice-a-produktovy-list', C3: 'C3-vystavna-sien' };
const ktore = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(NAVRHY_C);
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
      const { html, css } = NAVRHY_C[n]();
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
      const subor = `${CIEL_C}/${MENA_C[n]}-${z.meno}.png`;
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
