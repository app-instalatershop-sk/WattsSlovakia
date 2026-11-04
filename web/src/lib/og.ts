import { getCollection } from 'astro:content';
import { cestaKategorie, cestaRadu, cestaProduktu, kNazov, kKratky, rNazov, pNazov, rozsah, rozsahRur, rozsahDn, tlakText, tlakyRadov, type Kategoria } from './katalog';
import { faktyProduktu, kodyProduktu } from './produkty';
import { fotkaProduktu, render3d, radPiktogramu } from './obrazky';
import { clanky } from '../content/clanky';
import { type Lang, route, LANGS } from '../i18n/ui';

/**
 * Náhľadové obrázky stránok (Open Graph, 1200 × 630). Register pozná každú stránku: nadpis,
 * nadnadpis, dva až tri fakty a obraz zo `src/assets`. Obrázky kreslí `pages/og/[...cesta].jpg.ts`
 * pri builde; stránka mimo registra dostane predvolený obrázok svojho jazyka.
 */
export type Druh = 'render' | 'biely' | 'foto';
export interface OgZaznam { kluc: string; lang: Lang; nadpis: string; pred: string; fakty: [string, string][]; obraz?: string; druh: Druh }

/** Kľúč obrázka z adresy stránky: „/potrubia/vykurovanie/“ → „potrubia/vykurovanie“, „/“ → „domov“. */
export const klucOg = (cesta: string) => cesta.replace(/^\/|\/$/g, '').replace(/\/index\.html$/, '') || 'domov';

/** Obraz náhľadu z vlastného 3D modelu (cesta v src/assets), keď render existuje; inak pôvodný obraz. */
const z3d = (druh: Parameters<typeof render3d>[0], id: string | undefined, inak: string | undefined) => (render3d(druh, id) ? `3d/${druh}/${id}.webp` : inak);

const texty = {
  sk: {
    domov: ['Predizolované potrubia Microflex', 'Microflex Česko a Slovensko'], potrubia: ['Predizolované potrubia Microflex', 'Päť systémov podľa média'],
    vyber: ['Sprievodca výberom potrubia', 'Dimenzia podľa výkonu'], stiahnut: ['Katalóg, výkresy a vyhlásenia', 'Na stiahnutie'],
    firmy: ['Pre projektantov, montážne firmy a veľkoobchod', 'Pre firmy'], poradna: ['Výber, pokládka, skúška a tepelné straty', 'Poradňa'],
    kontakt: ['Kontakt a predajňa', 'Raková pri Čadci'], referencie: ['Kde už Microflex leží', 'Referencie'], predvolene: ['Predizolované ohybné potrubie', 'Microflex Česko a Slovensko'],
    tlak: 'Tlak', rura: 'Nosná rúra', plast: 'Plášť', systemy: 'Systémy', rady: 'Rady', produkty: 'Produkty', obj: 'Obj. čísla', potrubia2: 'Potrubia', clanok: 'Poradňa',
  },
  cs: {
    domov: ['Předizolované potrubí Microflex', 'Microflex Česko a Slovensko'], potrubia: ['Předizolované potrubí Microflex', 'Pět systémů podle média'],
    vyber: ['Průvodce výběrem potrubí', 'Dimenze podle výkonu'], stiahnut: ['Katalog, výkresy a prohlášení', 'Ke stažení'],
    firmy: ['Pro projektanty, montážní firmy a velkoobchod', 'Pro firmy'], poradna: ['Výběr, pokládka, zkouška a tepelné ztráty', 'Poradna'],
    kontakt: ['Kontakt a prodejna', 'Raková u Čadce'], referencie: ['Kde už Microflex leží', 'Reference'], predvolene: ['Předizolované ohebné potrubí', 'Microflex Česko a Slovensko'],
    tlak: 'Tlak', rura: 'Nosná trubka', plast: 'Plášť', systemy: 'Systémy', rady: 'Řady', produkty: 'Produkty', obj: 'Obj. čísla', potrubia2: 'Potrubí', clanok: 'Poradna',
  },
};

