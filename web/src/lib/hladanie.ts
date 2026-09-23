import { getCollection } from 'astro:content';
import { cestaKategorie, cestaRadu, cestaProduktu, kNazov, kPopis, rNazov, rKratky, pNazov, tlakText, ruraText, cislo, kotvaKodu, type Kategoria, type Produkt } from './katalog';
import { clanky } from '../content/clanky';
import { type Lang, t, route, ESHOP } from '../i18n/ui';
import type { Polozka } from './hladanie-klient';

/**
 * Index hľadania, generovaný pri builde do /hladat/index.json (a /cs/hledat/index.json).
 * Položka: s = skupina výsledkov, n = názov, d = doplnok, u = adresa, k = ďalšie kľúčové slová.
 * Normalizáciu a hodnotenie robí prehliadač (lib/hladanie-klient.ts), tu sú len surové texty.
 * Obj. čísla vedú priamo na svoj riadok v tabuľke (kotvaKodu).
 */
export type { Polozka, Skupina } from './hladanie-klient';

/** Hlavný rozmer riadku tabuľky dielu do doplnku výsledku: „rúra 32 × 2,9 mm“, „plášť 125 mm“, „závit 3/4″ F“. */
const ROZMERY: [RegExp, string, string][] = [
  [/^Rúra PE-X/, 'rúra', 'trubka'],
  [/^Plášť potrubia/, 'plášť', 'plášť'],
  [/^Plášť \/ rúra/, 'plášť / rúra', 'plášť / trubka'],
  [/^Závit/, 'závit', 'závit'],
];
function rozmerRiadku(tab: Produkt['tabulky'][number], riadok: string[], lang: Lang): string {
  for (const [re, sk, cs] of ROZMERY) {
    const i = tab.hlavicky.findIndex((h, j) => j > 0 && re.test(h));
    if (i > 0 && riadok[i]) return `${lang === 'cs' ? cs : sk} ${riadok[i]}${tab.jednotky[i] ? ` ${tab.jednotky[i]}` : ''}`;
  }
  return '';
}

