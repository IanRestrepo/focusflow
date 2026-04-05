import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';

export const POST: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;
  const { is_public } = await request.json();

  await pb.collection('users').update(userId, { is_public });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
