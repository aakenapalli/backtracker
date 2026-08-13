import type { GeneratedItinerary, ItineraryStop, UserPreferences } from "../types/domain.ts";

function formatThemeLabel(theme: string): string {
  return theme.replace(/-/g, " ");
}

function buildStopReason(stop: ItineraryStop, preferences: UserPreferences): string {
  const matchingThemes = stop.themes.filter((theme) => preferences.themes.includes(theme));
  const themeSummary = matchingThemes.slice(0, 2).map(formatThemeLabel).join(" and ");

  if (preferences.mustSeeSlugs.includes(stop.siteSlug)) {
    return `Included as one of your must-see sites with strong ${themeSummary || "historical"} relevance.`;
  }

  if (stop.required) {
    return `Included as a core stop because it strengthens your ${themeSummary || "selected theme"} route in ${stop.neighborhood}.`;
  }

  return `Added as a flexible supporting stop near your other ${themeSummary || "historical"} visits.`;
}

export function buildTripSummary(preferences: UserPreferences): string {
  const themeText = preferences.themes.map(formatThemeLabel).join(", ");
  return `A ${preferences.days}-day Istanbul itinerary focused on ${themeText}, balanced around your time, walking, and must-see priorities.`;
}

export function buildWarnings(preferences: UserPreferences): string[] {
  if (preferences.mustSeeSlugs.length > preferences.days * 3) {
    return ["This itinerary may feel dense because it prioritizes your must-see sites."];
  }

  return [];
}

export function explainItinerary(
  itinerary: GeneratedItinerary,
  preferences: UserPreferences,
): GeneratedItinerary {
  return {
    ...itinerary,
    days: itinerary.days.map((day) => ({
      ...day,
      stops: day.stops.map((stop) => ({
        ...stop,
        reasonIncluded: buildStopReason(stop, preferences),
      })),
    })),
    tripSummary: buildTripSummary(preferences),
    warnings: buildWarnings(preferences),
  };
}
