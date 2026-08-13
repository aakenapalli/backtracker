import { test } from "node:test";
import assert from "node:assert/strict";
import { buildClusters } from "./site-clusterer.ts";
import { makeSite } from "./test-fixtures.ts";
import type { ScoredSite } from "../types/domain.ts";

function makeScored(site: ReturnType<typeof makeSite>, score: number): ScoredSite {
  return {
    site,
    score,
    themeScore: 0,
    significanceScore: 0,
    mustSeeBoost: 0,
    budgetPenalty: 0,
    timePenalty: 0,
    familiarityAdjustment: 0,
    proximityScore: 0,
    sourcedInterestScore: 0,
    trendAdjustment: 0,
  };
}

test("builds one cluster per anchor and excludes the anchor from its own supporting sites", () => {
  const anchor = makeSite({ slug: "anchor" });
  const support = makeSite({ slug: "support" });
  const scored = [makeScored(anchor, 100), makeScored(support, 10)];

  const clusters = buildClusters([anchor], scored);

  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].anchor.slug, "anchor");
  assert.deepEqual(
    clusters[0].supportingSites.map((site) => site.slug),
    ["support"],
  );
});

test("supporting sites are capped at 4 and ordered by cluster score", () => {
  const anchor = makeSite({ slug: "anchor" });
  const supporters = Array.from({ length: 6 }, (_, index) =>
    makeScored(makeSite({ slug: `support-${index}` }), index),
  );

  const [cluster] = buildClusters([anchor], [makeScored(anchor, 100), ...supporters]);

  assert.equal(cluster.supportingSites.length, 4);
  assert.deepEqual(
    cluster.supportingSites.map((site) => site.slug),
    ["support-5", "support-4", "support-3", "support-2"],
  );
});

test("relationship strength boosts a supporting site's cluster ranking", () => {
  const anchor = makeSite({
    slug: "anchor",
    relationships: [{ fromSlug: "anchor", toSlug: "linked", relationshipType: "nearby", strength: 1 }],
  });
  const linked = makeScored(makeSite({ slug: "linked" }), 10);
  const higherScoreButUnlinked = makeScored(makeSite({ slug: "unlinked" }), 15);

  const [cluster] = buildClusters([anchor], [makeScored(anchor, 100), linked, higherScoreButUnlinked]);

  // linked: 10 + 1*20 = 30, unlinked: 15 + 0 = 15
  assert.deepEqual(
    cluster.supportingSites.map((site) => site.slug),
    ["linked", "unlinked"],
  );
});
