// Návrhy stránky Referencie A, B, C (Juraj 6. 11. 2026: „Daj mi 3 obrázkové možnosti na referencie stránku, išlo by
// o redesign, nekladiem ti medze, urob 3 varianty, z ktorých pôjdeme ďalej bližšie k finálnemu výsledku.“).
// Vkladá HTML a CSS do hotovej stránky /referencie/ z web/dist, web sa nemení. Texty a kóty fotiek sú z
// web/src/content/referencie.ts (len fakty zo stránok watts.eu), rozmery výrobkov z web/src/data/varianty.json,
// body kót renderov z web/src/data/rendery.json. Popisy fotiek opisujú len to, čo je na fotke vidieť.
// Spustenie: node navrhy.mjs [dnes A B C]   (bez argumentu všetko), potom python prehlad.py
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawn } from 'node:child_process';

const require = createRequire('C:/Users/krist/Documents/FajnInstalater/audit/scripts/package.json');
const { chromium } = require('playwright');
const KOREN = 'C:/Users/krist/Documents/FajnInstalater/MicroflexWeb';
const CIEL = `${KOREN}/snimky-stranok/navrh-referencie`;
mkdirSync(CIEL, { recursive: true });
const PORT = 4373;

// Ikony len originálne z Lucide (DESIGN.md kap. 6).
const IKONY = Object.fromEntries(['arrow-right', 'arrow-down', 'external-link', 'chevron-right', 'phone', 'send'].map((n) => [n,
  readFileSync(`${KOREN}/web/node_modules/lucide-static/icons/${n}.svg`, 'utf8').replace(/<!--[\s\S]*?-->/, '').replace(/\s+/g, ' ').trim()]));
const ik = (n, v = 18) => IKONY[n].replace(/width="24"/, `width="${v}"`).replace(/height="24"/, `height="${v}"`).replace('<svg', '<svg aria-hidden="true" class="ik"');

