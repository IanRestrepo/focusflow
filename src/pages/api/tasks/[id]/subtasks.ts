import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';

export const POST: APIRoute = async ({ request, params }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const { id } = params;
  const body = await request.json();
  const { title, points_value = 10 } = body;

  // Get current subtask count
  const existing = await pb.collection('subtasks').getFullList({
    filter: `task = "${id}"`,
  });

  const subtask = await pb.collection('subtasks').create({
    task: id,
    title,
    points_value,
    status: 'pending',
    order: existing.length,
  });

  return new Response(JSON.stringify(subtask), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
