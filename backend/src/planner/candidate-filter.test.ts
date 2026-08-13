import { test } from "node:test";
import assert from "node:assert/strict";
import { filterCandidates } from "./candidate-filter.ts";
import { makePreferences, makeSite } from "./test-fixtures.ts";

test("must-see sites always survive filtering", () => {
  const site = makeSite({ slug: "must-see", costCategory: "high", familiarityLevelHint: "enthusiast" });
  const preferences = makePreferences({
    budgetSensitivity: "high",
    familiarity: "beginner",
    mustSeeSlugs: ["must-see"],
  });

  const result = filterCandidates([site], preferences);

  assert.deepEqual(result, [site]);
});

test("high budget sensitivity drops non-must-see high-cost sites", () => {
  const site = makeSite({ slug: "expensive", costCategory: "high" });
  const preferences = makePreferences({ budgetSensitivity: "high" });

  assert.deepEqual(filterCandidates([site], preferences), []);
});

test("beginner familiarity drops non-must-see enthusiast-hint sites", () => {
  const site = makeSite({ slug: "niche", familiarityLevelHint: "enthusiast" });
  const preferences = makePreferences({ familiarity: "beginner" });

  assert.deepEqual(filterCandidates([site], preferences), []);
});

test("a site matching no exclusion rule passes through", () => {
  const site = makeSite({ slug: "ordinary", costCategory: "low", familiarityLevelHint: "all" });
  const preferences = makePreferences({ budgetSensitivity: "high", familiarity: "beginner" });

  assert.deepEqual(filterCandidates([site], preferences), [site]);
});
