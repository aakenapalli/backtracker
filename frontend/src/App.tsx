import { PreferencesWizardPage } from "./pages/PreferencesWizardPage";
import { TripPlannerPage } from "./pages/TripPlannerPage";
import { Icon } from "./components/ui/Icon";
import { usePlannerData } from "./hooks/usePlannerData";

export default function App() {
  const { preferences, itinerary, isLoading, errorMessage, generate, resetItinerary } = usePlannerData();

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

      {isLoading ? (
        <FullPageState kind="loading" />
      ) : itinerary && preferences ? (
        <TripPlannerPage itinerary={itinerary} preferences={preferences} onAdjustPreferences={resetItinerary} />
      ) : errorMessage ? (
        <FullPageState kind="error" message={errorMessage} onRetry={resetItinerary} />
      ) : (
        <PreferencesWizardPage initialDraft={preferences ?? undefined} onComplete={generate} />
      )}
    </main>
  );
}

function FullPageState({ kind, message, onRetry }: { kind: "loading" | "error"; message?: string; onRetry?: () => void }) {
  return (
    <div className="full-page-state">
      <section className={`state-card ${kind === "error" ? "state-card-error" : ""}`} aria-live="polite">
        {kind === "loading" ? <span className="loader" /> : <Icon name="info" />}
        <div>
          <strong>{kind === "loading" ? "Tracing your route…" : "We couldn't reach the planner"}</strong>
          <p>{kind === "loading" ? "Balancing time, distance, and context." : message}</p>
          {kind === "error" && onRetry ? (
            <button className="secondary-button" onClick={onRetry}>
              Try again
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
