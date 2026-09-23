/**
 * Hľadanie v prehliadači, spoločné pre stránku Hľadanie a našepkávač v hlavičke. Index (lib/hladanie.ts)
 * nesie surové texty, tu sa normalizujú a hodnotia.
 *
 * Slovo dotazu sa hľadá od začiatku slova v texte: celé, bez koncovky (čerpadlo = čerpadlá) alebo cez
 * synonymum (kúrenie = vykurovanie, 5/4 = 1 1/4″). Rozmery sa porovnávajú bez medzier okolo „x“ a „/“
 * („25x2.3“ = „25 × 2,3“), nikdy nie uprostred čísla či kódu („32“ nenájde M9032C ani „5/4“ „125/40“).
 * Výplňové slová (na, pre, do) sa vynechajú, všeobecné (potrubie, Microflex) nie sú povinné. Keď so všetkými
 * slovami nič nesedí, vráti výsledky aspoň pre časť slov.
 */
export type Skupina = 'rad' | 'kod' | 'diel' | 'stranka';
/** v = 1: obj. číslo potrubia (pri rovnakej zhode pred dielmi, ktoré ho len spomínajú). */
export interface Polozka { s: Skupina; n: string; d: string; u: string; k?: string; v?: 1 }
export interface Vysledok { p: Polozka; s: number }
export interface Vysledky { vysledky: Vysledok[]; ciastocne: boolean; terminy: string[] }

