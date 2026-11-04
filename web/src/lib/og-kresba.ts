import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import type { OgZaznam } from './og';

/**
 * Kresba náhľadového obrázka 1200 × 630 (JPEG): tmavomodrý podklad ako záver stránok, vľavo logo MICROFLEX,
 * nadnadpis, nadpis a fakty, vpravo obraz stránky (render voľne, fotka dielu na bielej karte, fotka
 * zo stavby do okraja so splynutím), dole logo Watts a partnerstvo. Písma Archivo a IBM Plex Sans
 * (Fontsource, latin + latin-ext kvôli diakritike). Beží pri builde, súbory číta z koreňa projektu.
 */
const W = 1200, H = 630;
const koren = process.cwd();
const subor = (...c: string[]) => readFile(join(koren, ...c));

type Uzol = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Uzol => ({ type, props: { style, children, ...extra } });

let pisma: Promise<{ name: string; data: Buffer; weight: 400 | 600 | 700; style: 'normal' }[]> | undefined;
const nacitajPisma = () => (pisma ??= (async () => {
  // Sada latin-ext (ľ, š, č, ť, ž…) má vlastné meno písma, text ju má ako náhradné písmo za základnou.
  const f = (balik: string, meno: string, rez: 400 | 600 | 700) => ['latin', 'latin-ext'].map(async (sada) => ({
    name: sada === 'latin' ? meno : `${meno}Ext`, weight: rez, style: 'normal' as const, data: await subor('node_modules', '@fontsource', balik, 'files', `${balik}-${sada}-${rez}-normal.woff`),
  }));
  return Promise.all([...f('archivo', 'Archivo', 700), ...f('archivo', 'Archivo', 600), ...f('ibm-plex-sans', 'Plex', 400), ...f('ibm-plex-sans', 'Plex', 600)]);
})());

let loga: Promise<{ microflex: string; watts: string }> | undefined;
const nacitajLoga = () => (loga ??= (async () => {
  const svg = (s: string) => `data:image/svg+xml;base64,${Buffer.from(s).toString('base64')}`;
  const mf = (await subor('src', 'assets', 'loga', 'microflex.svg')).toString().replace(/currentColor/g, '#ffffff');
  const wt = (await subor('src', 'assets', 'loga', 'watts.svg')).toString().replace(/#231F20/gi, '#ffffff');
  return { microflex: svg(mf), watts: svg(wt) };
})());

async function obraz(z: OgZaznam): Promise<string | undefined> {
  if (!z.obraz) return undefined;
  const vstup = sharp(await subor('src', 'assets', ...z.obraz.split('/')));
  const buf = z.druh === 'foto'
    ? await vstup.resize(1080, 1260, { fit: 'cover', position: 'attention' }).jpeg({ quality: 82 }).toBuffer()
    : z.druh === 'render'
      ? await vstup.resize(1240, 960, { fit: 'inside', withoutEnlargement: true }).png().toBuffer()
      : await vstup.flatten({ background: '#ffffff' }).resize(820, 780, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer();
  return `data:image/${z.druh === 'render' ? 'png' : 'jpeg'};base64,${buf.toString('base64')}`;
}

// Medzipamäť na disku: obrázok sa prekreslí, len keď sa zmení záznam, zdrojový obraz alebo kresba (VERZIA).
const VERZIA = 3; // 2: rendery vlastného 3D modelu, 3: nadnadpis vetou namiesto verzálok
const pamat = join(koren, 'node_modules', '.cache', 'og');
export async function kresliOg(z: OgZaznam): Promise<Buffer> {
  const zdroj = z.obraz ? (await stat(join(koren, 'src', 'assets', ...z.obraz.split('/')))).mtimeMs : 0;
  const kluc = createHash('sha1').update(JSON.stringify([VERZIA, z, zdroj])).digest('hex');
  const cesta = join(pamat, `${kluc}.jpg`);
  try { return await readFile(cesta); } catch { /* ešte nie je nakreslený */ }
  const jpg = await nakresli(z);
  await mkdir(pamat, { recursive: true });
  await writeFile(cesta, jpg);
  return jpg;
}

async function nakresli(z: OgZaznam): Promise<Buffer> {
  const [fonts, { microflex, watts }, img] = await Promise.all([nacitajPisma(), nacitajLoga(), obraz(z)]);
  const velkost = z.nadpis.length <= 30 ? 66 : z.nadpis.length <= 46 ? 56 : 48;
  const sirkaTextu = z.druh === 'foto' ? 600 : 560;
  const partner = z.lang === 'cs' ? 'Jediný oficiální partner pro Česko a Slovensko' : 'Jediný oficiálny partner pre Česko a Slovensko';

  const obrazUzol = !img ? null
    : z.druh === 'render'
      ? h('img', { position: 'absolute', right: -40, bottom: 24, width: 640, height: 500, objectFit: 'contain' }, undefined, { src: img })
      : z.druh === 'biely'
        ? h('div', { position: 'absolute', right: 60, top: 84, width: 460, height: 462, borderRadius: 30, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 34px 70px rgba(2, 12, 32, 0.45)' },
          h('img', { width: 392, height: 392, objectFit: 'contain' }, undefined, { src: img }))
        : h('img', { position: 'absolute', right: 0, top: 0, width: 560, height: H, objectFit: 'cover', maskImage: 'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.85) 30%, #000000 55%)' }, undefined, { src: img });

  const strom = h('div', { width: W, height: H, display: 'flex', position: 'relative', fontFamily: 'Plex, PlexExt', color: '#ffffff', backgroundImage: 'radial-gradient(circle at 74% 46%, rgba(120, 175, 245, 0.32) 0%, rgba(120, 175, 245, 0) 42%), linear-gradient(135deg, #123f86 0%, #0b2d63 52%, #071f47 100%)' }, [
    obrazUzol,
    h('div', { position: 'absolute', left: 68, top: 58, bottom: 52, width: sirkaTextu, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }, [
      h('img', { width: 238, height: 32 }, undefined, { src: microflex }),
      h('div', { display: 'flex', flexDirection: 'column' }, [
        h('div', { width: 64, height: 7, borderRadius: 4, background: '#f7c900', marginBottom: 22 }),
        h('div', { fontSize: 26, fontWeight: 500, color: '#f7c900', marginBottom: 12 }, z.pred), // veta, nie verzálky (DESIGN kap. 5 a 18)
        h('div', { fontFamily: 'Archivo, ArchivoExt', fontWeight: 700, fontSize: velkost, lineHeight: 1.06, letterSpacing: -1 }, z.nadpis),
        z.fakty.length ? h('div', { display: 'flex', gap: 44, marginTop: 34 }, z.fakty.slice(0, 3).map(([dt, dd]) =>
          h('div', { display: 'flex', flexDirection: 'column' }, [
            h('div', { fontSize: 19, color: '#a9c1e6' }, dt),
            h('div', { fontFamily: 'Archivo, ArchivoExt', fontWeight: 600, fontSize: 30, marginTop: 2 }, dd),
          ]))) : null,
      ].filter(Boolean)),
      h('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
        h('img', { width: 128, height: 22 }, undefined, { src: watts }),
        h('div', { fontSize: 19, color: '#c9d8f0' }, partner),
      ]),
    ]),
  ].filter(Boolean));

  const svg = await satori(strom as never, { width: W, height: H, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  return sharp(png).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}