// Sadzba ako na webe (lib/sadzba.ts zjednodušene): nezlomiteľná medzera za jednopísmenovou predložkou a spojkou,
// pred jednotkou, za Ø a okolo ×.
const NB = '\u00a0';
const S = (t) => String(t)
  .replace(/(^|[\s(])([vkszouaiVKSZOUAI])\s/g, `$1$2${NB}`)
  .replace(/(\d)\s(mm|m²|m|kW|bar|kg\/m|budov|fotiek|dimenzií)(?![\p{L}])/gu, `$1${NB}$2`)
  .replace(/Ø\s/g, `Ø${NB}`)
  .replace(/\s×\s/g, `${NB}×${NB}`);

const A_ = (p) => `/navrh-assets/src/${p}`;
const F = (f) => A_(`referencie/${f}`);
const DOPYT = '/pre-firmy/#dopyt';
const TEL = { href: 'tel:+421414220422', text: '+421 41 422 0422' };
const RAD = {
  uno: { url: '/potrubia/vykurovanie/microflex-uno-6-bar/', nazov: 'Microflex UNO, vykurovanie 6 bar', kratko: 'UNO 6 bar', celo: '3d/cela/microflex-uno-6-bar.webp' },
  unoPrimo: { url: '/potrubia/vykurovanie/microflex-uno-primo-6-bar/', nazov: 'Microflex UNO PRIMO, vykurovanie 6 bar', kratko: 'UNO PRIMO 6 bar', celo: '3d/cela/microflex-uno-primo-6-bar.webp' },
  primoDuo: { url: '/potrubia/vykurovanie/microflex-primo-duo-6-bar/', nazov: 'Microflex PRIMO DUO, vykurovanie 6 bar', kratko: 'PRIMO DUO 6 bar', celo: '3d/cela/microflex-primo-duo-6-bar.webp' },
};

// Stavby (poradie podľa veľkosti ako dnes). Kóty a fakty sú prevzaté z content/referencie.ts.
const R = {
  povazska: {
    id: 'povazska', nasa: true, typ: 'Obytný súbor, 31 budov', typKratko: 'Obytný súbor', kratko: 'Obytný súbor v Považskej Bystrici',
    nazov: 'Rozvod tepla pre obytný súbor v Považskej Bystrici', miesto: 'Považská Bystrica, Slovensko', mesto: 'Považská Bystrica',
    kedy: 'dodávky 12/2022 až 02/2023', rok: '2022 až 2023', rozsah: '31 budov', rozsahPopis: 'z jednej kotolne',
    perex: 'Kompletný vykurovací rozvod z predizolovaného potrubia Microflex pre 30 rodinných domov a jeden bytový dom, napojený na kotolňu s kotlami na pelety.',
    fakty: [['Napojené budovy', '30 rodinných domov a 1 bytový dom'], ['Dodávka', 'potrubie Microflex, pevné body, tesnenia a systémové príslušenstvo'], ['Zdroj tepla', 'kotolňa, 2 kotly ETA na pelety po 350 kW'], ['Revízne šachty', '4']],
    realizacia: 'Ponuku a dodávku zabezpečila Ohrievacia Technika, s. r. o., prevádzkovateľ tohto webu, s podporou Watts.',
    zdroj: 'https://www.watts.eu/sk/references/microflex-big-project-in-pova-bystrica',
    potrubie: 'Potrubie Microflex a systémové príslušenstvo',
    fotky: [
      { f: 'povazska-3.jpg', popis: 'Stavenisko obytného súboru', koty: [{ x: 45, y: 76, l: 12, smer: 'hore-vpravo', hodnota: '31 budov', text: 'rozvod z jednej kotolne' }] },
      { f: 'povazska-7.jpg', popis: 'Kotolňa s dvoma kotlami na pelety', koty: [{ x: 27, y: 58, l: 12, smer: 'hore-vpravo', hodnota: '2 × 350 kW', text: 'kotly na pelety' }] },
      { f: 'povazska-4.jpg', popis: 'Potrubie vo výkope pri budove' },
      { f: 'povazska-5.jpg', popis: 'Prestup stenou a napojenie na rozvod budovy' },
      { f: 'povazska-6.jpg', popis: 'Napojenie na rozvod v budove' },
      { f: 'povazska-2.jpg', popis: 'Kotúče potrubia na stavenisku' },
    ],
  },
  orange: {
    id: 'orange', typ: 'Vojenská základňa', typKratko: 'Vojenská základňa', kratko: 'Vojenská základňa v Orange',
    nazov: 'Rozvod tepla na vojenskej základni v Orange', miesto: 'Orange, Francúzsko', mesto: 'Orange, Francúzsko',
    kedy: 'október 2022', rok: '2022', rozsah: 'asi 800 m', rozsahPopis: 'potrubia',
    perex: 'Staré oceľové potrubia, ktoré viedli teplú vodu z hlavnej kotolne do budov areálu, nahradilo asi 800 metrov potrubia Microflex.',
    fakty: [['Potrubie', 'Microflex UNO, rúry Ø 63, 75 a 90 mm (DN 50, 61 a 72)'], ['Dĺžka', 'asi 800 m'], ['Dodávka', 'potrubie a príslušenstvo']],
    realizacia: 'Realizácia: Fauché, údržba budov.',
    zdroj: 'https://www.watts.eu/sk/references/microflex-in-orange-military-base',
    potrubie: 'Microflex UNO, Ø 63 až 90 mm', riadok: 'Microflex UNO, Ø 63 až 90 mm',
    fotky: [
      { f: 'orange-5-scena.jpg', popis: 'Dve potrubia UNO vo výkope', koty: [
        { x: 41, y: 87, l: 15, smer: 'hore-vlavo', hodnota: 'Ø 63 až 90 mm', text: 'Microflex UNO, DN 50 až 72' },
        { x: 60.5, y: 54, l: 13, smer: 'hore-vpravo', smerM: 'hore-vlavo', hodnota: 'asi 800 m', text: 'z kotolne do budov areálu' }] },
      { f: 'orange-4.jpg', popis: 'Potrubie vo výkope medzi budovami' },
      { f: 'orange-2.jpg', popis: 'Výkop so zapažením' },
      { f: 'orange-6.jpg', popis: 'Trasa cez areál' },
      { f: 'orange-3.jpg', popis: 'Križovanie s inou sieťou' },
    ],
    vyrobok: {
      rad: RAD.uno, nazov: 'Microflex UNO, vykurovanie 6 bar', render: '3d/varianty/M16090C.webp',
      koty: [{ x: 69.37, y: 73.79, l: 9, smer: 'dole-vlavo', hodnota: 'Ø 63 až 90 mm', text: 'nosné rúry DN 50 až 72, 6 bar' }],
      param: [['Rúry na stavbe', 'Ø 63, 75 a 90 mm'], ['Na stavbe', 'asi 800 m'], ['Tlak', '6 bar'], ['Rozmery v rade', '16 dimenzií']],
      akcia: { text: 'Vybrať rozmer UNO 6 bar', href: '/potrubia/vykurovanie/microflex-uno-6-bar/', ikona: 'arrow-right' },
      odkaz: { text: 'Sprievodca výberom potrubia', href: '/vyber/' },
    },
  },
  skola: {
    id: 'skola', typ: 'Základná škola', typKratko: 'Základná škola', kratko: 'Základná škola v Lehote pri Nitre',
    nazov: 'Nové vykurovanie základnej školy v Lehote pri Nitre', miesto: 'Lehota pri Nitre, Slovensko', mesto: 'Lehota pri Nitre',
    kedy: 'december 2023', rok: '2023', rozsah: '19,5 m', rozsahPopis: 'potrubia',
    perex: 'Starý oceľový rozvod v podzemnom kanáli praskol 3. decembra 2023. Hneď po poruche ho nahradilo potrubie Microflex.',
    fakty: [['Potrubie', 'Microflex UNO PRIMO 125/63 × 5,8'], ['Dĺžka', '19,5 m'], ['Škola', '164 žiakov, 17 učiteľov']],
    realizacia: 'Dodávateľ: TECHINS s. r. o., Nitra.',
    zdroj: 'https://www.watts.eu/sk/references/microflex-saves-school-year',
    potrubie: 'Microflex UNO PRIMO 125/63 × 5,8', riadok: 'Microflex UNO PRIMO 125/63 × 5,8',
    fotky: [
      { f: 'skola-2.jpg', popis: 'Výmena rozvodu pri škole v zime', koty: [{ x: 63, y: 48, l: 10, smer: 'dole-vpravo', smerM: 'dole-vlavo', hodnota: '19,5 m', text: 'Microflex UNO PRIMO 125/63 × 5,8' }] },
      { f: 'skola-1.jpg', popis: 'Potrubie na kotúči pred pokládkou' },
    ],
    vyrobok: {
      rad: RAD.unoPrimo, obj: 'M12563C', nazov: 'Microflex UNO PRIMO 125/63 × 5,8', render: '3d/varianty/M12563C.webp',
      koty: [{ x: 48.88, y: 18, l: 7, smer: 'hore-vpravo', hodnota: 'Ø 125 mm', text: 'plášť' }, { x: 69.37, y: 71.76, l: 9, smer: 'dole-vlavo', hodnota: 'Ø 63 mm', text: 'nosná rúra DN 50, 6 bar' }],
      param: [['Obj. číslo', 'M12563C'], ['Na stavbe', '19,5 m'], ['Polomer ohybu', '0,50 m'], ['Hmotnosť', '2,16 kg/m']],
      akcia: { text: 'Kúpiť M12563C v e-shope', href: 'https://www.instalatershop.sk/vyhledavani/?string=M12563C', ikona: 'external-link' },
      odkaz: { text: 'Všetky rozmery UNO PRIMO 6 bar', href: '/potrubia/vykurovanie/microflex-uno-primo-6-bar/' },
    },
  },
  fackov: {
    id: 'fackov', typ: 'Rodinný dom s garážou', typKratko: 'Rodinný dom s garážou', kratko: 'Rodinný dom s garážou vo Fačkove',
    nazov: 'Rodinný dom s garážou vo Fačkove', miesto: 'Fačkov, Slovensko', mesto: 'Fačkov',
    kedy: 'november 2024', rok: '2024', rozsah: '48 m', rozsahPopis: 'potrubia',
    perex: 'Rozvod vykurovacej vody z kotla na pelety do rodinného domu a do garáže s dielňou, ktorá stojí 15 metrov od domu.',
    fakty: [['Potrubie', 'Microflex PRIMO DUO 125/2 × 25'], ['Dĺžka', '48 m'], ['Budovy', 'dom 255 m², garáž s dielňou 100 m²'], ['Zdroj tepla', 'kotol na pelety']],
    realizacia: 'Dodávateľ: INSTA PL s. r. o., Prievidza.',
    zdroj: 'https://www.watts.eu/sk/references/microflex-slovakia-single-family',
    potrubie: 'Microflex PRIMO DUO 125/2 × 25', riadok: 'Microflex PRIMO DUO 125/2 × 25',
    fotky: [
      { f: 'fackov-2.jpg', popis: 'Výkop s potrubím k domu', koty: [{ x: 61, y: 86, l: 14, smer: 'hore-vpravo', smerM: 'hore-vlavo', hodnota: '48 m', text: 'Microflex PRIMO DUO 125/2 × 25' }] },
      { f: 'fackov-3.jpg', popis: 'Vývody potrubia v betónovej doske' },
      { f: 'fackov-1.jpg', popis: 'Vývod potrubia pred betonážou dosky' },
    ],
    vyrobok: {
      rad: RAD.primoDuo, obj: 'MD12525C', nazov: 'Microflex PRIMO DUO 125/2 × 25', render: '3d/varianty/MD12525C.webp',
      koty: [{ x: 48.88, y: 18, l: 7, smer: 'hore-vpravo', hodnota: 'Ø 125 mm', text: 'plášť' }, { x: 66.63, y: 69.06, l: 11, smer: 'dole-vlavo', hodnota: '2 × Ø 25 mm', text: 'nosné rúry DN 20, 6 bar' }],
      param: [['Obj. číslo', 'MD12525C'], ['Na stavbe', '48 m'], ['Polomer ohybu', '0,30 m'], ['Hmotnosť', '1,57 kg/m']],
      akcia: { text: 'Kúpiť MD12525C v e-shope', href: 'https://www.instalatershop.sk/vyhledavani/?string=MD12525C', ikona: 'external-link' },
      odkaz: { text: 'Všetky rozmery PRIMO DUO 6 bar', href: '/potrubia/vykurovanie/microflex-primo-duo-6-bar/' },
    },
  },
};
const PORADIE = ['povazska', 'orange', 'skola', 'fackov'];
// Diely, ktoré patrili k dodávke v Považskej Bystrici (fakt: „potrubie, pevné body, tesnenia a systémové
// príslušenstvo“, 4 revízne šachty). Fotky sú výrobky z našej ponuky; presné typy treba overiť.
const DIELY = [
  { img: '3d/kotuc/kotuc.webp', nazov: 'Potrubie Microflex', pod: 'na kotúčoch', href: '/potrubia/', kotuc: true },
  { img: 'produkty/fixny-bod.webp', nazov: 'Pevné body', pod: 'Pevný bod MFP', href: '/spojky/pevny-bod-mfp/' },
  { img: 'produkty/tesnenie-na-prienik-na-stenu-micro-press.webp', nazov: 'Tesnenia prestupov', pod: 'MICRO PRESS a MICRO SEAL', href: '/prislusenstvo/tesnenie-micro-press-prestup-stenou/' },
  { img: 'produkty/inspekcna-komora.webp', nazov: 'Revízne šachty', pod: 'Revízna šachta MIS', href: '/prislusenstvo/revizna-sachta-mis/' },
];
const CRUMBS = '<ol class="crumbs" aria-label="Kde ste"><li><a href="/">Domov</a></li><li aria-current="page">Referencie</li></ol>';

// ---------- spoločné stavebné diely ----------
function kota(k, o = {}) {
  const smer = o.smer ?? k.smer, smerM = o.smerM ?? k.smerM ?? smer, l = o.l ?? k.l, lM = o.lM ?? k.lM;
  const text = 'text' in o ? o.text : k.text;
  return `<li class="nk-kota s-${smer} sm-${smerM}" data-x="${k.x}" data-y="${k.y}" style="--l: ${l};${lM ? ` --lm: ${lM};` : ''}"><span class="bod"></span><span class="ciara"></span><span class="stitok"><strong>${S(o.hodnota ?? k.hodnota)}</strong>${text ? `<span${text.length > 26 ? ' class="dlhy"' : ''}>${S(text)}</span>` : ''}</span></li>`;
}
function foto(fd, { cls = '', pos = '50% 50%', koty = true, ko = [], popis = false, render = false, src, navrch = '' } = {}) {
  const k = koty && fd.koty?.length ? `<ul class="nk-koty">${fd.koty.map((x, i) => kota(x, ko[i] ?? {})).join('')}</ul>` : '';
  const p = popis && fd.popis ? `<figcaption class="nk-popis">${S(fd.popis)}</figcaption>` : '';
  return `<figure class="nk-foto${render ? ' nk-render' : ''} ${cls}"><img src="${src ?? F(fd.f)}" alt="${S(fd.popis ?? '')}" style="object-position: ${pos}">${k}${p}${navrch}</figure>`;
}
const pill = (r) => `<span class="nk-pill ${r.nasa ? 'nk-pill-nasa' : 'nk-pill-vyr'}">${r.nasa ? 'Naša dodávka' : 'Referencia výrobcu'}</span>`;
const spec = (fakty, cls = '') => `<dl class="nk-spec ${cls}">${fakty.map(([a, b]) => `<div><dt>${a}</dt><dd>${S(b)}</dd></div>`).join('')}</dl>`;
const riadok = (href, text, pocet = '') => `<a class="nk-riadok" href="${href}"><span class="nk-riadok-t">${S(text)}</span>${pocet ? `<span class="pocet">${S(pocet)}</span>` : ''}${ik('chevron-right', 18)}</a>`;
const diely = (cls = '') => `<ul class="nk-diely ${cls}">${DIELY.map((d) => `<li><a class="nk-diel" href="${d.href}"><span class="nk-diel-foto${d.kotuc ? ' kotuc' : ''}"><img src="${A_(d.img)}" alt=""></span><strong>${S(d.nazov)}</strong><span>${S(d.pod)}</span></a></li>`).join('')}</ul>`;

const CSS_SPOLOCNE = `
  .nk-telo { position: relative; }
  .nk-foto { position: relative; margin: 0; container-type: inline-size; isolation: isolate; border-radius: var(--radius-xl); background: var(--zem-3); }
  .nk-foto > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
  .nk-foto.nk-render { background: none; }
  .nk-foto.nk-render > img { object-fit: contain; }
  /* Kóty ako na webe (Koty.astro): bod na tom, čo číslo opisuje, čiara a mliečny štítok. Poloha bodu sa ráta
     z výrezu fotky (object-fit), takže sedí aj pri orezanej fotke. */
  .nk-koty { --k: 1; position: absolute; inset: 0; z-index: 2; margin: 0; padding: 0; list-style: none; pointer-events: none; }
  .nk-kota { --dlzka: calc(var(--l) * var(--k) * 1cqw); position: absolute; width: 0; height: 0; }
  .nk-kota .bod { position: absolute; z-index: 2; left: -7px; top: -7px; width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: inset 0 0 0 3px var(--color-blue-900), 0 0 0 4px rgb(255 255 255 / 0.5), 0 3px 10px rgb(4 16 40 / 0.4); }
  .nk-kota .ciara { position: absolute; left: -0.75px; width: 1.5px; height: var(--dlzka); background: var(--color-blue-900); box-shadow: 0 0 0 1.5px rgb(255 255 255 / 0.6); }
  .nk-kota .stitok { position: absolute; display: flex; flex-direction: column; gap: 4px; white-space: nowrap; padding: clamp(6px, 0.9cqw, 11px) clamp(9px, 1.3cqw, 15px); border-radius: var(--radius-l);
    background: var(--sklo-2); -webkit-backdrop-filter: blur(10px) saturate(1.4); backdrop-filter: blur(10px) saturate(1.4); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.08), var(--elev-2); }
  .nk-kota .stitok strong { font-family: var(--font-display); font-stretch: 118%; font-weight: 600; font-size: clamp(16px, 3.1cqw, 30px); line-height: 1.02; letter-spacing: -0.02em; color: var(--color-blue-900); font-variant-numeric: tabular-nums; }
  .nk-kota .stitok span { font-size: clamp(12px, 1.6cqw, 15px); line-height: 1.3; font-weight: 500; color: var(--color-ink-soft); }
  @media (min-width: 761px) {
    .nk-kota.s-hore-vpravo .ciara, .nk-kota.s-hore-vlavo .ciara { bottom: 0; }
    .nk-kota.s-dole-vpravo .ciara, .nk-kota.s-dole-vlavo .ciara { top: 0; }
    .nk-kota.s-hore-vpravo .stitok { left: -0.75px; bottom: var(--dlzka); border-bottom-left-radius: 2px; }
    .nk-kota.s-hore-vlavo .stitok { right: -0.75px; bottom: var(--dlzka); border-bottom-right-radius: 2px; align-items: flex-end; text-align: right; }
    .nk-kota.s-dole-vpravo .stitok { left: -0.75px; top: var(--dlzka); border-top-left-radius: 2px; }
    .nk-kota.s-dole-vlavo .stitok { right: -0.75px; top: var(--dlzka); border-top-right-radius: 2px; align-items: flex-end; text-align: right; }
  }
  @media (max-width: 760px) {
    .nk-koty { --k: 0.75; }
    .nk-kota { --dlzka: calc(var(--lm, var(--l)) * var(--k) * 1cqw); }
    .nk-kota .stitok { border-radius: var(--radius-m); }
    .nk-kota.sm-hore-vpravo .ciara, .nk-kota.sm-hore-vlavo .ciara { bottom: 0; }
    .nk-kota.sm-dole-vpravo .ciara, .nk-kota.sm-dole-vlavo .ciara { top: 0; }
    .nk-kota.sm-hore-vpravo .stitok { left: -0.75px; bottom: var(--dlzka); border-bottom-left-radius: 2px; }
    .nk-kota.sm-hore-vlavo .stitok { right: -0.75px; bottom: var(--dlzka); border-bottom-right-radius: 2px; align-items: flex-end; text-align: right; }
    .nk-kota.sm-dole-vpravo .stitok { left: -0.75px; top: var(--dlzka); border-top-left-radius: 2px; }
    .nk-kota.sm-dole-vlavo .stitok { right: -0.75px; top: var(--dlzka); border-top-right-radius: 2px; align-items: flex-end; text-align: right; }
  }
  /* Popis fotky: mliečny štítok v rohu, nie text pod fotkou. */
  .nk-popis { position: absolute; left: 12px; bottom: 12px; z-index: 2; max-width: calc(100% - 24px); padding: 6px 10px; border-radius: var(--radius-m); background: var(--sklo-2);
    -webkit-backdrop-filter: blur(8px) saturate(1.3); backdrop-filter: blur(8px) saturate(1.3); box-shadow: var(--elev-1); font-size: 13px; line-height: 1.3; font-weight: 500; color: var(--color-ink); }
  .nk-pill { display: inline-flex; align-items: center; flex: none; height: 28px; padding: 0 12px; border-radius: 999px; font-size: 14px; font-weight: 600; white-space: nowrap; }
  .nk-pill-nasa { background: var(--color-yellow-500); color: var(--color-ink); }
  .nk-pill-vyr { color: var(--color-ink-soft); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.24); }
  /* Štítok roly na fotke (ľavý horný roh), aby hlavička dlaždice ostala na jeden riadok. */
  .nk-foto > .nk-pill { position: absolute; top: 12px; left: 12px; z-index: 3; box-shadow: var(--elev-1); }
  .nk-foto > .nk-pill-vyr { background: var(--sklo-3); color: var(--color-ink); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.08), var(--elev-1); }
  .nk-kde { font-size: 15px; font-weight: 500; color: var(--color-blue-700); }
  .nk-perex { font-size: 17px; line-height: 1.6; color: var(--color-ink); }
  .nk-spec { display: grid; gap: 8px; margin: 24px 0 0; }
  .nk-spec > div { display: grid; grid-template-columns: 9.5em minmax(0, 1fr); gap: 16px; padding: 12px 16px; border-radius: var(--radius-l); background: var(--sklo-1); }
  .nk-spec dt { font-size: 14px; line-height: 1.45; color: var(--color-ink-soft); }
  .nk-spec dd { margin: 0; font-size: 15px; line-height: 1.45; font-weight: 600; color: var(--color-ink); }
  .nk-spec-biela > div { background: var(--color-blue-50); }
  .nk-tichy { color: var(--color-ink-soft) !important; }
  .nk-odkazy { display: flex; flex-wrap: wrap; gap: 16px 24px; margin-top: 24px; }
  .ik { flex: none; }
  /* Riadok ako v dlaždiciach katalógu na domove (G2): biela plocha, názov, počet a šípka. */
  .nk-riadok { display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 0 14px 0 16px; border-radius: var(--radius-m); background: #fff;
    box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.12), var(--elev-1); color: var(--color-ink); font-size: 15px; font-weight: 600; line-height: 1.25; }
  .nk-riadok:hover { color: var(--color-ink); box-shadow: inset 0 0 0 1px var(--color-blue-700), var(--elev-1); }
  .nk-riadok-t { min-width: 0; padding-block: 12px; }
  .nk-riadok .pocet { margin-left: auto; flex: none; font-size: 14px; font-weight: 400; color: var(--color-ink-soft); }
  .nk-riadok .ik { color: var(--color-blue-700); }
  .nk-riadok-t + .ik { margin-left: auto; }
  /* Diely na podlahe štúdia (ako KartaProduktu). */
  .nk-diely { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 0; padding: 0; list-style: none; }
  .nk-diel { display: grid; gap: 2px; height: 100%; padding: 8px 8px 14px; border-radius: var(--radius-l); background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-1); color: var(--color-ink); }
  .nk-diel-foto { position: relative; display: block; aspect-ratio: 4 / 3; margin-bottom: 10px; border-radius: var(--radius-m); overflow: hidden;
    background: radial-gradient(70% 60% at 50% 42%, #ffffff 0%, #f3f6fa 70%, #eaf0f7 100%); }
  .nk-diel-foto::after { content: ""; position: absolute; left: 22%; right: 22%; bottom: 9%; height: 10%; border-radius: 50%; background: radial-gradient(closest-side, rgb(10 42 94 / 0.2), rgb(10 42 94 / 0)); }
  .nk-diel-foto img { position: absolute; z-index: 1; left: 13%; top: 8%; width: 74%; height: 78%; object-fit: contain; }
  .nk-diel-foto.kotuc::after { display: none; }
  .nk-diel-foto.kotuc img { left: 18%; top: 4%; width: 64%; height: 92%; }
  .nk-diel strong { padding-inline: 4px; font-size: 15px; line-height: 1.3; }
  .nk-diel > span:last-child { padding-inline: 4px; font-size: 13px; line-height: 1.35; color: var(--color-ink-soft); }
  .tma .crumbs, .tma .crumbs a { color: var(--color-on-dark-muted); }
  .tma .crumbs li + li::before { color: rgb(255 255 255 / 0.3); }
  .tma .nk-pill-vyr { color: var(--color-on-dark-muted); box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.35); }
  @media (max-width: 760px) {
    .nk-spec > div { grid-template-columns: minmax(0, 1fr); gap: 2px; }
    .nk-diely { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .nk-perex { font-size: 16px; }
  }
`;

// ---------- A: Hlavná stavba (naša dodávka ako príbeh, ostatné stavby ako karty) ----------
function htmlA({ prehlad = false } = {}) {
  const p = R.povazska;
  const [stav, kotolna, vykop, prestup, napojenie] = p.fotky;
  const karta = (r) => {
    const [hl, ...ost] = r.fotky;
    return `<article class="nk-a-karta" id="${r.id}">
      <div class="nk-a-karta-fotky" data-n="${Math.min(r.fotky.length, 3)}">
        ${foto(hl, { cls: 'nk-a-karta-hl', ko: hl.koty.map((k) => ({ text: null, smer: k.x > 55 ? 'hore-vlavo' : 'hore-vpravo', smerM: k.x > 55 ? 'hore-vlavo' : 'hore-vpravo', l: 12 })), koty: true })}
        ${ost.slice(0, 2).map((f) => foto(f, { koty: false })).join('')}
      </div>
      <div class="nk-a-karta-text">
        ${pill(r)}
        <h3>${S(r.nazov)}</h3>
        <p class="nk-kde">${S(r.miesto)}, ${S(r.kedy)}</p>
        <p class="nk-a-karta-perex">${S(r.perex)}</p>
        ${riadok(r.vyrobok.rad.url, r.riadok, r.rozsah)}
      </div>
    </article>`;
  };
  // Na karte Orange len kóta dĺžky (dve kóty sa na malú fotku nezmestia).
  const orange = { ...R.orange, fotky: [{ ...R.orange.fotky[0], koty: [R.orange.fotky[0].koty[1]] }, ...R.orange.fotky.slice(1)] };
  return `
  <section class="nk-a-hero tma" aria-labelledby="h1-ref">
    <div class="wrap nk-a-hero-text">
      ${CRUMBS}
      <h1 id="h1-ref">Referencie</h1>
      <p class="nk-a-lead">${S('Stavby, na ktorých už potrubie Microflex vedie teplo: od rodinného domu s garážou po obytný súbor s 31 budovami.')}</p>
    </div>
    ${foto(stav, { cls: 'nk-a-hero-foto', pos: '30% 62%', ko: [{ l: 10, smerM: 'hore-vpravo' }] })}
    <div class="wrap nk-a-feat">
      <p class="nk-a-feat-meta">${pill(p)}<span>Považská Bystrica, ${S(p.rok)}</span></p>
      <p class="nk-a-feat-h">${S('Rozvod tepla pre 30 domov a bytový dom z jednej kotolne')}</p>
      <div class="nk-akcie"><a class="btn btn-inverse btn-lg" href="#povazska">Pozrieť stavbu ${ik('arrow-down')}</a><a class="nk-odkaz-tma" href="${DOPYT}">Poslať dopyt na projekt ${ik('arrow-right', 16)}</a></div>
    </div>
  </section>
  <div class="telo nk-telo nk-telo-ohyb">
    ${prehlad ? prehladStavieb() : ''}
    <section class="wrap nk-a-pripad" id="povazska" aria-labelledby="h-povazska">
      <header class="nk-a-pripad-hlava">
        <div>
          <p class="nk-kde">${S(p.miesto)}, ${S(p.kedy)}</p>
          <h2 id="h-povazska">${S(p.nazov)}</h2>
        </div>
        <p class="nk-a-dodal">${S(p.realizacia)}</p>
      </header>
      <div class="nk-a-pripad-grid">
        ${foto(kotolna, { cls: 'nk-a-kotolna', pos: '50% 50%', ko: [{ l: 10 }] })}
        <div class="nk-a-udaje">
          <p class="nk-perex">${S(p.perex)}</p>
          ${spec(p.fakty.filter(([a]) => a !== 'Dodávka'))}
          <div class="nk-odkazy"><a class="odkaz" href="${DOPYT}">Dopyt na podobný projekt ${ik('arrow-right', 16)}</a><a class="odkaz nk-tichy" href="${p.zdroj}">Referencia na watts.eu ${ik('external-link', 15)}</a></div>
        </div>
      </div>
      <div class="nk-a-pas">${[vykop, prestup, napojenie].map((f) => foto(f, { popis: true })).join('')}</div>
      <div class="harok nk-a-diely">
        <div class="nk-a-diely-text">
          <h3>Čo patrilo k dodávke</h3>
          <p>${S('Okrem potrubia aj pevné body, tesnenia prestupov stenou a systémové príslušenstvo. Na trase sú 4 revízne šachty.')}</p>
          <a class="odkaz" href="/prislusenstvo/">Príslušenstvo k potrubiu ${ik('arrow-right', 16)}</a>
        </div>
        ${diely()}
      </div>
    </section>
    <section class="wrap nk-a-dalsie" aria-labelledby="h-dalsie">
      <div class="s-hlava"><h2 id="h-dalsie">Ďalšie stavby s potrubím Microflex</h2><p>${S('Referencie výrobcu Watts s inými dodávateľmi, na Slovensku aj vo Francúzsku.')}</p></div>
      <div class="nk-a-karty">${[orange, R.skola, R.fackov].map(karta).join('')}</div>
    </section>
  </div>`;
}
const CSS_A = `
  .nk-a-hero { position: relative; isolation: isolate; overflow: clip; display: flex; flex-direction: column; justify-content: space-between;
    height: clamp(620px, calc(100svh - 164px), 740px); background: var(--color-blue-900); color: #fff; }
  .nk-a-hero > .wrap { position: relative; z-index: 3; width: 100%; }
  .nk-a-hero-text > *, .nk-a-feat > * { max-width: 560px; }
  .nk-a-hero-foto { position: absolute; inset: 0 0 0 34%; z-index: 1; border-radius: 0; background: #0e3676; }
  .nk-a-hero-foto::after { content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none;
    background: linear-gradient(90deg, var(--color-blue-900) 0%, rgb(10 42 94 / 0.82) 12%, rgb(10 42 94 / 0.25) 34%, rgb(10 42 94 / 0) 50%),
      linear-gradient(0deg, rgb(10 42 94 / 0.28) 0%, rgb(10 42 94 / 0) 22%); }
  .nk-a-hero h1 { margin-top: 28px; color: #fff; font-size: clamp(42px, 3vw + 14px, 64px); letter-spacing: -0.025em; }
  .nk-a-lead { margin-top: 16px; font-size: 18px; line-height: 1.55; color: var(--color-on-dark-muted); max-width: 27em !important; }
  .nk-a-feat { padding-bottom: calc(var(--presah-hero) + 8px); }
  .nk-a-feat-meta { display: flex; align-items: center; gap: 14px; font-size: 15px; font-weight: 500; color: var(--color-on-dark-muted); }
  .nk-a-feat-h { margin-top: 14px; font: 600 clamp(25px, 1.1vw + 15px, 34px)/1.14 var(--font-display); font-stretch: 112.5%; letter-spacing: -0.018em; color: #fff; max-width: 15em !important; text-wrap: balance; }
  .nk-akcie { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 28px; margin-top: 28px; }
  .nk-odkaz-tma { display: inline-flex; align-items: center; gap: 8px; padding-bottom: 4px; border-bottom: 1px solid rgb(255 255 255 / 0.55); font-weight: 600; color: #fff; }
  .nk-odkaz-tma:hover { color: #fff; border-bottom-color: #fff; }
  /* Telo začína ohnutou hranou cez spodok fotky (tvar --hrana-ohyb ako na domove). */
  .nk-telo-ohyb { overflow: visible; }
  .nk-telo-ohyb::before { content: ""; position: absolute; left: 0; right: 0; top: calc(-1 * var(--presah-hero) + 1px); height: var(--presah-hero); z-index: 4; pointer-events: none;
    background: var(--zem-1); -webkit-mask: var(--hrana-ohyb) no-repeat 0 0 / 100% 100%; mask: var(--hrana-ohyb) no-repeat 0 0 / 100% 100%; }
  .nk-a-pripad { scroll-margin-top: 110px; }
  .nk-a-pripad-hlava { display: grid; grid-template-columns: minmax(0, 8fr) minmax(0, 4fr); gap: 16px 48px; align-items: end; margin-bottom: 32px; }
  .nk-a-pripad-hlava h2 { margin-top: 10px; font-size: clamp(30px, 1.7vw + 15px, 46px); letter-spacing: -0.022em; max-width: 17em; }
  .nk-a-dodal { position: relative; padding: 16px 20px 16px 24px; border-radius: var(--radius-l); background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-2);
    font-size: 15px; line-height: 1.5; color: var(--color-ink); }
  .nk-a-dodal::before { content: ""; position: absolute; left: 0; top: 16px; bottom: 16px; width: 4px; border-radius: 0 4px 4px 0; background: var(--color-blue-700); }
  .nk-a-pripad-grid { display: grid; grid-template-columns: minmax(0, 8fr) minmax(0, 4fr); gap: 32px 48px; align-items: start; }
  .nk-a-kotolna { aspect-ratio: 16 / 10; box-shadow: var(--elev-4); }
  .nk-a-udaje .nk-spec > div { grid-template-columns: minmax(0, 1fr); gap: 2px; }
  .nk-a-pas { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
  .nk-a-pas .nk-foto { aspect-ratio: 4 / 3; box-shadow: var(--elev-3); }
  .nk-a-diely { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: 24px 48px; align-items: center; margin-top: 48px; padding: 32px; }
  .nk-a-diely-text h3 { font-size: 24px; }
  .nk-a-diely-text p { margin: 12px 0 20px; font-size: 16px; line-height: 1.55; color: var(--color-ink-soft); }
  .nk-a-dalsie .s-hlava { margin-bottom: 32px; }
  .nk-a-karty { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
  .nk-a-karta { display: flex; flex-direction: column; padding: 12px; border-radius: var(--radius-xl); background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-3); }
  .nk-a-karta-fotky { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); grid-template-rows: 1fr 1fr; gap: 6px; aspect-ratio: 3 / 2; }
  .nk-a-karta-fotky .nk-foto { border-radius: var(--radius-m); }
  .nk-a-karta-fotky .nk-a-karta-hl { grid-row: 1 / 3; border-radius: var(--radius-l) var(--radius-m) var(--radius-m) var(--radius-l); }
  .nk-a-karta-fotky[data-n="2"] .nk-foto:nth-child(2) { grid-row: 1 / 3; }
  .nk-a-karta-text { display: flex; flex-direction: column; align-items: flex-start; flex: 1; padding: 20px 8px 4px; }
  .nk-a-karta h3 { margin-top: 14px; font-size: 22px; line-height: 1.2; letter-spacing: -0.01em; }
  .nk-a-karta .nk-kde { margin-top: 6px; font-size: 14px; }
  .nk-a-karta-perex { margin: 12px 0 20px; font-size: 15px; line-height: 1.55; color: var(--color-ink-soft); }
  .nk-a-karta .nk-riadok { align-self: stretch; margin-top: auto; }
  @media (max-width: 1100px) {
    .nk-a-karty { grid-template-columns: minmax(0, 1fr); }
    .nk-a-diely { grid-template-columns: minmax(0, 1fr); }
  }
  @media (max-width: 760px) {
    .nk-a-hero { height: auto; justify-content: flex-start; }
    .nk-a-hero-foto { position: relative; inset: auto; aspect-ratio: 4 / 3; margin-top: 24px; }
    .nk-a-hero-foto::after { background: linear-gradient(180deg, var(--color-blue-900) 0%, rgb(10 42 94 / 0) 22%, rgb(10 42 94 / 0) 72%, var(--color-blue-900) 100%); }
    .nk-a-hero h1 { margin-top: 8px; }
    .nk-a-lead { font-size: 16px; }
    .nk-a-feat { margin-top: -24px; padding-bottom: calc(var(--presah-hero) + 24px); }
    .nk-a-feat-h { font-size: 24px; }
    .nk-akcie .btn-lg { width: 100%; justify-content: center; }
    .nk-a-pripad-hlava, .nk-a-pripad-grid { grid-template-columns: minmax(0, 1fr); }
    .nk-a-pripad-hlava h2 { font-size: 28px; }
    .nk-a-kotolna { aspect-ratio: 4 / 3; margin-inline: calc(-1 * var(--gutter)); border-radius: 0; }
    .nk-a-pas { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }
    .nk-a-pas .nk-foto:first-child { grid-column: 1 / -1; }
    .nk-a-pas .nk-foto { border-radius: var(--radius-l); }
    .nk-a-pas .nk-foto:not(:first-child) .nk-popis { left: 8px; bottom: 8px; max-width: calc(100% - 16px); font-size: 12px; }
    .nk-a-diely { padding: 20px; }
  }
`;

// ---------- Verzie smeru A (Juraj 7. 11. 2026: „Chcem smer A + 3 varianty.“) ----------
// A1 = A a pod úvodom pás so všetkými stavbami (prvá obrazovka ukáže aj menšie stavby).
const prehladStavieb = () => `
    <div class="wrap nk-a1-prehlad-obal">
      <nav class="harok nk-a1-prehlad" aria-label="Stavby na tejto stránke">
        ${PORADIE.map((id) => { const r = R[id]; return `<a class="nk-a1-polozka${r.nasa ? ' je-hlavna' : ''}" href="#${r.id}"><img src="${F(r.fotky[0].f)}" alt=""><span><strong>${S(r.rozsah)}</strong><b>${S(r.typKratko)}</b><span>${S(r.mesto)}</span></span></a>`; }).join('')}
      </nav>
    </div>`;
const CSS_A1 = `
  .nk-a1-prehlad-obal { position: relative; z-index: 5; margin-top: -144px; }
  .nk-a1-prehlad { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; padding: 8px; }
  .nk-a1-polozka { display: flex; align-items: center; gap: 16px; min-width: 0; padding: 8px 12px 8px 8px; border-radius: var(--radius-l); color: var(--color-ink); transition: background 150ms var(--ease-soft); }
  .nk-a1-polozka:hover, .nk-a1-polozka.je-hlavna { background: var(--color-blue-50); color: var(--color-ink); }
  .nk-a1-polozka img { flex: none; width: 76px; height: 76px; object-fit: cover; border-radius: var(--radius-m); }
  .nk-a1-polozka > span { display: grid; gap: 2px; min-width: 0; }
  .nk-a1-polozka strong { font: 600 24px/1.05 var(--font-display); font-stretch: 118%; letter-spacing: -0.02em; color: var(--color-blue-900); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .nk-a1-polozka b { margin-top: 4px; font-size: 15px; font-weight: 600; line-height: 1.25; }
  .nk-a1-polozka > span > span { font-size: 13px; line-height: 1.35; color: var(--color-ink-soft); }
  @media (max-width: 1100px) { .nk-a1-prehlad { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 760px) {
    .nk-a1-prehlad-obal { margin-top: -80px; }
    .nk-a1-prehlad { gap: 4px; padding: 6px; }
    .nk-a1-polozka { gap: 10px; padding: 6px; }
    .nk-a1-polozka img { width: 52px; height: 52px; }
    .nk-a1-polozka strong { font-size: 18px; }
    .nk-a1-polozka b { font-size: 13px; }
    .nk-a1-polozka > span > span { display: none; }
  }
`;

// A2 = príbeh v kapitolách: tmavý panel so šikmou hranou ako úvod domova, fotka cez hranu, príbeh Považskej
// v štyroch kapitolách hadovito, ďalšie stavby ako široké riadky so všetkými údajmi.
function htmlA2() {
  const p = R.povazska;
  const [stav, kotolna, vykop, prestup, napojenie] = p.fotky;
  const kap = ({ obr, nadpis, text, extra = '', vpravo = false }) => `
      <article class="nk-a2-kap${vpravo ? ' vpravo' : ''}">
        <div class="nk-a2-kap-obr">${obr}</div>
        <div class="nk-a2-kap-text"><h3>${S(nadpis)}</h3><p>${S(text)}</p>${extra}</div>
      </article>`;
  const stavba = (r) => {
    const [hl, ...ost] = r.fotky;
    const fakty = r.fakty.filter(([a]) => a !== 'Dodávka').slice(0, 3);
    return `
      <article class="harok nk-a2-stavba" id="${r.id}">
        <div class="nk-a2-stavba-obr">
          ${foto(hl, { cls: 'nk-a2-stavba-foto', ko: hl.koty.map(() => ({ text: null, l: 10 })), navrch: pill(r) })}
          ${ost.length > 1 ? `<div class="nk-a2-stavba-mini">${ost.slice(0, 3).map((f) => foto(f, { koty: false })).join('')}</div>` : ''}
        </div>
        <div class="nk-a2-stavba-text">
          <p class="nk-kde">${S(r.miesto)}, ${S(r.kedy)}</p>
          <h3>${S(r.nazov)}</h3>
          <p class="nk-a2-stavba-perex">${S(r.perex)}</p>
          ${spec(fakty, 'nk-spec-biela nk-a2-spec')}
          <div class="nk-a2-stavba-akcie">${riadok(r.vyrobok.rad.url, r.riadok, r.rozsah)}<a class="odkaz nk-tichy" href="${r.zdroj}">Referencia na watts.eu ${ik('external-link', 15)}</a></div>
        </div>
      </article>`;
  };
  const orange = { ...R.orange, fotky: [{ ...R.orange.fotky[0], koty: [R.orange.fotky[0].koty[1]] }, ...R.orange.fotky.slice(1)] };
  return `
  <section class="nk-a2-hero" aria-labelledby="h1-ref">
    <div class="nk-a2-panel tma">
      <div class="nk-a2-panel-in">
        <div>
          ${CRUMBS}
          <h1 id="h1-ref">Referencie</h1>
          <p class="nk-a2-lead">${S('Stavby, na ktorých už potrubie Microflex vedie teplo: od rodinného domu s garážou po obytný súbor s 31 budovami.')}</p>
        </div>
        <div class="nk-a2-feat">
          <p class="nk-a-feat-meta">${pill(p)}<span>Považská Bystrica, ${S(p.rok)}</span></p>
          <p class="nk-a-feat-h">${S('Rozvod tepla pre 30 domov a bytový dom z jednej kotolne')}</p>
          <div class="nk-akcie"><a class="btn btn-inverse btn-lg" href="#povazska">Príbeh stavby ${ik('arrow-down')}</a><a class="nk-odkaz-tma" href="${DOPYT}">Poslať dopyt na projekt ${ik('arrow-right', 16)}</a></div>
        </div>
      </div>
    </div>
    ${foto(stav, { cls: 'nk-a2-hero-foto', pos: '42% 60%', ko: [{ l: 9 }] })}
  </section>
  <div class="telo nk-telo nk-a2-telo">
    <section class="wrap nk-a2-pribeh" id="povazska" aria-labelledby="h-povazska">
      <header class="nk-a2-pribeh-hlava">
        <p class="nk-kde">${S(p.miesto)}, ${S(p.kedy)}</p>
        <h2 id="h-povazska">${S(p.nazov)}</h2>
        <p class="nk-perex">${S(p.perex)}</p>
      </header>
      ${kap({ obr: foto(kotolna, { cls: 'nk-a2-foto', ko: [{ l: 10 }] }), nadpis: 'Jedna kotolňa pre celý súbor', text: 'Teplo pre všetky budovy vyrába kotolňa s dvoma kotlami ETA na pelety. Z nej vychádza rozvod z potrubia Microflex.' })}
      ${kap({ vpravo: true, obr: `<div class="nk-a2-studio">${diely('nk-a2-diely')}</div>`, nadpis: 'Potrubie aj diely z jednej dodávky', text: 'Dodali sme potrubie Microflex, pevné body, tesnenia a systémové príslušenstvo. Dodávky prebiehali od decembra 2022 do februára 2023.' })}
      ${kap({ obr: foto(vykop, { cls: 'nk-a2-foto', popis: true }), nadpis: 'Rozvod k 31 budovám', text: 'Potrubie vedie z kotolne k 30 rodinným domom a jednému bytovému domu.', extra: spec([['Napojené budovy', '30 rodinných domov a 1 bytový dom'], ['Revízne šachty', '4']]) })}
      ${kap({ vpravo: true, obr: `<div class="nk-a2-par">${foto(prestup, { koty: false })}${foto(napojenie, { koty: false })}</div>`, nadpis: 'Napojenie v budovách', text: 'Potrubie prechádza stenou do budovy a napája sa na jej rozvod.' })}
      <div class="harok nk-a2-zaver">
        <div class="nk-a2-zaver-dodal">
          <p>${S(p.realizacia)}</p>
          <a class="odkaz nk-tichy" href="${p.zdroj}">Referencia na watts.eu ${ik('external-link', 15)}</a>
        </div>
        <div class="nk-a2-zaver-cta">
          <h3>Pripravujete rozvod pre viac budov?</h3>
          <p>${S('Pošlite nám projekt. Ozveme sa s ponukou na potrubie, spojky aj príslušenstvo a s dostupnosťou.')}</p>
          <a class="btn btn-yellow btn-lg" href="${DOPYT}">Poslať dopyt na projekt ${ik('send')}</a>
        </div>
      </div>
    </section>
    <section class="wrap nk-a2-dalsie" aria-labelledby="h-dalsie">
      <div class="s-hlava"><h2 id="h-dalsie">Ďalšie stavby s potrubím Microflex</h2><p>${S('Referencie výrobcu Watts s inými dodávateľmi, na Slovensku aj vo Francúzsku.')}</p></div>
      <div class="nk-a2-stavby">${[orange, R.skola, R.fackov].map(stavba).join('')}</div>
    </section>
  </div>`;
}
const CSS_A2 = `
  .nk-a2-hero { position: relative; z-index: 2; height: clamp(600px, calc(100svh - 164px), 720px); background: linear-gradient(180deg, #f7fafd 0%, var(--zem-1) 100%); }
  .nk-a2-panel { position: absolute; inset: 0 auto 0 0; width: 62%; color: #fff; background: linear-gradient(170deg, #0e3676 0%, var(--color-blue-900) 70%);
    clip-path: polygon(0 0, 100% 0, 80% 100%, 0 100%); }
  .nk-a2-panel-in { display: flex; flex-direction: column; justify-content: space-between; height: 100%;
    padding: 0 24% 64px max(var(--gutter), calc((100vw - var(--container-site)) / 2 + var(--gutter))); }
  .nk-a2-panel h1 { margin-top: 28px; color: #fff; font-size: clamp(42px, 3vw + 14px, 64px); letter-spacing: -0.025em; }
  .nk-a2-lead { margin-top: 16px; max-width: 26em; font-size: 18px; line-height: 1.55; color: var(--color-on-dark-muted); }
  .nk-a2-feat .nk-a-feat-h { max-width: 14em; }
  /* Fotka cez hranu: z úvodu presahuje do tela, vpravo za okraj obrazovky. */
  .nk-a2-hero-foto { position: absolute; z-index: 2; top: 56px; bottom: -80px; right: 0; width: 50%; border-radius: var(--radius-xl) 0 0 var(--radius-xl); box-shadow: var(--elev-4); }
  .nk-a2-telo { padding-top: 144px; }
  .nk-a2-pribeh-hlava { max-width: 52em; margin-bottom: 64px; }
  .nk-a2-pribeh-hlava h2 { margin-top: 10px; font-size: clamp(30px, 1.7vw + 15px, 46px); letter-spacing: -0.022em; max-width: 17em; }
  .nk-a2-pribeh-hlava .nk-perex { margin-top: 16px; max-width: 42em; color: var(--color-ink-soft); }
  .nk-a2-kap { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 32px 64px; align-items: center; }
  .nk-a2-kap + .nk-a2-kap { margin-top: 88px; }
  .nk-a2-kap.vpravo { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); }
  .nk-a2-kap.vpravo .nk-a2-kap-obr { order: 2; }
  .nk-a2-foto { aspect-ratio: 16 / 10; box-shadow: var(--elev-4); }
  .nk-a2-kap-text h3 { font-size: clamp(24px, 0.8vw + 18px, 32px); line-height: 1.15; letter-spacing: -0.015em; }
  .nk-a2-kap-text > p { margin-top: 14px; max-width: 30em; font-size: 17px; line-height: 1.6; color: var(--color-ink-soft); }
  .nk-a2-kap-text .nk-spec { margin-top: 20px; }
  .nk-a2-studio { padding: 16px; border-radius: var(--radius-xl); background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-4); }
  .nk-a2-diely { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .nk-a2-diely .nk-diel { background: var(--color-blue-50); box-shadow: none; }
  .nk-a2-diely .nk-diel-foto { aspect-ratio: 16 / 9; }
  .nk-a2-par { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; }
  .nk-a2-par .nk-foto { aspect-ratio: 4 / 5; box-shadow: var(--elev-3); }
  .nk-a2-zaver { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 32px 48px; align-items: center; margin-top: 96px; padding: 24px 24px 24px 40px; }
  .nk-a2-zaver-dodal p { margin-bottom: 16px; font-size: 16px; line-height: 1.55; color: var(--color-ink); }
  .nk-a2-zaver-cta { padding: 28px 32px 32px; border-radius: var(--radius-l); background: var(--color-blue-50); }
  .nk-a2-zaver-cta h3 { font-size: 24px; line-height: 1.2; }
  .nk-a2-zaver-cta p { margin: 10px 0 20px; font-size: 16px; line-height: 1.55; color: var(--color-ink-soft); }
  .nk-a2-dalsie .s-hlava { margin-bottom: 32px; }
  .nk-a2-stavby { display: grid; gap: 24px; }
  .nk-a2-stavba { display: grid; grid-template-columns: minmax(0, 6fr) minmax(0, 6fr); gap: 32px 48px; align-items: center; padding: 16px 40px 16px 16px; scroll-margin-top: 110px; }
  .nk-a2-stavba-obr { display: grid; gap: 8px; }
  .nk-a2-stavba-foto { aspect-ratio: 16 / 10; border-radius: var(--radius-l); }
  .nk-a2-stavba-mini { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .nk-a2-stavba-mini .nk-foto { aspect-ratio: 16 / 10; border-radius: var(--radius-m); }
  .nk-a2-stavba-text h3 { margin-top: 8px; font-size: 26px; line-height: 1.15; letter-spacing: -0.015em; }
  .nk-a2-stavba-perex { margin-top: 12px; font-size: 16px; line-height: 1.6; color: var(--color-ink-soft); }
  .nk-a2-spec { margin-top: 16px; }
  .nk-a2-stavba-akcie { display: grid; justify-items: start; gap: 14px; margin-top: 20px; }
  .nk-a2-stavba-akcie .nk-riadok { justify-self: stretch; }
  @media (max-width: 1100px) and (min-width: 761px) {
    .nk-a2-panel { width: 70%; }
    .nk-a2-hero-foto { width: 44%; }
    .nk-a2-stavba { grid-template-columns: minmax(0, 1fr); padding: 16px; }
  }
  @media (max-width: 760px) {
    .nk-a2-hero { height: auto; }
    .nk-a2-panel { position: relative; inset: auto; width: auto; clip-path: polygon(0 0, 100% 0, 100% calc(100% - 40px), 0 100%); }
    .nk-a2-panel-in { height: auto; padding: 0 var(--gutter) 104px; }
    .nk-a2-panel h1 { margin-top: 8px; }
    .nk-a2-lead { font-size: 16px; }
    .nk-a2-feat { margin-top: 28px; }
    .nk-a2-hero-foto { position: relative; inset: auto; width: auto; aspect-ratio: 4 / 3; margin: -64px var(--gutter) 0; border-radius: var(--radius-l); }
    .nk-a2-telo { padding-top: 48px; }
    .nk-a2-pribeh-hlava { margin-bottom: 40px; }
    .nk-a2-pribeh-hlava h2 { font-size: 28px; }
    .nk-a2-kap, .nk-a2-kap.vpravo { grid-template-columns: minmax(0, 1fr); gap: 20px; }
    .nk-a2-kap.vpravo .nk-a2-kap-obr { order: 0; }
    .nk-a2-kap + .nk-a2-kap { margin-top: 56px; }
    .nk-a2-foto { aspect-ratio: 4 / 3; margin-inline: calc(-1 * var(--gutter)); border-radius: 0; }
    .nk-a2-studio { padding: 8px; }
    .nk-a2-diely { gap: 8px; }
    .nk-a2-par .nk-foto { aspect-ratio: 3 / 4; }
    .nk-a2-zaver { grid-template-columns: minmax(0, 1fr); margin-top: 64px; padding: 20px; }
    .nk-a2-zaver-cta { padding: 20px; }
    .nk-a2-zaver-cta .btn { width: 100%; justify-content: center; }
    .nk-a2-stavba { grid-template-columns: minmax(0, 1fr); gap: 20px; padding: 12px 12px 20px; }
    .nk-a2-stavba-text { padding-inline: 4px; }
    .nk-a2-stavba-text h3 { font-size: 22px; }
  }
`;

// A3 = mozaika fotiek: svetlý úvod s mozaikou troch fotiek Považskej a bielou kartou cez jej spodok, list údajov
// a dielov, ďalšie stavby ako tmavé karty.
function htmlA3() {
  const p = R.povazska;
  const [stav, kotolna, vykop, prestup, napojenie] = p.fotky;
  const karta = (r) => {
    const hl = r.fotky[0];
    return `
      <article class="nk-a3-karta" id="${r.id}">
        ${foto(hl, { cls: 'nk-a3-karta-foto', pos: r.id === 'fackov' ? '50% 70%' : '50% 50%', ko: hl.koty.map(() => ({ text: null, l: 10 })) })}
        <div class="nk-a3-karta-text tma">
          ${pill(r)}
          <h3>${S(r.nazov)}</h3>
          <p class="nk-a3-karta-kde">${S(r.miesto)}, ${S(r.kedy)}</p>
          <p class="nk-a3-karta-perex">${S(r.perex)}</p>
          <a class="nk-a3-karta-rad" href="${r.vyrobok.rad.url}"><span>${S(r.riadok)}</span><span class="pocet">${S(r.rozsah)}</span>${ik('chevron-right', 18)}</a>
        </div>
      </article>`;
  };
  const orange = { ...R.orange, fotky: [{ ...R.orange.fotky[0], koty: [R.orange.fotky[0].koty[1]] }, ...R.orange.fotky.slice(1)] };
  return `
  <section class="nk-a3-hero" aria-labelledby="h1-ref">
    <div class="wrap">
      ${CRUMBS}
      <div class="nk-a3-uvod">
        <h1 id="h1-ref">Referencie</h1>
        <p class="nk-a3-lead">${S('Stavby, na ktorých už potrubie Microflex vedie teplo: od rodinného domu s garážou po obytný súbor s 31 budovami.')}</p>
      </div>
      <div class="nk-a3-mozaika">
        ${foto(stav, { cls: 'nk-a3-m1', pos: '40% 65%', ko: [{ l: 9 }], navrch: pill(p) })}
        ${foto(kotolna, { cls: 'nk-a3-m2', ko: [{ l: 9 }] })}
        ${foto(vykop, { cls: 'nk-a3-m3', popis: true })}
      </div>
      <div class="nk-a3-pod">
        <div class="harok nk-a3-titul" id="povazska">
          <p class="nk-kde">${S(p.miesto)}, ${S(p.kedy)}</p>
          <h2 id="h-povazska">${S(p.nazov)}</h2>
          <p class="nk-perex">${S(p.perex)}</p>
          <div class="nk-akcie"><a class="btn btn-primary btn-lg" href="${DOPYT}">Poslať dopyt na projekt ${ik('send')}</a><a class="odkaz" href="#udaje">Diely z dodávky ${ik('arrow-down', 16)}</a></div>
        </div>
        <div class="nk-a3-udaje-bok">
          ${spec(p.fakty.filter(([a]) => a !== 'Dodávka'))}
          <p class="nk-a3-dodal">${S(p.realizacia)}</p>
          <a class="odkaz nk-tichy" href="${p.zdroj}">Referencia na watts.eu ${ik('external-link', 15)}</a>
        </div>
      </div>
    </div>
  </section>
  <div class="telo nk-telo nk-a3-telo">
    <section class="wrap nk-a3-udaje" id="udaje" aria-label="Diely z dodávky v Považskej Bystrici">
      <div class="harok nk-a3-list">
        <div class="nk-a3-list-text">
          <h3>Čo patrilo k dodávke</h3>
          <p>${S('Potrubie Microflex, pevné body, tesnenia prestupov stenou a systémové príslušenstvo. Na trase sú 4 revízne šachty.')}</p>
          <a class="odkaz" href="/prislusenstvo/">Príslušenstvo k potrubiu ${ik('arrow-right', 16)}</a>
        </div>
        ${diely('nk-a3-diely')}
      </div>
      <div class="nk-a3-pas">${[prestup, napojenie].map((f) => foto(f, { popis: true })).join('')}</div>
    </section>
    <section class="wrap nk-a3-dalsie" aria-labelledby="h-dalsie">
      <div class="s-hlava"><h2 id="h-dalsie">Ďalšie stavby s potrubím Microflex</h2><p>${S('Referencie výrobcu Watts s inými dodávateľmi, na Slovensku aj vo Francúzsku.')}</p></div>
      <div class="nk-a3-karty">${[orange, R.skola, R.fackov].map(karta).join('')}</div>
    </section>
  </div>`;
}
const CSS_A3 = `
  .nk-a3-hero { position: relative; z-index: 2; padding-bottom: 8px; background: linear-gradient(180deg, #f7fafd 0%, var(--zem-1) 100%); }
  .nk-a3-uvod { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 16px 48px; align-items: end; margin: 8px 0 28px; }
  .nk-a3-uvod h1 { font-size: clamp(42px, 3vw + 14px, 64px); letter-spacing: -0.025em; }
  .nk-a3-lead { max-width: 36em; font-size: 17px; line-height: 1.55; color: var(--color-ink-soft); }
  .nk-a3-mozaika { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); grid-template-rows: repeat(2, clamp(180px, 17vw, 270px)); gap: 12px; }
  .nk-a3-m1 { grid-column: 1 / 9; grid-row: 1 / 3; box-shadow: var(--elev-4); }
  .nk-a3-m2 { grid-column: 9 / 13; grid-row: 1; box-shadow: var(--elev-3); }
  .nk-a3-m3 { grid-column: 9 / 13; grid-row: 2; box-shadow: var(--elev-3); }
  /* Biela karta s názvom stavby leží cez spodok mozaiky; vpravo pod mozaikou údaje stavby. */
  .nk-a3-pod { position: relative; z-index: 3; display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 32px 48px; align-items: start; margin-top: -72px; padding-left: 32px; }
  .nk-a3-titul { padding: 28px 32px 32px; }
  .nk-a3-titul h2 { margin-top: 8px; font-size: clamp(28px, 1.4vw + 16px, 40px); letter-spacing: -0.02em; }
  .nk-a3-titul .nk-perex { margin-top: 12px; color: var(--color-ink-soft); }
  .nk-a3-titul .nk-akcie { margin-top: 24px; }
  .nk-a3-udaje-bok { padding-top: 96px; }
  .nk-a3-udaje-bok .nk-spec { margin-top: 0; }
  .nk-a3-udaje-bok .nk-spec > div { background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-1); }
  .nk-a3-dodal { margin: 16px 0 12px; font-size: 15px; line-height: 1.55; color: var(--color-ink-soft); }
  .nk-a3-telo { padding-top: 72px; }
  .nk-a3-udaje { scroll-margin-top: 110px; }
  .nk-a3-list { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: 24px 48px; align-items: center; padding: 32px; }
  .nk-a3-list h3 { font-size: 24px; line-height: 1.2; }
  .nk-a3-list-text p { margin: 12px 0 20px; font-size: 16px; line-height: 1.55; color: var(--color-ink-soft); }
  .nk-a3-diely .nk-diel { background: var(--color-blue-50); box-shadow: none; }
  .nk-a3-pas { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; margin-top: 16px; }
  .nk-a3-pas .nk-foto { aspect-ratio: 16 / 9; box-shadow: var(--elev-3); }
  .nk-a3-dalsie .s-hlava { margin-bottom: 32px; }
  .nk-a3-karty { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
  .nk-a3-karta { display: flex; flex-direction: column; overflow: hidden; border-radius: var(--radius-xl); background: linear-gradient(170deg, #0e3676 0%, var(--color-blue-900) 100%); color: #fff; box-shadow: var(--elev-4); scroll-margin-top: 110px; }
  .nk-a3-karta-foto { aspect-ratio: 4 / 3; border-radius: 0; }
  .nk-a3-karta-text { display: flex; flex-direction: column; align-items: flex-start; flex: 1; padding: 20px 24px 24px; }
  .nk-a3-karta h3 { margin-top: 14px; color: #fff; font-size: 22px; line-height: 1.2; }
  .nk-a3-karta-kde { margin-top: 6px; font-size: 14px; color: var(--color-on-dark-muted); }
  .nk-a3-karta-perex { margin: 12px 0 20px; font-size: 15px; line-height: 1.55; color: var(--color-on-dark-muted); }
  .nk-a3-karta-rad { display: flex; align-items: center; gap: 12px; align-self: stretch; margin-top: auto; padding: 12px 14px 12px 16px; border-radius: var(--radius-m);
    background: rgb(255 255 255 / 0.08); box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.16); color: #fff; font-size: 15px; font-weight: 600; line-height: 1.25; }
  .nk-a3-karta-rad:hover { background: rgb(255 255 255 / 0.14); color: #fff; }
  .nk-a3-karta-rad .pocet { margin-left: auto; flex: none; font-weight: 400; font-size: 14px; color: var(--color-on-dark-muted); }
  @media (max-width: 1100px) and (min-width: 761px) {
    .nk-a3-pod, .nk-a3-list { grid-template-columns: minmax(0, 1fr); }
    .nk-a3-udaje-bok { padding-top: 0; }
    .nk-a3-karty { grid-template-columns: minmax(0, 1fr); }
  }
  @media (max-width: 760px) {
    .nk-a3-uvod { grid-template-columns: minmax(0, 1fr); margin-bottom: 20px; }
    .nk-a3-lead { font-size: 16px; }
    .nk-a3-mozaika { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-rows: auto auto; gap: 8px; }
    .nk-a3-m1 { grid-column: 1 / -1; grid-row: 1; aspect-ratio: 4 / 3; border-radius: var(--radius-l); }
    .nk-a3-m2 { grid-column: 1; grid-row: 2; aspect-ratio: 1; border-radius: var(--radius-l); }
    .nk-a3-m3 { grid-column: 2; grid-row: 2; aspect-ratio: 1; border-radius: var(--radius-l); }
    .nk-a3-m2 .stitok span, .nk-a3-m3 .nk-popis { display: none; }
    .nk-a3-pod { grid-template-columns: minmax(0, 1fr); gap: 16px; margin-top: -32px; padding: 0 8px; }
    .nk-a3-titul { padding: 20px; }
    .nk-a3-titul h2 { font-size: 24px; }
    .nk-a3-udaje-bok { padding: 8px 0 0; }
    .nk-a3-telo { padding-top: 40px; }
    .nk-a3-list { grid-template-columns: minmax(0, 1fr); padding: 20px 16px; }
    .nk-a3-pas { grid-template-columns: minmax(0, 1fr); gap: 8px; }
    .nk-a3-karty { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  }
`;

// ---------- B: Prehľad stavieb (dlaždice ako katalóg na domove, pod nimi list každej stavby) ----------
function htmlB() {
  const dlazdica = (r, cls, { pos = '50% 50%', ko = [], riadokHref, riadokText, pocet }) => `
    <article class="nk-b-dl ${cls}">
      <header class="nk-b-dl-hlava">
        ${r.vyrobok ? `<img class="nk-b-celo" src="${A_(r.vyrobok.rad.celo)}" alt="">` : ''}
        <div class="nk-b-dl-tit"><h2 class="nk-b-dl-h"><a href="#${r.id}">${S(r.typ)}</a></h2><p class="nk-b-dl-meta">${S(r.mesto)}, ${S(r.rok)}</p></div>
      </header>
      ${foto(r.fotky[0], { cls: 'nk-b-dl-foto', pos, ko, navrch: pill(r) })}
      ${riadok(riadokHref, riadokText, pocet)}
    </article>`;
  const list = (r) => {
    // Pri Považskej je na dlaždici stavenisko, v liste ide prvá kotolňa (s kótou výkonu).
    const fotky = r.id === 'povazska' ? [r.fotky[1], r.fotky[0], ...r.fotky.slice(2)] : r.fotky;
    return `
    <section class="wrap nk-b-list" id="${r.id}" aria-labelledby="h-${r.id}">
      <div class="harok nk-b-harok">
        <header class="nk-b-list-hlava">
          <div><p class="nk-kde">${S(r.miesto)}, ${S(r.kedy)}</p><h2 id="h-${r.id}">${S(r.nazov)}</h2></div>
          ${pill(r)}
        </header>
        <div class="nk-b-list-telo">
          <div class="nk-b-fotky" data-n="${fotky.length}">${fotky.map((f, i) => foto(f, { koty: i === 0, ko: [{ l: 9 }, { l: 9 }] })).join('')}</div>
          <div class="nk-b-udaje">
            <p class="nk-perex">${S(r.perex)}</p>
            ${spec(r.fakty, 'nk-spec-biela')}
            <p class="nk-b-realizacia">${S(r.realizacia)}</p>
            <div class="nk-b-akcie">
              ${r.vyrobok ? riadok(r.vyrobok.rad.url, `Rad ${r.vyrobok.rad.kratko}`, 'rozmery a obj. čísla') : riadok(DOPYT, 'Dopyt na podobný projekt', 'ozveme sa s ponukou')}
              <a class="odkaz nk-tichy" href="${r.zdroj}">Referencia na watts.eu ${ik('external-link', 15)}</a>
            </div>
          </div>
        </div>
      </div>
    </section>`;
  };
  return `
  <section class="nk-b-hlava">
    <div class="wrap">
      ${CRUMBS}
      <div class="nk-b-uvod">
        <h1>Referencie</h1>
        <div class="nk-b-uvod-text">
          <p>${S('Štyri stavby s potrubím Microflex: obytný súbor, vojenská základňa, škola a rodinný dom. Pri každej je rad potrubia, dĺžka rozvodu a fotky zo stavby.')}</p>
          <a class="odkaz" href="${DOPYT}">Poslať dopyt na projekt ${ik('arrow-right', 16)}</a>
        </div>
      </div>
      <div class="nk-b-bento">
        ${dlazdica(R.povazska, 'nk-b-povazska', { pos: '40% 70%', ko: [{ l: 10 }], riadokHref: '#povazska', riadokText: 'Kotolňa, trasa a napojenie budov', pocet: '6 fotiek' })}
        ${dlazdica(R.orange, 'nk-b-orange', { pos: '50% 50%', ko: [{ smer: 'hore-vpravo', l: 13 }, { smer: 'hore-vlavo', l: 16 }], riadokHref: RAD.uno.url, riadokText: 'Microflex UNO 6 bar', pocet: 'Ø 63 až 90 mm' })}
        ${dlazdica(R.fackov, 'nk-b-fackov', { pos: '50% 80%', ko: [{ smer: 'hore-vlavo', l: 16, text: 'potrubia' }], riadokHref: RAD.primoDuo.url, riadokText: 'Microflex PRIMO DUO 6 bar', pocet: '125/2 × 25' })}
        ${dlazdica(R.skola, 'nk-b-skola', { pos: '60% 50%', ko: [{ smer: 'dole-vlavo', l: 10, text: 'potrubia' }], riadokHref: RAD.unoPrimo.url, riadokText: 'Microflex UNO PRIMO 6 bar', pocet: '125/63 × 5,8' })}
        <aside class="nk-b-dl nk-b-cta">
          <div>
            <h2 class="nk-b-cta-h">Pripravujete podobnú stavbu?</h2>
            <p>${S('Pošlite nám projekt. Ozveme sa s ponukou na potrubie, spojky aj príslušenstvo a s dostupnosťou.')}</p>
          </div>
          <div class="nk-b-cta-akcie">
            <a class="nk-b-cta-odkaz" href="${DOPYT}">Poslať dopyt na projekt ${ik('arrow-right', 18)}</a>
            <a class="nk-b-cta-tel" href="${TEL.href}">${ik('phone', 16)} ${TEL.text}</a>
          </div>
        </aside>
      </div>
    </div>
  </section>
  <div class="telo nk-telo">${PORADIE.map((id) => list(R[id])).join('')}</div>`;
}
const CSS_B = `
  .nk-b-hlava { position: relative; padding-bottom: 64px; background: linear-gradient(180deg, #f7fafd 0%, var(--zem-1) 100%); }
  .nk-b-uvod { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 16px 48px; align-items: end; margin: 8px 0 32px; }
  .nk-b-uvod h1 { font-size: clamp(42px, 3vw + 14px, 64px); letter-spacing: -0.025em; }
  .nk-b-uvod-text { display: grid; justify-items: start; gap: 12px; }
  .nk-b-uvod-text p { max-width: 36em; font-size: 17px; line-height: 1.55; color: var(--color-ink-soft); }
  .nk-b-bento { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px; }
  .nk-b-dl { display: flex; flex-direction: column; gap: 16px; min-width: 0; padding: 20px; border-radius: var(--radius-xl);
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.05), var(--elev-3); color: var(--color-ink); }
  .nk-b-dl-hlava { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .nk-b-celo { flex: none; width: 48px; height: 48px; border-radius: 50%; object-fit: cover; background: #fff; box-shadow: 0 0 0 1px rgb(10 42 94 / 0.1), var(--elev-1); }
  .nk-b-dl-tit { min-width: 0; }
  .nk-b-dl-h { font-size: 24px; line-height: 1.15; letter-spacing: -0.012em; }
  .nk-b-dl-h a { color: var(--color-ink); }
  .nk-b-dl-meta { margin-top: 4px; font-size: 14px; color: var(--color-ink-soft); }
  .nk-b-dl-foto { flex: 1; min-height: 220px; border-radius: var(--radius-l); }
  .nk-b-povazska { grid-column: 1 / 8; grid-row: 1 / 3; }
  .nk-b-povazska .nk-b-dl-foto { min-height: 400px; }
  .nk-b-orange { grid-column: 8 / 13; grid-row: 1 / 3; }
  .nk-b-fackov { grid-column: 1 / 5; }
  .nk-b-skola { grid-column: 5 / 9; }
  .nk-b-fackov .nk-b-dl-foto, .nk-b-skola .nk-b-dl-foto { min-height: 240px; }
  .nk-b-cta { grid-column: 9 / 13; justify-content: space-between; padding: 28px; background: linear-gradient(170deg, #0e3676 0%, var(--color-blue-900) 100%); color: #fff; box-shadow: var(--elev-3); }
  .nk-b-cta-h { color: #fff; font-size: 26px; line-height: 1.15; }
  .nk-b-cta p { margin-top: 12px; font-size: 15px; line-height: 1.55; color: var(--color-on-dark-muted); }
  .nk-b-cta-akcie { display: grid; gap: 16px; justify-items: start; }
  .nk-b-cta-odkaz { display: inline-flex; align-items: center; gap: 10px; font-family: var(--font-display); font-stretch: 112.5%; font-size: 18px; font-weight: 600; color: #fff; }
  .nk-b-cta-tel { display: inline-flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 500; color: var(--color-on-dark-muted); }
  .nk-b-cta a:hover { color: #fff; }
  .nk-b-list { scroll-margin-top: 110px; }
  .nk-b-harok { padding: 32px; }
  .nk-b-list-hlava { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
  .nk-b-list-hlava h2 { margin-top: 8px; font-size: clamp(26px, 1.2vw + 15px, 36px); letter-spacing: -0.02em; max-width: 22em; }
  .nk-b-list-telo { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 32px 40px; align-items: start; }
  .nk-b-fotky { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); grid-auto-rows: clamp(96px, 9vw, 140px); gap: 8px; }
  .nk-b-fotky .nk-foto { grid-column: span 2; border-radius: var(--radius-m); }
  .nk-b-fotky .nk-foto:first-child { grid-column: span 4; grid-row: span 2; border-radius: var(--radius-l); }
  .nk-b-fotky[data-n="5"] .nk-foto:nth-child(n+4) { grid-column: span 3; }
  .nk-b-fotky[data-n="2"] .nk-foto:nth-child(2) { grid-row: span 2; }
  .nk-b-udaje .nk-spec { margin-top: 20px; }
  .nk-b-realizacia { margin-top: 16px; font-size: 14px; line-height: 1.5; color: var(--color-ink-soft); }
  .nk-b-akcie { display: grid; justify-items: start; gap: 16px; margin-top: 24px; }
  .nk-b-akcie .nk-riadok { justify-self: stretch; }
  @media (max-width: 1100px) {
    .nk-b-povazska, .nk-b-orange { grid-column: 1 / -1; grid-row: auto; }
    .nk-b-fackov, .nk-b-skola { grid-column: span 6; }
    .nk-b-cta { grid-column: 1 / -1; }
    .nk-b-list-telo { grid-template-columns: minmax(0, 1fr); }
  }
  @media (max-width: 760px) {
    .nk-b-uvod { grid-template-columns: minmax(0, 1fr); margin-bottom: 24px; }
    .nk-b-uvod-text p { font-size: 16px; }
    .nk-b-bento { grid-template-columns: minmax(0, 1fr); gap: 12px; }
    .nk-b-bento > * { grid-column: 1 / -1 !important; grid-row: auto !important; }
    .nk-b-dl { padding: 16px; gap: 12px; }
    .nk-b-dl-h { font-size: 20px; }
    .nk-b-celo { width: 40px; height: 40px; }
    .nk-b-dl-foto, .nk-b-povazska .nk-b-dl-foto, .nk-b-fackov .nk-b-dl-foto, .nk-b-skola .nk-b-dl-foto { flex: none; min-height: 0; aspect-ratio: 4 / 3; }
    .nk-b-cta { padding: 20px; gap: 20px; }
    .nk-b-harok { padding: 20px 16px; }
    .nk-b-list-hlava { flex-direction: column-reverse; gap: 12px; }
    .nk-b-list-hlava h2 { font-size: 24px; }
    .nk-b-fotky { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: auto; gap: 6px; margin-inline: -4px; }
    .nk-b-fotky .stitok span.dlhy { display: none; }
    .nk-b-fotky .nk-foto, .nk-b-fotky[data-n="5"] .nk-foto:nth-child(n+4) { grid-column: span 1; grid-row: auto; aspect-ratio: 4 / 3; }
    .nk-b-fotky .nk-foto:first-child { grid-column: 1 / -1; grid-row: auto; }
    .nk-b-fotky[data-n="2"] .nk-foto:nth-child(2) { grid-column: 1 / -1; }
    .nk-b-fotky[data-n="6"] .nk-foto:last-child, .nk-b-fotky[data-n="5"] .nk-foto:last-child { grid-column: 1 / -1; aspect-ratio: 2 / 1; }
  }
`;

// ---------- C: Stavba a výrobok (zoznam stavieb v tmavej hlave, pri fotke presný výrobok s kúpou) ----------
function htmlC() {
  const vyrobok = (r) => {
    if (!r.vyrobok) return `
      <aside class="nk-c-vyrobok nk-c-dodavka">
        <p class="nk-c-nad">Čo sme dodali</p>
        <h3>${S(r.potrubie)}</h3>
        ${diely('nk-c-diely')}
        <p class="nk-c-dodal">${S(r.realizacia)}</p>
        <a class="btn btn-primary btn-lg" href="${DOPYT}">Poslať dopyt na projekt ${ik('send')}</a>
        <a class="odkaz" href="/pre-firmy/">Pre projektantov a montážne firmy ${ik('arrow-right', 16)}</a>
      </aside>`;
    const v = r.vyrobok;
    return `
      <aside class="nk-c-vyrobok">
        <p class="nk-c-nad">Na stavbe leží</p>
        <h3>${S(v.nazov)}</h3>
        ${foto({ koty: v.koty }, { cls: 'nk-c-studio', render: true, src: A_(v.render), pos: '50% 100%' })}
        <dl class="nk-c-param">${v.param.map(([a, b]) => `<div><dt>${a}</dt><dd>${S(b)}</dd></div>`).join('')}</dl>
        <a class="btn btn-yellow btn-lg" href="${v.akcia.href}">${S(v.akcia.text)} ${ik(v.akcia.ikona)}</a>
        <a class="odkaz" href="${v.odkaz.href}">${S(v.odkaz.text)} ${ik('arrow-right', 16)}</a>
      </aside>`;
  };
  const stavba = (r, i) => {
    const fakty = r.fakty.filter(([a]) => !['Potrubie', 'Dĺžka', 'Dodávka'].includes(a));
    const nahlady = r.fotky.slice(1, 5);
    return `
    <section class="wrap nk-c-stavba${i % 2 ? ' vpravo' : ''}" id="${r.id}" aria-labelledby="h-${r.id}">
      <header class="nk-c-stavba-hlava">
        <div>
          <p class="nk-c-meta">${pill(r)}<span class="nk-kde">${S(r.miesto)}, ${S(r.kedy)}</span></p>
          <h2 id="h-${r.id}">${S(r.nazov)}</h2>
        </div>
        <p class="nk-perex">${S(r.perex)}</p>
      </header>
      <div class="nk-c-par">
        <div class="nk-c-foto-stlpec">
          ${foto(r.fotky[0], { cls: 'nk-c-hlavna', pos: r.id === 'fackov' ? '50% 75%' : '50% 50%', ko: r.id === 'orange' ? [{}, { smer: 'hore-vpravo' }] : [] })}
          ${nahlady.length ? `<div class="nk-c-nahlady" data-n="${nahlady.length}">${nahlady.map((f) => foto(f, { koty: false })).join('')}</div>` : ''}
        </div>
        ${vyrobok(r)}
      </div>
      <p class="nk-c-fakty">${fakty.map(([a, b]) => `<span>${a}: <b>${S(b)}</b></span>`).join('')}${r.vyrobok ? `<span>${S(r.realizacia)}</span>` : ''}<a class="odkaz nk-tichy" href="${r.zdroj}">Referencia na watts.eu ${ik('external-link', 15)}</a></p>
    </section>`;
  };
  const riadokIndex = (r) => `
    <li><a class="nk-c-riadok" href="#${r.id}">
      <img class="nk-c-thumb" src="${F(r.fotky[0].f)}" alt="">
      <span class="nk-c-riadok-text">
        <strong>${S(r.kratko)}</strong>
        <span class="nk-c-riadok-kde">${S(r.miesto)}, ${S(r.rok)}${r.nasa ? ` ${pill(r)}` : ''}</span>
      </span>
      <span class="nk-c-riadok-vyr"><img src="${A_(r.vyrobok ? r.vyrobok.rad.celo : '3d/kotuc/kotuc.webp')}" alt=""${r.vyrobok ? '' : ' class="kotuc"'}>${S(r.potrubie)}</span>
      <span class="nk-c-rozsah"><strong>${S(r.rozsah)}</strong><span>${S(r.rozsahPopis)}</span></span>
      ${ik('chevron-right', 20)}
    </a></li>`;
  return `
  <section class="nk-c-hlava tma" aria-labelledby="h1-ref">
    <div class="wrap">
      ${CRUMBS}
      <div class="nk-c-uvod">
        <h1 id="h1-ref">Referencie</h1>
        <div class="nk-c-uvod-text">
          <p class="nk-c-lead">${S('Stavby, na ktorých už potrubie Microflex leží. Pri každej je presný výrobok, ktorý tam bol použitý: rozmery, obj. číslo a kúpa v e-shope.')}</p>
          <p class="nk-c-kontakt">${ik('phone', 16)}<span>Poradíme s podobnou stavbou: <a href="${TEL.href}">${TEL.text}</a></span></p>
        </div>
      </div>
    </div>
  </section>
  <div class="telo nk-telo nk-c-telo">
    <div class="wrap nk-c-index-obal">
      <div class="harok nk-c-index">
        <p class="nk-c-index-hlava" aria-hidden="true"><span>Stavba</span><span>Potrubie na stavbe</span><span>Rozsah</span></p>
        <ol aria-label="Stavby na tejto stránke">${PORADIE.map((id) => riadokIndex(R[id])).join('')}</ol>
      </div>
    </div>
    ${PORADIE.map((id, i) => stavba(R[id], i)).join('')}
  </div>`;
}
const CSS_C = `
  /* Tmavá hlava s nadpisom; zoznam stavieb je biela tabuľka, ktorá leží cez ohnutú hranu do tela. */
  .nk-c-hlava { position: relative; isolation: isolate; padding: 0 0 calc(var(--presah-hero) + 180px); background: linear-gradient(170deg, #0e3676 0%, var(--color-blue-900) 62%); color: #fff; }
  .nk-c-hlava::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: var(--presah-hero); background: var(--zem-1);
    -webkit-mask: var(--hrana-ohyb) no-repeat 0 0 / 100% 100%; mask: var(--hrana-ohyb) no-repeat 0 0 / 100% 100%; }
  .nk-c-uvod { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 16px 48px; align-items: end; margin-top: 16px; }
  .nk-c-uvod h1 { color: #fff; font-size: clamp(42px, 3vw + 14px, 64px); letter-spacing: -0.025em; }
  .nk-c-lead { max-width: 36em; font-size: 18px; line-height: 1.55; color: var(--color-on-dark-muted); }
  .nk-c-kontakt { display: flex; align-items: center; gap: 10px; margin-top: 16px; font-size: 15px; color: var(--color-on-dark-muted); }
  .nk-c-kontakt .ik { color: #fff; }
  .nk-c-kontakt a { font-weight: 600; color: #fff; white-space: nowrap; border-bottom: 1px solid rgb(255 255 255 / 0.5); }
  /* flow-root: záporný okraj tabuľky nesmie stiahnuť nahor celé telo (zlučovanie okrajov). */
  .nk-c-telo { display: flow-root; padding-top: 0; }
  .nk-c-index-obal { position: relative; z-index: 5; margin-top: calc(-1 * (var(--presah-hero) + 140px)); }
  .nk-c-index { padding: 12px 16px 16px; }
  .nk-c-index-hlava, .nk-c-riadok { display: grid; grid-template-columns: 112px minmax(0, 1.2fr) minmax(0, 1fr) 150px 20px; column-gap: 24px; align-items: center; }
  .nk-c-index-hlava { padding: 6px 12px 10px 8px; font-size: 13px; font-weight: 500; color: var(--color-ink-soft); }
  .nk-c-index-hlava span:first-child { grid-column: 1 / 3; }
  .nk-c-index-hlava span:nth-child(3) { grid-column: 4; text-align: right; }
  .nk-c-index ol { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
  .nk-c-riadok { padding: 8px 12px 8px 8px; border-radius: var(--radius-l); background: var(--color-blue-50); color: var(--color-ink); transition: background 150ms var(--ease-soft); }
  .nk-c-riadok:hover { background: var(--color-blue-100); color: var(--color-ink); }
  .nk-c-thumb { width: 112px; height: 76px; object-fit: cover; border-radius: var(--radius-m); }
  .nk-c-riadok-text { display: grid; gap: 6px; min-width: 0; }
  .nk-c-riadok-text strong { font: 600 18px/1.2 var(--font-display); font-stretch: 112.5%; letter-spacing: -0.01em; }
  .nk-c-riadok-kde { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; font-size: 14px; color: var(--color-ink-soft); }
  .nk-c-riadok-kde .nk-pill { height: 24px; padding: 0 10px; font-size: 13px; }
  .nk-c-riadok-vyr { display: flex; align-items: center; gap: 12px; min-width: 0; font-size: 15px; font-weight: 500; line-height: 1.3; }
  .nk-c-riadok-vyr img { flex: none; width: 36px; height: 36px; border-radius: 50%; object-fit: cover; background: #fff; box-shadow: 0 0 0 1px rgb(10 42 94 / 0.1), var(--elev-1); }
  .nk-c-riadok-vyr img.kotuc { object-position: 50% 28%; }
  .nk-c-rozsah { display: grid; justify-items: end; gap: 4px; text-align: right; }
  .nk-c-rozsah strong { font: 600 26px/1 var(--font-display); font-stretch: 118%; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--color-blue-900); }
  .nk-c-rozsah span { font-size: 13px; color: var(--color-ink-soft); }
  .nk-c-riadok > .ik { color: var(--color-blue-700); }
  .nk-c-index-obal + .nk-c-stavba { margin-top: 96px; }
  .nk-c-stavba { scroll-margin-top: 110px; }
  .telo > .nk-c-stavba + .nk-c-stavba { margin-top: 128px; }
  .nk-c-stavba-hlava { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 16px 48px; align-items: end; margin-bottom: 28px; }
  .nk-c-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; }
  .nk-c-stavba-hlava h2 { margin-top: 12px; font-size: clamp(28px, 1.5vw + 15px, 42px); letter-spacing: -0.022em; max-width: 17em; }
  .nk-c-stavba-hlava .nk-perex { max-width: 30em; color: var(--color-ink-soft); }
  .nk-c-par { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 24px; align-items: stretch; }
  .nk-c-stavba.vpravo .nk-c-par { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); }
  .nk-c-stavba.vpravo .nk-c-foto-stlpec { order: 2; }
  .nk-c-foto-stlpec { display: grid; grid-template-rows: minmax(0, 1fr) auto; gap: 12px; min-width: 0; }
  .nk-c-hlavna { min-height: 420px; box-shadow: var(--elev-4); }
  .nk-c-nahlady { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
  .nk-c-nahlady[data-n="1"] { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .nk-c-nahlady[data-n="2"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .nk-c-nahlady .nk-foto { aspect-ratio: 4 / 3; border-radius: var(--radius-l); box-shadow: var(--elev-1); }
  .nk-c-nahlady[data-n="1"] .nk-foto, .nk-c-nahlady[data-n="2"] .nk-foto { aspect-ratio: 16 / 9; }
  .nk-c-nahlady .nk-popis { left: 8px; bottom: 8px; max-width: calc(100% - 16px); padding: 4px 8px; font-size: 12px; }
  .nk-c-vyrobok { display: flex; flex-direction: column; min-width: 0; padding: 24px; border-radius: var(--radius-xl); background: #fff; box-shadow: inset 0 0 0 1px rgb(10 42 94 / 0.06), var(--elev-3); }
  .nk-c-nad { font-size: 14px; font-weight: 500; color: var(--color-ink-soft); }
  .nk-c-vyrobok h3 { margin-top: 4px; font-size: 22px; line-height: 1.2; letter-spacing: -0.01em; }
  .nk-c-studio { aspect-ratio: 1.02; margin: 8px 0 0; border-radius: var(--radius-l); background: radial-gradient(70% 62% at 52% 46%, #ffffff 0%, #f1f5fa 66%, #e6edf6 100%); }
  .nk-c-param { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; margin: 16px 0 0; }
  .nk-c-param > div { padding: 10px 12px; border-radius: var(--radius-m); background: var(--color-blue-50); }
  .nk-c-param dt { font-size: 13px; color: var(--color-ink-soft); }
  .nk-c-param dd { margin: 4px 0 0; font: 600 17px/1.2 var(--font-display); font-stretch: 112.5%; font-variant-numeric: tabular-nums; color: var(--color-ink); }
  .nk-c-vyrobok .btn { width: 100%; justify-content: center; margin-top: 20px; }
  .nk-c-vyrobok .odkaz { align-self: flex-start; margin-top: 16px; font-size: 15px; }
  .nk-c-diely { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 16px; }
  .nk-c-diely .nk-diel { background: var(--color-blue-50); box-shadow: none; }
  .nk-c-dodal { margin-top: 16px; font-size: 14px; line-height: 1.5; color: var(--color-ink-soft); }
  .nk-c-fakty { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 28px; margin-top: 20px; font-size: 15px; color: var(--color-ink-soft); }
  .nk-c-fakty b { font-weight: 600; color: var(--color-ink); }
  @media (max-width: 1100px) {
    .nk-c-uvod { grid-template-columns: minmax(0, 1fr); }
    .nk-c-par, .nk-c-stavba.vpravo .nk-c-par, .nk-c-stavba-hlava { grid-template-columns: minmax(0, 1fr); }
    .nk-c-stavba.vpravo .nk-c-foto-stlpec { order: 0; }
  }
  @media (max-width: 900px) {
    .nk-c-index-hlava { display: none; }
    .nk-c-riadok { grid-template-columns: 96px minmax(0, 1fr) auto; row-gap: 4px; column-gap: 16px; }
    .nk-c-riadok-vyr, .nk-c-riadok > .ik { display: none; }
  }
  @media (max-width: 760px) {
    .nk-c-hlava { padding-bottom: calc(var(--presah-hero) + 120px); }
    .nk-c-uvod { margin-top: 8px; }
    .nk-c-lead { font-size: 16px; }
    .nk-c-kontakt { margin-top: 16px; }
    .nk-c-index-obal { margin-top: calc(-1 * (var(--presah-hero) + 104px)); }
    .nk-c-index { padding: 8px; }
    .nk-c-riadok { grid-template-columns: 80px minmax(0, 1fr); column-gap: 12px; }
    .nk-c-thumb { grid-row: 1 / 3; width: 80px; height: 80px; }
    .nk-c-riadok-text strong { font-size: 16px; }
    .nk-c-rozsah { grid-column: 2; display: flex; align-items: baseline; gap: 8px; justify-items: start; text-align: left; }
    .nk-c-rozsah strong { font-size: 20px; }
    .nk-c-index-obal + .nk-c-stavba { margin-top: 64px; }
    .telo > .nk-c-stavba + .nk-c-stavba { margin-top: 88px; }
    .nk-c-stavba-hlava h2 { font-size: 26px; }
    .nk-c-hlavna { min-height: 0; aspect-ratio: 4 / 3; margin-inline: calc(-1 * var(--gutter)); border-radius: 0; }
    .nk-c-nahlady, .nk-c-nahlady[data-n="1"] { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .nk-c-nahlady .nk-foto, .nk-c-nahlady[data-n="1"] .nk-foto { aspect-ratio: 4 / 3; }
    .nk-c-vyrobok { padding: 16px; }
    .nk-c-fakty { gap: 6px; flex-direction: column; }
  }
`;

// ---------- v prehliadači ----------
function VLOZ(html, css) {
  const s = document.createElement('style');
  s.textContent = css;
  document.head.append(s);
  document.querySelector('section.hlava')?.remove();
  document.querySelector('main > .telo')?.remove();
  document.querySelector('section.zaver').insertAdjacentHTML('beforebegin', html);
}
// Bod kóty v percentách pôvodnej fotky prepočíta na výrez (object-fit cover alebo contain, object-position).
function OSAD() {
  const osad = () => document.querySelectorAll('.nk-foto').forEach((fig) => {
    const img = fig.querySelector(':scope > img');
    if (!img || !img.naturalWidth) return;
    const W = fig.clientWidth, H = fig.clientHeight, w = img.naturalWidth, h = img.naturalHeight;
    const cs = getComputedStyle(img);
    const s = cs.objectFit === 'contain' ? Math.min(W / w, H / h) : Math.max(W / w, H / h);
    const [px, py] = cs.objectPosition.split(' ').map((v) => parseFloat(v) / 100);
    const ox = (W - w * s) * px, oy = (H - h * s) * py;
    fig.querySelectorAll('.nk-kota').forEach((k) => { k.style.left = `${ox + (w * s * k.dataset.x) / 100}px`; k.style.top = `${oy + (h * s * k.dataset.y) / 100}px`; });
    // Štítok, ktorý by vyšiel z fotky, sa otočí na druhú stranu čiary (vodorovne, potom zvislo).
    const pref = matchMedia('(max-width: 760px)').matches ? 'sm-' : 's-';
    fig.querySelectorAll('.nk-kota').forEach((k) => {
      for (let pokus = 0; pokus < 3; pokus++) {
        const f = fig.getBoundingClientRect(), r = k.querySelector('.stitok').getBoundingClientRect();
        const trieda = [...k.classList].find((c) => c.startsWith(pref) && /^(s|sm)-(hore|dole)-(vpravo|vlavo)$/.test(c));
        let [v, hz] = trieda.slice(pref.length).split('-');
        if (r.right > f.right - 4 && hz === 'vpravo') hz = 'vlavo';
        else if (r.left < f.left + 4 && hz === 'vlavo') hz = 'vpravo';
        else if (r.top < f.top + 4 && v === 'hore') v = 'dole';
        else if (r.bottom > f.bottom - 4 && v === 'dole') v = 'hore';
        else break;
        k.classList.replace(trieda, `${pref}${v}-${hz}`);
      }
    });
  });
  osad();
  window.addEventListener('resize', osad);
  window.nkOsad = osad;
}

const NAVRHY = {
  A: { meno: 'A-hlavna-stavba', html: htmlA, css: CSS_A },
  B: { meno: 'B-prehlad-stavieb', html: htmlB, css: CSS_B },
  C: { meno: 'C-stavba-a-vyrobok', html: htmlC, css: CSS_C },
  A1: { meno: 'A1-tmavy-pas-s-prehladom', dir: 'verzie-a', html: () => htmlA({ prehlad: true }), css: CSS_A + CSS_A1 },
  A2: { meno: 'A2-pribeh-v-kapitolach', dir: 'verzie-a', html: htmlA2, css: CSS_A + CSS_A2 },
  A3: { meno: 'A3-mozaika-fotiek', dir: 'verzie-a', html: htmlA3, css: CSS_A + CSS_A3 },
};
const ktore = process.argv.slice(2).length ? process.argv.slice(2) : ['dnes', 'A', 'B', 'C'];
const server = spawn(process.execPath, [`${KOREN}/snimky-stranok/_skripty/server.mjs`, `${KOREN}/web/dist`, String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));
const browser = await chromium.launch({ channel: 'chrome' });

const typ = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const priprav = async (page, v) => {
  await page.goto(`http://127.0.0.1:${PORT}/referencie/`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (v !== 'dnes') {
    const n = NAVRHY[v];
    await page.evaluate(`(${VLOZ})(${JSON.stringify(n.html())}, ${JSON.stringify(CSS_SPOLOCNE + n.css)})`);
    // Len obrázky návrhu: pätička a záver majú loading="lazy" a bez rolovania by sa nenačítali nikdy.
    await page.evaluate(() => Promise.race([
      Promise.all([...document.querySelectorAll('img[src^="/navrh-assets/"]')].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; }))),
      new Promise((r) => setTimeout(r, 15000)),
    ]));
    await page.evaluate(`(${OSAD})()`);
  }
  await page.waitForTimeout(300);
};
const nacitajVsetko = async (page) => {
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 600) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(60); }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.nkOsad?.());
};

