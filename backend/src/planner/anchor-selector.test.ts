import { test } from "node:test";
import assert from "node:assert/strict";
import { selectAnchors } from "./anchor-selector.ts";
import { makePreferences, makeSite } from "./test-fixtures.ts";
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

test("only high-priority or must-see sites are eligible", () => {
  const highPriority = makeScored(makeSite({ slug: "high", editorialPriority: 5 }), 10);
  const lowPriority = makeScored(makeSite({ slug: "low", editorialPriority: 2 }), 20);

  const anchors = selectAnchors([highPriority, lowPriority], makePreferences());

  assert.deepEqual(anchors.map((site) => site.slug), ["high"]);
});

test("a low-priority must-see site is still included", () => {
  const mustSee = makeScored(makeSite({ slug: "must-see", editorialPriority: 1 }), 5);
  const preferences = makePreferences({ mustSeeSlugs: ["must-see"] });

  const anchors = selectAnchors([mustSee], preferences);

  assert.deepEqual(anchors.map((site) => site.slug), ["must-see"]);
});

test("anchors are sorted by score descending", () => {
  const low = makeScored(makeSite({ slug: "low", editorialPriority: 5 }), 10);
  const high = makeScored(makeSite({ slug: "high", editorialPriority: 5 }), 30);
  const mid = makeScored(makeSite({ slug: "mid", editorialPriority: 5 }), 20);

  const anchors = selectAnchors([low, high, mid], makePreferences());

  assert.deepEqual(anchors.map((site) => site.slug), ["high", "mid", "low"]);
});

test("anchors are capped at preferences.days * 2", () => {
  const eligible = Array.from({ length: 5 }, (_, index) =>
    makeScored(makeSite({ slug: `site-${index}`, editorialPriority: 5 }), 10 - index),
  );
  const preferences = makePreferences({ days: 1 });

  const anchors = selectAnchors(eligible, preferences);

  assert.equal(anchors.length, 2);
});
