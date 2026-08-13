import type { ScoredSite, Site, UserPreferences } from "../types/domain.ts";

export function selectAnchors(scoredSites: ScoredSite[], preferences: UserPreferences): Site[] {
  const sorted = [...scoredSites].sort((left, right) => right.score - left.score);
  const maxAnchors = preferences.days * 2;

  return sorted
    .filter((entry) => entry.site.editorialPriority >= 4 || preferences.mustSeeSlugs.includes(entry.site.slug))
    .slice(0, maxAnchors)
    .map((entry) => entry.site);
}
