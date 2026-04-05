// ── Lógica compartida del sistema de recompensas escalonado ──────────────────

export type RewardPhase = 1 | 2 | 3;

export interface PhaseConfig {
  phase:        RewardPhase;
  label:        string;
  emoji:        string;
  description:  string;
  cooldownHours: number;
  maxPerDay:    number;
  color:        string;
}

export const PHASE_CONFIGS: Record<RewardPhase, PhaseConfig> = {
  1: {
    phase: 1,
    label: 'Bienvenida',
    emoji: '🌱',
    description: 'Hasta 2 premios cada 12 horas',
    cooldownHours: 12,
    maxPerDay: 2,
    color: '#22c55e',
  },
  2: {
    phase: 2,
    label: 'Ritmo base',
    emoji: '⚡',
    description: '1 premio cada 24 horas',
    cooldownHours: 24,
    maxPerDay: 1,
    color: '#3b82f6',
  },
  3: {
    phase: 3,
    label: 'Premium',
    emoji: '👑',
    description: '1 premio al día + bonus exclusivo cada 72 h',
    cooldownHours: 24,
    maxPerDay: 1,
    color: '#f59e0b',
  },
};

/** Determina la fase del usuario */
export function getRewardPhase(userCreated: string, streakDays: number): RewardPhase {
  if (streakDays >= 14) return 3;
  const daysSinceCreation = (Date.now() - new Date(userCreated).getTime()) / 86400000;
  return daysSinceCreation <= 7 ? 1 : 2;
}

/** Cuántas claims hizo el usuario en la ventana de 24h */
export function countClaimsInWindow(claims: { claimed_at: string }[], windowHours: number): number {
  const cutoff = Date.now() - windowHours * 3600000;
  return claims.filter(c => new Date(c.claimed_at).getTime() >= cutoff).length;
}

/** Timestamp del próximo canjeo disponible (null = ya puede canjear) */
export function getNextClaimAt(
  claims: { claimed_at: string }[],
  config: PhaseConfig,
): Date | null {
  if (claims.length === 0) return null;

  // Cooldown desde el último canjeo
  const sorted = [...claims].sort(
    (a, b) => new Date(b.claimed_at).getTime() - new Date(a.claimed_at).getTime()
  );
  const lastClaim = new Date(sorted[0].claimed_at);
  const cooldownEnd = new Date(lastClaim.getTime() + config.cooldownHours * 3600000);
  if (cooldownEnd > new Date()) return cooldownEnd;

  // Límite diario (ventana de 24h)
  const in24h = countClaimsInWindow(claims, 24);
  if (in24h >= config.maxPerDay) {
    // Próximo slot: cuando salga el canjeo más antiguo dentro de la ventana de 24h
    const window24claims = sorted.filter(
      c => new Date(c.claimed_at).getTime() >= Date.now() - 86400000
    );
    const oldest = new Date(window24claims[window24claims.length - 1].claimed_at);
    return new Date(oldest.getTime() + 86400000);
  }

  return null;
}

/** Fase 3: bonus cada 72h — devuelve cuándo estará disponible el próximo bonus */
export function getPremiumBonusStatus(claims: { claimed_at: string }[]): {
  available: boolean;
  nextAt: Date | null;
} {
  if (claims.length === 0) return { available: true, nextAt: null };
  const sorted = [...claims].sort(
    (a, b) => new Date(b.claimed_at).getTime() - new Date(a.claimed_at).getTime()
  );
  const lastClaim = new Date(sorted[0].claimed_at);
  const bonusEnd = new Date(lastClaim.getTime() + 72 * 3600000);
  if (bonusEnd <= new Date()) return { available: true, nextAt: null };
  return { available: false, nextAt: bonusEnd };
}
