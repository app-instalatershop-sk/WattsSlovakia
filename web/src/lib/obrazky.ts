import type { ImageMetadata } from 'astro';
import rendery from '../data/rendery.json';

/** Fotky radov a piktogramy skopírované skriptom data/normalize.py do src/assets. */
const rady = import.meta.glob<{ default: ImageMetadata }>('/src/assets/rady/*.{jpg,jpeg,png}', { eager: true });
const piktogramy = import.meta.glob<{ default: ImageMetadata }>('/src/assets/piktogramy/*.png', { eager: true });
const fotky = import.meta.glob<{ default: ImageMetadata }>('/src/assets/fotky/*.{jpg,jpeg,png}', { eager: true });
const referencie = import.meta.glob<{ default: ImageMetadata }>('/src/assets/referencie/*.jpg', { eager: true });
/** Detaily materiálov vyrezané z renderov výrobcu (plášť, pena, nosná rúra). */
const detaily = import.meta.glob<{ default: ImageMetadata }>('/src/assets/detaily/*.{jpg,png}', { eager: true });
/** Prvé strany PDF a výkresy z DXF výrobcu pre stôl dokumentov (data/nahlady_dokumentov.py). */
const dokumenty = import.meta.glob<{ default: ImageMetadata }>('/src/assets/dokumenty/*.jpg', { eager: true });

function najdi(mapa: Record<string, { default: ImageMetadata }>, subor: string | null | undefined): ImageMetadata | undefined {
  if (!subor) return undefined;
  const kluc = Object.keys(mapa).find((k) => k.endsWith('/' + subor));
  return kluc ? mapa[kluc].default : undefined;
}

export const fotkaRadu = (subor: string | null | undefined) => najdi(rady, subor);
export const piktogram = (subor: string | null | undefined) => najdi(piktogramy, subor);
export const fotka = (subor: string | null | undefined) => najdi(fotky, subor);
export const detail = (subor: string | null | undefined) => najdi(detaily, subor);
export const fotkaReferencie = (subor: string | null | undefined) => najdi(referencie, subor);
export const nahladDokumentu = (subor: string | null | undefined) => najdi(dokumenty, subor);

/** Fotky spojok a príslušenstva z galérie watts.eu podľa id produktu: zväčšené a vyrezané z bieleho
 *  pozadia (priehľadné WebP, data/vylepsi_obrazky.py). Nový diel bez úpravy má pôvodné JPG. */
const produkty = import.meta.glob<{ default: ImageMetadata }>('/src/assets/produkty/*.{webp,jpg}', { eager: true });
export const fotkaProduktu = (id: string) => najdi(produkty, `${id}.webp`) ?? najdi(produkty, `${id}.jpg`);

/**
 * Rendery vlastného 3D modelu (data/blender, data/rendery_web.py; od 26. 10. 2026 nahrádzajú rendery Watts):
 *  rady/<id radu>     záber celého potrubia na karty, katalóg, menu, výber a hľadanie
 *  hlavy/<id radu>    čelný pohľad na rez do hlavy stránky radu a systému
 *  varianty/<obj. č.> čelný pohľad ku každej dimenzii (živé kóty)
 *  hero, rodina, makra  hero domova, rodina systémov, makrá vrstiev do líp
 * Body pre kóty a pomer strán sú v data/rendery.json. Bez 3D renderu sa použije pôvodný piktogram Watts.
 */
