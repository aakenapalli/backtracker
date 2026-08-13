import type {
  GeneratedItinerary,
  ThemeSlug,
  WalkingTolerance,
  BudgetSensitivity,
  FamiliarityLevel,
  CostCategory,
  SiteSources,
} from "./domain.ts";

export interface GenerateItineraryRequestDto {
  preferences: {
    city: "istanbul";
    days: 1 | 2 | 3;
    hoursPerDay: number;
    walkingTolerance: WalkingTolerance;
    budgetSensitivity: BudgetSensitivity;
    familiarity: FamiliarityLevel;
    themes: ThemeSlug[];
    mustSeeSlugs: string[];
  };
}

export interface GenerateItineraryResponseDto {
  itinerary: GeneratedItinerary;
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

export interface SiteDetailDto {
  slug: string;
  name: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  shortDescription: string;
  historicalSignificance: string;
  estimatedVisitMinutes: number;
  costCategory: CostCategory;
  advanceTicketRequired: boolean;
  mustBookAhead: boolean;
  recommendedBookingNotes?: string;
  openingHoursNote?: string;
  closedDaysNote?: string;
  themes: ThemeSlug[];
  sources?: SiteSources;
}

export interface GetSiteBySlugResponseDto {
  site: SiteDetailDto;
}
