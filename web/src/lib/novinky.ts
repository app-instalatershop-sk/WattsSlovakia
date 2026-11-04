/**
 * Údaje pre novinky z 3D modelu (Juraj 28. 10. 2026), ktoré používa viac stránok: štítky systémov pri rodine
 * na ťuknutie (domov aj Potrubia) skladané z katalógu, aby sedeli s kartami a stránkami radov.
 */
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { kategorie, variantyRadu, rNazov, rMedium, tlakText, rozsah, rozsahRur, rozsahDn, cestaRadu, type Rad } from './katalog';
import { rodinaMasky } from './obrazky';
import { type Lang, t } from '../i18n/ui';
import type { SystemRodiny } from '../components/RodinaVyber.astro';

/** Štítky systémov rodiny v poradí masiek (data/novinky_web.py rodina) a obraz na zvýraznenie (2400 px). */
export async function rodinaNaTuknutie(rady: Rad[], obraz: ImageMetadata, lang: Lang) {
  const data = rodinaMasky();
  if (!data) return null;
  const ui = t(lang);
  const kats = await kategorie();
  const systemy: SystemRodiny[] = await Promise.all(data.systemy.map(async (s) => {
    const r = rady.find((x) => x.id === s.rad)!;
    const k = kats.find((x) => x.id === r.kategoria)!;
    const vs = await variantyRadu(r.id);
    const rury = r.pocet_rur === 1 ? ui.rad.jednaRura : r.pocet_rur === 2 ? ui.rad.dveRury : r.pocet_rur ? ui.rad.rury(r.pocet_rur) : '';
    const ruraRozsah = rozsahRur(vs, lang);
    const plast = rozsah(vs.map((v) => v.plast_mm), 'mm', lang);
    return {
      nazov: rNazov(r, lang).replace(/^Microflex /, ''),
      fakty: [
        [rury && rury.charAt(0).toUpperCase() + rury.slice(1), rMedium(r, lang), tlakText(r)].filter(Boolean).join(', '),
        [plast && `${ui.novinky.rodina.plast} Ø ${plast}`, ruraRozsah && `${(r.pocet_rur ?? 1) > 1 ? ui.novinky.rodina.rury : ui.novinky.rodina.rura} Ø ${ruraRozsah}`, rozsahDn(vs)].filter(Boolean).join(', '),
      ],
      odkaz: cestaRadu(k, r, lang),
    };
  }));
  const svetlo = (await getImage({ src: obraz, width: 2400, format: 'webp', quality: 86 })).src;
  return { data, systemy, svetlo };
}
