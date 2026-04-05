import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';
import { TASK_COMPLETE_BONUS_PCT, syncLevel } from '@/lib/points';

export const DELETE: APIRoute = async ({ request, params }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;
  const { id } = params;

  // Get task and subtasks before deleting
  const task = await pb.collection('tasks').getOne(id!);
  const subtasks = await pb.collection('subtasks').getFullList({
    filter: `task = "${id}"`,
  });

  // Calculate points to deduct for completed subtasks
  const completedSubtasks = subtasks.filter((s: any) => s.status === 'completed');
  const completedSubtaskPoints = completedSubtasks.reduce(
    (sum: number, s: any) => sum + (s.points_value ?? 0), 0
  );

  // If the task itself was completed, also deduct the task completion bonus
  const taskBonus = task.status === 'completed'
    ? Math.round(completedSubtaskPoints * TASK_COMPLETE_BONUS_PCT)
    : 0;

  const totalDeduction = completedSubtaskPoints + taskBonus;

  // Deduct points if any were earned
  if (totalDeduction > 0) {
    const user = await pb.collection('users').getOne(userId);
    const newTotalPoints = Math.max(0, (user.total_points ?? 0) - totalDeduction);
    const newCurrentPoints = Math.max(0, (user.current_points ?? 0) - totalDeduction);
    await pb.collection('users').update(userId, {
      total_points: newTotalPoints,
      current_points: newCurrentPoints,
    });
    await syncLevel(pb, userId, newTotalPoints, user.level);
  }

  // Delete subtasks first, then task
  await Promise.all(subtasks.map((s: any) => pb.collection('subtasks').delete(s.id)));
  await pb.collection('tasks').delete(id!);

  return new Response(JSON.stringify({ success: true, pointsDeducted: totalDeduction }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
