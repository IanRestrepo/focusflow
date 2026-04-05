import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';

export const POST: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;
  const { password, passwordConfirm } = await request.json();

  await pb.collection('users').update(userId, { password, passwordConfirm, oldPassword: password });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
