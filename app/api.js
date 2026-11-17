// make.fun's public API: read-only GET requests, open to any origin (CORS).
// The full API is described at https://make.fun/api/openapi.json.
//
// Answers are cached in memory and revalidated with their ETag (the API binds
// ETags to the minute, so a repeat view inside the minute costs a 304), and
// simultaneous requests for the same path share one fetch.

const API = 'https://make.fun/api';

const cache = new Map();
const inflight = new Map();

async function cachedGet(path) {
  if (inflight.has(path)) return inflight.get(path);
  const hit = cache.get(path);
  const promise = (async () => {
    const headers = hit?.etag ? { 'If-None-Match': hit.etag } : {};
    const res = await fetch(API + path, { headers });
    if (res.status === 304 && hit) return hit.data;
    if (!res.ok) throw new Error(`make.fun API ${res.status} for ${path}`);
    const data = await res.json();
    cache.set(path, { etag: res.headers.get('etag'), data });
    return data;
  })();
  inflight.set(path, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(path);
  }
}

/** The open bounties, one page of up to 100: { items: [...] } (activity=times leaves out the activity a board does not show). */
export const getBounties = () => cachedGet('/competitions?status=open&activity=times&limit=100');

/** One bounty, by its slug. */
export const getBounty = (slug) => cachedGet(`/competitions/${encodeURIComponent(slug)}`);

/** A bounty's leaderboard, first rows only (the full board can run to thousands of entries). */
export const getLeaderboard = (slug) => cachedGet(`/competitions/${encodeURIComponent(slug)}/leaderboard?rows=first`);

/** An account's public profile, by handle. */
export const getProfile = (handle) => cachedGet(`/profiles/${encodeURIComponent(handle)}`);
