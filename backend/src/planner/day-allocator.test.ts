import { test } from "node:test";
import assert from "node:assert/strict";
import { allocateDays } from "./day-allocator.ts";
import { makePreferences, makeSite } from "./test-fixtures.ts";
import type { SiteCluster } from "./site-clusterer.ts";
import type { ScoredSite } from "../types/domain.ts";

function makeCluster(anchor: ReturnType<typeof makeSite>, supportingSites: ReturnType<typeof makeSite>[] = []): SiteCluster {
  return { anchor, supportingSites };
}

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

test("produces exactly preferences.days day plans", () => {
  const days = allocateDays([], makePreferences({ days: 3 }));
  assert.equal(days.length, 3);
  assert.deepEqual(days.map((day) => day.dayNumber), [1, 2, 3]);
  assert.ok(days.every((day) => day.totalPlannedMinutes === 0 && day.stops.length === 0));
});

test("anchors balance across the least-loaded day", () => {
  const anchorA = makeSite({ slug: "anchor-a", estimatedVisitMinutes: 100, typicalWaitMinutes: 0 });
  const anchorB = makeSite({ slug: "anchor-b", estimatedVisitMinutes: 100, typicalWaitMinutes: 0 });
  const preferences = makePreferences({ days: 2, hoursPerDay: 8 });

  const days = allocateDays([makeCluster(anchorA), makeCluster(anchorB)], preferences);

  assert.equal(days[0].stops[0]?.siteSlug, "anchor-a");
  assert.equal(days[1].stops[0]?.siteSlug, "anchor-b");
});

test("a site already placed is never duplicated across clusters", () => {
  const shared = makeSite({ slug: "shared", estimatedVisitMinutes: 30, typicalWaitMinutes: 0 });
  const anchorA = makeSite({ slug: "anchor-a", estimatedVisitMinutes: 30, typicalWaitMinutes: 0 });
  const anchorB = makeSite({ slug: "anchor-b", estimatedVisitMinutes: 30, typicalWaitMinutes: 0 });
  const preferences = makePreferences({ days: 2, hoursPerDay: 8 });

  const days = allocateDays(
    [makeCluster(anchorA, [shared]), makeCluster(anchorB, [shared])],
    preferences,
  );

  const sharedOccurrences = days.flatMap((day) => day.stops).filter((stop) => stop.siteSlug === "shared");
  assert.equal(sharedOccurrences.length, 1);
});

test("a non-must-see supporting site is dropped past the 95% capacity soft cap", () => {
  const anchor = makeSite({ slug: "anchor", estimatedVisitMinutes: 60, typicalWaitMinutes: 0 });
  const bigSupport = makeSite({ slug: "big", estimatedVisitMinutes: 400, typicalWaitMinutes: 0 });
  const preferences = makePreferences({ days: 1, hoursPerDay: 8, mustSeeSlugs: [] });

  const [day] = allocateDays([makeCluster(anchor, [bigSupport])], preferences);

  assert.deepEqual(day.stops.map((stop) => stop.siteSlug), ["anchor"]);
});

test("a must-see supporting site is added even past the soft cap", () => {
  const anchor = makeSite({ slug: "anchor", estimatedVisitMinutes: 60, typicalWaitMinutes: 0 });
  const bigSupport = makeSite({ slug: "big", estimatedVisitMinutes: 400, typicalWaitMinutes: 0 });
  const preferences = makePreferences({ days: 1, hoursPerDay: 8, mustSeeSlugs: ["big"] });

  const [day] = allocateDays([makeCluster(anchor, [bigSupport])], preferences);

  assert.deepEqual(day.stops.map((stop) => stop.siteSlug).sort(), ["anchor", "big"]);
});

test("totalPlannedMinutes matches totalVisitMinutes before route optimization", () => {
  const anchor = makeSite({ slug: "anchor", estimatedVisitMinutes: 75, typicalWaitMinutes: 20 });
  const support = makeSite({ slug: "support", estimatedVisitMinutes: 45, typicalWaitMinutes: 15 });
  const preferences = makePreferences({ days: 1, hoursPerDay: 8 });

  const [day] = allocateDays([makeCluster(anchor, [support])], preferences);

  assert.equal(day.totalVisitMinutes, 95 + 60);
  assert.equal(day.totalTravelMinutes, 0);
  assert.equal(day.totalPlannedMinutes, day.totalVisitMinutes);
});

test("a leftover site not in any cluster tops up an under-capacity day", () => {
  const anchor = makeSite({ slug: "anchor", estimatedVisitMinutes: 60, typicalWaitMinutes: 0 });
  const leftover = makeSite({ slug: "leftover", estimatedVisitMinutes: 30, typicalWaitMinutes: 0 });
  const preferences = makePreferences({ days: 1, hoursPerDay: 8, mustSeeSlugs: [] });

  const [day] = allocateDays(
    [makeCluster(anchor)],
    preferences,
    [makeScored(leftover, 5)],
  );

  assert.deepEqual(day.stops.map((stop) => stop.siteSlug).sort(), ["anchor", "leftover"]);
});

test("leftovers fill the least-loaded day first, highest score first", () => {
  const anchorA = makeSite({ slug: "anchor-a", estimatedVisitMinutes: 60, typicalWaitMinutes: 0 });
  const anchorB = makeSite({ slug: "anchor-b", estimatedVisitMinutes: 200, typicalWaitMinutes: 0 });
  const leftoverLow = makeSite({ slug: "leftover-low", estimatedVisitMinutes: 30, typicalWaitMinutes: 0 });
  const leftoverHigh = makeSite({ slug: "leftover-high", estimatedVisitMinutes: 30, typicalWaitMinutes: 0 });
  const preferences = makePreferences({ days: 2, hoursPerDay: 8, mustSeeSlugs: [] });

  const [dayA, dayB] = allocateDays(
    [makeCluster(anchorA), makeCluster(anchorB)],
    preferences,
    [makeScored(leftoverLow, 1), makeScored(leftoverHigh, 10)],
  );

  assert.deepEqual(dayA.stops.map((stop) => stop.siteSlug), ["anchor-a", "leftover-high", "leftover-low"]);
  assert.deepEqual(dayB.stops.map((stop) => stop.siteSlug), ["anchor-b"]);
});

test("a must-see leftover site is added even past the soft cap", () => {
  const anchor = makeSite({ slug: "anchor", estimatedVisitMinutes: 460, typicalWaitMinutes: 0 });
  const leftover = makeSite({ slug: "leftover", estimatedVisitMinutes: 30, typicalWaitMinutes: 0 });
  const preferences = makePreferences({ days: 1, hoursPerDay: 8, mustSeeSlugs: ["leftover"] });

  const [day] = allocateDays(
    [makeCluster(anchor)],
    preferences,
    [makeScored(leftover, 5)],
  );

  assert.deepEqual(day.stops.map((stop) => stop.siteSlug).sort(), ["anchor", "leftover"]);
});

test("a leftover site already placed by a cluster is not duplicated", () => {
  const anchor = makeSite({ slug: "anchor", estimatedVisitMinutes: 60, typicalWaitMinutes: 0 });
  const shared = makeSite({ slug: "shared", estimatedVisitMinutes: 30, typicalWaitMinutes: 0 });
  const preferences = makePreferences({ days: 1, hoursPerDay: 8, mustSeeSlugs: [] });

  const [day] = allocateDays(
    [makeCluster(anchor, [shared])],
    preferences,
    [makeScored(shared, 5)],
  );

  const occurrences = day.stops.filter((stop) => stop.siteSlug === "shared");
  assert.equal(occurrences.length, 1);
});
