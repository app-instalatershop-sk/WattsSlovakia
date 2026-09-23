import type { APIRoute } from 'astro';
import { indexHladania } from '../../lib/hladanie';

export const GET: APIRoute = async () => new Response(JSON.stringify(await indexHladania('sk')), { headers: { 'Content-Type': 'application/json' } });
