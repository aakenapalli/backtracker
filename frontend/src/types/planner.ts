export type WalkingTolerance = "low" | "medium" | "high";
export type BudgetSensitivity = "low" | "medium" | "high";
export type FamiliarityLevel = "beginner" | "intermediate" | "knowledgeable";

export type ThemeSlug =
  | "byzantine"
  | "ottoman"
  | "religious-history"
  | "architecture"
  | "neighborhood-change"
  | "modern-political-history";

export interface PlannerPreferences {
  city: "istanbul";
  days: 1 | 2 | 3;
  hoursPerDay: number;
  walkingTolerance: WalkingTolerance;
  budgetSensitivity: BudgetSensitivity;
  familiarity: FamiliarityLevel;
  themes: ThemeSlug[];
  mustSeeSlugs: string[];
}

export interface ItineraryStopView {
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

export interface DayPlanView {
  dayNumber: number;
  totalVisitMinutes: number;
  totalTravelMinutes: number;
  totalPlannedMinutes: number;
  stops: ItineraryStopView[];
}

export interface GeneratedItineraryView {
  city: "istanbul";
  tripSummary: string;
  warnings: string[];
  days: DayPlanView[];
  optionalSiteSlugs: string[];
  omittedMustSeeSlugs: string[];
}

