/**
 * Kóty na obrazoch: typ a body na renderoch radov. Rendery Watts majú rovnakú orientáciu (telo
 * vľavo hore, rez vpravo dole), takže každý render má tri body v percentách obrázka:
 *  plast  horný okraj plášťa pri reze      → štítok nad ním vpravo (prázdny horný roh)
 *  rura   spodok čela najnižšej nosnej rúry → štítok pod ním doľava
 *  ohyb   spodná hrana zvlneného tela       → štítok pod ňou doprava (prázdny dolný roh)
 * Body vypočítal skript z masiek farieb (pena, jadro, telo) a overili sa na kontrolnom obrázku;
 * pri HP je ručne opravená rúra (algoritmus vybral čiernu chráničku kábla namiesto žltej rúry).
 */
type Smer = 'hore-vpravo' | 'hore-vlavo' | 'dole-vpravo' | 'dole-vlavo';
export interface Kota {
  x: number; y: number; l: number; smer: Smer; smerM?: Smer;
  hodnota: string; text: string;
}

type Bod = [number, number];
const BODY: Record<string, { plast: Bod; rura: Bod; ohyb: Bod }> = {
  'rad-cool-duo.png': { plast: [68.1, 22.2], rura: [80.9, 86.4], ohyb: [16.0, 71.8] },
  'rad-cool-uno.png': { plast: [67.6, 22.5], rura: [68.5, 88.7], ohyb: [15.9, 73.8] },
  'rad-cool-vyhrievaci-kabel.png': { plast: [69.4, 38.0], rura: [73.1, 77.0], ohyb: [15.9, 60.0] },
  'rad-duo-kurenie.png': { plast: [60.6, 24.5], rura: [87.1, 83.9], ohyb: [16.0, 69.5] },
  'rad-duo-sanita.png': { plast: [68.7, 21.9], rura: [86.7, 84.1], ohyb: [16.0, 65.5] },
  'rad-hp-tepelne-cerpadlo.png': { plast: [62.9, 33.0], rura: [84.0, 76.0], ohyb: [16.0, 60.9] },
  'rad-quadro.png': { plast: [53.3, 23.3], rura: [70.4, 77.8], ohyb: [16.0, 74.0] },
  'rad-uno-kurenie.png': { plast: [66.1, 26.0], rura: [88.6, 68.4], ohyb: [16.0, 68.0] },
  'rad-uno-sanita.png': { plast: [62.8, 25.6], rura: [91.2, 71.7], ohyb: [16.0, 74.9] },
};

/** Kóty na renderi radu alebo systému z hodnôt, ktoré má stránka z dát; chýbajúca hodnota = bez kóty. */
export function kotyRenderu(
  piktogram: string | null | undefined,
  h: { plast?: [string, string]; rura?: [string, string]; ohyb?: [string, string] },
): Kota[] {
  const b = piktogram ? BODY[piktogram] : undefined;
  if (!b) return [];
  const out: Kota[] = [];
  if (h.plast) out.push({ x: b.plast[0], y: b.plast[1], l: 8, smer: 'hore-vpravo', hodnota: h.plast[0], text: h.plast[1] });
  if (h.rura) out.push({ x: b.rura[0], y: b.rura[1], l: 6, smer: 'dole-vlavo', hodnota: h.rura[0], text: h.rura[1] });
  if (h.ohyb) out.push({ x: b.ohyb[0], y: b.ohyb[1], l: 7, smer: 'dole-vpravo', hodnota: h.ohyb[0], text: h.ohyb[1] });
  return out;
}