export async function indexHladania(lang: Lang): Promise<Polozka[]> {
  const ui = t(lang);
  const cs = lang === 'cs';
  const kat = (await getCollection('kategorie')).map((x) => x.data).sort((a, b) => a.poradie - b.poradie);
  const rady = (await getCollection('rady')).map((x) => x.data);
  const varianty = (await getCollection('varianty')).map((x) => x.data);
  const produkty = (await getCollection('produkty')).map((x) => x.data).sort((a, b) => a.poradie - b.poradie);
  const katId = (id: string) => kat.find((k) => k.id === id) as Kategoria;
  const out: Polozka[] = [];

  // Kategórie aj s popisom (kotolňa, biomasa, pitná voda…) a slugom (sanita).
  for (const k of kat) out.push({ s: 'stranka', n: kNazov(k, lang), d: k.typ === 'potrubie' ? ui.nav.potrubia : '', u: cestaKategorie(k, lang), k: [k.kratky_nazov, k.kratky_nazov_cs, k.slug.replace(/-/g, ' '), kPopis(k, lang)].filter(Boolean).join(' ') });

  for (const r of rady.filter((x) => !x.je_skupina)) {
    const k = katId(r.kategoria);
    out.push({ s: 'rad', n: rNazov(r, lang), d: [kNazov(k, lang), tlakText(r)].filter(Boolean).join(' · '), u: cestaRadu(k, r, lang), k: [r.nazov_watts, r.nazov, rKratky(r, lang)].filter(Boolean).join(' ') });
  }

  for (const v of varianty) {
    const r = rady.find((x) => x.id === v.rad);
    if (!r) continue;
    const k = katId(r.kategoria);
    const model = rNazov(r, lang).split(',')[0].trim();
    const rura = ruraText(v);
    const d = [model, rura && `${cs ? 'trubka' : 'rúra'} ${rura}`, v.plast_mm && `plášť ${cislo(v.plast_mm)} mm`].filter(Boolean).join(' · ');
    // „125/32“, „125/2x32“: bežný zápis dimenzie plášť/rúry v objednávkach; „DN 25“ z tabuľky výrobcu
    const d0 = v.rura?.d ?? (rura.match(/\d{2,3}/)?.[0] ?? '');
    const pocet = r.pocet_rur && r.pocet_rur > 1 ? `${r.pocet_rur}x` : '';
    const kluce = [model, `${v.plast_mm ?? ''}/${d0}`, `${v.plast_mm ?? ''}/${pocet}${d0}`, rura, v.dn ? `DN ${v.dn}` : '', ...(v.prislusenstvo ?? []).map((x) => x.obj)];
    out.push({ s: 'kod', n: v.obj_cislo, d, u: `${cestaRadu(k, r, lang)}#${kotvaKodu(v.obj_cislo)}`, k: kluce.filter(Boolean).join(' '), v: 1 });
  }

  for (const p of produkty) {
    const k = katId(p.kategoria);
    const sk = rady.find((x) => x.id === p.skupina);
    const cesta = cestaProduktu(p, k, lang);
    out.push({ s: 'diel', n: pNazov(p, lang), d: sk ? rNazov(sk, lang) : '', u: cesta, k: p.nazov_watts });
    // Obj. čísla dielu s rozmerom v doplnku a celým riadkom tabuľky v kľúčoch (rúra, závit, plášť).
    const videne = new Set<string>();
    for (const tab of p.tabulky) {
      const riadky = cs ? tab.riadky_cs : tab.riadky;
      const hlavicky = cs ? tab.hlavicky_cs : tab.hlavicky;
      for (const riadok of riadky) {
        const kod = riadok[0];
        if (!kod || videne.has(kod)) continue;
        videne.add(kod);
        const rozmer = rozmerRiadku(tab, riadok, lang);
        out.push({ s: 'kod', n: kod, d: [pNazov(p, lang), rozmer].filter(Boolean).join(' · '), u: `${cesta}#${kotvaKodu(kod)}`, k: riadok.slice(1).map((c, i) => `${hlavicky[i + 1] ?? ''} ${c}`).join(' ') });
      }
    }
  }

  for (const c of clanky(lang)) out.push({ s: 'stranka', n: c.nazov, d: ui.nav.poradna, u: `${route(lang, 'poradna')}${c.slug}/`, k: [c.perex, ...c.sekcie.map((x) => x.h)].join(' ') });

  const stranky: [string, string, string, string][] = [
    [ui.nav.vyber, '', route(lang, 'vyber'), cs ? 'průvodce výběrem potrubí dimenze výkon kW' : 'sprievodca výberom potrubia dimenzia výkon kW'],
    [ui.nav.stiahnut, '', route(lang, 'stiahnut'), cs
      ? 'katalog pdf dwg dxf výkres výkresy cad bim prohlášení o shodě epd technický list technické listy brožura dokumenty'
      : 'katalóg pdf dwg dxf výkres výkresy cad bim vyhlásenie o zhode epd technický list technické listy brožúra dokumenty'],
    [ui.nav.firmy, '', route(lang, 'firmy'), cs ? 'poptávka cenová nabídka projekt projektant montážní firma velkoobchod' : 'dopyt cenová ponuka projekt projektant montážna firma veľkoobchod'],
    [cs ? 'Reference' : 'Referencie', '', route(lang, 'referencie'), 'referencia reference stavba stavby považská bystrica fačkov lehota orange'],
    [ui.nav.poradna, '', route(lang, 'poradna'), cs ? 'články rady návod montáž pokládka výběr tlaková zkouška tepelné ztráty' : 'články rady návod montáž pokládka výber tlaková skúška tepelné straty'],
    [cs ? 'Kontakt a prodejna' : 'Kontakt a predajňa', '', route(lang, 'kontakt'), cs
      ? 'telefon e-mail adresa prodejna sklad osobní odběr raková otevírací doba ičo'
      : 'telefón e-mail adresa predajňa sklad osobný odber raková otváracie hodiny ičo'],
    [`${ui.nav.eshop} instalatershop.sk`, cs ? 'Cena, dostupnost a nákup' : 'Cena, dostupnosť a nákup', ESHOP, cs
      ? 'cena ceny ceník koupit nákup objednat objednávka eshop obchod prodej dostupnost skladem'
      : 'cena ceny cenník kúpiť kúpa nákup objednať objednávka eshop obchod predaj dostupnosť skladom'],
  ];
  for (const [n, d, u, k] of stranky) out.push({ s: 'stranka', n, d, u, k });
  return out;
}
