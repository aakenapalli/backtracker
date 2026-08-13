import { themeSeeds } from "../seed/themes.seed.ts";
import { siteSeeds } from "../seed/sites.seed.ts";
import { relationshipSeeds } from "../seed/relationships.seed.ts";
import { pool, closePool } from "./pool.ts";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run the seed script with NODE_ENV=production.");
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

let dbHost: string;
try {
  dbHost = new URL(process.env.DATABASE_URL ?? "").hostname;
} catch {
  throw new Error("Could not parse DATABASE_URL; refusing to seed.");
}

if (!LOCAL_HOSTS.has(dbHost) && process.env.ALLOW_REMOTE_SEED !== "true") {
  throw new Error(
    `Refusing to seed remote database "${dbHost}". Re-run with ALLOW_REMOTE_SEED=true if this is intended.`,
  );
}

async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query("TRUNCATE site_relationships, site_themes, sites, themes CASCADE");

    for (const theme of themeSeeds) {
      await client.query(
        "INSERT INTO themes (slug, name, description) VALUES ($1, $2, $3)",
        [theme.slug, theme.name, theme.description],
      );
    }

    for (const site of siteSeeds) {
      await client.query(
        `INSERT INTO sites (
          slug, name, city, neighborhood, latitude, longitude,
          short_description, historical_significance,
          estimated_visit_minutes, typical_wait_minutes, cost_category,
          advance_ticket_required, must_book_ahead,
          recommended_booking_notes, opening_hours_note, closed_days_note,
          indoor_outdoor, pace_intensity, familiarity_level_hint, editorial_priority
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          site.slug,
          site.name,
          site.city,
          site.neighborhood,
          site.latitude,
          site.longitude,
          site.shortDescription,
          site.historicalSignificance,
          site.estimatedVisitMinutes,
          site.typicalWaitMinutes,
          site.costCategory,
          site.advanceTicketRequired,
          site.mustBookAhead,
          site.recommendedBookingNotes ?? null,
          site.openingHoursNote ?? null,
          site.closedDaysNote ?? null,
          site.indoorOutdoor,
          site.paceIntensity,
          site.familiarityLevelHint,
          site.editorialPriority,
        ],
      );

      for (const theme of site.themes) {
        await client.query(
          "INSERT INTO site_themes (site_slug, theme_slug, weight) VALUES ($1, $2, $3)",
          [site.slug, theme.slug, theme.weight],
        );
      }
    }

    for (const relationship of relationshipSeeds) {
      await client.query(
        `INSERT INTO site_relationships (from_slug, to_slug, relationship_type, strength, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          relationship.fromSlug,
          relationship.toSlug,
          relationship.relationshipType,
          relationship.strength,
          relationship.notes ?? null,
        ],
      );
    }

    await client.query("COMMIT");

    const siteThemeCount = siteSeeds.reduce((sum, site) => sum + site.themes.length, 0);
    console.log(
      `seeded ${themeSeeds.length} themes, ${siteSeeds.length} sites, ${siteThemeCount} site_themes, ${relationshipSeeds.length} relationships`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

await seed();
await closePool();
