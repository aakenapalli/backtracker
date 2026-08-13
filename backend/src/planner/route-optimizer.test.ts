import { test } from "node:test";
import assert from "node:assert/strict";
import { optimizeDayRoute } from "./route-optimizer.ts";
import type { DayPlan, ItineraryStop } from "../types/domain.ts";

function makeStop(overrides: Partial<ItineraryStop> & Pick<ItineraryStop, "siteSlug" | "latitude" | "longitude">): ItineraryStop {
  return {
    name: overrides.siteSlug,
    neighborhood: "Sultanahmet",
    required: true,
    visitMinutes: 30,
    waitMinutes: 0,
    totalStopMinutes: 30,
    walkFromPreviousMinutes: 0,
    distanceFromPreviousKm: 0,
    historicalSignificance: "",
    reasonIncluded: "",
    advanceTicketRequired: false,
    mustBookAhead: false,
    themes: [],
    nearbyRelatedSiteSlugs: [],
    ...overrides,
  };
}

function makeDayPlan(stops: ItineraryStop[]): DayPlan {
  return {
    dayNumber: 1,
    totalVisitMinutes: stops.reduce((sum, stop) => sum + stop.totalStopMinutes, 0),
    totalTravelMinutes: 0,
    totalPlannedMinutes: 0,
    stops,
  };
}

test("a day with 1 or fewer stops is returned unchanged", () => {
  const single = makeDayPlan([makeStop({ siteSlug: "only", latitude: 0, longitude: 0 })]);
  assert.deepEqual(optimizeDayRoute(single), single);

  const empty = makeDayPlan([]);
  assert.deepEqual(optimizeDayRoute(empty), empty);
});

test("reorders stops using greedy nearest-neighbor from the first stop", () => {
  const start = makeStop({ siteSlug: "start", latitude: 0, longitude: 0 });
  const far = makeStop({ siteSlug: "p1-far", latitude: 0, longitude: 0.05 });
  const near = makeStop({ siteSlug: "p2-near", latitude: 0, longitude: 0.01 });
  const mid = makeStop({ siteSlug: "p3-mid", latitude: 0, longitude: 0.03 });

  const optimized = optimizeDayRoute(makeDayPlan([start, far, near, mid]));

  assert.deepEqual(
    optimized.stops.map((stop) => stop.siteSlug),
    ["start", "p2-near", "p3-mid", "p1-far"],
  );
});

test("populates travel fields from the second stop onward and recomputes totals", () => {
  const start = makeStop({ siteSlug: "start", latitude: 0, longitude: 0 });
  const near = makeStop({ siteSlug: "near", latitude: 0, longitude: 0.01 });
  const far = makeStop({ siteSlug: "far", latitude: 0, longitude: 0.05 });

  const optimized = optimizeDayRoute(makeDayPlan([start, near, far]));

  assert.equal(optimized.stops[0].walkFromPreviousMinutes, 0);
  assert.equal(optimized.stops[0].distanceFromPreviousKm, 0);
  assert.ok(optimized.stops[1].walkFromPreviousMinutes > 0);
  assert.ok(optimized.stops[2].walkFromPreviousMinutes > 0);

  const expectedTravel = optimized.stops.slice(1).reduce((sum, stop) => sum + stop.walkFromPreviousMinutes, 0);
  assert.equal(optimized.totalTravelMinutes, expectedTravel);
  assert.equal(optimized.totalPlannedMinutes, optimized.totalVisitMinutes + optimized.totalTravelMinutes);
});
