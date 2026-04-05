import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';

/**
 * GET /api/stats/charts?days=30
 * Returns data for 3 dashboard charts:
 *   1. activity    – daily points earned (consistency)
 *   2. completion  – daily task completion %
 *   3. habits      – cumulative active recurring templates over time
 */
export const GET: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;
  const url    = new URL(request.url);
  const days   = Math.min(90, Math.max(7, parseInt(url.searchParams.get('days') ?? '30')));

  // Build date range
  const dateList: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dateList.push(d.toISOString().split('T')[0]);
  }
  const startDate = dateList[0];

  // ── Fetch all tasks in range ───────────────────────────────────────────────
  const tasks = await pb.collection('tasks').getFullList({
    filter: `user = "${userId}" && date >= "${startDate}"`,
    fields: 'id,date,status,points_value',
  });

  // ── Fetch subtask completions (for points per day) ─────────────────────────
  const subtasks = await pb.collection('subtasks').getFullList({
    filter: `task.user = "${userId}" && completed_at >= "${startDate}T00:00:00Z"`,
    fields: 'points_value,completed_at,status',
  });

  // ── Fetch recurring templates with creation date ───────────────────────────
  const templates = await pb.collection('recurring_templates').getFullList({
    filter: `user = "${userId}"`,
    fields: 'id,is_active,created',
  });

  // ── Build chart data per day ───────────────────────────────────────────────
  const activity: { date: string; label: string; pts: number; active: boolean }[] = [];
  const completion: { date: string; label: string; pct: number; done: number; total: number }[] = [];

  for (const dayStr of dateList) {
    const label = new Date(dayStr + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    // Points earned this day (from subtask completions)
    const dayPts = subtasks
      .filter(s => s.status === 'completed' && s.completed_at?.startsWith(dayStr))
      .reduce((sum: number, s: any) => sum + (s.points_value ?? 0), 0);

    // Task completion %
    const dayTasks = tasks.filter((t: any) => t.date === dayStr);
    const doneTasks = dayTasks.filter((t: any) => t.status === 'completed').length;
    const pct = dayTasks.length > 0 ? Math.round((doneTasks / dayTasks.length) * 100) : -1; // -1 = no tasks

    activity.push({ date: dayStr, label, pts: dayPts, active: dayPts > 0 });
    completion.push({ date: dayStr, label, pct: pct < 0 ? 0 : pct, done: doneTasks, total: dayTasks.length });
  }

  // ── Habits chart: cumulative active templates per day ──────────────────────
  const habits: { date: string; label: string; count: number }[] = [];
  for (const dayStr of dateList) {
    const label = new Date(dayStr + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    // Count templates created on or before this day (that are still active or were created then)
    const count = templates.filter((t: any) => {
      const created = t.created?.split('T')[0] ?? '';
      return created <= dayStr;
    }).length;
    habits.push({ date: dayStr, label, count });
  }

  // ── Summary stats ──────────────────────────────────────────────────────────
  const activeDays    = activity.filter(d => d.active).length;
  const consistencyPct = Math.round((activeDays / days) * 100);
  const totalTasks    = completion.reduce((s, d) => s + d.total, 0);
  const totalDone     = completion.reduce((s, d) => s + d.done, 0);
  const avgCompletion = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  const activeHabits  = templates.filter((t: any) => t.is_active).length;

  return new Response(JSON.stringify({
    activity, completion, habits,
    summary: { consistencyPct, avgCompletion, activeHabits, activeDays, days },
  }), { headers: { 'Content-Type': 'application/json' } });
};
