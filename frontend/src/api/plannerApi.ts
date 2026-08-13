import type {
  GenerateItineraryRequestDto,
  GenerateItineraryResponseDto,
  GetSitesResponseDto,
} from "../types/api";

export async function fetchSites(signal?: AbortSignal): Promise<GetSitesResponseDto> {
  const response = await fetch("/api/sites", { signal });

  if (!response.ok) {
    throw new Error("Unable to load seeded Istanbul sites.");
  }

  return response.json() as Promise<GetSitesResponseDto>;
}

export async function generateItinerary(
  payload: GenerateItineraryRequestDto,
  signal?: AbortSignal,
): Promise<GenerateItineraryResponseDto> {
  const response = await fetch("/api/itinerary/generate", {
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