async function zostav(): Promise<OgZaznam[]> {
  const kat = (await getCollection('kategorie')).map((x) => x.data).sort((a, b) => a.poradie - b.poradie);
  const rady = (await getCollection('rady')).map((x) => x.data).filter((r) => !r.je_skupina);
  const varianty = (await getCollection('varianty')).map((x) => x.data);
  const produkty = (await getCollection('produkty')).map((x) => x.data);
  const skupiny = (await getCollection('rady')).map((x) => x.data).filter((r) => r.je_skupina);
  const out: OgZaznam[] = [];
  for (const lang of LANGS) {
    const tx = texty[lang];
    const potrubne = kat.filter((k) => k.typ === 'potrubie');
    const tlaky = tlakyRadov(rady);
    const staticke = (kluc: 'domov' | 'potrubia' | 'vyber' | 'stiahnut' | 'firmy' | 'poradna' | 'kontakt' | 'referencie', obraz: string, druh: Druh, fakty: [string, string][] = []) => {
      const [nadpis, pred] = tx[kluc];
      out.push({ kluc: klucOg(route(lang, kluc)), lang, nadpis, pred, fakty, obraz, druh });
    };
    staticke('domov', z3d('hero', 'duo', 'fotky/hero-rez-duo.png')!, 'render', [[tx.systemy, String(potrubne.length)], [tx.rady, String(rady.length)], [tx.tlak, `${tlaky.join(' / ')} bar`]]);
    staticke('potrubia', z3d('rodina', 'rodina', 'fotky/rodina-potrubi.png')!, 'render', [[tx.systemy, String(potrubne.length)], [tx.rady, String(rady.length)], [tx.tlak, `${tlaky.join(' / ')} bar`]]);
    staticke('vyber', z3d('rady', 'microflex-duo-6-bar', 'piktogramy/rad-duo-kurenie.png')!, 'render');
    staticke('stiahnut', 'fotky/katalog-obalka.jpg', 'biely');
    staticke('firmy', 'fotky/montaz-budova.jpg', 'foto');
    staticke('poradna', 'fotky/vykop-rez.jpg', 'foto');
    staticke('kontakt', 'fotky/kotuc.jpg', 'foto');
    staticke('referencie', 'referencie/orange-5.jpg', 'foto');
    const [pn, pp] = tx.predvolene;
    out.push({ kluc: `predvolene-${lang}`, lang, nadpis: pn, pred: pp, fakty: [], obraz: z3d('rodina', 'rodina', 'fotky/rodina-potrubi.png'), druh: 'render' });

    for (const k of kat) {
      const rr = rady.filter((r) => r.kategoria === k.id);
      const vs = varianty.filter((v) => rr.some((r) => r.id === v.rad));
      if (k.typ === 'potrubie') {
        const fakty: [string, string][] = [];
        if (tlakyRadov(rr).length) fakty.push([tx.tlak, `${tlakyRadov(rr).join(' / ')} bar`]);
        if (rozsahRur(vs, lang)) fakty.push([tx.rura, [`Ø ${rozsahRur(vs, lang)}`, rozsahDn(vs)].filter(Boolean).join(', ')]);
        if (vs.some((v) => v.plast_mm)) fakty.push([tx.plast, `Ø ${rozsah(vs.map((v) => v.plast_mm), 'mm', lang)}`]);
        out.push({ kluc: klucOg(cestaKategorie(k, lang)), lang, nadpis: kNazov(k, lang), pred: tx.potrubia2, fakty, obraz: z3d('rady', radPiktogramu(k.piktogram), k.piktogram ? `piktogramy/${k.piktogram}` : undefined), druh: 'render' });
      } else {
        const ps = produkty.filter((p) => p.kategoria === k.id);
        out.push({ kluc: klucOg(cestaKategorie(k, lang)), lang, nadpis: kNazov(k, lang), pred: 'Microflex', fakty: [[tx.produkty, String(ps.length)], [tx.obj, String(ps.reduce((n, p) => n + kodyProduktu(p).length, 0))]],
          obraz: k.typ === 'spojky' ? 'fotky/montaz-odbocka.jpg' : 'fotky/vykop-spojky.jpg', druh: k.typ === 'spojky' ? 'biely' : 'foto' });
      }
    }
    for (const r of rady) {
      const k = kat.find((x) => x.id === r.kategoria) as Kategoria;
      const vs = varianty.filter((v) => v.rad === r.id);
      const fakty: [string, string][] = [];
      if (tlakText(r)) fakty.push([tx.tlak, tlakText(r)]);
      if (rozsahRur(vs, lang)) fakty.push([tx.rura, [`Ø ${rozsahRur(vs, lang)}`, rozsahDn(vs)].filter(Boolean).join(', ')]);
      if (vs.some((v) => v.plast_mm)) fakty.push([tx.plast, `Ø ${rozsah(vs.map((v) => v.plast_mm), 'mm', lang)}`]);
      out.push({ kluc: klucOg(cestaRadu(k, r, lang)), lang, nadpis: rNazov(r, lang), pred: kKratky(k, lang), fakty, obraz: z3d('rady', r.id, r.piktogram ? `piktogramy/${r.piktogram}` : undefined), druh: 'render' });
    }
    for (const p of produkty) {
      const k = kat.find((x) => x.id === p.kategoria) as Kategoria;
      const sk = skupiny.find((x) => x.id === p.skupina);
      // Vyrezaný diel (priehľadné WebP) leží na modrej ploche ako render, pôvodná fotka má bielu kartu.
      const vyrez = fotkaProduktu(p.id)?.format === 'webp';
      out.push({ kluc: klucOg(cestaProduktu(p, k, lang)), lang, nadpis: pNazov(p, lang), pred: sk ? rNazov(sk, lang) : kKratky(k, lang), fakty: faktyProduktu(p, lang).slice(0, 2), obraz: `produkty/${p.id}.${vyrez ? 'webp' : 'jpg'}`, druh: vyrez ? 'render' : 'biely' });
    }
    for (const c of clanky(lang)) {
      out.push({ kluc: klucOg(`${route(lang, 'poradna')}${c.slug}/`), lang, nadpis: c.nazov, pred: tx.clanok, fakty: [], obraz: `fotky/${c.obraz}`, druh: c.obraz.endsWith('.png') ? 'render' : 'foto' });
    }
  }
  return out;
}

let zaznamy: Promise<OgZaznam[]> | undefined;
export const ogZaznamy = () => (zaznamy ??= zostav());

/** Adresa náhľadového obrázka pre stránku; stránka mimo registra dostane predvolený obrázok jazyka. */
export async function ogObrazok(cesta: string, lang: Lang): Promise<string> {
  const kluc = klucOg(cesta);
  const z = (await ogZaznamy()).find((x) => x.kluc === kluc);
  return `/og/${z ? z.kluc : `predvolene-${lang}`}.jpg`;
}
