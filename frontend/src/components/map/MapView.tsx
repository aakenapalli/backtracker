import { useEffect } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { divIcon, type LatLngBoundsExpression, type LatLngTuple } from "leaflet";
import type { DayPlanView, GeneratedItineraryView } from "../../types/planner";

interface MapViewProps {
  itinerary: GeneratedItineraryView;
  activeDay: number;
}

const DAY_COLORS = ["#c96a45", "#2b3b45", "#7a8f6a", "#a3623f"];

export function MapView({ itinerary, activeDay }: MapViewProps) {
  const allStops = itinerary.days.flatMap((day) => day.stops);
  const center: LatLngTuple = allStops.length
    ? [allStops[0].latitude, allStops[0].longitude]
    : [41.0082, 28.9784];

  return (
    <section className="map-pane" aria-label="Route overview">
      <MapContainer center={center} zoom={14} scrollWheelZoom className="map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {itinerary.days.map((day) => (
          <DayLayer key={day.dayNumber} day={day} color={DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length]} />
        ))}
        <FitToDay itinerary={itinerary} activeDay={activeDay} />
      </MapContainer>
      <div className="map-overlay">
        <div className="map-overlay-stat">
          <span><strong>{allStops.length} places</strong><small>across {itinerary.days.length} days</small></span>
        </div>
        <div className="map-key">
          {itinerary.days.map((day) => (
            <span key={day.dayNumber}>
              <i style={{ background: DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length] }} /> Day {day.dayNumber}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function DayLayer({ day, color }: { day: DayPlanView; color: string }) {
  const positions: LatLngTuple[] = day.stops.map((stop) => [stop.latitude, stop.longitude]);

  return (
    <>
      <Polyline positions={positions} pathOptions={{ color, weight: 3, opacity: 0.75, dashArray: "1 8", lineCap: "round" }} />
      {day.stops.map((stop, index) => (
        <Marker
          key={stop.siteSlug}
          position={[stop.latitude, stop.longitude]}
          icon={divIcon({
            className: "map-marker-icon",
            html: `<span style="background:${color}"><b>${index + 1}</b></span>`,
            iconSize: [30, 30],
            iconAnchor: [15, 28],
            popupAnchor: [0, -28],
          })}
        >
          <Popup>
            <strong>{stop.name}</strong>
            <p>{stop.reasonIncluded}</p>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function FitToDay({ itinerary, activeDay }: { itinerary: GeneratedItineraryView; activeDay: number }) {
  const map = useMap();

  useEffect(() => {
    const day = itinerary.days.find((item) => item.dayNumber === activeDay) ?? itinerary.days[0];
    if (!day || day.stops.length === 0) {
      return;
    }

    const bounds: LatLngBoundsExpression = day.stops.map((stop) => [stop.latitude, stop.longitude]);
    map.fitBounds(bounds, { padding: [64, 64], maxZoom: 16 });
  }, [map, itinerary, activeDay]);

  return null;
}
