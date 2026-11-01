// Slovenská a česká sadzba na celom texte webu (polish 1. 11. 2026, docs/POLISH.md T4). Po builde prejde všetky
// stránky v dist a na text v <body> použije pravidlá z src/lib/sadzba.ts (nezlomiteľná medzera za jednopísmenovou
// predložkou, pred jednotkou, za Ø a okolo ×). Skripty, štýly, kód, šablóny, SVG a atribúty ostanú bez zmeny.
// Audit 1. 11. našiel 2 850 miest, kde text, ktorý sadzbu nevolal, mohol zlomiť riadok zle (napr. „125 | mm“).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sadzba } from '../src/lib/sadzba.ts';

const PRESKOC = new Set(['script', 'style', 'pre', 'code', 'textarea', 'svg', 'template', 'noscript', 'title']);
// značka s úvodzovkami v atribútoch (v hodnote môže byť „>“), komentár zvlášť
const ZNACKA = /<!--[\s\S]*?-->|<\/?([a-zA-Z][\w:-]*)(?:[^>"']|"[^"]*"|'[^']*')*>/g;

export function sadzbaHtml(html) {
  const zac = html.search(/<body[\s>]/i);
  if (zac < 0) return html;
  let out = html.slice(0, zac), posledny = zac, preskoc = null, hlbka = 0;
  ZNACKA.lastIndex = zac;
  for (let m; (m = ZNACKA.exec(html));) {
    const text = html.slice(posledny, m.index);
    out += preskoc ? text : sadzba(text);
    const znacka = m[0], meno = (m[1] || '').toLowerCase();
    if (meno && !znacka.startsWith('<!--')) {
      const zatvara = znacka.startsWith('</'), samo = znacka.endsWith('/>');
      if (!preskoc && PRESKOC.has(meno) && !zatvara && !samo) { preskoc = meno; hlbka = 1; }
      else if (preskoc === meno && !samo) { hlbka += zatvara ? -1 : 1; if (hlbka === 0) preskoc = null; }
    }
    out += znacka;
    posledny = ZNACKA.lastIndex;
  }
  const zvysok = html.slice(posledny);
  return out + (preskoc ? zvysok : sadzba(zvysok));
}

async function* stranky(dir) {
  for (const f of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) yield* stranky(p);
    else if (f.name.endsWith('.html')) yield p;
  }
}

export default function sadzbaWebu() {
  return {
    name: 'microflex-sadzba',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        let n = 0, zmenene = 0;
        for await (const p of stranky(fileURLToPath(dir))) {
          const html = await readFile(p, 'utf8');
          const nove = sadzbaHtml(html);
          n++;
          if (nove !== html) { zmenene++; await writeFile(p, nove); }
        }
        logger.info(`sadzba: ${zmenene} z ${n} stránok upravených`);
      },
    },
  };
}
