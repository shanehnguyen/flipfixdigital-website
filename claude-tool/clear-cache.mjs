// Clears all cached audit results from Upstash Redis.
// Usage:
//   node claude-tool/clear-cache.mjs                 → clears every audit:* key
//   node claude-tool/clear-cache.mjs https://foo.com → clears one normalized URL
//
// Reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN from .env.local.

import { config as loadEnv } from 'dotenv';
loadEnv({ path: new URL('../.env.local', import.meta.url) });

import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
  console.error('UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set.');
  process.exit(1);
}

const redis = new Redis({ url, token });

function normalizeUrl(raw) {
  const u = new URL(raw);
  let host = u.hostname.toLowerCase();
  if (host.startsWith('www.')) host = host.slice(4);
  let path = u.pathname || '/';
  if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
  return `${u.protocol}//${host}${path}`;
}

const targetUrl = process.argv[2];

if (targetUrl) {
  const key = `audit:${normalizeUrl(targetUrl)}`;
  const removed = await redis.del(key);
  console.log(removed ? `Cleared: ${key}` : `Not in cache: ${key}`);
  process.exit(0);
}

let cursor = '0';
let total = 0;
do {
  const [next, keys] = await redis.scan(cursor, { match: 'audit:*', count: 100 });
  cursor = String(next);
  if (keys && keys.length) {
    await redis.del(...keys);
    total += keys.length;
    console.log(`Cleared batch of ${keys.length} keys.`);
  }
} while (cursor !== '0');

console.log(`Done. Removed ${total} cached audit${total === 1 ? '' : 's'}.`);
