import type { Lang } from '../i18n/ui';

/**
 * Titulok a popis pre vyhľadávače. Google zobrazí titulok do ~60 znakov a popis do ~160; kratší
 * popis než 120 znakov si často nahradí vlastným výňatkom. Popis sa skladá z celých viet v poradí,
 * v akom ich stránka dá; krátky sa doplní vetou o webe, dlhý sa skráti na celom slove.
 */
const MAX_TITULOK = 60;
const MIN_POPIS = 120;
const MAX_POPIS = 160;

const doplnky: Record<Lang, string[]> = {
  sk: ['Obj. čísla, podklady výrobcu a nákup na instalatershop.sk.', 'Oficiálny partner Watts pre Slovensko.'],
  cs: ['Obj. čísla, podklady výrobce a nákup na instalatershop.sk.', 'Oficiální partner Watts pro Slovensko.'],
};

/** „Názov | Microflex Slovensko“, pri dlhom názve „Názov | Microflex“, inak len názov. */
export function titulok(nazov: string, znacka: string): string {
  if (nazov === znacka) return nazov;
  for (const pripona of [` | ${znacka}`, ' | Microflex']) if ((nazov + pripona).length <= MAX_TITULOK) return nazov + pripona;
  return nazov;
}

// Veta končí bodkou, otáznikom alebo výkričníkom pred veľkým písmenom (skratky ako „obj. čísla“ ostanú celé).
const vety = (text: string) => text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-ZÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ„0-9])/u).filter(Boolean);

function orez(text: string, max: number): string {
  if (text.length <= max) return text;
  const kus = text.slice(0, max - 1);
  return `${kus.slice(0, kus.lastIndexOf(' ')).replace(/[,;:\s]+$/, '')}…`;
}

export function popisMeta(text: string, lang: Lang): string {
  let out = '';
  for (const v of vety(text)) {
    const dalsi = out ? `${out} ${v}` : v;
    // Veta, ktorá sa už nezmestí, sa preskočí a skúsi sa ďalšia (kratšia veta s číslami má prednosť pred doplnkom).
    if (dalsi.length > MAX_POPIS) { if (!out) out = orez(v, MAX_POPIS); continue; }
    out = dalsi;
  }
  for (const d of doplnky[lang]) {
    if (out.length >= MIN_POPIS) break;
    if (out.includes(d.slice(0, 20))) continue;
    const dalsi = out ? `${out} ${d}` : d;
    if (dalsi.length <= MAX_POPIS) out = dalsi;
  }
  return out;
}
