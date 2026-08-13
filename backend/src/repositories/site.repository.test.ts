import { test, after } from "node:test";
import assert from "node:assert/strict";
import { SiteRepository } from "./site.repository.ts";
import { closePool } from "../db/pool.ts";

after(async () => {
  await closePool();
});

test("returns all seeded Istanbul sites", async () => {
  const sites = await new SiteRepository().getAllSites("istanbul");
  assert.equal(sites.length, 27);
});

test("theme weights and coordinates are numbers, not strings", async () => {
  const sites = await new SiteRepository().getAllSites("istanbul");
  const hagia = sites.find((site) => site.slug === "hagia-sophia");

  assert.ok(hagia);
  assert.equal(typeof hagia.latitude, "number");
  assert.equal(typeof hagia.longitude, "number");
  assert.ok(hagia.themes.length > 0);
  for (const theme of hagia.themes) {
    assert.equal(typeof theme.weight, "number");
  }
});

test("relationships are attached whether the site is the from or to side", async () => {
  const sites = await new SiteRepository().getAllSites("istanbul");
  const hagia = sites.find((site) => site.slug === "hagia-sophia");

  assert.ok(hagia?.relationships && hagia.relationships.length > 0);
  const asFrom = hagia.relationships.some((relationship) => relationship.fromSlug === "hagia-sophia");
  const asTo = hagia.relationships.some((relationship) => relationship.toSlug === "hagia-sophia");
  assert.ok(asFrom || asTo);
});

test("missing optional fields map to undefined, not null", async () => {
  const sites = await new SiteRepository().getAllSites("istanbul");
  const withoutClosedDaysNote = sites.find((site) => site.closedDaysNote === undefined);

  assert.ok(withoutClosedDaysNote, "expected at least one site with no closedDaysNote");
  assert.equal("closedDaysNote" in withoutClosedDaysNote && withoutClosedDaysNote.closedDaysNote, undefined);
});
