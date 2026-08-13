import { fetchJson } from "./http-client.ts";

export type WikipediaLanguage = "en" | "tr";

export interface MonthlyPageviews {
  month: string; // "YYYY-MM-01"
  views: number;
}

interface PageviewsResponse {
  items: Array<{ timestamp: string; views: number }>;
}

function formatTimestamp(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}${month}0100`;
}

/**
 * Fetches monthly pageviews for the trailing N complete months (excluding
 * the current, necessarily-partial month -- an incomplete month silently
 * undercounts and would skew the trend/interest formulas if included).
 */
export async function fetchMonthlyPageviews(
  title: string,
  language: WikipediaLanguage,
  userAgent: string,
  monthsBack = 25,
): Promise<MonthlyPageviews[]> {
  const now = new Date();
  const endOfLastCompleteMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const start = new Date(endOfLastCompleteMonth);
  start.setUTCMonth(start.getUTCMonth() - monthsBack);

  const startStamp = formatTimestamp(start);
  const endStamp = formatTimestamp(endOfLastCompleteMonth);

  const url =
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${language}.wikipedia/all-access/user/` +
    `${encodeURIComponent(title.replaceAll(" ", "_"))}/monthly/${startStamp}/${endStamp}`;

  const data = await fetchJson<PageviewsResponse>(url, { userAgent });

  return data.items
    .map((item) => ({
      month: `${item.timestamp.slice(0, 4)}-${item.timestamp.slice(4, 6)}-01`,
      views: item.views,
    }))
    .filter((item) => item.month < `${endOfLastCompleteMonth.toISOString().slice(0, 7)}-01`);
}
