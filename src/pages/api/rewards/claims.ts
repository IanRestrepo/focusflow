import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';

export const GET: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;
  const claims = await pb.collection('reward_claims').getFullList({
    filter: `user = "${userId}"`,
    sort: '-claimed_at',
    expand: 'reward',
  });

  return new Response(JSON.stringify(claims), {
    headers: { 'Content-Type': 'application/json' },
  });
};
