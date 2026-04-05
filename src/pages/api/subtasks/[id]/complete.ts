import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';
import {
  awardSubtaskPoints,
  awardTaskBonus,
  checkAndAwardPerfectDay,
  updateStreak,
  syncLevel,
} from '@/lib/points';
import { today } from '@/lib/utils';

export const POST: APIRoute = async ({ request, params }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const { id } = params;
  const userId = pb.authStore.record!.id;

  // Get subtask
  const subtask = await pb.collection('subtasks').getOne(id!);
  if (subtask.status === 'completed') {
    return new Response(JSON.stringify({ alreadyDone: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get user
  let user = await pb.collection('users').getOne(userId);

  // Update streak first (if needed)
  const prevStreakDate = user.last_active_date;
  const streakDays = await updateStreak(pb, userId, user);
  user = await pb.collection('users').getOne(userId); // refresh
  // True only when the streak counter actually went up this request
  const streakIncremented = user.last_active_date !== prevStreakDate && streakDays > 0;

  // Mark subtask completed
  await pb.collection('subtasks').update(id!, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });

  // Award subtask points
  const earned = await awardSubtaskPoints(pb, userId, subtask.points_value, streakDays);

  // Check if all subtasks of the parent task are now done
  const allSubtasks = await pb.collection('subtasks').getFullList({
    filter: `task = "${subtask.task}"`,
  });
  const allDone = allSubtasks.every((s: any) => s.id === id || s.status === 'completed');

  let taskCompleted = false;
  let bonusPoints = 0;

  if (allDone) {
    // Get parent task
    const task = await pb.collection('tasks').getOne(subtask.task);

    // Only give bonus if task wasn't already completed
    if (task.status !== 'completed') {
      await pb.collection('tasks').update(subtask.task, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      const subtaskSum = allSubtasks.reduce((s: number, st: any) => s + st.points_value, 0);
      bonusPoints = await awardTaskBonus(pb, userId, subtaskSum, streakDays);
      taskCompleted = true;

      // Check perfect day
      await checkAndAwardPerfectDay(pb, userId, task.date);
    }
  }

  // Sync level
  user = await pb.collection('users').getOne(userId);
  const { levelUp, newLevel } = await syncLevel(pb, userId, user.total_points, user.level);

  return new Response(JSON.stringify({
    earned,
    taskCompleted,
    bonusPoints,
    levelUp,
    newLevel,
    streakDays,
    streakIncremented,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
