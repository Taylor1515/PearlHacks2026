import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { wageDataTable, jobCategoriesTable } from "@/server/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";

/**
 * POST /api/estimate
 * Returns BLS wage data for a given location and job category.
 *
 * Request body:
 * {
 *   location: string;       // e.g. "San Francisco" or "Seattle, WA"
 *   jobLabel: string;       // e.g. "Software Engineer"
 *   seniorityLevel?: string // e.g. "entry" | "mid" | "senior"
 * }
 *
 * Response:
 * {
 *   location: { searched: string, matched: string, isFallback: boolean },
 *   jobTitle: string,
 *   seniorityLevel: string,
 *   wages: {
 *     annual: { p10, p25, median, p75, p90, mean },
 *     hourly: { p10, p25, median, p75, p90, mean }
 *   },
 *   dataSource: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, jobLabel, seniorityLevel = "mid" } = body;

    // --- Validate inputs ---
    if (!location || !jobLabel) {
      return NextResponse.json(
        { error: "location and jobLabel are required" },
        { status: 400 }
      );
    }

    // --- Look up SOC codes for the requested job label ---
    const [jobCategory] = await db
      .select()
      .from(jobCategoriesTable)
      .where(eq(jobCategoriesTable.label, jobLabel))
      .limit(1);

    if (!jobCategory) {
      return NextResponse.json(
        { error: `Unknown job category: ${jobLabel}` },
        { status: 400 }
      );
    }

    const socCode = jobCategory.socCodes[0];

    // --- Try to find wage data, with metro → state → national fallback ---
    const wageData = await findWageData(location, socCode);

    if (!wageData) {
      return NextResponse.json(
        { error: "No wage data found for this location and job category" },
        { status: 404 }
      );
    }

    // --- Parse numeric fields (Drizzle returns numeric columns as strings) ---
    const wages = parseWages(wageData);

    // --- Apply seniority adjustment ---
    const adjusted = applySeniorityAdjustment(wages, seniorityLevel);

    return NextResponse.json({
      location: {
        searched: location,
        matched: wageData.areaName,
        isFallback: wageData.areaType !== "4", // not a metro match
      },
      jobTitle: wageData.occTitle,
      jobLabel: jobLabel,
      seniorityLevel,
      wages: adjusted,
      totalEmployment: wageData.totalEmployment,
      dataSource: `BLS OEWS 2024 (${wageData.source})`,
    });
  } catch (error) {
    console.error("POST /api/estimate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Tries to find wage data for a location using progressively broader matches:
 * 1. Metro area (area_type = '3') — fuzzy name match
 * 2. State (area_type = '2') — fuzzy name match
 * 3. National (area_type = '1') — fallback
 */
async function findWageData(location: string, socCode: string) {
  // 1. Try metro match (area_type = '3')
  const metroResults = await db
    .select()
    .from(wageDataTable)
    .where(
      and(
        eq(wageDataTable.socCode, socCode),
        eq(wageDataTable.areaType, "4"),
        or(
          ilike(wageDataTable.areaName, `%${location}%`),
          ilike(wageDataTable.areaName, `${location}%`)
        )
      )
    )
    .limit(1);

  if (metroResults.length > 0) return metroResults[0];

  // 2. Try state match (area_type = '2')
  const stateResults = await db
    .select()
    .from(wageDataTable)
    .where(
      and(
        eq(wageDataTable.socCode, socCode),
        eq(wageDataTable.areaType, "2"),
        ilike(wageDataTable.areaName, `%${location}%`)
      )
    )
    .limit(1);

  if (stateResults.length > 0) return stateResults[0];

  // 3. National fallback (area_type = '1')
  const nationalResults = await db
    .select()
    .from(wageDataTable)
    .where(
      and(
        eq(wageDataTable.socCode, socCode),
        eq(wageDataTable.areaType, "1")
      )
    )
    .limit(1);

  return nationalResults[0] ?? null;
}

/**
 * Parses Drizzle's string numeric values into numbers.
 */
function parseWages(row: typeof wageDataTable.$inferSelect) {
  const p = (v: string | null) => (v ? parseFloat(v) : null);
  return {
    annual: {
      p10: p(row.annualP10),
      p25: p(row.annualP25),
      median: p(row.annualMedian),
      p75: p(row.annualP75),
      p90: p(row.annualP90),
      mean: p(row.annualMean),
    },
    hourly: {
      p10: p(row.hourlyP10),
      p25: p(row.hourlyP25),
      median: p(row.hourlyMedian),
      p75: p(row.hourlyP75),
      p90: p(row.hourlyP90),
      mean: p(row.hourlyMean),
    },
  };
}

/**
 * Adjusts the salary range based on seniority level.
 * 
 * Rather than fabricating different percentiles, we shift which BLS
 * percentiles we highlight as the "expected range" for each level:
 *   entry  → P25 as target, P10–P50 as range
 *   mid    → P50 as target, P25–P75 as range (default)
 *   senior → P75 as target, P50–P90 as range
 *
 * The raw BLS data is always included so the frontend can show full context.
 */
function applySeniorityAdjustment(
  wages: ReturnType<typeof parseWages>,
  seniority: string
) {
  const ranges = {
    entry: {
      label: "Entry Level",
      targetAnnual: wages.annual.p25,
      rangeAnnual: { low: wages.annual.p10, high: wages.annual.median },
      targetHourly: wages.hourly.p25,
      rangeHourly: { low: wages.hourly.p10, high: wages.hourly.median },
    },
    mid: {
      label: "Mid Level",
      targetAnnual: wages.annual.median,
      rangeAnnual: { low: wages.annual.p25, high: wages.annual.p75 },
      targetHourly: wages.hourly.median,
      rangeHourly: { low: wages.hourly.p25, high: wages.hourly.p75 },
    },
    senior: {
      label: "Senior Level",
      targetAnnual: wages.annual.p75,
      rangeAnnual: { low: wages.annual.median, high: wages.annual.p90 },
      targetHourly: wages.hourly.p75,
      rangeHourly: { low: wages.hourly.median, high: wages.hourly.p90 },
    },
  };

  const adjustment =
    ranges[seniority as keyof typeof ranges] ?? ranges.mid;

  return {
    ...wages,
    seniorityAdjusted: adjustment,
  };
}
