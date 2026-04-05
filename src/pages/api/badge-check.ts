import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';

export const GET: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;

  try {
    const [user, tasks, subtasks, claims] = await Promise.all([
      pb.collection('users').getOne(userId),
      pb.collection('tasks').getFullList({
        filter: `user = "${userId}" && status = "completed"`,
        fields: 'id,category,date,points_value,completed_at',
      }),
      pb.collection('subtasks').getFullList({
        filter: `task.user = "${userId}" && status = "completed"`,
        fields: 'id,completed_at',
      }),
      pb.collection('reward_claims').getFullList({
        filter: `user = "${userId}"`,
        fields: 'id',
      }),
    ]);

    const catWork     = tasks.filter((t: any) => t.category === 'work').length;
    const catHealth   = tasks.filter((t: any) => t.category === 'health').length;
    const catLearn    = tasks.filter((t: any) => t.category === 'learning').length;
    const catPersonal = tasks.filter((t: any) => t.category === 'personal').length;

    // Perfect days
    const byDate: Record<string, any[]> = {};
    tasks.forEach((t: any) => { const d = t.date?.split('T')[0]; if (d) { byDate[d] = byDate[d] ?? []; byDate[d].push(t); } });
    const perfectDays = Object.keys(byDate).length;

    // Max pts in a single day
    const ptsByDate: Record<string, number> = {};
    tasks.forEach((t: any) => { const d = t.date?.split('T')[0]; if (d) ptsByDate[d] = (ptsByDate[d] ?? 0) + (t.points_value ?? 0); });
    const maxDayPts = Math.max(0, ...Object.values(ptsByDate));

    // Unique weekdays active
    const uniqueDays = new Set(tasks.map((t: any) => new Date(t.date + 'T12:00:00').getDay())).size;

    // Multi-cat day
    const catsByDate: Record<string, Set<string>> = {};
    tasks.forEach((t: any) => {
      const d = t.date?.split('T')[0];
      if (d && t.category) { catsByDate[d] = catsByDate[d] ?? new Set(); catsByDate[d].add(t.category); }
    });
    const multiCatDay = Object.values(catsByDate).some((s: Set<string>) => s.size >= 3);

    // Max subtasks in a single day
    const stByDate: Record<string, number> = {};
    subtasks.forEach((s: any) => {
      if (!s.completed_at) return;
      const d = s.completed_at.split('T')[0];
      stByDate[d] = (stByDate[d] ?? 0) + 1;
    });
    const maxDaySubs = Math.max(0, ...Object.values(stByDate));

    // Consistency weeks
    const weeks = new Set(tasks.map((t: any) => {
      const d = new Date(t.date + 'T12:00:00');
      const start = new Date(d); start.setDate(d.getDate() - d.getDay());
      return start.toISOString().split('T')[0];
    })).size;

    // Early bird / night owl
    const earlyBird = tasks.some((t: any) => { if (!t.completed_at) return false; return new Date(t.completed_at).getHours() < 9; });
    const nightOwl  = tasks.some((t: any) => { if (!t.completed_at) return false; return new Date(t.completed_at).getHours() >= 22; });
    const weekend   = (() => { const d = new Set(tasks.map((t: any) => new Date(t.date + 'T12:00:00').getDay())); return d.has(0) && d.has(6); })();

    return new Response(JSON.stringify({
      totalTasks:   tasks.length,
      totalSubs:    subtasks.length,
      totalPoints:  user.total_points ?? 0,
      streakDays:   user.streak_days ?? 0,
      level:        user.level ?? 1,
      claimsCount:  claims.length,
      catWork, catHealth, catLearn, catPersonal,
      perfectDays,
      maxDayPts,
      uniqueDays,
      multiCatDay,
      maxDaySubs,
      weeks,
      earlyBird,
      nightOwl,
      weekend,
      allCats: catWork > 0 && catHealth > 0 && catLearn > 0 && catPersonal > 0,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message }), { status: 500 });
  }
};
