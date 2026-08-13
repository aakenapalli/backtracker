import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTripSummary, buildWarnings, explainItinerary } from "./itinerary-explainer.ts";
import { makePreferences } from "./test-fixtures.ts";
import type { GeneratedItinerary, ItineraryStop, ThemeSlug } from "../types/domain.ts";

function makeStop(overrides: Partial<ItineraryStop> & Pick<ItineraryStop, "siteSlug">): ItineraryStop {
  return {
    name: overrides.siteSlug,
    neighborhood: "Sultanahmet",
    latitude: 0,
    longitude: 0,
    required: true,
    visitMinutes: 0,
    waitMinutes: 0,
    totalStopMinutes: 0,
    walkFromPreviousMinutes: 0,
    distanceFromPreviousKm: 0,
    historicalSignificance: "",
    reasonIncluded: "",
    advanceTicketRequired: false,
    mustBookAhead: false,
    themes: [] as ThemeSlug[],
    nearbyRelatedSiteSlugs: [],
    ...overrides,
  };
}

function makeItinerary(stops: ItineraryStop[]): GeneratedItinerary {
  return {
    city: "istanbul",
    tripSummary: "",
    warnings: [],
    days: [{ dayNumber: 1, totalVisitMinutes: 0, totalTravelMinutes: 0, totalPlannedMinutes: 0, stops }],
    optionalSiteSlugs: [],
    omittedMustSeeSlugs: [],
  };
}

test("buildTripSummary formats day count and dash-stripped theme list", () => {
  const preferences = makePreferences({ days: 3, themes: ["byzantine", "religious-history"] });

  assert.equal(
    buildTripSummary(preferences),
    "A 3-day Istanbul itinerary focused on byzantine, religious history, balanced around your time, walking, and must-see priorities.",
  );
});

test("buildWarnings flags a dense itinerary only when must-sees exceed 3 per day", () => {
  const dense = makePreferences({ days: 1, mustSeeSlugs: ["a", "b", "c", "d"] });
  const normal = makePreferences({ days: 1, mustSeeSlugs: ["a", "b", "c"] });

  assert.equal(buildWarnings(dense).length, 1);
  assert.deepEqual(buildWarnings(normal), []);
});

test("explainItinerary gives must-see stops must-see phrasing", () => {
  const preferences = makePreferences({ themes: ["byzantine", "architecture"], mustSeeSlugs: ["hagia"] });
  const itinerary = makeItinerary([makeStop({ siteSlug: "hagia", themes: ["byzantine", "ottoman"] })]);

  const result = explainItinerary(itinerary, preferences);

  assert.equal(
    result.days[0].stops[0].reasonIncluded,
    "Included as one of your must-see sites with strong byzantine relevance.",
  );
});

test("explainItinerary gives required, non-must-see stops core-stop phrasing", () => {
  const preferences = makePreferences({ themes: ["byzantine", "architecture"], mustSeeSlugs: [] });
  const itinerary = makeItinerary([
    makeStop({ siteSlug: "other", neighborhood: "Fatih", required: true, themes: ["architecture", "religious-history"] }),
  ]);

  const result = explainItinerary(itinerary, preferences);

  assert.equal(
    result.days[0].stops[0].reasonIncluded,
    "Included as a core stop because it strengthens your architecture route in Fatih.",
  );
});

test("explainItinerary gives optional stops flexible-supporting phrasing with a historical fallback", () => {
  const preferences = makePreferences({ themes: ["byzantine", "architecture"], mustSeeSlugs: [] });
  const itinerary = makeItinerary([
    makeStop({ siteSlug: "optional-one", required: false, themes: ["modern-political-history"] }),
  ]);

  const result = explainItinerary(itinerary, preferences);

  assert.equal(
    result.days[0].stops[0].reasonIncluded,
    "Added as a flexible supporting stop near your other historical visits.",
  );
});

test("explainItinerary falls back to 'selected theme' when a required stop matches no themes", () => {
  const preferences = makePreferences({ themes: ["byzantine"], mustSeeSlugs: [] });
  const itinerary = makeItinerary([
    makeStop({ siteSlug: "other", neighborhood: "Fatih", required: true, themes: ["modern-political-history"] }),
  ]);

  const result = explainItinerary(itinerary, preferences);

  assert.equal(
    result.days[0].stops[0].reasonIncluded,
    "Included as a core stop because it strengthens your selected theme route in Fatih.",
  );
});

test("explainItinerary also sets tripSummary and warnings", () => {
  const preferences = makePreferences({ days: 2, themes: ["byzantine"], mustSeeSlugs: [] });
  const result = explainItinerary(makeItinerary([]), preferences);

  assert.ok(result.tripSummary.includes("2-day"));
  assert.deepEqual(result.warnings, []);
});
