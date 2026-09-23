import type { APIRoute, GetStaticPaths } from 'astro';
import { ogZaznamy, type OgZaznam } from '../../lib/og';
import { kresliOg } from '../../lib/og-kresba';

/** Náhľadové obrázky stránok (Open Graph), jeden na každý záznam registra v lib/og.ts. */
export const getStaticPaths = (async () => (await ogZaznamy()).map((z) => ({ params: { cesta: z.kluc }, props: { z } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => new Response(new Uint8Array(await kresliOg(props.z as OgZaznam)), { headers: { 'Content-Type': 'image/jpeg' } });
