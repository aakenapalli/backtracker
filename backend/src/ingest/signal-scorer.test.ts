import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyBreadthGate,
  clamp,
  computeTrendScore,
  median,
  normalizeToCorpus,
  percentile,
  rawInterest,
  rawSocialInterest,
} from "./signal-scorer.ts";

test("median resists a single spike value", () => {
  assert.equal(median([10, 10, 10, 10, 10000]), 10);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(median([]), 0);
});

test("percentile returns the corpus's boundary values", () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.ok(percentile(values, 10) <= percentile(values, 90));
  assert.equal(percentile([], 50), 0);
});

test("clamp bounds a value on both sides", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
});

test("rawInterest compresses a wide range via log10", () => {
  const low = rawInterest([500]);
  const high = rawInterest([85000]);
  // 170x difference in input compresses to well under a 170x difference in output
  assert.ok(high / low < 3);
});

test("normalizeToCorpus clamps to [0,1] and is relative to the corpus spread", () => {
  const corpus = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => Math.log10(v));
  const midValue = Math.log10(5);
  const normalized = normalizeToCorpus(midValue, corpus);
  assert.ok(normalized >= 0 && normalized <= 1);

  const belowRange = normalizeToCorpus(Math.log10(0.001), corpus);
  assert.equal(belowRange, 0);

  const aboveRange = normalizeToCorpus(Math.log10(1000), corpus);
  assert.equal(aboveRange, 1);
});

test("computeTrendScore is 0 for flat views over time", () => {
  const flat = Array(24).fill(1000);
  assert.equal(computeTrendScore(flat), 0);
});

test("computeTrendScore: a modest doubling and a 100x viral spike clamp to the same ceiling", () => {
  const baseline = Array(21).fill(1000);

  const doubled = [...baseline, 2000, 2000, 2000];
  const spiked = [...baseline, 100_000, 100_000, 100_000];

  const doubledScore = computeTrendScore(doubled);
  const spikedScore = computeTrendScore(spiked);

  assert.equal(doubledScore, 1);
  assert.equal(spikedScore, 1);
  assert.equal(doubledScore, spikedScore, "a 100x spike must not score higher than a modest doubling once clamped");
});

test("computeTrendScore: a halving clamps to -1", () => {
  const baseline = Array(21).fill(1000);
  const halved = [...baseline, 500, 500, 500];
  assert.equal(computeTrendScore(halved), -1);
});

test("computeTrendScore returns 0 with insufficient history", () => {
  assert.equal(computeTrendScore([1, 2, 3]), 0);
});

test("rawSocialInterest caps a single post's contribution regardless of how large its score is", () => {
  const moderatePost = rawSocialInterest({ postCount: 1, commentCount: 50, scoreSum: 500 });
  const viralPost = rawSocialInterest({ postCount: 1, commentCount: 500, scoreSum: 30_000 });

  // the viral post scores higher, but not proportionally to its ~60x larger raw numbers
  assert.ok(viralPost > moderatePost);
  assert.ok(viralPost / moderatePost < 3);
});

test("applyBreadthGate caps a single-thread signal at 0.5 regardless of magnitude", () => {
  assert.equal(applyBreadthGate(0.9, 1), 0.5);
  assert.equal(applyBreadthGate(0.3, 1), 0.3);
  assert.equal(applyBreadthGate(0.9, 2), 0.5);
});

test("applyBreadthGate does not cap a broadly-discussed place", () => {
  assert.equal(applyBreadthGate(0.9, 3), 0.9);
  assert.equal(applyBreadthGate(0.9, 10), 0.9);
});
