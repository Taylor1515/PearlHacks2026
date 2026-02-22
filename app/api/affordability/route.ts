import { NextRequest, NextResponse } from "next/server";
import { generateAffordabilityEstimate } from "@/server/gemini-affordability";

/**
 * POST /api/affordability
 *
 * Request body:
 * {
 *   salary: number;    // annual gross salary
 *   city: string;      // e.g. "San Francisco" or "San Francisco, CA"
 * }
 */

// ---------------------------------------------------------------------------
// Hardcoded average 1BR rent for major US tech cities (monthly, USD)
// Source: approximate 2024 market averages
// ---------------------------------------------------------------------------
const CITY_RENT_DATA: Record<string, {
  rent1br: number;
  costIndex: number; // relative to national avg (1.0 = average)
  label: string;     // canonical display name
}> = {
  "san francisco":    { rent1br: 3200, costIndex: 1.8,  label: "San Francisco, CA" },
  "san jose":         { rent1br: 2800, costIndex: 1.65, label: "San Jose, CA" },
  "oakland":          { rent1br: 2400, costIndex: 1.5,  label: "Oakland, CA" },
  "new york":         { rent1br: 3500, costIndex: 1.85, label: "New York, NY" },
  "seattle":          { rent1br: 2200, costIndex: 1.5,  label: "Seattle, WA" },
  "boston":           { rent1br: 2800, costIndex: 1.6,  label: "Boston, MA" },
  "washington":       { rent1br: 2400, costIndex: 1.5,  label: "Washington, DC" },
  "dc":               { rent1br: 2400, costIndex: 1.5,  label: "Washington, DC" },
  "los angeles":      { rent1br: 2500, costIndex: 1.55, label: "Los Angeles, CA" },
  "san diego":        { rent1br: 2400, costIndex: 1.45, label: "San Diego, CA" },
  "denver":           { rent1br: 1800, costIndex: 1.2,  label: "Denver, CO" },
  "austin":           { rent1br: 1700, costIndex: 1.15, label: "Austin, TX" },
  "dallas":           { rent1br: 1500, costIndex: 1.05, label: "Dallas, TX" },
  "houston":          { rent1br: 1400, costIndex: 1.0,  label: "Houston, TX" },
  "chicago":          { rent1br: 1900, costIndex: 1.2,  label: "Chicago, IL" },
  "atlanta":          { rent1br: 1700, costIndex: 1.1,  label: "Atlanta, GA" },
  "miami":            { rent1br: 2300, costIndex: 1.35, label: "Miami, FL" },
  "portland":         { rent1br: 1700, costIndex: 1.2,  label: "Portland, OR" },
  "minneapolis":      { rent1br: 1500, costIndex: 1.05, label: "Minneapolis, MN" },
  "phoenix":          { rent1br: 1500, costIndex: 1.0,  label: "Phoenix, AZ" },
  "raleigh":          { rent1br: 1500, costIndex: 1.0,  label: "Raleigh, NC" },
  "durham":           { rent1br: 1400, costIndex: 0.95, label: "Durham, NC" },
  "chapel hill":      { rent1br: 1400, costIndex: 0.95, label: "Chapel Hill, NC" },
  "charlotte":        { rent1br: 1500, costIndex: 1.0,  label: "Charlotte, NC" },
  "nashville":        { rent1br: 1700, costIndex: 1.1,  label: "Nashville, TN" },
  "pittsburgh":       { rent1br: 1300, costIndex: 0.9,  label: "Pittsburgh, PA" },
  "philadelphia":     { rent1br: 1800, costIndex: 1.15, label: "Philadelphia, PA" },
  "salt lake city":   { rent1br: 1600, costIndex: 1.05, label: "Salt Lake City, UT" },
  "detroit":          { rent1br: 1200, costIndex: 0.85, label: "Detroit, MI" },
  "columbus":         { rent1br: 1200, costIndex: 0.85, label: "Columbus, OH" },
  "indianapolis":     { rent1br: 1100, costIndex: 0.82, label: "Indianapolis, IN" },
};

// National average baseline estimates (monthly)
const NATIONAL_BASELINE = {
  rent1br: 1500,
  groceries: 400,
  transport: 350,
  utilities: 150,
  healthcare: 200,
  misc: 300,
};

function findCityData(city: string) {
  const normalized = city.toLowerCase().replace(/,.*$/, "").trim();
  // Exact match first
  if (CITY_RENT_DATA[normalized]) return CITY_RENT_DATA[normalized];
  // Partial match
  for (const [key, data] of Object.entries(CITY_RENT_DATA)) {
    if (normalized.includes(key) || key.includes(normalized)) return data;
  }
  return null;
}

function calculateMonthlyBudget(annualSalary: number, costIndex: number, rent1br: number) {
  // Rough take-home: ~72% of gross (accounts for fed/state taxes, FICA)
  // This is approximate and varies by state but good enough for this tool
  const monthlyTakeHome = (annualSalary * 0.72) / 12;

  // Scale non-rent costs by cost index
  const groceries  = Math.round(NATIONAL_BASELINE.groceries  * costIndex);
  const transport  = Math.round(NATIONAL_BASELINE.transport  * costIndex);
  const utilities  = Math.round(NATIONAL_BASELINE.utilities  * costIndex);
  const healthcare = Math.round(NATIONAL_BASELINE.healthcare * costIndex);
  const misc       = Math.round(NATIONAL_BASELINE.misc       * costIndex);

  const totalExpenses = rent1br + groceries + transport + utilities + healthcare + misc;
  const remaining = monthlyTakeHome - totalExpenses;
  const savingsRate = remaining / monthlyTakeHome;

  // Affordability verdict
  let verdict: "comfortable" | "tight" | "difficult";
  if (savingsRate >= 0.2)      verdict = "comfortable";
  else if (savingsRate >= 0.05) verdict = "tight";
  else                          verdict = "difficult";

  return {
    monthlyTakeHome: Math.round(monthlyTakeHome),
    expenses: {
      rent:       rent1br,
      groceries,
      transport,
      utilities,
      healthcare,
      misc,
      total:      totalExpenses,
    },
    remaining:   Math.round(remaining),
    savingsRate: Math.round(savingsRate * 100),
    verdict,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { salary, city } = body;

    if (!salary || !city) {
      return NextResponse.json(
        { error: "salary and city are required" },
        { status: 400 }
      );
    }

    if (typeof salary !== "number" || salary <= 0) {
      return NextResponse.json(
        { error: "salary must be a positive number" },
        { status: 400 }
      );
    }

    const cityData = findCityData(city);
    const cityLabel = cityData?.label ?? city;
    const rent1br   = cityData?.rent1br   ?? NATIONAL_BASELINE.rent1br;
    const costIndex = cityData?.costIndex ?? 1.0;
    const isEstimated = !cityData; // true if we fell back to national avg

    const budget = calculateMonthlyBudget(salary, costIndex, rent1br);

    // Call Gemini for narrative commentary
    const aiCommentary = await generateAffordabilityEstimate({
      salary,
      city: cityLabel,
      budget,
      isEstimated,
    });

    return NextResponse.json({
      city: cityLabel,
      isEstimated,
      annualSalary: salary,
      budget,
      aiCommentary,
    });
  } catch (error) {
    console.error("POST /api/affordability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
