import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL ?? 'http://127.0.0.1:8091';

/** Create a PocketBase client, loading auth from cookie if provided.
 *  Auto-cancellation is disabled — in SSR we run multiple parallel fetches
 *  (Promise.all) and the SDK would otherwise abort them as "duplicates". */
export function createPBClient(cookieHeader?: string | null): PocketBase {
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  if (cookieHeader) {
    pb.authStore.loadFromCookie(cookieHeader);
  }
  return pb;
}

/** Returns a PB client authenticated from the request cookie */
export function getPBFromRequest(request: Request): PocketBase {
  const cookie = request.headers.get('cookie');
  return createPBClient(cookie);
}

export { PB_URL };
