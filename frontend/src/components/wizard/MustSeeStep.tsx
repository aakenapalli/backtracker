import { useEffect, useState } from "react";
import { fetchSites } from "../../api/plannerApi";
import type { SiteListItemDto } from "../../types/api";
import { Icon } from "../ui/Icon";

interface MustSeeStepProps {
  selected: string[];
  onToggle: (slug: string) => void;
}

export function MustSeeStep({ selected, onToggle }: MustSeeStepProps) {
  const [sites, setSites] = useState<SiteListItemDto[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchSites(controller.signal)
      .then((response) => setSites(response.sites))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load sites.");
        }
      });

    return () => controller.abort();
  }, []);

  if (errorMessage) {
    return <p className="wizard-error">{errorMessage}</p>;
  }

  if (!sites) {
    return <p className="wizard-loading-text">Loading Istanbul sites…</p>;
  }

  const byNeighborhood = new Map<string, SiteListItemDto[]>();
  for (const site of sites) {
    const group = byNeighborhood.get(site.neighborhood) ?? [];
    group.push(site);
    byNeighborhood.set(site.neighborhood, group);
  }

  return (
    <div className="wizard-must-see">
      {[...byNeighborhood.entries()].map(([neighborhood, neighborhoodSites]) => (
        <div className="wizard-must-see-group" key={neighborhood}>
          <p className="wizard-must-see-neighborhood">{neighborhood}</p>
          <div className="wizard-chip-grid">
            {neighborhoodSites.map((site) => {
              const isSelected = selected.includes(site.slug);
              return (
                <button
                  key={site.slug}
                  type="button"
                  className={`wizard-chip ${isSelected ? "selected" : ""}`}
                  aria-pressed={isSelected}
                  onClick={() => onToggle(site.slug)}
                >
                  {isSelected ? <Icon name="pin" /> : null}
                  {site.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
