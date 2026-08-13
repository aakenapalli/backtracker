export function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = clamp(Math.round((p / 100) * (sorted.length - 1)), 0, sorted.length - 1);

  return sorted[index];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Raw (pre-corpus-normalization) interest value for one site: median of
 * trailing months, log10-transformed. Median (not mean) so a single spike
 * month can't move the baseline. log10 because real pageview data spans a
 * 173x range across a 27-site corpus -- linear would make the single most
 * popular site dominate every other site's score.
 */
export function rawInterest(monthlyViews: number[]): number {
  return Math.log10(median(monthlyViews) + 1);
}

/**
 * Normalizes a raw value into [0, 1] using the corpus's 10th/90th
 * percentile as the range, not min/max -- so one future outlier site
 * (extremely popular or extremely obscure) doesn't compress every other
 * site's score toward one end.
 */
export function normalizeToCorpus(rawValue: number, corpusRawValues: number[]): number {
  const p10 = percentile(corpusRawValues, 10);
  const p90 = percentile(corpusRawValues, 90);

  if (p90 <= p10) {
    return 0.5;
  }

  return clamp((rawValue - p10) / (p90 - p10), 0, 1);
}

/**
 * Recent momentum relative to a longer baseline, clamped to [-1, 1]. This
 * clamp is the anti-virality mechanism: a 100x viral spike computes to
 * log2(100) =~ 6.6 but clamps to exactly +1 -- the same ceiling as a modest
 * doubling. `monthlyViewsChronological` must be oldest-first; the most
 * recent 3 entries are "recent," the rest are "baseline."
 */
export function computeTrendScore(monthlyViewsChronological: number[]): number {
  if (monthlyViewsChronological.length < 4) {
    return 0;
  }

  const recentWindow = monthlyViewsChronological.slice(-3);
  const baselineWindow = monthlyViewsChronological.slice(0, -3);

  const recent = median(recentWindow);
  const baseline = median(baselineWindow);

  if (baseline <= 0) {
    return recent > 0 ? 1 : 0;
  }

  return clamp(Math.log2(recent / baseline), -1, 1);
}

export interface SocialSnapshotInput {
  postCount: number;
  commentCount: number;
  scoreSum: number;
}

/**
 * Per-post contribution is capped via log10 before summing, so one
 * enormously-upvoted post contributes a bounded amount rather than
 * dominating the total. Distinct post count is tracked separately for the
 * breadth gate below.
 */
export function rawSocialInterest(snapshot: SocialSnapshotInput): number {
  const perPostCap = 5.0;
  const perPostContribution = Math.min(
    Math.log10(1 + Math.max(snapshot.scoreSum, 0) + snapshot.commentCount),
    perPostCap,
  );

  return Math.log10(1 + perPostContribution * snapshot.postCount);
}

/**
 * A place discussed in exactly one viral thread and nowhere else is
 * structurally capped below a place with broad, sustained discussion --
 * "loud" and "broadly discussed" are different things, and only the second
 * should be able to reach a high score.
 */
export function applyBreadthGate(score: number, distinctPostCount: number): number {
  return distinctPostCount < 3 ? Math.min(score, 0.5) : score;
}
