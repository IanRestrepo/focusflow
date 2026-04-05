import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';
import {
  getRewardPhase, PHASE_CONFIGS,
  getNextClaimAt, countClaimsInWindow, getPremiumBonusStatus,
} from '@/lib/rewards';

export const GET: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;
  const user   = await pb.collection('users').getOne(userId);

  const claims = await pb.collection('reward_claims').getFullList({
    sort: '-claimed_at',
  });

  const phase  = getRewardPhase(user.created, user.streak_days ?? 0);
  const config = PHASE_CONFIGS[phase];

  const nextClaimAt  = getNextClaimAt(claims, config);
  const claimsToday  = countClaimsInWindow(claims, 24);
  const bonus        = phase === 3 ? getPremiumBonusStatus(claims) : { available: false, nextAt: null };

  return new Response(JSON.stringify({
    phase,
    config,
    canClaim:     nextClaimAt === null,
    nextClaimAt:  nextClaimAt?.toISOString() ?? null,
    claimsToday,
    maxPerDay:    config.maxPerDay,
    // Phase 3 bonus
    premiumBonusAvailable: bonus.available,
    premiumBonusNextAt:    bonus.nextAt?.toISOString() ?? null,
  }), { headers: { 'Content-Type': 'application/json' } });
};
