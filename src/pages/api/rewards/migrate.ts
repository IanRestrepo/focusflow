import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';
import { DEFAULT_REWARDS } from '@/lib/defaultRewards';

const MIN_REWARD_COST = 1_000;

/**
 * POST /api/rewards/migrate
 * Desactiva todas las recompensas por debajo del mínimo
 * y crea las recompensas por defecto si el usuario no tiene ninguna válida.
 */
export const POST: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;

  // Obtener todas las recompensas del usuario
  const allRewards = await pb.collection('rewards').getFullList({
    filter: `user = "${userId}"`,
  });

  // Borrar las que estén por debajo del mínimo
  const toDelete = allRewards.filter((r: any) => r.cost < MIN_REWARD_COST);
  await Promise.all(toDelete.map((r: any) => pb.collection('rewards').delete(r.id)));

  // Si después de borrar no quedan recompensas válidas, crear las por defecto
  const remaining = allRewards.filter((r: any) => r.cost >= MIN_REWARD_COST);
  if (remaining.length === 0) {
    for (const reward of DEFAULT_REWARDS) {
      await pb.collection('rewards').create({
        ...reward,
        user: userId,
        is_active: true,
      });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    deleted: toDelete.length,
    defaultsCreated: remaining.length === 0,
  }), { headers: { 'Content-Type': 'application/json' } });
};
