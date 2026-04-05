import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';
import { DEFAULT_REWARDS } from '@/lib/defaultRewards';
import { today } from '@/lib/utils';

export const POST: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;

  // ── Delete all user data ──────────────────────────────────────────────────
  // listRule on each collection restricts to current user — no extra filter needed
  const [tasks, rewards, claims, recurringTemplates] = await Promise.all([
    pb.collection('tasks').getFullList(),
    pb.collection('rewards').getFullList(),
    pb.collection('reward_claims').getFullList(),
    pb.collection('recurring_templates').getFullList(),
  ]);

  // Delete subtasks first, then tasks
  for (const task of tasks) {
    const subtasks = await pb.collection('subtasks').getFullList({ filter: `task = "${task.id}"` });
    await Promise.all(subtasks.map((s: any) => pb.collection('subtasks').delete(s.id)));
    await pb.collection('tasks').delete(task.id);
  }

  await Promise.all([
    ...rewards.map((r: any) => pb.collection('rewards').delete(r.id)),
    ...claims.map((c: any) => pb.collection('reward_claims').delete(c.id)),
    ...recurringTemplates.map((t: any) => pb.collection('recurring_templates').delete(t.id)),
  ]);

  // ── Reset user stats to zero ──────────────────────────────────────────────
  await pb.collection('users').update(userId, {
    total_points: 0,
    current_points: 0,
    level: 1,
    streak_days: 0,
    last_active_date: '',
  });

  // ── Restore default rewards ───────────────────────────────────────────────
  for (const reward of DEFAULT_REWARDS) {
    await pb.collection('rewards').create({
      ...reward,
      user: userId,
      is_active: true,
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
