import { getCollection, type CollectionEntry } from 'astro:content';
import { type Lang, ROUTES, type Alternates } from '../i18n/ui';
import dnKatalog from '../data/dn.json';

export type Kategoria = CollectionEntry<'kategorie'>['data'];
export type Rad = CollectionEntry<'rady'>['data'];
export type Variant = CollectionEntry<'varianty'>['data'];
export type Produkt = CollectionEntry<'produkty'>['data'];

/* ---------- Texty podľa jazyka: obsah má polia *_cs, slovenčina je základ ---------- */

export const kNazov = (k: Kategoria, lang: Lang) => (lang === 'cs' && k.nazov_cs) || k.nazov;
export const kKratky = (k: Kategoria, lang: Lang) => (lang === 'cs' && k.kratky_nazov_cs) || k.kratky_nazov;
export const kPopis = (k: Kategoria, lang: Lang) => (lang === 'cs' && k.popis_cs) || k.popis;
export const kSlug = (k: Kategoria, lang: Lang) => (lang === 'cs' && k.slug_cs) || k.slug;

export const rNazov = (r: Rad, lang: Lang) => (lang === 'cs' && r.nazov_cs) || r.nazov;
export const rKratky = (r: Rad, lang: Lang) => (lang === 'cs' ? r.kratky_popis_cs ?? r.kratky_popis : r.kratky_popis) ?? null;
export const rPopis = (r: Rad, lang: Lang) => (lang === 'cs' ? r.popis_cs ?? r.popis : r.popis) ?? null;
export const rMedium = (r: Rad, lang: Lang) => (lang === 'cs' ? r.medium_cs ?? r.medium : r.medium) ?? null;
export const rOznacenie = (r: Rad, lang: Lang) => (lang === 'cs' && r.nazov_watts_cs) || r.nazov_watts;

export const pNazov = (p: Produkt, lang: Lang) => (lang === 'cs' && p.nazov_cs) || p.nazov;
export const pPopis = (p: Produkt, lang: Lang) => (lang === 'cs' ? p.popis_cs ?? p.popis : p.popis) ?? null;

/* ---------- Cesty ---------- */

/** Kotva riadku s obj. číslom v tabuľke (#MD12532C, #MJ13032/29): hľadanie a sprievodca vedú priamo naň. */
export const kotvaKodu = (kod: string) => kod.replace(/\s+/g, '');

export function cestaKategorie(k: Kategoria, lang: Lang): string {
  if (k.typ === 'spojky') return ROUTES[lang].spojky;
  if (k.typ === 'prislusenstvo') return ROUTES[lang].prislusenstvo;
  return `${ROUTES[lang].potrubia}${kSlug(k, lang)}/`;
}
export function cestaRadu(k: Kategoria, r: Rad, lang: Lang): string {
  return `${cestaKategorie(k, lang)}${r.slug}/`;
}
export const alternatyKategorie = (k: Kategoria): Alternates => ({ sk: cestaKategorie(k, 'sk'), cs: cestaKategorie(k, 'cs') });
export const alternatyRadu = (k: Kategoria, r: Rad): Alternates => ({ sk: cestaRadu(k, r, 'sk'), cs: cestaRadu(k, r, 'cs') });

/* ---------- Dáta ---------- */

export async function kategorie(): Promise<Kategoria[]> {
  const rows = await getCollection('kategorie');
  return rows.map((r) => r.data).sort((a, b) => a.poradie - b.poradie);
}
export async function kategoriaPodlaSlugu(slug: string, lang: Lang = 'sk'): Promise<Kategoria | undefined> {
  return (await kategorie()).find((k) => kSlug(k, lang) === slug);
}
export async function radyKategorie(kategoriaId: string): Promise<Rad[]> {
  const rows = await getCollection('rady', (r) => r.data.kategoria === kategoriaId);
  return rows.map((r) => r.data).sort((a, b) => a.poradie - b.poradie);
}
export async function variantyRadu(radId: string): Promise<Variant[]> {
  const rows = await getCollection('varianty', (v) => v.data.rad === radId);
  return rows.map((v) => v.data).sort((a, b) => a.poradie - b.poradie);
}
export async function produktyPodlaId(ids: string[]): Promise<Produkt[]> {
  if (!ids.length) return [];
  const rows = await getCollection('produkty', (p) => ids.includes(p.data.id));
  const byId = new Map(rows.map((p) => [p.data.id, p.data]));
  return ids.map((id) => byId.get(id)).filter((p): p is Produkt => Boolean(p));
}

