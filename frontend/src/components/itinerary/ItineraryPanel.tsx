import type { GeneratedItineraryView } from "../../types/planner";
import { Icon } from "../ui/Icon";

interface ItineraryPanelProps {
  itinerary: GeneratedItineraryView;
  activeDay: number;
  onDayChange: (day: number) => void;
}

export function ItineraryPanel({ itinerary, activeDay, onDayChange }: ItineraryPanelProps) {
  const day = itinerary.days.find((item) => item.dayNumber === activeDay) ?? itinerary.days[0];

  return (
    <section className="itinerary-section">
      <p className="itinerary-summary">{itinerary.tripSummary}</p>

      {itinerary.warnings.length > 0 ? <div className="warning">{itinerary.warnings.join(" ")}</div> : null}

      <div className="day-tabs" role="tablist" aria-label="Itinerary days">
        {itinerary.days.map((item) => (
          <button key={item.dayNumber} className={item.dayNumber === activeDay ? "active" : ""} onClick={() => onDayChange(item.dayNumber)}>
            <span>Day {item.dayNumber}</span>
            <small>{item.stops[0]?.neighborhood}</small>
          </button>
        ))}
      </div>

      <article className="day-panel">
        <div className="day-overview">
          <div><span>Day {day.dayNumber}</span><h3>{day.stops[0]?.neighborhood} & beyond</h3></div>
          <div className="day-metrics">
            <span><Icon name="clock" /> {formatMinutes(day.totalPlannedMinutes)}</span>
            <span><Icon name="walk" /> {day.totalTravelMinutes} min walking</span>
          </div>
        </div>

        <div className="timeline">
          {day.stops.map((stop, index) => (
            <div className="timeline-stop" key={stop.siteSlug}>
              <div className="timeline-marker"><span>{index + 1}</span></div>
              <div className="stop-card">
                <div className="stop-topline">
                  <div>
                    <p>{index === 0 ? "Start here" : `${stop.walkFromPreviousMinutes} min walk from previous`}</p>
                    <h4>{stop.name}</h4>
                  </div>
                  <button className="save-button" aria-label={`Save ${stop.name}`}><Icon name="bookmark" /></button>
                </div>
                <div className="stop-meta">
                  <span><Icon name="clock" /> {stop.visitMinutes} min</span>
                  <span><Icon name="pin" /> {stop.neighborhood}</span>
                  {stop.mustBookAhead ? <span className="booking"><Icon name="ticket" /> Book ahead</span> : null}
                </div>
                <p className="stop-reason">{stop.reasonIncluded}</p>
                <div className="stop-footer">
                  <span className={stop.required ? "required-badge" : "optional-badge"}>{stop.required ? "Essential stop" : "Optional detour"}</span>
                  <button>Why this stop? <span>→</span></button>
                </div>
                {stop.sources?.sourceUrl ? (
                  <a className="stop-source" href={stop.sources.sourceUrl} target="_blank" rel="noopener noreferrer">
                    Source: Wikipedia <span>↗</span>
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${remainder}m`;
}
