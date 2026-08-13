import type { ScoredSite, Site, UserPreferences } from "../types/domain.ts";

function getBudgetPenalty(site: Site, preferences: UserPreferences): number {
  if (preferences.budgetSensitivity === "low") {
    return 0;
  }

  if (preferences.budgetSensitivity === "medium") {
    return site.costCategory === "high" ? 12 : 0;
  }

  if (site.costCategory === "high") {
    return 24;
  }

  if (site.costCategory === "medium") {
    return 10;
  }

  return 0;
}

function getTimePenalty(site: Site, preferences: UserPreferences): number {
  const dailyMinutes = preferences.hoursPerDay * 60;
  return site.estimatedVisitMinutes + site.typicalWaitMinutes > dailyMinutes * 0.35 ? 10 : 0;
}

function getFamiliarityAdjustment(site: Site, preferences: UserPreferences): number {
  if (preferences.familiarity === "beginner" && site.familiarityLevelHint === "enthusiast") {
    return -12;
  }

  if (preferences.familiarity === "knowledgeable" && site.familiarityLevelHint === "enthusiast") {
    return 8;
  }

  return 0;
}

function getRelationshipScore(site: Site, preferences: UserPreferences): number {
  if (!site.relationships) {
    return 0;
  }

  return site.relationships.reduce((sum, relationship) => {
    if (preferences.mustSeeSlugs.includes(relationship.fromSlug) || preferences.mustSeeSlugs.includes(relationship.toSlug)) {
      return sum + relationship.strength * 8;
    }

    return sum + relationship.strength * 2;
  }, 0);
}

function getThemeScore(site: Site, preferences: UserPreferences): number {
  return site.themes
    .filter((theme) => preferences.themes.includes(theme.slug))
    .reduce((sum, theme) => sum + theme.weight, 0);
}

export function scoreSites(sites: Site[], preferences: UserPreferences): ScoredSite[] {
  return sites.map((site) => {
    const themeScore = getThemeScore(site, preferences) * 40;
    const significanceScore = site.editorialPriority * 10;
    const mustSeeBoost = preferences.mustSeeSlugs.includes(site.slug) ? 1000 : 0;
    const budgetPenalty = getBudgetPenalty(site, preferences);
    const timePenalty = getTimePenalty(site, preferences);
    const familiarityAdjustment = getFamiliarityAdjustment(site, preferences);
    const proximityScore = getRelationshipScore(site, preferences);

    return {
      site,
      score:
        themeScore +
        significanceScore +
        mustSeeBoost +
        familiarityAdjustment +
        proximityScore -
        budgetPenalty -
        timePenalty,
      themeScore,
      significanceScore,
      mustSeeBoost,
      budgetPenalty,
      timePenalty,
      familiarityAdjustment,
      proximityScore,
    };
  });
}
