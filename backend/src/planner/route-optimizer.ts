import type { DayPlan, ItineraryStop } from "../types/domain.ts";
import { estimateWalkingTravel } from "../utils/distance.ts";

export function optimizeDayRoute(dayPlan: DayPlan): DayPlan {
  if (dayPlan.stops.length <= 1) {
    return dayPlan;
  }

  const [firstStop, ...otherStops] = [...dayPlan.stops];
  const orderedStops: ItineraryStop[] = [firstStop];

  while (otherStops.length > 0) {
    const current = orderedStops[orderedStops.length - 1];
    let bestIndex = 0;
    let bestMinutes = Number.POSITIVE_INFINITY;

    for (let index = 0; index < otherStops.length; index += 1) {
      const travel = estimateWalkingTravel(current, otherStops[index]);
      if (travel.minutes < bestMinutes) {
        bestMinutes = travel.minutes;
        bestIndex = index;
      }
    }

    const [nextStop] = otherStops.splice(bestIndex, 1);
    orderedStops.push(nextStop);
  }

  let totalTravelMinutes = 0;
  const stops = orderedStops.map((stop, index) => {
    if (index === 0) {
      return stop;
    }

    const travel = estimateWalkingTravel(orderedStops[index - 1], stop);
    totalTravelMinutes += travel.minutes;

    return {
      ...stop,
      walkFromPreviousMinutes: travel.minutes,
      distanceFromPreviousKm: travel.distanceKm,
    };
  });

  return {
    ...dayPlan,
    stops,
    totalTravelMinutes,
    totalPlannedMinutes: dayPlan.totalVisitMinutes + totalTravelMinutes,
  };
}
