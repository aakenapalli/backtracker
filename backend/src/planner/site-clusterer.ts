import type { ScoredSite, Site } from "../types/domain.ts";

export interface SiteCluster {
  anchor: Site;
  supportingSites: Site[];
}

export function buildClusters(anchors: Site[], scoredSites: ScoredSite[]): SiteCluster[] {
  return anchors.map((anchor) => ({
    anchor,
    supportingSites: scoredSites
      .filter((entry) => entry.site.slug !== anchor.slug)
      .map((entry) => {
        const relationshipBoost =
          anchor.relationships?.find(
            (relationship) =>
              relationship.fromSlug === entry.site.slug || relationship.toSlug === entry.site.slug,
          )?.strength ?? 0;

        return {
          ...entry,
          clusterScore: entry.score + relationshipBoost * 20,
        };
      })
      .sort((left, right) => right.clusterScore - left.clusterScore)
      .slice(0, 4)
      .map((entry) => entry.site),
  }));
}
