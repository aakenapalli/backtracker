import type { GeneratedItineraryView, PlannerPreferences, ThemeSlug } from "./planner";

export interface GenerateItineraryRequestDto {
  preferences: PlannerPreferences;
}

export interface GenerateItineraryResponseDto {
  itinerary: GeneratedItineraryView;
}

export interface SiteListItemDto {
  slug: string;
  name: string;
  neighborhood: string;
  themes: ThemeSlug[];
  editorialPriority: 1 | 2 | 3 | 4 | 5;
}

export interface GetSitesResponseDto {
  sites: SiteListItemDto[];
}

