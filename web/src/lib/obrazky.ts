import type { ImageMetadata } from 'astro';

/** Fotky radov a piktogramy skopírované skriptom data/normalize.py do src/assets. */
const rady = import.meta.glob<{ default: ImageMetadata }>('/src/assets/rady/*.{jpg,jpeg,png}', { eager: true });
const piktogramy = import.meta.glob<{ default: ImageMetadata }>('/src/assets/piktogramy/*.png', { eager: true });
const fotky = import.meta.glob<{ default: ImageMetadata }>('/src/assets/fotky/*.{jpg,jpeg,png}', { eager: true });
/** Detaily materiálov vyrezané z renderov výrobcu (plášť, pena, nosná rúra). */
const detaily = import.meta.glob<{ default: ImageMetadata }>('/src/assets/detaily/*.{jpg,png}', { eager: true });

function najdi(mapa: Record<string, { default: ImageMetadata }>, subor: string | null | undefined): ImageMetadata | undefined {
  if (!subor) return undefined;
  const kluc = Object.keys(mapa).find((k) => k.endsWith('/' + subor));
  return kluc ? mapa[kluc].default : undefined;
}

export const fotkaRadu = (subor: string | null | undefined) => najdi(rady, subor);
export const piktogram = (subor: string | null | undefined) => najdi(piktogramy, subor);
export const fotka = (subor: string | null | undefined) => najdi(fotky, subor);
export const detail = (subor: string | null | undefined) => najdi(detaily, subor);
