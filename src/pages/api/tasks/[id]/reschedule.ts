import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';

export const POST: APIRoute = async ({ request, params }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const { id } = params;
  const body = await request.json();
  const { date } = body;

  await pb.collection('tasks').update(id!, { date, status: 'pending' });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
