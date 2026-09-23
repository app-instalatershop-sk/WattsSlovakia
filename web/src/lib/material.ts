import { cislo, type Produkt, type Rad, type Variant } from './katalog';

/**
 * Zoznam materiálu na trasu: pre variant potrubia pripraví obj. čísla dielov na jednotku.
 * Spojky PE-X sa vyberú podľa rúry (Ø × hrúbka) zo skupiny podľa SDR (SDR 11 = vykurovanie a COOL,
 * SDR 7,4 = sanita), izolačné sady a prestup stenou podľa plášťa, krytky a pevné body z katalógu
 * (varianty.prislusenstvo). Množstvá počíta prehliadač podľa dĺžky, odbočiek, spojov a prestupov.
 * Pravidlá potvrdil Juraj 23. 9. 2026 (rezerva 1 m na koniec, krytka na výber, spoje so sadami);
 * čo patrí na konce trasy, si zákazník zaškrtne sám (otázka č. 14 pre manažéra).
 */
export interface Diel { kod: string; n: number; poz?: string; over?: boolean }
export interface MaterialVariantu {
  rury: number;                 // počet nosných rúr v plášti
  T: Diel[]; P: Diel[]; PR: Diel[]; MFP: Diel[];
  MK?: string; MG?: string; IST?: string; ISP?: string; MP?: string; paska: string;
}

const SKUPINY = {
  vyk: { T: '3-x-ohrev-spojky-pe-x-t', P: 'pe-x-x-pe-x-spojka-kurenie', PR: 'pe-x-spojka-kurenie-cool-6-16bar' },
  san: { T: '3-x-pe-x-t-spojka-sanitarna', P: 'pe-x-x-pe-x-sanitarne-zariadenie', PR: 'sanitarne-spojky-microflex-pe-x' },
};

/** Rúry variantu: [{d, s, n}] z rúry alebo z textu „2x25/2,3 1x25/3,5 1x20/2,8“. */
export function ruryVariantu(v: Variant, r: Rad): { d: number; s: number; n: number }[] {
  if (v.rura?.d && v.rura.s) return [{ d: v.rura.d, s: v.rura.s, n: r.pocet_rur ?? 1 }];
  const out: { d: number; s: number; n: number }[] = [];
  for (const m of (v.rura_text ?? '').matchAll(/(?:(\d)\s*[x×]\s*)?(\d{2,3})\s*[/x×]\s*(\d{1,2}[.,]\d)/g)) {
    out.push({ d: Number(m[2]), s: Number(m[3].replace(',', '.')), n: Number(m[1] ?? 1) });
  }
  return out;
}

const riadokRury = (p: Produkt | undefined, d: number, s: number) => {
  if (!p) return undefined;
  const t = p.tabulky[0];
  const i = t?.hlavicky.findIndex((h) => /^Rúra PE-X/.test(h)) ?? -1;
  const hladane = `${cislo(d)} × ${cislo(s, 1)}`;
  return i < 0 ? undefined : t.riadky.find((r) => r[i] === hladane)?.[0];
};

const podlaPlasta = (p: Produkt | undefined, plast: number | null | undefined, rozsah = false) => {
  if (!p || !plast) return undefined;
  const t = p.tabulky[0];
  const i = t?.hlavicky.findIndex((h) => /^Plášť potrubia/.test(h)) ?? -1;
  if (i < 0) return undefined;
  // „75/90“ alebo „125/90/75“: sada pre ktorýkoľvek z plášťov; inak presná zhoda
  return t.riadky.find((r) => (rozsah ? r[i].split('/').map(Number).includes(plast) : r[i] === String(plast)))?.[0];
};

export function materialVariantu(v: Variant, r: Rad, produkty: Produkt[]): MaterialVariantu {
  const prod = (id: string) => produkty.find((p) => p.id === id);
  const rury = ruryVariantu(v, r);
  const m: MaterialVariantu = { rury: rury.reduce((n, x) => n + x.n, 0), T: [], P: [], PR: [], MFP: [], paska: r.slug === 'microflex-cool-s-vyhrievacim-kablom' ? 'MTRB' : 'MTRW' };
  const pridaj = (zoznam: Diel[], kod: string | undefined, n: number, poz?: string, over = false) => {
    const k = kod ?? '';
    const x = zoznam.find((z) => z.kod === k && z.poz === poz);
    if (x) x.n += n; else zoznam.push({ kod: k, n, ...(poz ? { poz } : {}), ...(over ? { over } : {}) });
  };
  for (const x of rury) {
    const sk = x.d / x.s >= 9.5 ? SKUPINY.vyk : SKUPINY.san;
    const rozmer = `${cislo(x.d)} × ${cislo(x.s, 1)}`;
    // Sanitárna T-spojka: v tabuľke výrobcu (katalóg s. 24 aj watts.eu) nesedia obj. čísla s rozmermi.
    pridaj(m.T, riadokRury(prod(sk.T), x.d, x.s), x.n, rozmer, sk === SKUPINY.san);
    pridaj(m.P, riadokRury(prod(sk.P), x.d, x.s), x.n, rozmer);
    pridaj(m.PR, riadokRury(prod(sk.PR), x.d, x.s), x.n, rozmer);
  }
  for (const d of v.prislusenstvo ?? []) {
    if (d.druh === 'MFP') pridaj(m.MFP, d.obj, d.pocet ?? 1, d.zavit ?? undefined);
    if (d.druh === 'MK') m.MK = d.obj;
    if (d.druh === 'MG') m.MG = d.obj;
  }
  m.IST = podlaPlasta(prod('izolovana-suprava-t-kusu'), v.plast_mm, true);
  m.ISP = podlaPlasta(prod('izolacna-sada-i-variant'), v.plast_mm, true);
  m.MP = podlaPlasta(prod('tesnenie-na-prienik-na-stenu-micro-press'), v.plast_mm);
  return m;
}
