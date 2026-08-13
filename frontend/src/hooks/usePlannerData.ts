import { useEffect, useState } from "react";
import { generateItinerary } from "../api/plannerApi";
import { defaultPreferences } from "../data/mockItinerary";
import type { GeneratedItineraryView, PlannerPreferences } from "../types/planner";

interface PlannerDataState {
  preferences: PlannerPreferences;
  itinerary: GeneratedItineraryView | null;
  isLoading: boolean;
  errorMessage: string | null;
}

export function usePlannerData(): PlannerDataState {
  const [itinerary, setItinerary] = useState<GeneratedItineraryView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadItinerary() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await generateItinerary(
          { preferences: defaultPreferences },
          controller.signal,
        );
        setItinerary(response.itinerary);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Unable to load planner data right now.";
        setErrorMessage(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadItinerary();

    return () => controller.abort();
  }, []);

  return {
    preferences: defaultPreferences,
    itinerary,
    isLoading,
    errorMessage,
  };
}

