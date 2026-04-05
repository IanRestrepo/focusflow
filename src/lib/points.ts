import type PocketBase from 'pocketbase';
import { today, yesterday } from './utils';

export const TASK_COMPLETE_BONUS_PCT = 0.20;  // 20% bonus on task completion
export const PERFECT_DAY_BONUS = 50;           // pts bonus if all tasks completed
export const STREAK_MULTIPLIER_PER_DAY = 0.05; // 5% per streak day
export const STREAK_MULTIPLIER_MAX = 1.5;       // cap at 1.5x
export const LEVEL_POINTS = 500;               // pts per level

/** Calculate streak multiplier */
export function streakMultiplier(streakDays: number): number {
  const mult = 1 + streakDays * STREAK_MULTIPLIER_PER_DAY;
  return Math.min(mult, STREAK_MULTIPLIER_MAX);
}

/** Apply streak multiplier and round to integer */
export function applyStreak(points: number, streakDays: number): number {
  return Math.round(points * streakMultiplier(streakDays));
}

/** Calculate task completion bonus from subtask values */
export function taskCompletionBonus(subtaskPointsTotal: number): number {
  return Math.round(subtaskPointsTotal * TASK_COMPLETE_BONUS_PCT);
}

/**
 * Award points for completing a subtask.
 * Updates user's total_points and current_points.
 */
export async function awardSubtaskPoints(
  pb: PocketBase,
  userId: string,
  basePoints: number,
  streakDays: number
): Promise<number> {
  const earned = applyStreak(basePoints, streakDays);
  await pb.collection('users').update(userId, {
    'total_points+': earned,
    'current_points+': earned,
  });
  return earned;
}

/**
 * Award task completion bonus (20% extra).
 */
export async function awardTaskBonus(
  pb: PocketBase,
  userId: string,
  subtaskSum: number,
  streakDays: number
): Promise<number> {
  const bonus = applyStreak(taskCompletionBonus(subtaskSum), streakDays);
  await pb.collection('users').update(userId, {
    'total_points+': bonus,
    'current_points+': bonus,
  });
  return bonus;
}

/**
 * Award perfect-day bonus if all tasks for a date are completed.
 */
export async function checkAndAwardPerfectDay(
  pb: PocketBase,
  userId: string,
  date: string
): Promise<number> {
  const tasks = await pb.collection('tasks').getFullList({
    filter: `user = "${userId}" && date = "${date}"`,
  });

  if (tasks.length === 0) return 0;

  const allDone = tasks.every((t: any) => t.status === 'completed');
  if (!allDone) return 0;

  await pb.collection('users').update(userId, {
    'total_points+': PERFECT_DAY_BONUS,
    'current_points+': PERFECT_DAY_BONUS,
  });

  return PERFECT_DAY_BONUS;
}

/**
 * Update streak: check if user was active yesterday, increment or reset.
 * Returns new streak count.
 */
export async function updateStreak(
  pb: PocketBase,
  userId: string,
  user: any
): Promise<number> {
  const todayStr = today();
  const yesterdayStr = yesterday();

  if (user.last_active_date === todayStr) {
    return user.streak_days; // already counted today
  }

  let newStreak: number;
  if (user.last_active_date === yesterdayStr) {
    newStreak = (user.streak_days ?? 0) + 1;
  } else {
    newStreak = 1; // reset
  }

  await pb.collection('users').update(userId, {
    streak_days: newStreak,
    last_active_date: todayStr,
  });

  return newStreak;
}

/**
 * Recalculate and update user level based on total_points.
 * Returns true if level changed.
 */
export async function syncLevel(
  pb: PocketBase,
  userId: string,
  totalPoints: number,
  currentLevel: number
): Promise<{ levelUp: boolean; newLevel: number }> {
  const newLevel = Math.floor(totalPoints / LEVEL_POINTS) + 1;
  if (newLevel !== currentLevel) {
    await pb.collection('users').update(userId, { level: newLevel });
    return { levelUp: newLevel > currentLevel, newLevel };
  }
  return { levelUp: false, newLevel: currentLevel };
}

/**
 * Spend current_points for a reward claim.
 * Returns false if insufficient points.
 */
export async function spendPoints(
  pb: PocketBase,
  userId: string,
  cost: number,
  currentPoints: number
): Promise<boolean> {
  if (currentPoints < cost) return false;
  await pb.collection('users').update(userId, {
    'current_points+': -cost,
  });
  return true;
}
