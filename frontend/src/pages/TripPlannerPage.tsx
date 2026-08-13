import { useState } from "react";
import { ItineraryPanel } from "../components/itinerary/ItineraryPanel";
import { MapView } from "../components/map/MapView";
import { PreferencesForm } from "../components/planner/PreferencesForm";
import type { GeneratedItineraryView, PlannerPreferences } from "../types/planner";

interface TripPlannerPageProps {
  itinerary: GeneratedItineraryView;
  preferences: PlannerPreferences;
  onAdjustPreferences: () => void;
}

export function TripPlannerPage({ itinerary, preferences, onAdjustPreferences }: TripPlannerPageProps) {
  const [activeDay, setActiveDay] = useState(1);

  return (
    <section className="planner-split" id="plan">
      <aside className="side-panel">
        <PreferencesForm preferences={preferences} onAdjustPreferences={onAdjustPreferences} />

        <div className="side-panel-content">
          <ItineraryPanel itinerary={itinerary} activeDay={activeDay} onDayChange={setActiveDay} />
        </div>
      </aside>

      <MapView itinerary={itinerary} activeDay={activeDay} />
    </section>
  );
}
