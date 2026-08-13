import type { Site, TravelEstimate } from "../types/domain.ts";

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function getDistanceKm(left: Pick<Site, "latitude" | "longitude">, right: Pick<Site, "latitude" | "longitude">): number {
  const deltaLatitude = toRadians(right.latitude - left.latitude);
  const deltaLongitude = toRadians(right.longitude - left.longitude);
  const startLatitude = toRadians(left.latitude);
  const endLatitude = toRadians(right.latitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(deltaLongitude / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function estimateWalkingTravel(
  left: Pick<Site, "latitude" | "longitude">,
  right: Pick<Site, "latitude" | "longitude">,
): TravelEstimate {
  const distanceKm = getDistanceKm(left, right);
  const walkingSpeedKmPerMinute = 4.5 / 60;

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    minutes: Math.max(5, Math.round(distanceKm / walkingSpeedKmPerMinute)),
    mode: "walk",
  };
}
