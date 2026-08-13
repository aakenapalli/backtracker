import type { Site, UserPreferences } from "../types/domain.ts";

export function filterCandidates(sites: Site[], preferences: UserPreferences): Site[] {
  return sites.filter((site) => {
    if (preferences.mustSeeSlugs.includes(site.slug)) {
      return true;
    }

    if (preferences.budgetSensitivity === "high" && site.costCategory === "high") {
      return false;
    }

    if (preferences.familiarity === "beginner" && site.familiarityLevelHint === "enthusiast") {
      return false;
    }

    return true;
  });
}