try {
  for (const [z, vp, dsf] of [['pc', { width: 1600, height: 900 }, 1.25], ['mobil', { width: 390, height: 844 }, 2]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf, reducedMotion: 'reduce' });
    await ctx.route('**/navrh-assets/**', async (route) => {
      const rel = decodeURIComponent(new URL(route.request().url()).pathname.replace(/^\/navrh-assets\/src\//, ''));
      const subor = join(KOREN, 'web/src/assets', rel);
      await route.fulfill({ status: 200, contentType: typ[extname(subor)], body: readFileSync(subor) });
    });
    for (const v of ktore) {
      const kam = v !== 'dnes' && NAVRHY[v].dir ? `${CIEL}/${NAVRHY[v].dir}` : CIEL;
      mkdirSync(kam, { recursive: true });
      const meno = `${kam.slice(CIEL.length + 1) ? `${kam.slice(CIEL.length + 1)}/` : ''}${v === 'dnes' ? '0-dnes' : NAVRHY[v].meno}`;
      const page = await ctx.newPage();
      const chyby = [];
      page.on('pageerror', (e) => chyby.push(String(e)));
      await priprav(page, v);
      await nacitajVsetko(page);
      // Prvá obrazovka (počítač) alebo prvé dve obrazovky (telefón).
      if (z === 'pc') await page.screenshot({ path: `${CIEL}/${meno}-pc.png` });
      else await page.screenshot({ path: `${CIEL}/${meno}-mobil.png`, fullPage: true, clip: { x: 0, y: 0, width: vp.width, height: 1688 } });
      const H = await page.evaluate(() => document.documentElement.scrollHeight);
      // Celá stránka: v Chrome sa snímka nad 16 384 px obrazu opakuje od začiatku → pri dlhej stránke menšia hustota.
      if (H * dsf <= 16000) await page.screenshot({ path: `${CIEL}/${meno}-cela-${z}.jpg`, fullPage: true, type: 'jpeg', quality: 82 });
      else {
        const c2 = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce' });
        await c2.route('**/navrh-assets/**', async (route) => {
          const rel = decodeURIComponent(new URL(route.request().url()).pathname.replace(/^\/navrh-assets\/src\//, ''));
          await route.fulfill({ status: 200, contentType: typ[extname(rel)], body: readFileSync(join(KOREN, 'web/src/assets', rel)) });
        });
        const p2 = await c2.newPage();
        await priprav(p2, v);
        await nacitajVsetko(p2);
        await p2.screenshot({ path: `${CIEL}/${meno}-cela-${z}.jpg`, fullPage: true, type: 'jpeg', quality: 85 });
        await c2.close();
      }
      // Presah do šírky (vodorovný posuvník) a kóty mimo fotky.
      const kontrola = await page.evaluate(() => {
        const presah = document.documentElement.scrollWidth - innerWidth;
        const mimo = [...document.querySelectorAll('.nk-kota .stitok')].filter((s) => {
          const f = s.closest('.nk-foto').getBoundingClientRect(), r = s.getBoundingClientRect();
          return r.left < f.left - 1 || r.right > f.right + 1 || r.top < f.top - 1 || r.bottom > f.bottom + 1;
        }).map((s) => s.textContent.trim().slice(0, 30));
        return { presah, mimo };
      });
      console.log('ok', meno, z, `výška ${H}`, `presah ${kontrola.presah}`, kontrola.mimo.length ? `KÓTY MIMO: ${kontrola.mimo.join(' | ')}` : '', chyby.length ? `CHYBY: ${chyby.join(' | ')}` : '');
      await page.close();
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
