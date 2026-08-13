import { test } from "node:test";
import assert from "node:assert/strict";
import { markOptionalStops } from "./optional-stop-selector.ts";
import { makePreferences } from "./test-fixtures.ts";
import type { DayPlan, ItineraryStop } from "../types/domain.ts";

function makeStop(overrides: Partial<ItineraryStop> & Pick<ItineraryStop, "siteSlug">): ItineraryStop {
  return {
    name: overrides.siteSlug,
    neighborhood: "Sultanahmet",
    latitude: 0,
    longitude: 0,
    required: false,
    visitMinutes: 0,
    waitMinutes: 0,
    totalStopMinutes: 0,
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
  return { dayNumber: 1, totalVisitMinutes: 0, totalTravelMinutes: 0, totalPlannedMinutes: 0, stops };
}

test("already-required stops stay required regardless of running time", () => {
  const preferences = makePreferences({ hoursPerDay: 8 }); // soft limit = 480 * 0.85 = 408
  const stop = makeStop({ siteSlug: "anchor", required: true, totalStopMinutes: 9000 });

  const { stops } = markOptionalStops(makeDayPlan([stop]), preferences);

  assert.equal(stops[0].required, true);
});

test("non-required stops within the soft limit become required, past it become optional", () => {
  const preferences = makePreferences({ hoursPerDay: 8 }); // soft limit = 408
  const anchor = makeStop({ siteSlug: "anchor", required: true, totalStopMinutes: 300 }); // running: 300
  const withinLimit = makeStop({ siteSlug: "within", required: false, totalStopMinutes: 100 }); // running: 400
  const pastLimit = makeStop({ siteSlug: "past", required: false, totalStopMinutes: 50 }); // running: 450

  const { stops } = markOptionalStops(makeDayPlan([anchor, withinLimit, pastLimit]), preferences);

  assert.equal(stops[0].required, true);
  assert.equal(stops[1].required, true);
  assert.equal(stops[2].required, false);
});

test("running total includes walking time, not just visit time", () => {
  const preferences = makePreferences({ hoursPerDay: 8 }); // soft limit = 408
  const anchor = makeStop({ siteSlug: "anchor", required: true, totalStopMinutes: 300 }); // running: 300
  // 300 + 100 (visit) = 400 would stay within the limit, but +10 walk pushes it to 410, past 408.
  const stop = makeStop({ siteSlug: "stop", required: false, totalStopMinutes: 100, walkFromPreviousMinutes: 10 });

  const { stops } = markOptionalStops(makeDayPlan([anchor, stop]), preferences);

  assert.equal(stops[1].required, false);
});
