import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';

export const PATCH: APIRoute = async ({ request, params }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  try {
    const body = await request.json();
    const updated = await pb.collection('recurring_templates').update(params.id!, body);
    return new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[recurring PATCH]', e?.message);
    return new Response(JSON.stringify({ error: e?.message ?? 'Error al actualizar' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  try {
    await pb.collection('recurring_templates').delete(params.id!);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[recurring DELETE]', e?.message);
    return new Response(JSON.stringify({ error: e?.message ?? 'Error al eliminar' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
