import { pool, type Queryable } from "../db/pool.ts";
import type {
  CitySlug,
  CostCategory,
  FamiliarityHint,
  IndoorOutdoor,
  PaceIntensity,
  Site,
  SiteRelationship,
  SiteRelationshipType,
  SiteTheme,
  ThemeSlug,
} from "../types/domain.ts";

interface SiteRow {
  slug: string;
  name: string;
  city: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  short_description: string;
  historical_significance: string;
  estimated_visit_minutes: number;
  typical_wait_minutes: number;
  cost_category: string;
  advance_ticket_required: boolean;
  must_book_ahead: boolean;
  recommended_booking_notes: string | null;
  opening_hours_note: string | null;
  closed_days_note: string | null;
  indoor_outdoor: string;
  pace_intensity: string;
  familiarity_level_hint: string;
  editorial_priority: number;
}

interface SiteThemeRow {
  site_slug: string;
  theme_slug: string;
  weight: number;
}

interface SiteRelationshipRow {
  from_slug: string;
  to_slug: string;
  relationship_type: string;
  strength: number;
  notes: string | null;
}

function toSite(row: SiteRow): Site {
  return {
    slug: row.slug,
    name: row.name,
    city: row.city as CitySlug,
    neighborhood: row.neighborhood,
    latitude: row.latitude,
    longitude: row.longitude,
    shortDescription: row.short_description,
    historicalSignificance: row.historical_significance,
    estimatedVisitMinutes: row.estimated_visit_minutes,
    typicalWaitMinutes: row.typical_wait_minutes,
    costCategory: row.cost_category as CostCategory,
    advanceTicketRequired: row.advance_ticket_required,
    mustBookAhead: row.must_book_ahead,
    recommendedBookingNotes: row.recommended_booking_notes ?? undefined,
    openingHoursNote: row.opening_hours_note ?? undefined,
    closedDaysNote: row.closed_days_note ?? undefined,
    indoorOutdoor: row.indoor_outdoor as IndoorOutdoor,
    paceIntensity: row.pace_intensity as PaceIntensity,
    familiarityLevelHint: row.familiarity_level_hint as FamiliarityHint,
    editorialPriority: row.editorial_priority as 1 | 2 | 3 | 4 | 5,
    themes: [],
    relationships: [],
  };
}

export class SiteRepository {
  private readonly db: Queryable;

  constructor(db: Queryable = pool) {
    this.db = db;
  }

  async getAllSites(city: CitySlug): Promise<Site[]> {
    const [sitesResult, themesResult, relationshipsResult] = await Promise.all([
      this.db.query<SiteRow>("SELECT * FROM sites WHERE city = $1 ORDER BY slug", [city]),
      this.db.query<SiteThemeRow>(
        `SELECT st.site_slug, st.theme_slug, st.weight
         FROM site_themes st
         JOIN sites s ON s.slug = st.site_slug
         WHERE s.city = $1
         ORDER BY st.site_slug, st.weight DESC, st.theme_slug`,
        [city],
      ),
      this.db.query<SiteRelationshipRow>(
        `SELECT r.from_slug, r.to_slug, r.relationship_type, r.strength, r.notes
         FROM site_relationships r
         JOIN sites f ON f.slug = r.from_slug
         JOIN sites t ON t.slug = r.to_slug
         WHERE f.city = $1 AND t.city = $1
         ORDER BY r.strength DESC, r.from_slug, r.to_slug`,
        [city],
      ),
    ]);

    const themesBySite = new Map<string, SiteTheme[]>();
    for (const row of themesResult.rows) {
      const themes = themesBySite.get(row.site_slug) ?? [];
      themes.push({ slug: row.theme_slug as ThemeSlug, weight: row.weight });
      themesBySite.set(row.site_slug, themes);
    }

    const relationshipsBySite = new Map<string, SiteRelationship[]>();
    for (const row of relationshipsResult.rows) {
      const relationship: SiteRelationship = {
        fromSlug: row.from_slug,
        toSlug: row.to_slug,
        relationshipType: row.relationship_type as SiteRelationshipType,
        strength: row.strength,
        notes: row.notes ?? undefined,
      };

      for (const slug of [row.from_slug, row.to_slug]) {
        const relationships = relationshipsBySite.get(slug) ?? [];
        relationships.push(relationship);
        relationshipsBySite.set(slug, relationships);
      }
    }

    return sitesResult.rows.map((row) => ({
      ...toSite(row),
      themes: themesBySite.get(row.slug) ?? [],
      relationships: relationshipsBySite.get(row.slug) ?? [],
    }));
  }
}
