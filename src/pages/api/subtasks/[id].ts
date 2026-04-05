import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';
import { TASK_COMPLETE_BONUS_PCT, syncLevel } from '@/lib/points';

export const DELETE: APIRoute = async ({ request, params }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;
  const subtaskId = params.id!;

  // Get the subtask before deleting
  const subtask = await pb.collection('subtasks').getOne(subtaskId);
  let totalDeduction = 0;

  if (subtask.status === 'completed') {
    // Deduct the subtask's points
    totalDeduction += subtask.points_value ?? 0;

    // Check if the parent task was completed — if so, also deduct the task completion bonus
    const parentTask = await pb.collection('tasks').getOne(subtask.task);
    if (parentTask.status === 'completed') {
      // Get all sibling subtasks to recalculate the bonus
      const allSubtasks = await pb.collection('subtasks').getFullList({
        filter: `task = "${subtask.task}"`,
      });
      const completedSubtaskPoints = allSubtasks
        .filter((s: any) => s.status === 'completed')
        .reduce((sum: number, s: any) => sum + (s.points_value ?? 0), 0);
      const taskBonus = Math.round(completedSubtaskPoints * TASK_COMPLETE_BONUS_PCT);
      totalDeduction += taskBonus;

      // Revert parent task to pending since it's no longer fully complete
      await pb.collection('tasks').update(subtask.task, {
        status: 'pending',
        completed_at: null,
      });
    }

    // Apply deduction to user
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
  }

  await pb.collection('subtasks').delete(subtaskId);

  return new Response(JSON.stringify({ success: true, pointsDeducted: totalDeduction }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
