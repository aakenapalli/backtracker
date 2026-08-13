import { fetchJson } from "./http-client.ts";

export interface WikipediaSummary {
  qid: string | null;
  canonicalTitle: string;
  description: string | null;
  extract: string;
  coordinates: { lat: number; lon: number } | null;
  articleUrl: string;
}

interface WikipediaSummaryResponse {
  wikibase_item?: string;
  titles?: { canonical?: string };
  description?: string;
  extract?: string;
  coordinates?: { lat: number; lon: number };
  content_urls?: { desktop?: { page?: string } };
}

/**
 * en.wikipedia.org/api/rest_v1/ rather than the newer api.wikimedia.org host:
 * the latter is being deprecated through mid-2027 per Wikimedia's own
 * migration notice, with replacement URLs not yet announced as of this
 * writing. Isolated in this one module so swapping hosts later is a
 * one-file change.
 */
export async function fetchWikipediaSummary(title: string, userAgent: string): Promise<WikipediaSummary> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
  const data = await fetchJson<WikipediaSummaryResponse>(url, { userAgent });

  return {
    qid: data.wikibase_item ?? null,
    canonicalTitle: data.titles?.canonical?.replaceAll("_", " ") ?? title,
    description: data.description ?? null,
    extract: data.extract ?? "",
    coordinates: data.coordinates ?? null,
    articleUrl: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`,
  };
}
