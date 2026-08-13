import { useState } from "react";
import { ItineraryPanel } from "../components/itinerary/ItineraryPanel";
import { MapView } from "../components/map/MapView";
import { PreferencesForm } from "../components/planner/PreferencesForm";
import { Icon } from "../components/ui/Icon";
import { usePlannerData } from "../hooks/usePlannerData";

export function TripPlannerPage() {
  const { preferences, itinerary, isLoading, errorMessage } = usePlannerData();
  const [activeDay, setActiveDay] = useState(1);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Backtrack home">
          <span className="brand-mark">B</span>
          <span>backtrack</span>
        </a>
        <nav className="topbar-nav" aria-label="Main navigation">
          <a className="nav-active" href="#plan">Plan a trip</a>
          <a href="#how-it-works">How it works</a>
          <button className="icon-button" aria-label="Saved itineraries">
            <Icon name="bookmark" />
          </button>
        </nav>
      </header>

      <section className="planner-split" id="plan">
        <aside className="side-panel">
          <PreferencesForm preferences={preferences} />

          <div className="side-panel-content">
            {isLoading ? <LoadingState /> : null}
            {errorMessage ? <ErrorState message={errorMessage} /> : null}
            {itinerary ? (
              <ItineraryPanel itinerary={itinerary} activeDay={activeDay} onDayChange={setActiveDay} />
            ) : null}
          </div>
        </aside>

        {itinerary ? <MapView itinerary={itinerary} activeDay={activeDay} /> : <div className="map-pane map-pane-empty" />}
      </section>
    </main>
  );
}

function LoadingState() {
  return (
    <section className="state-card" aria-live="polite">
      <span className="loader" />
      <div><strong>Tracing your route…</strong><p>Balancing time, distance, and context.</p></div>
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="state-card state-card-error">
      <Icon name="info" />
      <div><strong>We couldn’t reach the planner</strong><p>{message}</p></div>
    </section>
  );
}
