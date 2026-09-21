import { getCollection, type CollectionEntry } from 'astro:content';
import { type Lang, ROUTES, type Alternates } from '../i18n/ui';

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
