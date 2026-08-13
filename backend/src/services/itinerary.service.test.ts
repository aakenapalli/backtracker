import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { ItineraryService } from "./itinerary.service.ts";
import { closePool, pool } from "../db/pool.ts";
import type { UserPreferences } from "../types/domain.ts";

const preferences: UserPreferences = {
  city: "istanbul",
  days: 2,
  hoursPerDay: 8,
  walkingTolerance: "medium",
  budgetSensitivity: "medium",
  familiarity: "beginner",
  themes: ["byzantine", "architecture", "religious-history"],
  mustSeeSlugs: ["hagia-sophia", "blue-mosque"],
};

const itineraryService = new ItineraryService();

before(async () => {
  try {
    const { rows } = await pool.query<{ count: string }>("SELECT count(*) FROM sites");
    if (Number(rows[0].count) === 0) {
      throw new Error("no rows");
    }
  } catch {
    throw new Error(
      "No sites found in the database. Run: npm run db:up && npm run db:migrate && npm run db:seed",
    );
  }
});

after(async () => {
  await closePool();
});

test("generateItinerary produces the requested number of days from real seed data", async () => {
  const itinerary = await itineraryService.generateItinerary(preferences);
  assert.equal(itinerary.days.length, preferences.days);
});

test("generateItinerary either includes or explicitly omits every must-see site, never neither", async () => {
  const itinerary = await itineraryService.generateItinerary(preferences);
  const placedSlugs = new Set(itinerary.days.flatMap((day) => day.stops.map((stop) => stop.siteSlug)));

  for (const mustSeeSlug of preferences.mustSeeSlugs) {
    const isPlaced = placedSlugs.has(mustSeeSlug);
    const isOmitted = itinerary.omittedMustSeeSlugs.includes(mustSeeSlug);
    assert.ok(isPlaced || isOmitted, `${mustSeeSlug} was neither placed nor reported as omitted`);
    assert.ok(!(isPlaced && isOmitted), `${mustSeeSlug} was both placed and reported as omitted`);
  }
});

test("generateItinerary never places the same site twice", async () => {
  const itinerary = await itineraryService.generateItinerary(preferences);
  const allSlugs = itinerary.days.flatMap((day) => day.stops.map((stop) => stop.siteSlug));
  assert.equal(allSlugs.length, new Set(allSlugs).size);
});

test("generateItinerary keeps each day's time bookkeeping consistent", async () => {
  const itinerary = await itineraryService.generateItinerary(preferences);

  for (const day of itinerary.days) {
    assert.equal(day.totalPlannedMinutes, day.totalVisitMinutes + day.totalTravelMinutes);
  }
});
