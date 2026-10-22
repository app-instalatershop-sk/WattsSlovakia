/** Spoločné dáta pre pracovné stránky s návrhmi: rad Microflex DUO 6 bar a systém Vykurovanie, ako na webe. */
import { getCollection } from 'astro:content';
import { kategorie, variantyRadu, cestaKategorie, cestaRadu, rNazov, rKratky, kKratky, rozsah, rozsahRur, cislo, tlakText, type Rad, type Variant } from '../lib/katalog';
import { piktogram } from '../lib/obrazky';
import { kotyRenderu } from '../lib/koty';
import { t, route } from '../i18n/ui';

const ui = t('sk');

/** Čísla radu z tabuľky variantov (ako v Rad.astro a KartaRadu.astro). */
export function cislaRadu(r: Rad, vv: Variant[]) {
  const pol = vv.map((v) => v.polomer_ohybu_m).filter((x): x is number => typeof x === 'number');
  const rura = rozsahRur(vv, 'sk');
  return {
    rura: rura ? `${r.pocet_rur && r.pocet_rur > 1 && vv.some((v) => v.rura) ? `${r.pocet_rur} × ` : ''}${rura}` : '',
    plast: vv.some((v) => v.plast_mm) ? rozsah(vv.map((v) => v.plast_mm), 'mm', 'sk') : '',
    polomer: pol.length ? `${ui.common.od} ${cislo(Math.min(...pol), 2)} m` : '',
    tlak: tlakText(r),
    dimenzii: vv.length,
  };
}

export async function radDuo() {
  const rady = (await getCollection('rady')).map((x) => x.data);
  const kats = await kategorie();
  const r = rady.find((x) => x.id === 'microflex-duo-6-bar')!;
  const k = kats.find((x) => x.id === 'vykurovanie')!;
  const vv = await variantyRadu(r.id);
  const c = cislaRadu(r, vv);
  const nazov = rNazov(r, 'sk');
  const koty = kotyRenderu(r.piktogram, {
    plast: c.plast ? [`Ø ${c.plast}`, ui.home.popisy.plast] : undefined,
    rura: c.rura ? [c.rura, [ui.rad.rura.toLowerCase(), c.tlak].filter(Boolean).join(', ')] : undefined,
    ohyb: c.polomer ? [c.polomer, ui.home.popisy.polomer] : undefined,
  });
  return {
    r, k, vv, c, koty, nazov,
    model: nazov.split(',')[0].trim(),
    kratky: rKratky(r, 'sk') ?? '',
    pikto: piktogram(r.piktogram)!,
    pred: `${kKratky(k, 'sk')}, ${ui.rad.dveRury}`,
    drobceky: [{ text: ui.nav.potrubia, href: route('sk', 'potrubia') }, { text: kKratky(k, 'sk'), href: cestaKategorie(k, 'sk') }, { text: nazov.split(',')[0].trim() }],
    href: cestaRadu(k, r, 'sk'),
  };
}

/** Rady systému Vykurovanie ako karty: základné rady a ich vyhotovenia so spoločným renderom (PRIMO). */
export async function radyVykurovania() {
  const rady = (await getCollection('rady')).map((x) => x.data);
  const kats = await kategorie();
  const k = kats.find((x) => x.id === 'vykurovanie')!;
  const rr = rady.filter((x) => x.kategoria === k.id).sort((a, b) => a.poradie - b.poradie);
  const karty: { r: Rad; vyhotovenia: Rad[] }[] = [];
  for (const r of rr) {
    const spolocna = r.piktogram ? karty.find((x) => x.r.piktogram === r.piktogram) : undefined;
    if (spolocna) spolocna.vyhotovenia.push(r); else karty.push({ r, vyhotovenia: [] });
  }
  return Promise.all(karty.map(async ({ r, vyhotovenia }) => {
    const vv = await variantyRadu(r.id);
    return {
      r, vv, k, c: cislaRadu(r, vv),
      model: rNazov(r, 'sk').split(',')[0].trim(),
      kratky: rKratky(r, 'sk') ?? '',
      pikto: piktogram(r.piktogram)!,
      href: cestaRadu(k, r, 'sk'),
      vyhotovenia: vyhotovenia.map((v) => ({ model: rNazov(v, 'sk').split(',')[0].trim(), href: cestaRadu(k, v, 'sk') })),
    };
  }));
}
