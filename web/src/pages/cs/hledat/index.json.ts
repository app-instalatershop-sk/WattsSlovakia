import type { APIRoute } from 'astro';
import { indexHladania } from '../../../lib/hladanie';

export const GET: APIRoute = async () => new Response(JSON.stringify(await indexHladania('cs')), { headers: { 'Content-Type': 'application/json' } });
