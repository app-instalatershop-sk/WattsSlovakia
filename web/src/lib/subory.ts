import type { Lang } from '../i18n/ui';

/**
 * Podklady výrobcu (odkazy na watts.eu). Názvy z watts.eu sú dlhé a miešajú angličtinu, preto sa
 * zobrazujú ako druh podkladu a doplnok („Výkres DWG“ + „UNO a UNO PRIMO vykurovanie a chladenie“).
 */
export interface Subor { nazov: string; typ: string; jazyk: string | null; url: string }
export interface PopisSuboru { typ: string; nazov: string; meta: string | null; druh: 'katalog' | 'list' | 'vykres' | 'zhoda' | 'epd' | 'brozura' | 'iny' }

const jazyky = { sk: { sk: 'slovensky', en: 'anglicky', cs: 'česky' }, cs: { sk: 'slovensky', en: 'anglicky', cs: 'česky' } };
export const jazykSuboru = (j: string | null, lang: Lang) => (j ? (jazyky[lang] as Record<string, string>)[j] ?? null : null);

/** Anglický názov výkresu z watts.eu po slovensky alebo česky. */
export function nazovVykresu(meta: string, lang: Lang): string {
  const cs = lang === 'cs';
  return meta.replace(/ & /g, ' a ').replace('heating and cooling', cs ? 'vytápění a chlazení' : 'vykurovanie a chladenie')
    .replace('sanitary water', 'pitná voda').replace('with heating cable', cs ? 's topným kabelem' : 's vyhrievacím káblom');
}

export function popisSuboru(s: Subor, lang: Lang): PopisSuboru {
  const cs = lang === 'cs';
  const n = s.nazov;
  let m: RegExpMatchArray | null;
  if (s.typ === 'EPD' || /deklar/i.test(n)) {
    const platna = n.match(/platná do (.+)$/);
    return { druh: 'epd', typ: 'EPD', nazov: cs ? 'Environmentální prohlášení o produktu' : 'Environmentálne vyhlásenie o produkte', meta: platna ? `platné do ${platna[1]}` : null };
  }
  if ((m = n.match(/^Výkres (DWG|DXF): (.+)$/))) return { druh: 'vykres', typ: m[1], nazov: `Výkres ${m[1]}`, meta: nazovVykresu(m[2], lang) };
  if (/^Katalóg/.test(n)) return { druh: 'katalog', typ: 'PDF', nazov: cs ? 'Katalog Microflex' : 'Katalóg Microflex', meta: 'slovensky, 19 MB' };
  if (/^Brožúra/.test(n)) return { druh: 'brozura', typ: 'PDF', nazov: cs ? 'Brožura Microflex' : 'Brožúra Microflex', meta: jazykSuboru(s.jazyk, lang) };
  if (/^Vyhlásenie o zhode/.test(n)) return { druh: 'zhoda', typ: 'PDF', nazov: cs ? 'Prohlášení o shodě' : 'Vyhlásenie o zhode', meta: jazykSuboru(s.jazyk, lang) };
  if (/Technický list/.test(n)) return { druh: 'list', typ: 'PDF', nazov: 'Technický list', meta: n.replace(/\s*-\s*Technický list/, '') };
  return { druh: 'iny', typ: s.typ, nazov: n, meta: jazykSuboru(s.jazyk, lang) };
}
