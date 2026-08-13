import { fetchJson } from "./http-client.ts";
import type { SocialSnapshotInput } from "./signal-scorer.ts";

interface StackExchangeSearchResponse {
  items: Array<{
    score: number;
    answer_count: number;
    view_count: number;
    link: string;
  }>;
  quota_remaining: number;
}

export interface StackExchangeResult extends SocialSnapshotInput {
  distinctPostCount: number;
  topItemUrl: string | null;
}

/**
 * Searches travel.stackexchange.com for a site name. Verified empirically
 * (2026-08-13) that this signal is often sparse for individual Istanbul
 * landmarks -- e.g. zero results for "Basilica Cistern" and "Dolmabahce
 * Palace" -- not a bug, a real property of this specific Q&A community's
 * content volume. The scoring formula (signal-scorer.ts) handles this
 * gracefully: zero/low posts just produce a near-zero social score via the
 * breadth gate, rather than an error.
 */
export async function fetchStackExchangeSignal(siteName: string, userAgent: string): Promise<StackExchangeResult> {
  const url =
    `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&` +
    `q=${encodeURIComponent(siteName)}&site=travel`;

  const data = await fetchJson<StackExchangeSearchResponse>(url, { userAgent });

  const postCount = data.items.length;
  const commentCount = data.items.reduce((sum, item) => sum + item.answer_count, 0);
  const scoreSum = data.items.reduce((sum, item) => sum + item.score, 0);
  const topItem = [...data.items].sort((a, b) => b.score - a.score)[0];

  return {
    postCount,
    commentCount,
    scoreSum,
    distinctPostCount: postCount,
    topItemUrl: topItem?.link ?? null,
  };
}
