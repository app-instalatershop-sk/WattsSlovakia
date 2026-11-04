// Meranie prechodov do e-shopu bez cookies a bez lišty (Juraj 4. 11. 2026): po builde doplní ku každej adrese
// https://www.instalatershop.sk/… v stránkach a dátach (index hľadania, dáta sprievodcu) značky UTM. Štatistiky
// e-shopu potom ukážu návštevy zo zdroja microflex.sk. Štruktúrované dáta (application/ld+json) ostanú bez UTM:
// adresa tam pomenúva firmu, nie odkaz na kliknutie.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const UTM = 'utm_source=microflex.sk&utm_medium=referral&utm_campaign=microflex-web';
// Adresa e-shopu končí úvodzovkou, medzerou, < >, spätnou lomkou alebo zakódovanou úvodzovkou v atribúte (&quot;).
const ADRESA = /https:\/\/www\.instalatershop\.sk\/(?:(?!&quot;|&#34;|&#x22;)[^"'\s<>\\])*/g;
const LD = /<script type="application\/ld\+json">[\s\S]*?<\/script>/g;

export function pridajUtm(adresa) {
  if (adresa.includes('utm_source=')) return adresa;
  const [bez, kotva] = adresa.split('#');
  return `${bez}${bez.includes('?') ? '&' : '?'}${UTM}${kotva !== undefined ? `#${kotva}` : ''}`;
}

export function utmText(text) {
  // Bloky štruktúrovaných dát vynechať: rozdeliť text na časti mimo nich a v nich.
  let out = '', posledny = 0;
  for (const m of text.matchAll(LD)) {
    out += text.slice(posledny, m.index).replace(ADRESA, pridajUtm) + m[0];
    posledny = m.index + m[0].length;
  }
  return out + text.slice(posledny).replace(ADRESA, pridajUtm);
}

async function* subory(dir) {
  for (const f of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) yield* subory(p);
    else if (/\.(html|json)$/.test(f.name)) yield p;
  }
}

export default function utmWebu() {
  return {
    name: 'microflex-utm',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        let odkazy = 0, zmenene = 0;
        for await (const p of subory(fileURLToPath(dir))) {
          const text = await readFile(p, 'utf8');
          const nove = utmText(text);
          if (nove !== text) {
            zmenene++;
            odkazy += (nove.match(/utm_source=microflex\.sk/g) ?? []).length - (text.match(/utm_source=microflex\.sk/g) ?? []).length;
            await writeFile(p, nove);
          }
        }
        logger.info(`utm: ${odkazy} odkazov do e-shopu v ${zmenene} súboroch`);
      },
    },
  };
}
