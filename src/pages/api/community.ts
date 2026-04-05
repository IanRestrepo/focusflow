import type { APIRoute } from 'astro';
import { getPBFromRequest } from '@/lib/pocketbase';

export const GET: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId     = pb.authStore.record!.id;
  const selfRecord = pb.authStore.record!;

  // Current user — always included even if private
  const self = {
    id:           selfRecord.id,
    username:     selfRecord.username,
    level:        selfRecord.level        ?? 1,
    streak_days:  selfRecord.streak_days  ?? 0,
    total_points: selfRecord.total_points ?? 0,
  };

  // Other public users (list rule now allows authenticated users to query)
  const others: typeof self[] = [];
  try {
    const list = await pb.collection('users').getFullList({
      filter: `is_public = true && id != "${userId}"`,
      fields: 'id,username,level,streak_days,total_points',
    });
    others.push(...list.map((u: any) => ({
      id:           u.id,
      username:     u.username,
      level:        u.level        ?? 1,
      streak_days:  u.streak_days  ?? 0,
      total_points: u.total_points ?? 0,
    })));
  } catch { /* list rule may still restrict — self is always shown */ }

  const all = [self, ...others].sort(
    (a, b) => b.streak_days - a.streak_days || b.level - a.level || b.total_points - a.total_points,
  );

  return new Response(JSON.stringify(all), {
    headers: { 'Content-Type': 'application/json' },
  });
};
