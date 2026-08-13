import type { DayPlan, ItineraryStop, ScoredSite, Site, UserPreferences } from "../types/domain.ts";
import type { SiteCluster } from "./site-clusterer.ts";

function toStop(site: Site, required: boolean): ItineraryStop {
  const nearbyRelatedSiteSlugs = Array.from(
    new Set(
      site.relationships?.map((relationship) =>
        relationship.fromSlug === site.slug ? relationship.toSlug : relationship.fromSlug,
      ) ?? [],
    ),
  );

  return {
    siteSlug: site.slug,
    name: site.name,
    neighborhood: site.neighborhood,
    latitude: site.latitude,
    longitude: site.longitude,
    required,
    visitMinutes: site.estimatedVisitMinutes,
    waitMinutes: site.typicalWaitMinutes,
    totalStopMinutes: site.estimatedVisitMinutes + site.typicalWaitMinutes,
    walkFromPreviousMinutes: 0,
    distanceFromPreviousKm: 0,
    historicalSignificance: site.historicalSignificance,
    reasonIncluded: "",
    advanceTicketRequired: site.advanceTicketRequired,
    mustBookAhead: site.mustBookAhead,
    recommendedBookingNotes: site.recommendedBookingNotes,
    openingHoursNote: site.openingHoursNote,
    closedDaysNote: site.closedDaysNote,
    themes: site.themes.map((theme) => theme.slug),
    nearbyRelatedSiteSlugs,
    sources: site.sources,
  };
}

function getStopMinutes(site: Site): number {
  return site.estimatedVisitMinutes + site.typicalWaitMinutes;
}

export function allocateDays(
  clusters: SiteCluster[],
  preferences: UserPreferences,
  allScoredSites: ScoredSite[] = [],
): DayPlan[] {
  const days: DayPlan[] = Array.from({ length: preferences.days }, (_, index) => ({
    dayNumber: index + 1,
    totalVisitMinutes: 0,
    totalTravelMinutes: 0,
    totalPlannedMinutes: 0,
    stops: [],
  }));

  const usedSlugs = new Set<string>();
  const dailyCapacityMinutes = preferences.hoursPerDay * 60;

  for (const cluster of clusters) {
    const targetDay = [...days]
      .sort((left, right) => left.totalPlannedMinutes - right.totalPlannedMinutes)
      .find(
        (day) =>
          day.totalPlannedMinutes + getStopMinutes(cluster.anchor) <= dailyCapacityMinutes * 1.1,
      ) ?? [...days].sort((left, right) => left.totalPlannedMinutes - right.totalPlannedMinutes)[0];

    if (!usedSlugs.has(cluster.anchor.slug)) {
      const anchorStop = toStop(
        cluster.anchor,
        preferences.mustSeeSlugs.includes(cluster.anchor.slug) || cluster.anchor.editorialPriority >= 4,
      );
      targetDay.stops.push(anchorStop);
      targetDay.totalVisitMinutes += getStopMinutes(cluster.anchor);
      usedSlugs.add(cluster.anchor.slug);
      targetDay.totalPlannedMinutes = targetDay.totalVisitMinutes + targetDay.totalTravelMinutes;
    }

    for (const site of cluster.supportingSites) {
      if (usedSlugs.has(site.slug)) {
        continue;
      }

      const projectedMinutes = targetDay.totalPlannedMinutes + getStopMinutes(site);
      const isMustSee = preferences.mustSeeSlugs.includes(site.slug);

      if (!isMustSee && projectedMinutes > dailyCapacityMinutes * 0.95) {
        continue;
      }

      targetDay.stops.push(toStop(site, isMustSee));
      targetDay.totalVisitMinutes += getStopMinutes(site);
      usedSlugs.add(site.slug);
      targetDay.totalPlannedMinutes = targetDay.totalVisitMinutes + targetDay.totalTravelMinutes;
    }
  }

  // Clusters can leave some days far under capacity: a cluster's supportingSites
  // are capped at 4 and picked from the same globally-scored pool as every other
  // cluster, so a later, lower-scoring cluster can find most of its best
  // supporting sites already claimed by an earlier one, starving its day. Top up
  // any day that still has room from the full scored pool (not just cluster
  // members), always retargeting the least-loaded day so what's left spreads
  // evenly instead of piling onto whichever day filled first.
  const leftovers = allScoredSites
    .filter((entry) => !usedSlugs.has(entry.site.slug))
    .sort((left, right) => right.score - left.score);

  for (const entry of leftovers) {
    const site = entry.site;
    const isMustSee = preferences.mustSeeSlugs.includes(site.slug);

    const targetDay = [...days]
      .sort((left, right) => left.totalPlannedMinutes - right.totalPlannedMinutes)
      .find(
        (day) =>
          isMustSee || day.totalPlannedMinutes + getStopMinutes(site) <= dailyCapacityMinutes * 0.95,
      );

    if (!targetDay) {
      continue;
    }

    targetDay.stops.push(toStop(site, isMustSee));
    targetDay.totalVisitMinutes += getStopMinutes(site);
    usedSlugs.add(site.slug);
    targetDay.totalPlannedMinutes = targetDay.totalVisitMinutes + targetDay.totalTravelMinutes;
  }

  return days;
}
