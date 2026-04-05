import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';
import { spendPoints } from '@/lib/points';
import {
  getRewardPhase, PHASE_CONFIGS,
  getNextClaimAt, countClaimsInWindow,
} from '@/lib/rewards';

const MIN_REWARD_COST = 1_000;

export const POST: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;
  const body   = await request.json();
  const { rewardId, cost } = body;

  const user   = await pb.collection('users').getOne(userId);
  const claims = await pb.collection('reward_claims').getFullList({ sort: '-claimed_at' });

  // ── Determinar fase y configuración ──────────────────────────────────────
  const phase  = getRewardPhase(user.created, user.streak_days ?? 0);
  const config = PHASE_CONFIGS[phase];

  // ── Comprobar cooldown y límite diario ────────────────────────────────────
  const nextClaimAt = getNextClaimAt(claims, config);
  if (nextClaimAt !== null) {
    const msLeft       = nextClaimAt.getTime() - Date.now();
    const hoursLeft    = Math.floor(msLeft / 3600000);
    const minutesLeft  = Math.ceil((msLeft % 3600000) / 60000);

    const timeStr = hoursLeft > 0
      ? `${hoursLeft}h ${minutesLeft}min`
      : `${minutesLeft} min`;

    const claimsToday = countClaimsInWindow(claims, 24);
    const hitDailyLimit = claimsToday >= config.maxPerDay;

    return new Response(JSON.stringify({
      error: hitDailyLimit
        ? `Límite diario alcanzado (${config.maxPerDay}/${config.maxPerDay}). Próximo premio en ${timeStr}.`
        : `Cooldown activo. Próximo premio disponible en ${timeStr}.`,
      cooldown: true,
      nextClaimAt: nextClaimAt.toISOString(),
      hoursLeft,
      minutesLeft,
    }), { status: 429, headers: { 'Content-Type': 'application/json' } });
  }

  // ── Validar costo mínimo ──────────────────────────────────────────────────
  if (cost < MIN_REWARD_COST) {
    return new Response(
      JSON.stringify({ error: `Las recompensas deben costar al menos ${MIN_REWARD_COST.toLocaleString('es-ES')} puntos.` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── Comprobar puntos ──────────────────────────────────────────────────────
  const success = await spendPoints(pb, userId, cost, user.current_points);
  if (!success) {
    return new Response(
      JSON.stringify({ error: 'Puntos insuficientes' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── Registrar canje ───────────────────────────────────────────────────────
  const claim = await pb.collection('reward_claims').create({
    user:         userId,
    reward:       rewardId,
    points_spent: cost,
    claimed_at:   new Date().toISOString(),
    phase,
  });

  const updatedUser = await pb.collection('users').getOne(userId);

  // Calcular próximo canjeo disponible para devolver al cliente
  const allClaims = await pb.collection('reward_claims').getFullList({ sort: '-claimed_at' });
  const nextAvailable = getNextClaimAt(allClaims, config);

  return new Response(JSON.stringify({
    success:        true,
    claim,
    currentPoints:  updatedUser.current_points,
    phase,
    nextClaimAt:    nextAvailable?.toISOString() ?? null,
    claimsToday:    countClaimsInWindow(allClaims, 24),
    maxPerDay:      config.maxPerDay,
  }), { headers: { 'Content-Type': 'application/json' } });
};
