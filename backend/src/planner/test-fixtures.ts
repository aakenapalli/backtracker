import type { Site, UserPreferences } from "../types/domain.ts";

export function makeSite(overrides: Partial<Site> = {}): Site {
  return {
    slug: "site",
    name: "Site",
    city: "istanbul",
    neighborhood: "Sultanahmet",
    latitude: 41.0086,
    longitude: 28.9802,
    shortDescription: "A site.",
    historicalSignificance: "Historically significant.",
    estimatedVisitMinutes: 60,
    typicalWaitMinutes: 10,
    costCategory: "low",
    advanceTicketRequired: false,
    mustBookAhead: false,
    indoorOutdoor: "mixed",
    paceIntensity: "medium",
    familiarityLevelHint: "all",
    editorialPriority: 3,
    themes: [],
    relationships: [],
    ...overrides,
  };
}

export function makePreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    city: "istanbul",
    days: 2,
    hoursPerDay: 8,
    walkingTolerance: "medium",
    budgetSensitivity: "medium",
    familiarity: "beginner",
    themes: ["byzantine"],
    mustSeeSlugs: [],
    ...overrides,
  };
}
