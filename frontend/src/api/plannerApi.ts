import type {
  GenerateItineraryRequestDto,
  GenerateItineraryResponseDto,
  GetSitesResponseDto,
} from "../types/api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export async function fetchSites(signal?: AbortSignal): Promise<GetSitesResponseDto> {
  const response = await fetch(`${API_BASE_URL}/api/sites`, { signal });

  if (!response.ok) {
    throw new Error("Unable to load seeded Istanbul sites.");
  }

  return response.json() as Promise<GetSitesResponseDto>;
}

export async function generateItinerary(
  payload: GenerateItineraryRequestDto,
  signal?: AbortSignal,
): Promise<GenerateItineraryResponseDto> {
  const response = await fetch(`${API_BASE_URL}/api/itinerary/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error("Unable to generate itinerary.");
  }

  return response.json() as Promise<GenerateItineraryResponseDto>;
}

