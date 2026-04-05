import { defineMiddleware } from 'astro:middleware';
import { getPBFromRequest } from '@/lib/pocketbase';

const PUBLIC_ROUTES = ['/login', '/register'];

/** Clears the auth cookie and redirects to /login */
function clearAndRedirect(path = '/login') {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': path,
      // Expire the cookie immediately
      'Set-Cookie': 'pb_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return next();
  }

  // Allow static assets
  if (pathname.startsWith('/_astro') || pathname.startsWith('/sounds')) {
    return next();
  }

  const pb = getPBFromRequest(context.request);

  if (!pb.authStore.isValid) {
    return clearAndRedirect();
  }

  // Verify the token is still valid server-side (catches invalidated tokens
  // e.g. after a password reset, which rotates the tokenKey in PocketBase)
  try {
    const userId = pb.authStore.record?.id;
    if (!userId) return clearAndRedirect();

    const user = await pb.collection('users').getOne(userId);

    context.locals.pb = pb;
    context.locals.user = user;
  } catch {
    // Token rejected by PocketBase — clear cookie and force re-login
    return clearAndRedirect();
  }

  return next();
});
