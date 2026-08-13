import { test } from "node:test";
import assert from "node:assert/strict";
import { getDistanceKm, estimateWalkingTravel } from "./distance.ts";

test("getDistanceKm returns 0 for identical coordinates", () => {
  const point = { latitude: 41.0086, longitude: 28.9802 };
  assert.equal(getDistanceKm(point, point), 0);
});

test("getDistanceKm matches the known distance for 1 degree of latitude", () => {
  const distance = getDistanceKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
  assert.ok(Math.abs(distance - 111.19) < 0.5, `expected ~111.19km, got ${distance}`);
});

test("estimateWalkingTravel enforces a 5 minute floor for very short distances", () => {
  const travel = estimateWalkingTravel({ latitude: 41.0086, longitude: 28.9802 }, { latitude: 41.0087, longitude: 28.9802 });
  assert.equal(travel.minutes, 5);
  assert.equal(travel.mode, "walk");
});

test("estimateWalkingTravel minutes scale up with distance", () => {
  const short = estimateWalkingTravel({ latitude: 0, longitude: 0 }, { latitude: 0.01, longitude: 0 });
  const long = estimateWalkingTravel({ latitude: 0, longitude: 0 }, { latitude: 0.2, longitude: 0 });
  assert.ok(long.minutes > short.minutes);
  assert.ok(Math.abs(long.distanceKm - 22.24) < 0.5);
});
