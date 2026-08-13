import { writeFile } from "node:fs/promises";
import path from "node:path";
import { qidBySlug } from "./qid-map.ts";
import { fetchWikidataCoordinates } from "./wikidata.client.ts";
import { fetchWikipediaSummary } from "./wikipedia.client.ts";
import { fetchMonthlyPageviews, type MonthlyPageviews } from "./pageviews.client.ts";
import { fetchStackExchangeSignal } from "./stackexchange.client.ts";
import { applyBreadthGate, computeTrendScore, normalizeToCorpus, rawInterest, rawSocialInterest } from "./signal-scorer.ts";
import { siteSeeds } from "../seed/sites.seed.ts";

const SEED_DIR = path.join(import.meta.dirname, "..", "seed");
const COORDINATE_DELTA_FLAG_METERS = 100;

function getUserAgent(): string {
  const userAgent = process.env.WIKIMEDIA_USER_AGENT;
  if (!userAgent) {
    throw new Error(
      "WIKIMEDIA_USER_AGENT is not set. Copy .env.example's ingest section to .env and fill it in.",
    );
  }
  return userAgent;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function combineMonthlySeries(en: MonthlyPageviews[], tr: MonthlyPageviews[]): number[] {
  const byMonth = new Map<string, number>();
  for (const item of [...en, ...tr]) {
    byMonth.set(item.month, (byMonth.get(item.month) ?? 0) + item.views);
  }
  return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, views]) => views);
}

interface SiteIngestResult {
  slug: string;
  qid: string;
  wikipediaTitle: string;
  sourceUrl: string;
  coordinateDeltaMeters: number | null;
  enMonths: MonthlyPageviews[];
  trMonths: MonthlyPageviews[];
  combinedSeries: number[];
  rawInterestValue: number;
  trendScore: number;
  socialRawValue: number;
  socialDistinctPosts: number;
  socialTopUrl: string | null;
}

async function ingestOneSite(slug: string, userAgent: string): Promise<SiteIngestResult> {
  const seed = siteSeeds.find((s) => s.slug === slug);
  const mapping = qidBySlug[slug];
  if (!seed || !mapping) {
    throw new Error(`No seed/QID mapping for ${slug}`);
  }

  const [wikidataCoords, wikipediaSummary, enMonths, trMonths, social] = await Promise.all([
    fetchWikidataCoordinates(mapping.qid, userAgent).catch(() => null),
    fetchWikipediaSummary(mapping.wikipediaTitle, userAgent),
    fetchMonthlyPageviews(mapping.wikipediaTitle, "en", userAgent).catch(() => []),
    fetchMonthlyPageviews(mapping.wikipediaTitle, "tr", userAgent).catch(() => []),
    fetchStackExchangeSignal(seed.name, userAgent).catch(() => ({
      postCount: 0,
      commentCount: 0,
      scoreSum: 0,
      distinctPostCount: 0,
      topItemUrl: null,
    })),
  ]);

  const coordinateDeltaMeters = wikidataCoords
    ? haversineMeters(seed.latitude, seed.longitude, wikidataCoords.lat, wikidataCoords.lon)
    : null;

  const combinedSeries = combineMonthlySeries(enMonths, trMonths);

  return {
    slug,
    qid: mapping.qid,
    wikipediaTitle: wikipediaSummary.canonicalTitle,
    sourceUrl: wikipediaSummary.articleUrl,
    coordinateDeltaMeters,
    enMonths,
    trMonths,
    combinedSeries,
    rawInterestValue: rawInterest(combinedSeries),
    trendScore: computeTrendScore(combinedSeries),
    socialRawValue: rawSocialInterest(social),
    socialDistinctPosts: social.distinctPostCount,
    socialTopUrl: social.topItemUrl,
  };
}

async function main(): Promise<void> {
  const write = process.argv.includes("--write");
  const userAgent = getUserAgent();
  const slugs = Object.keys(qidBySlug);

  console.log(`Ingesting ${slugs.length} sites (${write ? "WRITE" : "DRY RUN"})...\n`);

  const results: SiteIngestResult[] = [];
  for (const slug of slugs) {
    process.stdout.write(`  ${slug}... `);
    const result = await ingestOneSite(slug, userAgent);
    console.log("done");
    results.push(result);
  }

  const interestCorpus = results.map((r) => r.rawInterestValue);
  const socialCorpus = results.map((r) => r.socialRawValue);

  const scored = results.map((r) => {
    const interestScore = normalizeToCorpus(r.rawInterestValue, interestCorpus);
    const socialScoreRaw = normalizeToCorpus(r.socialRawValue, socialCorpus);
    const socialScore = applyBreadthGate(socialScoreRaw, r.socialDistinctPosts);
    return { ...r, interestScore, socialScore };
  });

  console.log("\n--- Review report ---\n");

  for (const r of scored) {
    const seed = siteSeeds.find((s) => s.slug === r.slug)!;
    const flags: string[] = [];

    if (r.coordinateDeltaMeters !== null && r.coordinateDeltaMeters > COORDINATE_DELTA_FLAG_METERS) {
      flags.push(`coordinates differ by ${r.coordinateDeltaMeters.toFixed(0)}m from Wikidata`);
    }

    const editorialNormalized = (seed.editorialPriority - 1) / 4;
    if (Math.abs(editorialNormalized - r.interestScore) > 0.6) {
      flags.push(
        `editorialPriority (${seed.editorialPriority}) and interestScore (${r.interestScore.toFixed(2)}) disagree sharply`,
      );
    }

    if (r.combinedSeries.length < 12) {
      flags.push(`only ${r.combinedSeries.length} months of pageview data`);
    }

    if (flags.length > 0) {
      console.log(`${r.slug}:`);
      for (const flag of flags) {
        console.log(`  - ${flag}`);
      }
    }
  }

  console.log(
    `\n${scored.length} sites processed. ${write ? "Writing generated files..." : "Dry run -- pass --write to generate files."}`,
  );

  if (!write) {
    return;
  }

  await writeGeneratedFiles(scored);
  console.log("Wrote sources.generated.ts and signals.generated.ts. Review the git diff before committing.");
}

