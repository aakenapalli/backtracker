import { selectAnchors } from "../planner/anchor-selector.ts";
import { filterCandidates } from "../planner/candidate-filter.ts";
import { allocateDays } from "../planner/day-allocator.ts";
import { explainItinerary } from "../planner/itinerary-explainer.ts";
import { markOptionalStops } from "../planner/optional-stop-selector.ts";
import { optimizeDayRoute } from "../planner/route-optimizer.ts";
import { scoreSites } from "../planner/site-scorer.ts";
import { buildClusters } from "../planner/site-clusterer.ts";
import { SiteRepository } from "../repositories/site.repository.ts";
import type { GeneratedItinerary, UserPreferences } from "../types/domain.ts";

export class ItineraryService {
  private readonly siteRepository: SiteRepository;

  constructor(siteRepository = new SiteRepository()) {
    this.siteRepository = siteRepository;
  }

  async generateItinerary(preferences: UserPreferences): Promise<GeneratedItinerary> {
    const sites = await this.siteRepository.getAllSites(preferences.city);
    const filteredSites = filterCandidates(sites, preferences);
    const scoredSites = scoreSites(filteredSites, preferences);
    const anchors = selectAnchors(scoredSites, preferences);
    const clusters = buildClusters(anchors, scoredSites);
    const days = allocateDays(clusters, preferences, scoredSites)
      .map(optimizeDayRoute)
      .map((day) => markOptionalStops(day, preferences))
      .filter((day) => day.stops.length > 0);

    const allStopSlugs = new Set(days.flatMap((day) => day.stops.map((stop) => stop.siteSlug)));
    const omittedMustSeeSlugs = preferences.mustSeeSlugs.filter((slug) => !allStopSlugs.has(slug));
    const optionalSiteSlugs = days.flatMap((day) =>
      day.stops.filter((stop) => !stop.required).map((stop) => stop.siteSlug),
    );

    const itinerary: GeneratedItinerary = {
      city: preferences.city,
      tripSummary: "",
      warnings: [],
      days,
      optionalSiteSlugs,
      omittedMustSeeSlugs,
    };

    return explainItinerary(itinerary, preferences);
  }
}