const rendery3d = import.meta.glob<{ default: ImageMetadata }>('/src/assets/3d/*/*.webp', { eager: true });
export type Druh3d = 'rady' | 'hlavy' | 'varianty' | 'hero' | 'rodina' | 'makra' | 'teplo-hlavy' | 'teplo-varianty' | 'mierka' | 'kotuc' | 'cela';
export const render3d = (druh: Druh3d, id: string | null | undefined) => (id ? najdi(rendery3d, `${druh}/${id}.webp`) : undefined);
/** Rad, ktorého render zastupuje piktogram Watts (kategória a systém poznajú len piktogram). */
export const radPiktogramu = (subor: string | null | undefined) => (subor ? (rendery.piktogramy as Record<string, string>)[subor] : undefined);
/** Render radu (celé potrubie), inak piktogram Watts. */
export const obrazRadu = (r: { id: string; piktogram: string | null }) => render3d('rady', r.id) ?? piktogram(r.piktogram);
/** Render systému podľa jeho piktogramu (celé potrubie), inak piktogram Watts. */
export const obrazPiktogramu = (subor: string | null | undefined) => render3d('rady', radPiktogramu(subor)) ?? piktogram(subor);
/** Čelný pohľad do hlavy stránky: vlastný záber hlavy, inak celé potrubie, inak piktogram Watts. */
export const obrazHlavy = (id: string | undefined, subor: string | null | undefined) => render3d('hlavy', id) ?? render3d('rady', id) ?? piktogram(subor);
/** Či obrázok pochádza z 3D modelu (má celé telo a vlastný tieň: bez masky a bez tieňa z CSS). */
const mnozina3d = new Set(Object.values(rendery3d).map((m) => m.default));
export const je3d = (img: ImageMetadata | undefined) => Boolean(img && mnozina3d.has(img));
/** Rozložený rez radu (data/rozklad_web.py): snímky vo web/public/3d/rozklad-<id radu>/, body vrstiev v JSON. */
export interface RozkladData { meno: string; snimok: number; pomer: number; sirky: number[]; cesta: string; body: Record<'plast' | 'pena' | 'rura', [number, number]>[] }
const rozklady = import.meta.glob<{ default: RozkladData }>('/src/data/rozklad-*.json', { eager: true });
export const rozkladRadu = (id: string | null | undefined) => (id ? rozklady[`/src/data/rozklad-${id}.json`]?.default : undefined);
/** Makro materiálu nosnej rúry podľa média radu (vykurovanie žltá PE-Xa, sanita biela PE-Xa, chlad čierna PE 100). */
export const makroRury = (kategoria: string) => render3d('makra', kategoria === 'sanita' ? 'rura-biela' : kategoria === 'studena-a-chladena-voda' ? 'rura-cierna' : 'rura-zlta');
/** Maska odlesku k renderu 3D modelu: len výrobok bez tieňa (<meno>-maska.webp vedľa renderu). */
export const maska3d = (img: ImageMetadata | undefined) => {
  const kluc = img && Object.keys(rendery3d).find((k) => rendery3d[k].default === img);
  return kluc ? rendery3d[kluc.replace(/\.webp$/, '-maska.webp')]?.default : undefined;
};

/* Novinky z 3D modelu (Juraj 28. 10. 2026; data/novinky_web.py): údaje, ktoré ešte nie sú vyrenderované,
   chýbajú a stránka danú časť vynechá. */
const jsonDat = import.meta.glob<{ default: unknown }>('/src/data/{ohyb-*,mierka,teplo,rodina-masky,kotuc}.json', { eager: true });
const dat = <T>(meno: string) => jsonDat[`/src/data/${meno}.json`]?.default as T | undefined;
/** Ohyb na najmenší polomer: snímky vo web/public/3d/ohyb-<id radu>/, body kóty polomeru. */
export const ohybRadu = (id: string | null | undefined) => (id ? dat<import('../components/Ohyb.astro').OhybData>(`ohyb-${id}`) : undefined);
/** Dimenzie radu v mierke: masky a mapa indexov vo web/public/3d/mierka/<id radu>/, body štítkov. */
export interface SystemyData { pomer: number; krok: number; cesta: string; systemy: { rad: string; obj: string; bod: number[] }[] }
export const mierkaRadu = (id: string | null | undefined) => (id ? dat<Record<string, SystemyData>>('mierka')?.[id] : undefined);
/** Rodina na ťuknutie: masky šiestich systémov rodiny z webu. */
export const rodinaMasky = () => dat<SystemyData>('rodina-masky');
/** Teplo v reze: body a teploty kót termo záberov hlavy a variantov, úlohy médií a paleta. */
export interface TeploZaber { rad: string; pomer: number; rury: { bod: number[]; t: number }[]; plast: { bod: number[]; vlavo?: number[]; t: number }; poda: number; q: number | null; rozsah: number[] }
export interface TeploData { hlavy: Record<string, TeploZaber>; varianty: Record<string, TeploZaber>; role: Record<string, string[]>; paleta: [number, [number, number, number]][] }
export const teplo = () => dat<TeploData>('teplo');
/** Kotúč: záber s kótami a odvaľovanie (snímky vo web/public/3d/kotuc-odvalenie/). */
export interface KotucInfo { d_m: number; sirka_m: number; vrstvy: number; zavitov: number; dlzka_m: number }
export interface KotucData {
  zaber?: { pomer: number; kotuc: KotucInfo; body: Record<string, number[]> };
  odvalenie?: { snimok: number; pomer: number; sirky: number[]; cesta: string; kotuc: KotucInfo; body: { vrch: number[]; celo: number[]; volny_m: number }[] };
}
export const kotuc = () => dat<KotucData>('kotuc');
