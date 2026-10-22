import type { ImageMetadata } from 'astro';

/** Fotky radov a piktogramy skopírované skriptom data/normalize.py do src/assets. */
const rady = import.meta.glob<{ default: ImageMetadata }>('/src/assets/rady/*.{jpg,jpeg,png}', { eager: true });
const piktogramy = import.meta.glob<{ default: ImageMetadata }>('/src/assets/piktogramy/*.png', { eager: true });
const fotky = import.meta.glob<{ default: ImageMetadata }>('/src/assets/fotky/*.{jpg,jpeg,png}', { eager: true });
const referencie = import.meta.glob<{ default: ImageMetadata }>('/src/assets/referencie/*.jpg', { eager: true });
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
export const fotkaReferencie = (subor: string | null | undefined) => najdi(referencie, subor);

/** Fotky spojok a príslušenstva z galérie watts.eu podľa id produktu: zväčšené a vyrezané z bieleho
 *  pozadia (priehľadné WebP, data/vylepsi_obrazky.py). Nový diel bez úpravy má pôvodné JPG. */
const produkty = import.meta.glob<{ default: ImageMetadata }>('/src/assets/produkty/*.{webp,jpg}', { eager: true });
export const fotkaProduktu = (id: string) => najdi(produkty, `${id}.webp`) ?? najdi(produkty, `${id}.jpg`);
