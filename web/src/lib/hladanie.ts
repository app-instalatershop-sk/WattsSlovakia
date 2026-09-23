import { getCollection } from 'astro:content';
import { cestaKategorie, cestaRadu, cestaProduktu, kNazov, rNazov, pNazov, tlakText, ruraText, cislo, type Kategoria } from './katalog';
import { kodyProduktu } from './produkty';
import { type Lang, t, route } from '../i18n/ui';

/**
 * Index hľadania, generovaný pri builde do /hladat/index.json (a /cs/hledat/index.json).
 * Položka: s = skupina výsledkov, n = názov, d = doplnok, u = adresa, k = ďalšie kľúčové slová.
 * Normalizáciu (bez diakritiky, „x“ = „×“) robí prehliadač, tu sú len surové texty.
 */
export type Skupina = 'rad' | 'kod' | 'diel' | 'stranka';
export interface Polozka { s: Skupina; n: string; d: string; u: string; k?: string }

export async function indexHladania(lang: Lang): Promise<Polozka[]> {
  const ui = t(lang);
  const cs = lang === 'cs';
  const kat = (await getCollection('kategorie')).map((x) => x.data).sort((a, b) => a.poradie - b.poradie);
  const rady = (await getCollection('rady')).map((x) => x.data);
  const varianty = (await getCollection('varianty')).map((x) => x.data);
  const produkty = (await getCollection('produkty')).map((x) => x.data).sort((a, b) => a.poradie - b.poradie);
  const katId = (id: string) => kat.find((k) => k.id === id) as Kategoria;
  const out: Polozka[] = [];

  for (const k of kat) out.push({ s: 'stranka', n: kNazov(k, lang), d: k.typ === 'potrubie' ? ui.nav.potrubia : '', u: cestaKategorie(k, lang), k: k.kratky_nazov + ' ' + (k.kratky_nazov_cs ?? '') });

  for (const r of rady.filter((x) => !x.je_skupina)) {
    const k = katId(r.kategoria);
    out.push({ s: 'rad', n: rNazov(r, lang), d: [kNazov(k, lang), tlakText(r)].filter(Boolean).join(' · '), u: cestaRadu(k, r, lang), k: `${r.nazov_watts} ${r.nazov}` });
  }

  for (const v of varianty) {
    const r = rady.find((x) => x.id === v.rad);
    if (!r) continue;
    const k = katId(r.kategoria);
    const model = rNazov(r, lang).split(',')[0].trim();
    const rura = ruraText(v);
    const d = [model, rura && `${cs ? 'trubka' : 'rúra'} ${rura}`, v.plast_mm && `${cs ? 'plášť' : 'plášť'} ${cislo(v.plast_mm)} mm`].filter(Boolean).join(' · ');
    // „125/32“, „125/2x32“: bežný zápis dimenzie plášť/rúry v objednávkach
    const d0 = v.rura?.d ?? (rura.match(/\d{2,3}/)?.[0] ?? '');
    const pocet = r.pocet_rur && r.pocet_rur > 1 ? `${r.pocet_rur}x` : '';
    out.push({ s: 'kod', n: v.obj_cislo, d, u: `${cestaRadu(k, r, lang)}#varianty`, k: `${model} ${v.plast_mm ?? ''}/${d0} ${v.plast_mm ?? ''}/${pocet}${d0} ${rura} ${(v.prislusenstvo ?? []).map((d) => d.obj).join(' ')}` });
  }

  for (const p of produkty) {
    const k = katId(p.kategoria);
    const sk = rady.find((x) => x.id === p.skupina);
    out.push({ s: 'diel', n: pNazov(p, lang), d: sk ? rNazov(sk, lang) : '', u: cestaProduktu(p, k, lang), k: p.nazov_watts });
    for (const c of kodyProduktu(p)) out.push({ s: 'kod', n: c, d: pNazov(p, lang), u: `${cestaProduktu(p, k, lang)}#tabulka` });
  }

  const stranky: [string, Parameters<typeof route>[1], string][] = [
    [ui.nav.vyber, 'vyber', cs ? 'průvodce výběrem potrubí dimenze výkon' : 'sprievodca výberom potrubia dimenzia výkon'],
    [ui.nav.stiahnut, 'stiahnut', 'katalóg katalog pdf dwg dxf výkres vyhlásenie prohlášení epd brožúra'],
    [ui.nav.firmy, 'firmy', cs ? 'poptávka projekt projektant montážní firma velkoobchod' : 'dopyt projekt projektant montážna firma veľkoobchod'],
    [cs ? 'Reference' : 'Referencie', 'referencie', 'referencia stavba považská bystrica fačkov lehota orange'],
    [ui.nav.poradna, 'poradna', cs ? 'články pokládka výběr' : 'články pokládka výber'],
    [cs ? 'Kontakt a prodejna' : 'Kontakt a predajňa', 'kontakt', 'telefón telefon e-mail adresa predajňa prodejna raková otváracie hodiny ičo'],
  ];
  for (const [n, kluc, k] of stranky) out.push({ s: 'stranka', n, d: '', u: route(lang, kluc), k });
  return out;
}
