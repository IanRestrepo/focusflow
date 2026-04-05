import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';

const MIN_REWARD_COST = 1_000;

export const GET: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;
  const rewards = await pb.collection('rewards').getFullList({
    filter: `user = "${userId}" && is_active = true && cost >= ${MIN_REWARD_COST}`,
    sort: 'cost',
  });

  return new Response(JSON.stringify(rewards), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;
  const body = await request.json();
  const { title, description, icon } = body;
  const cost = parseInt(body.cost) || 0;

  if (!title?.trim()) {
    return new Response(JSON.stringify({ error: 'El título es obligatorio.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (cost < MIN_REWARD_COST) {
    return new Response(JSON.stringify({ error: `El costo mínimo es ${MIN_REWARD_COST.toLocaleString('es-ES')} puntos.` }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const reward = await pb.collection('rewards').create({
    user: userId,
    title: title.trim(),
    description: description?.trim() ?? '',
    cost,
    icon: icon ?? '🎁',
    is_active: true,
  });

  return new Response(JSON.stringify(reward), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
