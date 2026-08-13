import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const CACHE_DIR = path.join(import.meta.dirname, ".cache");
const MIN_INTERVAL_MS = 1000;

const lastRequestAtByHost = new Map<string, number>();

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheKeyFor(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

async function readCache(url: string): Promise<unknown | undefined> {
  try {
    const raw = await readFile(path.join(CACHE_DIR, `${cacheKeyFor(url)}.json`), "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

async function writeCache(url: string, data: unknown): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(path.join(CACHE_DIR, `${cacheKeyFor(url)}.json`), JSON.stringify(data), "utf8");
}

async function throttle(host: string): Promise<void> {
  const lastRequestAt = lastRequestAtByHost.get(host) ?? 0;
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - elapsed);
  }
  lastRequestAtByHost.set(host, Date.now());
}

export interface FetchJsonOptions {
  userAgent: string;
  maxRetries?: number;
  useCache?: boolean;
}

/**
 * Fetches and parses JSON with: a descriptive User-Agent (required by
 * Wikimedia and good practice generally), ~1 req/sec throttling per host,
 * 429/503 handling via Retry-After with exponential backoff as a normal
 * path (not an error path -- both were observed during API research), and
 * an on-disk cache so repeated runs during formula-tuning don't re-hit the
 * network at all.
 */
export async function fetchJson<T>(url: string, options: FetchJsonOptions): Promise<T> {
  const { userAgent, maxRetries = 4, useCache = true } = options;

  if (useCache) {
    const cached = await readCache(url);
    if (cached !== undefined) {
      return cached as T;
    }
  }

  const host = new URL(url).host;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    await throttle(host);

    const response = await fetch(url, { headers: { "User-Agent": userAgent } });

    if (response.status === 429 || response.status === 503) {
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
      const waitMs = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds * 1000
        : 2 ** attempt * 1000 + Math.random() * 500;

      if (attempt === maxRetries) {
        throw new Error(`${url} rate-limited/unavailable (${response.status}) after ${maxRetries} retries`);
      }

      console.warn(`${url} returned ${response.status}, retrying in ${Math.round(waitMs)}ms`);
      await sleep(waitMs);
      continue;
    }

    if (!response.ok) {
      throw new Error(`${url} returned ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as T;

    if (useCache) {
      await writeCache(url, data);
    }

    return data;
  }

  throw new Error(`unreachable: exhausted retries for ${url}`);
}
