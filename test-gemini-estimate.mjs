/**
 * test-gemini-estimate.mjs
 * Quick test to verify the Gemini salary estimate is working.
 * Run with: node --experimental-strip-types test-gemini-estimate.ts
 * Or copy the JS equivalent below.
 */

import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Simulate what /api/estimate would pass to Gemini
const mockInput = {
  jobCategory: "Software Engineer",
  jobTitle: "Senior Frontend Engineer",
  company: "Google",
  location: "San Francisco",
  seniorityLevel: "senior",
  yearsOfExperience: 6,
  extraContext: "I have a competing offer from a Series B startup for $185k base plus equity.",
  matchedLocation: "San Francisco-Oakland-Fremont, CA",
  isFallback: false,
  wages: {
    annual: {
      p10: 128140,
      p25: 160060,
      median: 174910,
      p75: 213420,
      p90: null,
      mean: 187840,
    },
    seniorityAdjusted: {
      label: "Senior Level",
      targetAnnual: 213420,
      rangeAnnual: { low: 174910, high: null },
    },
  },
  totalEmployment: 76900,
  dataSource: "BLS OEWS 2024 (metro)",
};

function fmt(n) {
  if (n === null) return "not available";
  return `$${n.toLocaleString()}`;
}

function buildPrompt(input) {
  const { wages } = input;
  return `You are an expert compensation analyst and career coach specializing in helping women and nonbinary professionals in the tech industry negotiate fair salaries. Your goal is to give specific, data-backed, actionable salary guidance — not generic advice.

## TASK
Based on the Bureau of Labor Statistics wage data and the candidate's profile below, provide a specific salary recommendation with detailed rationale.

## CANDIDATE PROFILE
- **Job Category (BLS):** ${input.jobCategory}
- **Specific Job Title:** ${input.jobTitle}
- **Company:** ${input.company}
- **Location:** ${input.location}
- **Seniority Level:** ${input.seniorityLevel}
- **Years of Relevant Experience:** ${input.yearsOfExperience}
${input.extraContext ? `- **Additional Context:** ${input.extraContext}` : ""}

## BLS WAGE DATA (${input.dataSource})
Local data for ${input.matchedLocation}:
- 10th percentile: ${fmt(wages.annual.p10)}/year
- 25th percentile: ${fmt(wages.annual.p25)}/year
- Median: ${fmt(wages.annual.median)}/year
- 75th percentile: ${fmt(wages.annual.p75)}/year
- 90th percentile: ${fmt(wages.annual.p90)}/year
- Mean: ${fmt(wages.annual.mean)}/year
- Total employed: ${input.totalEmployment?.toLocaleString()}

Seniority-adjusted target: ${fmt(wages.seniorityAdjusted.targetAnnual)}/year
Expected range: ${fmt(wages.seniorityAdjusted.rangeAnnual.low)} – ${fmt(wages.seniorityAdjusted.rangeAnnual.high)}/year

## INSTRUCTIONS
Give a specific salary recommendation grounded in the BLS data. Consider seniority, experience, company type, job title, and any additional context. Be specific, warm, and empowering. Do not go below the BLS 25th percentile without strong reason.

## RESPONSE FORMAT
Respond with valid JSON only, no markdown:
{
  "recommendedSalary": { "point": <number>, "rangeLow": <number>, "rangeHigh": <number> },
  "rationale": "<2-4 paragraphs addressed directly to the candidate>",
  "negotiationTips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "confidenceLevel": "<high|medium|low>",
  "confidenceReason": "<one sentence>"
}`;
}

const prompt = buildPrompt(mockInput);

console.log("Sending request to Gemini...\n");

const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: prompt,
  config: { temperature: 0.3, maxOutputTokens: 2048 },
});

const text = response.text ?? "";
const cleaned = text.replace(/```json|```/g, "").trim();

try {
  const parsed = JSON.parse(cleaned);
  console.log("✓ Gemini response parsed successfully:\n");
  console.log(JSON.stringify(parsed, null, 2));
} catch {
  console.log("✗ Failed to parse JSON. Raw response:");
  console.log(text);
}
