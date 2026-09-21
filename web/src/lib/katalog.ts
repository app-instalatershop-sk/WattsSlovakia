import { getCollection, type CollectionEntry } from 'astro:content';

export type Kategoria = CollectionEntry<'kategorie'>['data'];
export type Rad = CollectionEntry<'rady'>['data'];
export type Variant = CollectionEntry<'varianty'>['data'];
export type Produkt = CollectionEntry<'produkty'>['data'];

/** Základná cesta kategórie podľa typu: potrubia majú prefix /potrubia/, spojky a príslušenstvo sú na koreni. */
export function cestaKategorie(k: Kategoria): string {
  return k.typ === 'potrubie' ? `/potrubia/${k.slug}/` : `/${k.slug}/`;
}

export function cestaRadu(k: Kategoria, r: Rad): string {
  return `${cestaKategorie(k)}${r.slug}/`;
}

export async function kategorie(): Promise<Kategoria[]> {
  const rows = await getCollection('kategorie');
  return rows.map((r) => r.data).sort((a, b) => a.poradie - b.poradie);
}

export async function kategoriaPodlaSlugu(slug: string): Promise<Kategoria | undefined> {
  return (await kategorie()).find((k) => k.slug === slug);
}

export async function radyKategorie(kategoriaId: string): Promise<Rad[]> {
  const rows = await getCollection('rady', (r) => r.data.kategoria === kategoriaId);
  return rows.map((r) => r.data).sort((a, b) => a.poradie - b.poradie);
}

export async function radPodlaSlugu(slug: string): Promise<Rad | undefined> {
  const rows = await getCollection('rady', (r) => r.data.slug === slug);
  return rows[0]?.data;
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

/** Slovenský zápis čísla: desatinná čiarka, medzera medzi tisíckami. */
export function cislo(n: number | null | undefined, desatiny?: number): string {
  if (n === null || n === undefined) return '';
  return n.toLocaleString('sk-SK', {
    minimumFractionDigits: desatiny ?? (Number.isInteger(n) ? 0 : 2),
    maximumFractionDigits: desatiny ?? 2,
  });
}

/** Rozsah „25 až 125 mm“ z čísel. */
export function rozsah(hodnoty: Array<number | null | undefined>, jednotka: string): string {
  const cisla = hodnoty.filter((x): x is number => typeof x === 'number');
  if (!cisla.length) return 'podľa katalógu';
  const min = Math.min(...cisla), max = Math.max(...cisla);
  return min === max ? `${cislo(min)} ${jednotka}` : `${cislo(min)} až ${cislo(max)} ${jednotka}`;
}

export function skloňujVarianty(n: number): string {
  if (n === 1) return '1 variant';
  if (n >= 2 && n <= 4) return `${n} varianty`;
  return `${n} variantov`;
}

export function skloňujDimenzie(n: number): string {
  if (n === 1) return '1 dimenzia';
  if (n >= 2 && n <= 4) return `${n} dimenzie`;
  return `${n} dimenzií`;
}

export function skloňujRady(n: number): string {
  if (n === 1) return '1 rad';
  if (n >= 2 && n <= 4) return `${n} rady`;
  return `${n} radov`;
}
