import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';

export const GET: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const url = new URL(request.url);
  const date = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0];
  const userId = pb.authStore.record!.id;

  const tasks = await pb.collection('tasks').getFullList({
    filter: `user = "${userId}" && date = "${date}"`,
    sort: '+order',
  });

  // Fetch subtasks for each task
  const tasksWithSubtasks = await Promise.all(
    tasks.map(async (task: any) => {
      const subtasks = await pb.collection('subtasks').getFullList({
        filter: `task = "${task.id}"`,
        sort: '+order',
      });
      return { ...task, subtasks };
    })
  );

  return new Response(JSON.stringify(tasksWithSubtasks), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;
  const body = await request.json();
  const { title, description, category, date, points_value, subtasks = [] } = body;

  // Get current task count for order
  const existing = await pb.collection('tasks').getFullList({
    filter: `user = "${userId}" && date = "${date}"`,
  });

  const task = await pb.collection('tasks').create({
    user: userId,
    title,
    description,
    category: category ?? 'other',
    date,
    points_value: points_value ?? 10,
    status: 'pending',
    order: existing.length,
  });

  // Create subtasks
  const createdSubtasks = await Promise.all(
    subtasks.map((st: any, i: number) =>
      pb.collection('subtasks').create({
        task: task.id,
        title: st.title,
        points_value: st.points_value ?? 10,
        status: 'pending',
        order: i,
      })
    )
  );

  return new Response(JSON.stringify({ ...task, subtasks: createdSubtasks }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