/* ---------- Čísla ---------- */

export function cislo(n: number | null | undefined, desatiny?: number): string {
  if (n === null || n === undefined) return '';
  return n.toLocaleString('sk-SK', {
    minimumFractionDigits: desatiny ?? (Number.isInteger(n) ? 0 : 2),
    maximumFractionDigits: desatiny ?? 2,
  });
}
export function rozsah(hodnoty: Array<number | null | undefined>, jednotka: string, lang: Lang): string {
  const cisla = hodnoty.filter((x): x is number => typeof x === 'number');
  if (!cisla.length) return lang === 'cs' ? 'podle katalogu' : 'podľa katalógu';
  const min = Math.min(...cisla), max = Math.max(...cisla);
  return min === max ? `${cislo(min)} ${jednotka}` : `${cislo(min)} až ${cislo(max)} ${jednotka}`;
}
export function datum(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleDateString(lang === 'cs' ? 'cs-CZ' : 'sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

/**
 * Priemery nosných rúr variantu v mm. Pri DUO 10 bar, QUADRO a HP je v bunke viac rúr naraz
 * („1x28/4.01x18/2.5“, „2 x 25/2,3 1 x 25/3,5“, „2 x 32 x 2.9“): berie sa číslo pred hrúbkou steny.
 */
export function priemery(v: Variant): number[] {
  if (v.rura?.d) return [v.rura.d];
  const out: number[] = [];
  for (const m of (v.rura_text ?? '').matchAll(/(\d{2,3})\s*[/x×]\s*\d{1,2}[.,]\d/g)) out.push(Number(m[1]));
  return out;
}
/** Rozsah priemerov nosných rúr skupiny variantov („25 až 125 mm“), prázdny reťazec, ak nie sú. */
export function rozsahRur(vs: Variant[], lang: Lang): string {
  const d = vs.flatMap(priemery);
  return d.length ? rozsah(d, 'mm', lang) : '';
}

/* ---------- DN nosnej rúry (Juraj 4. 11. 2026: zákazník musí vedieť, či číslo je vonkajší priemer, alebo DN) ----------
 * Rúra sa označuje vonkajším priemerom × hrúbkou steny („25 × 2,3“, tak ju označuje katalóg aj spojky).
 * DN je menovitá svetlosť, približne vnútorný priemer: rúra 25 × 2,3 má DN 20, rúra 32 × 2,9 má DN 25.
 * DN je z katalógu výrobcu (data/dn_katalog.py → data/dn.json); keď ho katalóg neuvádza alebo nesedí
 * s rozmerom, DN sa nepíše. */

/** Nosná rúra: vonkajší priemer d a hrúbka steny s v mm, n rovnakých rúr. */
export type RuraCast = { n: number; d: number; s: number };
/** Nosné rúry variantu. Pri jednej rúre z dát (DUO má v dátach jednu rúru, počet je pri rade), pri viacerých
 *  z textu katalógu („1x28/4.01x18/2.5“, „2 x 25/2,3 1 x 25/3,5“). */
export function ruryVariantu(v: Variant): RuraCast[] {
  if (v.rura?.d) return [{ n: 1, d: v.rura.d, s: v.rura.s ?? 0 }];
  return [...(v.rura_text ?? '').matchAll(/(?:(\d)\s*[x×]\s*)?(\d{2,3})\s*[/x×]\s*(\d{1,2}[.,]\d)/g)]
    .map(([, n, d, s]) => ({ n: Number(n ?? 1), d: Number(d), s: Number(s.replace(',', '.')) }));
}
/** DN nosnej rúry s vonkajším priemerom d × stena s podľa katalógu výrobcu, null keď ho katalóg neuvádza. */
export function dnRury(d: number, s: number): number | null {
  return (dnKatalog.dn as Record<string, number>)[`${d}x${s}`] ?? null;
}
/** DN rúr variantu: „20“, pri rôznych rúrach „23 + 18“, s počtom „2× 20 + 18 + 14“; prázdne, keď niektoré chýba. */
export function dnVariantu(v: Variant): string {
  const casti = ruryVariantu(v);
  const dn = casti.map((c) => dnRury(c.d, c.s));
  if (!casti.length || dn.some((x) => x === null)) return '';
  return casti.map((c, i) => `${c.n > 1 ? `${c.n}× ` : ''}${dn[i]}`).join(' + ');
}
/** Rozsah DN nosných rúr skupiny variantov: „DN 20 až 102“, „DN 25“, prázdne bez DN. */
export function rozsahDn(vs: Variant[]): string {
  const dn = vs.flatMap((v) => ruryVariantu(v).map((c) => dnRury(c.d, c.s))).filter((x): x is number => x !== null);
  if (!dn.length) return '';
  const min = Math.min(...dn), max = Math.max(...dn);
  return min === max ? `DN ${min}` : `DN ${min} až ${max}`;
}
/** DN rúr v bunke tabuľky dielu („25 × 2,3“ → „20“, „40 × 3,7 + 32 × 2,9“ → „32 + 25“); prázdne, keď niektoré chýba. */
export function dnBunky(text: string): string {
  const dn = [...text.matchAll(/(\d{2,3})\s*×\s*(\d{1,2}(?:,\d)?)/g)].map((m) => dnRury(Number(m[1]), Number(m[2].replace(',', '.'))));
  return dn.length && dn.every((x) => x !== null) ? dn.join(' + ') : '';
}
/** Rúra variantu do vety a výsledkov: „32 × 2,9 mm, DN 25“ (bez DN, keď ho katalóg neuvádza). */
export function ruraSDn(v: Variant): string {
  const r = ruraText(v), dn = dnVariantu(v);
  return r ? `${r} mm${dn ? `, DN ${dn}` : ''}` : '';
}

/**
 * Nosné rúry variantu na zobrazenie: „25 × 2,3“, pri viacerých rúrach „28 × 4,0 + 18 × 2,5“,
 * rovnaké rúry s počtom „2× 32 × 2,9“.
 */
export function ruraText(v: Variant): string {
  // Nezlomiteľné medzery: rúra „25 × 2,3“ sa nerozdelí na dva riadky, zalomiť sa dá len pri „+“.
  if (v.rura?.d) return `${cislo(v.rura.d)} × ${cislo(v.rura.s, 1)}`;
  const casti = [...(v.rura_text ?? '').matchAll(/(?:(\d)\s*[x×]\s*)?(\d{2,3})\s*[/x×]\s*(\d{1,2}[.,]\d)/g)];
  if (!casti.length) return (v.rura_text ?? '').replace(/x/g, '×');
  return casti.map(([, n, d, s]) => `${n && n !== '1' ? `${n}× ` : ''}${d} × ${s.replace('.', ',')}`).join(' + ');
}

/** Prevádzkové tlaky radov v bar (QUADRO má dva: 6 bar vykurovacie a 10 bar sanitárne rúry). */
export function tlakyRadov(rr: Rad[]): number[] {
  const t = new Set<number>();
  for (const r of rr) {
    if (typeof r.tlak_bar === 'number') t.add(r.tlak_bar);
    for (const m of (r.tlak_text ?? '').matchAll(/\d+/g)) t.add(Number(m[0]));
  }
  return [...t].sort((a, b) => a - b);
}
/** Tlak radu na zobrazenie: „6 bar“, „6 / 10 bar“, alebo prázdny reťazec. */
export const tlakText = (r: Rad) => r.tlak_text ?? (typeof r.tlak_bar === 'number' ? `${r.tlak_bar} bar` : '');

/** Stránka produktu spojok a príslušenstva: /spojky/<slug>/, /cs/prislusenstvi/<slug_cs>/. */
export function cestaProduktu(p: Produkt, k: Kategoria, lang: Lang): string {
  return `${cestaKategorie(k, lang)}${lang === 'cs' ? p.slug_cs : p.slug}/`;
}
export const alternatyProduktu = (p: Produkt, k: Kategoria): Alternates => ({ sk: cestaProduktu(p, k, 'sk'), cs: cestaProduktu(p, k, 'cs') });
