import type { DayPlan, UserPreferences } from "../types/domain.ts";

export function markOptionalStops(dayPlan: DayPlan, preferences: UserPreferences): DayPlan {
  const softLimitMinutes = preferences.hoursPerDay * 60 * 0.85;
  let runningMinutes = 0;

  const stops = dayPlan.stops.map((stop) => {
    runningMinutes += stop.totalStopMinutes + stop.walkFromPreviousMinutes;

    if (stop.required) {
      return stop;
    }

    return {
      ...stop,
      required: runningMinutes <= softLimitMinutes,
    };
  });

  return {
    ...dayPlan,
    stops,
  };
}
