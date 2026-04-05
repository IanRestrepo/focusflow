import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';

export const GET: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });
  const userId = pb.authStore.record!.id;

  try {
    // The collection's listRule already restricts to `user = @request.auth.id`,
    // so no additional filter is needed — adding one for a relation field
    // causes a 400 in some PocketBase versions.
    const templates = await pb.collection('recurring_templates').getFullList();
    return new Response(JSON.stringify(templates), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[recurring GET]', e?.message);
    return new Response(JSON.stringify({ error: e?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });
  const userId = pb.authStore.record!.id;

  const body = await request.json();
  const { title, description, category, subtask_templates, days, points_value } = body;

  try {
    const template = await pb.collection('recurring_templates').create({
      user: userId,
      title: title.trim(),
      description: description?.trim() ?? '',
      category: category ?? 'other',
      subtask_templates: JSON.stringify(subtask_templates ?? []),
      days: days ?? '0,1,2,3,4,5,6',
      is_active: true,
      points_value: points_value ?? 10,
      last_generated_date: '',
    });
    return new Response(JSON.stringify(template), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[recurring POST]', e?.message);
    return new Response(JSON.stringify({ error: e?.message ?? 'Error al crear' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
