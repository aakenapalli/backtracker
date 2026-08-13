import { useEffect, useRef, useState } from "react";
import { generateItinerary } from "../api/plannerApi";
import type { GeneratedItineraryView, PlannerPreferences } from "../types/planner";

interface PlannerDataState {
  preferences: PlannerPreferences | null;
  itinerary: GeneratedItineraryView | null;
  isLoading: boolean;
  errorMessage: string | null;
  generate: (preferences: PlannerPreferences) => void;
  resetItinerary: () => void;
}

export function usePlannerData(): PlannerDataState {
  const [preferences, setPreferences] = useState<PlannerPreferences | null>(null);
  const [itinerary, setItinerary] = useState<GeneratedItineraryView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  function generate(nextPreferences: PlannerPreferences) {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setPreferences(nextPreferences);
    setIsLoading(true);
    setErrorMessage(null);

    generateItinerary({ preferences: nextPreferences }, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setItinerary(response.itinerary);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "Unable to load planner data right now.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });
  }

  function resetItinerary() {
    setItinerary(null);
    setErrorMessage(null);
  }

  return {
    preferences,
    itinerary,
    isLoading,
    errorMessage,
    generate,
    resetItinerary,
  };
}
