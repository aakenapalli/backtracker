import { fetchJson } from "./http-client.ts";

export interface WikidataCoordinates {
  lat: number;
  lon: number;
}

interface WikibaseCoordinateValue {
  value?: {
    content?: {
      latitude?: number;
      longitude?: number;
    };
  };
}

/**
 * Fetches P625 (coordinate location) via the Wikibase REST API. Kept as a
 * separate call from the Wikipedia summary endpoint deliberately: Wikidata's
 * structured statements are CC0 (no attribution required), distinct from
 * Wikipedia's CC BY-SA article text, and this project's licensing story
 * depends on being able to say precisely which fact came from which source.
 */
export async function fetchWikidataCoordinates(qid: string, userAgent: string): Promise<WikidataCoordinates | null> {
  const url = `https://www.wikidata.org/w/rest.php/wikibase/v1/entities/items/${qid}/statements?property=P625`;
  const data = await fetchJson<Record<string, WikibaseCoordinateValue[]>>(url, { userAgent });

  const statements = data["P625"];
  const content = statements?.[0]?.value?.content;

  if (!content || typeof content.latitude !== "number" || typeof content.longitude !== "number") {
    return null;
  }

  return { lat: content.latitude, lon: content.longitude };
}