/** Bez diakritiky a veľkých písmen, „×“ ako „x“, desatinná bodka ako čiarka. Dĺžku textu nemení (zvýraznenie). */
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/×/g, 'x').replace(/[″”“]/g, '"').replace(/[‐–—]/g, '-').replace(/(\d)\.(?=\d)/g, '$1,').replace(/\s/g, ' ');
export const kompakt = (s: string) => norm(s).replace(/[\s\-_.]/g, '');
/** Rozmer bez medzier okolo „x“ a „/“: „160/2 x 25 x 2,3“ → „160/2x25x2,3“. */
const tesne = (s: string) => s.replace(/(\d)\s*([x/])\s*(?=\d)/g, '$1$2');
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const VYPLN = new Set(['na', 'pre', 'pro', 'do', 's', 'so', 'se', 'a', 'aj', 'i', 'v', 'vo', 've', 'k', 'ku', 'z', 'zo', 'ze', 'od', 'pri', 'u', 'o', 'za', 'ako', 'jak', 'alebo', 'nebo', 'je', 'sa', 'si', 'co', 'hladam', 'hledam', 'potrebujem', 'potrebuji']);
const VSEOBECNE = /^(potrub|predizol|microflex|mikroflex|watts|rur|trub|flexibil|ohybn)/;
const SYNONYMA: [RegExp, string[]][] = [
  [/^(kuren|kurit|kurenar|topen|topit|ustredn|teplovod|kotol|kotl|kotel|biomas|pelet|krb)/, ['vykurov', 'vytap']],
  [/^(tuv|pitn|uzitkov|sanitar|zdravotn|vodovod)/, ['sanit', 'pitn']],
  [/^(chlad|chlaz|klimat)/, ['chlad', 'chlaz', 'cool']],
  [/^tc$/, ['cerpadl', 'hp']],
  [/^odboc/, ['t-spojk', 't-kus', 'odboc']],
  [/^(pri?echodk|pruchodk|prostup|sten|stien)/, ['prestup', 'priechodk', 'pruchodk', 'prostup']],
  [/^(koncovk|uzaver|zatk|zaslep|vicko|viecko|ukoncen)/, ['krytk', 'ukoncov']],
  [/^gumen/, ['gumov']],
  [/^trubk/, ['rur']],
  [/^rur/, ['trubk']],
  [/^(pex|pexa|pe-xa)$/, ['pe-x']],
  [/^mikroflex/, ['microflex']],
  [/^(dvojit|dvojrur|dvoutrub)/, ['duo']],
  [/^(jednoduch|jednorur|jednotrub)/, ['uno']],
  [/^(stvor|ctyr)/, ['quadro']],
  [/^(kabel|kabl)/, ['kabl', 'kabel']],
  [/^5\/4"?$/, ['1 1/4']],
  [/^6\/4"?$/, ['1 1/2']],
];

/** Kmeň slova bez koncovky: čerpadlo → čerpadl, krytky → krytk, sady → sad. */
function kmen(w: string): string {
  if (w.length < 4 || /[^a-z]/.test(w)) return w;
  const s = w.replace(/(ami|ach|ych|ymi|ich|om|ou|ov|ej|ho|mu)$/, '').replace(/[aeiouy]+$/, '');
  return s.length >= 3 ? s : w;
}
/** Tvary, ktorými sa slovo môže v texte nájsť; prvý je slovo samo. */
function tvary(w: string): string[] {
  const out = [w];
  const k = kmen(w);
  if (k !== w) out.push(k);
  for (const [re, alt] of SYNONYMA) if (re.test(w)) for (const a of alt) if (!out.includes(a)) out.push(a);
  return out;
}

/** Tvar na začiatku slova v texte: 2 = celé slovo, 1 = začiatok dlhšieho slova, 0 = nie je. */
function naZaciatku(text: string, t: string): 0 | 1 | 2 {
  let najlepsie: 0 | 1 | 2 = 0;
  for (let i = text.indexOf(t); i >= 0; i = text.indexOf(t, i + 1)) {
    if (i > 0 && /[a-z0-9]/.test(text[i - 1])) continue;
    if (!/[a-z0-9]/.test(text[i + t.length] ?? '')) return 2;
    najlepsie = 1;
  }
  return najlepsie;
}
const ciselny = (t: string) => /[^a-z-]/.test(t);

interface Pripravena { p: Polozka; n: string; v: string; vk: string; nk: string }
const pripravene = new WeakMap<Polozka[], Pripravena[]>();
function priprav(index: Polozka[]): Pripravena[] {
  let x = pripravene.get(index);
  if (!x) {
    x = index.map((p) => { const n = tesne(norm(p.n)); const v = tesne(`${n} ${norm(p.d)} ${norm(p.k ?? '')}`); return { p, n, v, vk: kompakt(v), nk: kompakt(p.n) }; });
    pripravene.set(index, x);
  }
  return x;
}

/** Body za jedno slovo: v názve 30 (celé slovo) alebo 20 (začiatok slova, kmeň, synonymum), inde 8 alebo 5. */
function body(x: Pripravena, tv: string[]): number {
  let best = 0;
  tv.forEach((t, i) => {
    const vNazve = naZaciatku(x.n, t);
    const inde = vNazve || naZaciatku(x.v, t);
    const plne = i === 0 && (inde === 2 || ciselny(t));
    best = Math.max(best, vNazve ? (plne ? 30 : 20) : inde ? (plne ? 8 : 5) : 0);
  });
  return best;
}

export function hladaj(index: Polozka[], dotaz: string): Vysledky {
  const q = tesne(norm(dotaz.trim()));
  const slova = q.split(' ').filter(Boolean);
  if (!slova.length) return { vysledky: [], ciastocne: false, terminy: [] };
  const vecne = slova.filter((w) => !VYPLN.has(w));
  const povinne0 = vecne.filter((w) => !VSEOBECNE.test(w));
  const povinne = povinne0.length ? povinne0 : vecne.length ? vecne : slova;
  const volitelne = povinne0.length ? vecne.filter((w) => VSEOBECNE.test(w)) : [];
  const tvP = povinne.map(tvary), tvV = volitelne.map(tvary);
  const dk = kompakt(dotaz);
  const fraza = kompakt(povinne.join(' '));

  const hodnotene = priprav(index).map((x) => {
    let s = 0, trafene = 0;
    if (x.p.s === 'kod') {
      if (x.nk === dk) return { x, s: 1000, trafene: povinne.length };
      if (dk.length >= 3 && x.nk.startsWith(dk)) return { x, s: 600 - x.nk.length, trafene: povinne.length };
      if (dk.length >= 4 && /\d/.test(dk) && x.nk.includes(dk)) return { x, s: 300 - x.nk.length, trafene: povinne.length };
    }
    for (const tv of tvP) { const b = body(x, tv); if (b) { trafene++; s += b; } }
    for (const tv of tvV) { const b = body(x, tv); s += b >= 20 ? 12 : b ? 3 : 0; }
    // Viac slov vedľa seba (DN 25, T kus) má prednosť pred rozhádzanými po texte.
    if (povinne.length > 1 && x.vk.includes(fraza)) s += x.nk.includes(fraza) ? 25 : 15;
    s += (x.p.s === 'rad' ? 12 : x.p.s === 'diel' ? 8 : x.p.s === 'stranka' ? 4 : x.p.v ? 6 : 0) - x.n.length / 100;
    return { x, s, trafene };
  });

  let vyber = hodnotene.filter((h) => h.trafene === povinne.length && h.s > 0);
  let ciastocne = false;
  if (!vyber.length && povinne.length > 1) {
    const max = Math.max(...hodnotene.map((h) => h.trafene));
    if (max > 0) { vyber = hodnotene.filter((h) => h.trafene === max); ciastocne = true; }
  }
  vyber.sort((a, b) => b.s - a.s);
  // Zvýrazňujú sa len povinné slová: „potrubie“ by svietilo takmer v každom riadku.
  const terminy = [...new Set(tvP.flat())];
  if (dk.length >= 3) terminy.push(dk);
  return { vysledky: vyber.map((h) => ({ p: h.x.p, s: h.s })), ciastocne, terminy };
}

/** Zvýrazní nájdené tvary od začiatku slova: slová až po koniec slova, rozmery aj s medzerami okolo „x“ a „/“. */
export function zvyrazni(text: string, terminy: string[]): string {
  const n = norm(text);
  const znacky = new Array(text.length).fill(false);
  for (const t of terminy) {
    if (t.length < 2) continue;
    const vzor = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/(?<=\d)([x/])(?=\d)/g, '\\s*$1\\s*');
    for (const m of n.matchAll(new RegExp(`(?<![a-z0-9])${vzor}`, 'g'))) {
      let j = m.index + m[0].length;
      if (!ciselny(t)) while (j < n.length && /[a-z]/.test(n[j])) j++;
      for (let k = m.index; k < j; k++) znacky[k] = true;
    }
  }
  let out = '', on = false;
  for (let i = 0; i < text.length; i++) { if (znacky[i] !== on) { out += znacky[i] ? '<mark>' : '</mark>'; on = znacky[i]; } out += esc(text[i]); }
  return out + (on ? '</mark>' : '');
}

/** Index sa načíta raz za návštevu, zdieľa ho stránka Hľadanie aj hlavička. */
const nacitane = new Map<string, Promise<Polozka[]>>();
export function nacitajIndex(url: string): Promise<Polozka[]> {
  let p = nacitane.get(url);
  if (!p) {
    p = fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
    p.catch(() => nacitane.delete(url));
    nacitane.set(url, p);
  }
  return p;
}
