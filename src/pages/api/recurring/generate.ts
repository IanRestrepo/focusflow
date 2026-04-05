import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';
import { today } from '@/lib/utils';

/** Generates today's tasks from all active recurring templates for this user.
 *  Idempotent: templates with last_generated_date === today are skipped. */
export const POST: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;
  const todayStr = today();
  const todayDOW = new Date(todayStr + 'T12:00:00').getDay(); // 0=Sun … 6=Sat

  // listRule already restricts to current user — only apply the is_active filter
  const templates = await pb.collection('recurring_templates').getFullList({
    filter: `is_active = true`,
  });

  const generated: string[] = [];

  for (const tpl of templates) {
    // Skip already generated today
    if (tpl.last_generated_date === todayStr) continue;

    // Check if today is in the allowed days
    const allowedDays: number[] = (tpl.days ?? '0,1,2,3,4,5,6')
      .split(',').map((d: string) => parseInt(d.trim())).filter((d: number) => !isNaN(d));
    if (!allowedDays.includes(todayDOW)) continue;

    // Parse subtask templates
    let subtaskTemplates: { title: string; points_value: number }[] = [];
    try {
      subtaskTemplates = JSON.parse(tpl.subtask_templates || '[]');
    } catch {}

    // Count existing tasks today for order
    const existing = await pb.collection('tasks').getFullList({
      filter: `user = "${userId}" && date = "${todayStr}"`,
    });

    // Create the task
    const task = await pb.collection('tasks').create({
      user: userId,
      title: tpl.title,
      description: tpl.description ?? '',
      category: tpl.category ?? 'other',
      date: todayStr,
      points_value: tpl.points_value ?? 10,
      status: 'pending',
      order: existing.length,
    });

    // Create subtasks
    for (let i = 0; i < subtaskTemplates.length; i++) {
      const st = subtaskTemplates[i];
      await pb.collection('subtasks').create({
        task: task.id,
        title: st.title,
        points_value: st.points_value ?? 10,
        status: 'pending',
        order: i,
      });
    }

    // Mark template as generated today
    await pb.collection('recurring_templates').update(tpl.id, {
      last_generated_date: todayStr,
    });

    generated.push(task.id);
  }

  return new Response(JSON.stringify({ generated: generated.length, ids: generated }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
