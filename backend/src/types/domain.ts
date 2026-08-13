export type CitySlug = "istanbul";

export type WalkingTolerance = "low" | "medium" | "high";
export type BudgetSensitivity = "low" | "medium" | "high";
export type FamiliarityLevel = "beginner" | "intermediate" | "knowledgeable";
export type CostCategory = "free" | "low" | "medium" | "high";
export type IndoorOutdoor = "indoor" | "outdoor" | "mixed";
export type PaceIntensity = "low" | "medium" | "high";
export type FamiliarityHint = "beginner" | "all" | "enthusiast";

export type ThemeSlug =
  | "byzantine"
  | "ottoman"
  | "religious-history"
  | "architecture"
  | "neighborhood-change"
  | "modern-political-history";

export type SiteRelationshipType =
  | "nearby"
  | "same-era"
  | "same-theme"
  | "paired-visit"
  | "contrast-over-time";

export interface Theme {
  slug: ThemeSlug;
  name: string;
  description: string;
}

export interface SiteTheme {
  slug: ThemeSlug;
  weight: number;
}

export interface SiteRelationship {
  fromSlug: string;
  toSlug: string;
  relationshipType: SiteRelationshipType;
  strength: number;
  notes?: string;
}

export interface Site {
  slug: string;
  name: string;
  city: CitySlug;
  neighborhood: string;
  latitude: number;
  longitude: number;
  shortDescription: string;
  historicalSignificance: string;
  estimatedVisitMinutes: number;
  typicalWaitMinutes: number;
  costCategory: CostCategory;
  advanceTicketRequired: boolean;
  mustBookAhead: boolean;
  recommendedBookingNotes?: string;
  openingHoursNote?: string;
  closedDaysNote?: string;
  indoorOutdoor: IndoorOutdoor;
  paceIntensity: PaceIntensity;
  familiarityLevelHint: FamiliarityHint;
  editorialPriority: 1 | 2 | 3 | 4 | 5;
  themes: SiteTheme[];
  relationships?: SiteRelationship[];
}

export interface UserPreferences {
  city: CitySlug;
  days: 1 | 2 | 3;
  hoursPerDay: number;
  walkingTolerance: WalkingTolerance;
  budgetSensitivity: BudgetSensitivity;
  familiarity: FamiliarityLevel;
  themes: ThemeSlug[];
  mustSeeSlugs: string[];
}

export interface ScoredSite {
  site: Site;
  score: number;
  themeScore: number;
  significanceScore: number;
  mustSeeBoost: number;
  budgetPenalty: number;
  timePenalty: number;
  familiarityAdjustment: number;
  proximityScore: number;
}

export interface TravelEstimate {
  minutes: number;
  distanceKm: number;
  mode: "walk";
}

export interface ItineraryStop {
  siteSlug: string;
  name: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  required: boolean;
  visitMinutes: number;
  waitMinutes: number;
  totalStopMinutes: number;
  walkFromPreviousMinutes: number;
  distanceFromPreviousKm: number;
  historicalSignificance: string;
  reasonIncluded: string;
  advanceTicketRequired: boolean;
  mustBookAhead: boolean;
  recommendedBookingNotes?: string;
  openingHoursNote?: string;
  closedDaysNote?: string;
  themes: ThemeSlug[];
  nearbyRelatedSiteSlugs: string[];
}

export interface DayPlan {
  dayNumber: number;
  totalVisitMinutes: number;
  totalTravelMinutes: number;
  totalPlannedMinutes: number;
  stops: ItineraryStop[];
}

export interface GeneratedItinerary {
  city: CitySlug;
  tripSummary: string;
  warnings: string[];
  days: DayPlan[];
  optionalSiteSlugs: string[];
  omittedMustSeeSlugs: string[];
}