async function writeGeneratedFiles(results: (SiteIngestResult & { interestScore: number; socialScore: number })[]): Promise<void> {
  const retrievedAt = new Date().toISOString();

  const sourcesLines = results.map(
    (r) => `  {
    slug: "${r.slug}",
    wikidataQid: "${r.qid}",
    wikipediaTitle: ${JSON.stringify(r.wikipediaTitle)},
    sourceUrl: ${JSON.stringify(r.sourceUrl)},
    sourceAttribution: "Facts from Wikidata (${r.qid}, CC0) and Wikipedia (CC BY-SA 4.0)",
    sourceLicense: "CC0-1.0" as const,
    retrievedAt: "${retrievedAt}",
  }`,
  );

  const sourcesContent = `// GENERATED by \`npm run ingest:sync -- --write\`. Do not hand-edit.
// Review this diff carefully before committing -- see PROJECT_INTERVIEW_NOTES.md.

export interface GeneratedSiteSource {
  slug: string;
  wikidataQid: string;
  wikipediaTitle: string;
  sourceUrl: string;
  sourceAttribution: string;
  sourceLicense: "CC0-1.0" | "CC-BY-SA-4.0";
  retrievedAt: string;
}

export const generatedSources: GeneratedSiteSource[] = [
${sourcesLines.join(",\n")}
];
`;

  const pageviewLines: string[] = [];
  for (const r of results) {
    for (const m of r.enMonths) {
      pageviewLines.push(`  { siteSlug: "${r.slug}", language: "en" as const, month: "${m.month}", views: ${m.views} }`);
    }
    for (const m of r.trMonths) {
      pageviewLines.push(`  { siteSlug: "${r.slug}", language: "tr" as const, month: "${m.month}", views: ${m.views} }`);
    }
  }

  const socialLines = results.map(
    (r) => `  {
    siteSlug: "${r.slug}",
    source: "stackexchange" as const,
    capturedOn: "${retrievedAt.slice(0, 10)}",
    windowDays: 365,
    postCount: ${r.socialDistinctPosts},
    commentCount: 0,
    scoreSum: 0,
    topItemUrl: ${r.socialTopUrl ? JSON.stringify(r.socialTopUrl) : "null"},
  }`,
  );

  const scoreLines = results.map(
    (r) => `  { siteSlug: "${r.slug}", interestScore: ${r.interestScore.toFixed(4)}, trendScore: ${r.trendScore.toFixed(4)}, socialScore: ${r.socialScore.toFixed(4)} }`,
  );

  const signalsContent = `// GENERATED by \`npm run ingest:sync -- --write\`. Do not hand-edit.
// Review this diff carefully before committing -- see PROJECT_INTERVIEW_NOTES.md.

export interface GeneratedPageviewMonth {
  siteSlug: string;
  language: "en" | "tr";
  month: string;
  views: number;
}

export interface GeneratedSocialSnapshot {
  siteSlug: string;
  source: "stackexchange" | "reddit";
  capturedOn: string;
  windowDays: number;
  postCount: number;
  commentCount: number;
  scoreSum: number;
  topItemUrl: string | null;
}

export interface GeneratedScore {
  siteSlug: string;
  interestScore: number;
  trendScore: number;
  socialScore: number;
}

export const generatedPageviewMonths: GeneratedPageviewMonth[] = [
${pageviewLines.join(",\n")}
];

export const generatedSocialSnapshots: GeneratedSocialSnapshot[] = [
${socialLines.join(",\n")}
];

export const generatedScores: GeneratedScore[] = [
${scoreLines.join(",\n")}
];
`;

  await writeFile(path.join(SEED_DIR, "sources.generated.ts"), sourcesContent, "utf8");
  await writeFile(path.join(SEED_DIR, "signals.generated.ts"), signalsContent, "utf8");
}

await main();
