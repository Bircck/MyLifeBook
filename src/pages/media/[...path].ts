import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { getMediaAssets } from '../../lib/content';

export function getStaticPaths() {
  return getMediaAssets().map(asset => ({ params: { path: asset.routePath }, props: { asset } }));
}

export const GET: APIRoute = ({ props }) => new Response(new Uint8Array(readFileSync(props.asset.absolutePath)), { headers: { 'Content-Type': props.asset.mime, 'X-Content-Type-Options': 'nosniff' } });
