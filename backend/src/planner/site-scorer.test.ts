import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreSites } from "./site-scorer.ts";
import { makePreferences, makeSite } from "./test-fixtures.ts";

function scoreOne(site: ReturnType<typeof makeSite>, preferences: ReturnType<typeof makePreferences>) {
  const [scored] = scoreSites([site], preferences);
  return scored;
}

test("theme score sums only weights for themes the user selected", () => {
  const site = makeSite({
    themes: [
      { slug: "byzantine", weight: 2 },
      { slug: "ottoman", weight: 3 },
    ],
  });
  const preferences = makePreferences({ themes: ["byzantine"] });

  assert.equal(scoreOne(site, preferences).themeScore, 2 * 40);
});

test("mustSeeBoost is 1000 only for must-see slugs", () => {
  const site = makeSite({ slug: "hagia" });
  const withBoost = scoreOne(site, makePreferences({ mustSeeSlugs: ["hagia"] }));
  const withoutBoost = scoreOne(site, makePreferences({ mustSeeSlugs: [] }));

  assert.equal(withBoost.mustSeeBoost, 1000);
  assert.equal(withoutBoost.mustSeeBoost, 0);
});

test("budget penalty follows the sensitivity/cost matrix", () => {
  const cases: Array<[UserPreferencesBudget, CostCategory, number]> = [
    ["low", "high", 0],
    ["medium", "high", 12],
    ["medium", "low", 0],
    ["high", "high", 24],
    ["high", "medium", 10],
    ["high", "low", 0],
  ];

  for (const [budgetSensitivity, costCategory, expected] of cases) {
    const site = makeSite({ costCategory });
    const preferences = makePreferences({ budgetSensitivity });
    assert.equal(
      scoreOne(site, preferences).budgetPenalty,
      expected,
      `${budgetSensitivity}/${costCategory} should be ${expected}`,
    );
  }
});

test("time penalty triggers once visit+wait exceeds 35% of the day", () => {
  const preferences = makePreferences({ hoursPerDay: 8 }); // 480 min/day, 35% = 168 min
  const underLimit = makeSite({ estimatedVisitMinutes: 60, typicalWaitMinutes: 10 });
  const overLimit = makeSite({ estimatedVisitMinutes: 150, typicalWaitMinutes: 30 });

  assert.equal(scoreOne(underLimit, preferences).timePenalty, 0);
  assert.equal(scoreOne(overLimit, preferences).timePenalty, 10);
});

test("familiarity adjustment penalizes beginners and rewards experts on enthusiast sites", () => {
  const site = makeSite({ familiarityLevelHint: "enthusiast" });

  assert.equal(scoreOne(site, makePreferences({ familiarity: "beginner" })).familiarityAdjustment, -12);
  assert.equal(scoreOne(site, makePreferences({ familiarity: "knowledgeable" })).familiarityAdjustment, 8);
  assert.equal(scoreOne(site, makePreferences({ familiarity: "intermediate" })).familiarityAdjustment, 0);

  const generalSite = makeSite({ familiarityLevelHint: "all" });
  assert.equal(scoreOne(generalSite, makePreferences({ familiarity: "beginner" })).familiarityAdjustment, 0);
});

test("relationship score weights must-see-linked relationships higher", () => {
  const site = makeSite({
    slug: "cistern",
    relationships: [{ fromSlug: "cistern", toSlug: "hagia", relationshipType: "nearby", strength: 1 }],
  });

  const linkedToMustSee = scoreOne(site, makePreferences({ mustSeeSlugs: ["hagia"] }));
  const notLinked = scoreOne(site, makePreferences({ mustSeeSlugs: [] }));

  assert.equal(linkedToMustSee.proximityScore, 1 * 8);
  assert.equal(notLinked.proximityScore, 1 * 2);
});

test("final score is the sum of all components", () => {
  const site = makeSite({
    slug: "hagia",
    editorialPriority: 5,
    costCategory: "high",
    estimatedVisitMinutes: 75,
    typicalWaitMinutes: 20,
    familiarityLevelHint: "all",
    themes: [
      { slug: "byzantine", weight: 1 },
      { slug: "religious-history", weight: 0.5 },
    ],
    relationships: [{ fromSlug: "hagia", toSlug: "blue-mosque", relationshipType: "nearby", strength: 0.5 }],
  });
  const preferences = makePreferences({
    hoursPerDay: 8,
    budgetSensitivity: "high",
    familiarity: "beginner",
    themes: ["byzantine", "religious-history"],
    mustSeeSlugs: ["hagia"],
  });

  const scored = scoreOne(site, preferences);

  assert.equal(scored.themeScore, 60);
  assert.equal(scored.significanceScore, 50);
  assert.equal(scored.mustSeeBoost, 1000);
  assert.equal(scored.budgetPenalty, 24);
  assert.equal(scored.timePenalty, 0);
  assert.equal(scored.familiarityAdjustment, 0);
  assert.equal(scored.proximityScore, 4);
  assert.equal(
    scored.score,
    scored.themeScore +
      scored.significanceScore +
      scored.mustSeeBoost +
      scored.familiarityAdjustment +
      scored.proximityScore -
      scored.budgetPenalty -
      scored.timePenalty,
  );
  assert.equal(scored.score, 1090);
});

type UserPreferencesBudget = "low" | "medium" | "high";
type CostCategory = "free" | "low" | "medium" | "high";
