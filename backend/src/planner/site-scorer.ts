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

/**
 * Sourced interest, from real Wikipedia/Wikidata pageview data blended with
 * Stack Exchange discussion volume (70/30 -- sustained encyclopedic interest
 * weighted above sparser social-discussion signal). Both are already
 * normalized to [0,1] against the sourced-site corpus at ingestion time
 * (see backend/src/ingest/signal-scorer.ts); this just applies the blend
 * and the resume-to-score-points multiplier. Sites with no sourced data
 * (interestScore/socialScore both undefined) contribute 0, same as before
 * this feature existed.
 */
function getSourcedInterestScore(site: Site): number {
  const interest = site.sources?.interestScore ?? 0;
  const social = site.sources?.socialScore ?? 0;
  return (0.7 * interest + 0.3 * social) * 15;
}

/**
 * Recent momentum (already clamped to [-1,1] at ingestion time -- see
 * signal-scorer.ts's computeTrendScore, where a 100x viral spike and a
 * modest doubling both clamp to the same +1 ceiling). +/-5 points here is
 * deliberately small relative to editorialPriority's 10-50 point spread
 * (see the "editorial dominance" invariant test in site-scorer.test.ts) --
 * a trending site can nudge a ranking, never override curated judgment.
 */
function getTrendAdjustment(site: Site): number {
  return (site.sources?.trendScore ?? 0) * 5;
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
    const sourcedInterestScore = getSourcedInterestScore(site);
    const trendAdjustment = getTrendAdjustment(site);

    return {
      site,
      score:
        themeScore +
        significanceScore +
        mustSeeBoost +
        familiarityAdjustment +
        proximityScore +
        sourcedInterestScore +
        trendAdjustment -
        budgetPenalty -
        timePenalty,
      themeScore,
      significanceScore,
      mustSeeBoost,
      budgetPenalty,
      timePenalty,
      familiarityAdjustment,
      proximityScore,
      sourcedInterestScore,
      trendAdjustment,
    };
  });
}
