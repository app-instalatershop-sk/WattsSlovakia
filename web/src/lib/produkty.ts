import { getCollection } from 'astro:content';
import { stranky } from '../content/stranky';
import { cislo, type Produkt, type Rad } from './katalog';
import type { Lang } from '../i18n/ui';

/** Stĺpec tabuľky produktu podľa hlavičky (slovenské hlavičky sú rovnaké pre obe jazykové verzie). */
const stlpec = (p: Produkt, test: RegExp) => p.tabulky.flatMap((t) => {
  const i = t.hlavicky.findIndex((h) => test.test(h));
  return i < 0 ? [] : t.riadky.map((r) => r[i] ?? '');
});

/** Všetky obj. čísla produktu (prvý stĺpec tabuliek), bez opakovaní. */
export const kodyProduktu = (p: Produkt) => [...new Set(p.tabulky.flatMap((t) => t.riadky.map((r) => r[0])).filter(Boolean))];

function rozsahMm(hodnoty: string[]): string {
  const cisla = hodnoty.flatMap((h) => [...h.matchAll(/(\d{2,3})(?=\s*(?:×|$|\/|\s*–))/g)].map((m) => Number(m[1])));
  if (!cisla.length) return '';
  const min = Math.min(...cisla), max = Math.max(...cisla);
  return min === max ? `${cislo(min)} mm` : `${cislo(min)} až ${cislo(max)} mm`;
}

/** Kľúčové údaje produktu do hlavy a na kartu: počet obj. čísel, rozsah rúr alebo plášťa, závity. */
export function faktyProduktu(p: Produkt, lang: Lang): [string, string][] {
  const tx = stranky(lang).produkt;
  const out: [string, string][] = [];
  const kody = kodyProduktu(p);
  if (kody.length) out.push([tx.pocet, String(kody.length)]);
  const rura = rozsahMm(stlpec(p, /^Rúra PE-X/));
  if (rura) out.push([tx.rura, rura]);
  const plast = rozsahMm(stlpec(p, /^Plášť potrubia|^Plášť \/ rúra/).map((h) => h.split('/')[0]));
  if (plast && !rura) out.push([tx.plast, plast]);
  const zavity = [...new Set(stlpec(p, /^Závit/).filter((z) => /″/.test(z) && !/[+×]/.test(z)))];
  if (zavity.length && !rura) out.push([tx.zavit, zavity.length > 1 ? `${zavity[0]} až ${zavity[zavity.length - 1]}` : zavity[0]]);
  return out;
}

/** Rady, ku ktorým výrobca produkt odporúča. PRIMO bez vlastného zoznamu preberá zoznam základného radu. */
export async function radyProduktu(p: Produkt): Promise<Rad[]> {
  const kat = (await getCollection('kategorie')).map((k) => k.data);
  const poradieKat = (id: string) => kat.find((k) => k.id === id)?.poradie ?? 99;
  const rady = (await getCollection('rady')).map((r) => r.data).filter((r) => !r.je_skupina)
    .sort((a, b) => poradieKat(a.kategoria) - poradieKat(b.kategoria) || a.poradie - b.poradie);
  const zoznam = (r: Rad) => (r.suvisiace.length ? r.suvisiace : rady.find((x) => x.id !== r.id && x.kategoria === r.kategoria && x.piktogram === r.piktogram && x.suvisiace.length)?.suvisiace ?? []);
  return rady.filter((r) => zoznam(r).includes(p.id));
}

/** Prvá veta popisu na kartu produktu. */
export const prvaVeta = (t: string | null | undefined) => (t ?? '').match(/^.*?[.!?](?=\s|$)/)?.[0] ?? t ?? '';

/** Krátky názov skupiny do navigácie a drobčekov: „Spojky PE-X pre sanitu“ → „Sanita“. */
export function kratkyNazovSkupiny(n: string): string {
  const x = n.replace(/^Spojky PE-X pr[eo] /, '').replace(/^Príslušenstvo pre spojky PE-X$/, 'Príslušenstvo spojok')
    .replace(/^Příslušenství pro spojky PE-X$/, 'Příslušenství spojek').replace(/^sanitu$/, 'sanita');
  return x.charAt(0).toUpperCase() + x.slice(1);
}
