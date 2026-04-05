// ── Sistema de puntos basado en complejidad real ──────────────────────────────

export type EffortLevel = 'routine' | 'moderate' | 'creative' | 'analytical';
export type DifficultyPreset = 'very_easy' | 'easy' | 'normal' | 'hard';

// Effort → raw multiplier unit (relative to each other at 25-unit steps)
export const EFFORT_VALUES: Record<EffortLevel, number> = {
  routine:    25,  // 1x
  moderate:   50,  // 2x
  creative:   75,  // 3x
  analytical: 100, // 4x
};

// Category → task-type multiplier
export const CATEGORY_MULTIPLIERS: Record<string, number> = {
  work:     1.5,
  learning: 1.3,
  health:   1.2,
  personal: 1.0,
  other:    1.0,
};

// Quick-fill presets: click = sets duration + effort
export const DIFFICULTY_PRESETS: Record<DifficultyPreset, {
  label: string; emoji: string; description: string;
  durationMin: number; effort: EffortLevel;
}> = {
  very_easy: { label: 'Muy fácil', emoji: '🌱', description: 'Rutina, <15 min',      durationMin: 10,  effort: 'routine'    },
  easy:      { label: 'Fácil',     emoji: '⚡', description: 'Moderada, 15-45 min',  durationMin: 25,  effort: 'moderate'   },
  normal:    { label: 'Normal',    emoji: '🔥', description: 'Desafiante, 45-120 min', durationMin: 75, effort: 'creative'   },
  hard:      { label: 'Difícil',   emoji: '💎', description: 'Compleja, 2+ horas',   durationMin: 150, effort: 'analytical' },
};

/** Map effortLevel string → nearest preset key (for AI auto-selection) */
export function effortToPreset(effort: EffortLevel): DifficultyPreset {
  const map: Record<EffortLevel, DifficultyPreset> = {
    routine: 'very_easy', moderate: 'easy', creative: 'normal', analytical: 'hard',
  };
  return map[effort] ?? 'easy';
}

export interface PointsParams {
  durationMin:     number;
  effort:          EffortLevel;
  category:        string;
  numSubtasks:     number;
  hasDependencies?: boolean;
  isUrgent?:       boolean;   // task due <48h
  isCritical?:     boolean;   // task due <24h (today)
}

export interface PointsBreakdown {
  base:         number;
  subtaskBonus: number;
  bonusPts:     number;
  bonusLabels:  string[];
  total:        number;       // clamped & rounded to nearest 50
}

/**
 * Main formula:
 *   base        = (durationMin / 5) × effortValue × categoryMult
 *   subtaskBonus = numSubtasks × 100   (cap 10 subtasks)
 *   bonusPct    = sum of applicable %-bonuses (applied on base only)
 *   total       = clamp(round50(base + subtaskBonus + bonusPts), 50, 10_000)
 */
export function calculatePoints(p: PointsParams): PointsBreakdown {
  const effortVal = EFFORT_VALUES[p.effort] ?? 25;
  const catMult   = CATEGORY_MULTIPLIERS[p.category] ?? 1.0;
  const clampedDur = Math.max(5, Math.min(1440, p.durationMin));

  const base        = Math.round((clampedDur / 5) * effortVal * catMult);
  const numSub      = Math.min(Math.max(0, p.numSubtasks), 10);
  const subtaskBonus = numSub * 100;

  let bonusPct = 0;
  const bonusLabels: string[] = [];

  if (numSub >= 3)          { bonusPct += 0.10; bonusLabels.push('+10% (3+ pasos)'); }
  if (p.hasDependencies)    { bonusPct += 0.15; bonusLabels.push('+15% dependencias'); }
  // critical takes precedence over urgent
  if (p.isCritical)         { bonusPct += 0.30; bonusLabels.push('+30% crítico'); }
  else if (p.isUrgent)      { bonusPct += 0.20; bonusLabels.push('+20% urgente'); }

  const bonusPts = Math.round(base * bonusPct);
  const raw      = base + subtaskBonus + bonusPts;
  const total    = Math.max(50, Math.min(10_000, Math.round(raw / 50) * 50));

  return { base, subtaskBonus, bonusPts, bonusLabels, total };
}

/** Human-readable formula breakdown string */
export function breakdownText(bd: PointsBreakdown): string {
  const parts: string[] = [`${bd.base.toLocaleString('es-ES')} base`];
  if (bd.subtaskBonus > 0) parts.push(`${bd.subtaskBonus} subtareas`);
  if (bd.bonusPts > 0)     parts.push(`${bd.bonusPts} bonus`);
  return parts.join(' + ') + ` = ${bd.total.toLocaleString('es-ES')} pts`;
}
