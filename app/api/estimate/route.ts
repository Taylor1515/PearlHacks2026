import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { wageDataTable, jobCategoriesTable } from "@/server/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";
import { generateSalaryEstimate } from "@/server/gemini";

/**
 * POST /api/estimate
 *
 * Request body:
 * {
 *   location: string;           // e.g. "San Francisco"
 *   jobLabel: string;           // e.g. "Software Engineer"
 *   jobTitle: string;           // e.g. "Senior Frontend Engineer"
 *   company: string;            // e.g. "Google"
 *   seniorityLevel: string;     // "entry" | "mid" | "senior"
 *   yearsOfExperience: number;  // e.g. 6
 *   extraContext?: string;      // competing offers, skills, etc.
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      location,
      jobLabel,
      jobTitle,
      company,
      seniorityLevel = "mid",
      yearsOfExperience,
      extraContext,
    } = body;

    // --- Validate required inputs ---
    if (!location || !jobLabel || !jobTitle || !company || yearsOfExperience === undefined) {
      return NextResponse.json(
        { error: "location, jobLabel, jobTitle, company, and yearsOfExperience are required" },
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

    // --- Find BLS wage data with metro → state → national fallback ---
    const searchLocation = location.split(",")[0].trim();
    const wageData = await findWageData(searchLocation, socCode);

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

    const isFallback = wageData.areaType === "1";

    // --- Call Gemini for AI-powered salary estimate and rationale ---
    const aiEstimate = await generateSalaryEstimate({
      // User inputs
      jobCategory: jobLabel,
      jobTitle,
      company,
      location,
      seniorityLevel,
      yearsOfExperience,
      extraContext,

      // BLS data
      matchedLocation: wageData.areaName ?? "",
      isFallback,
      wages: adjusted,
      totalEmployment: wageData.totalEmployment,
      dataSource: `BLS OEWS 2024 (${wageData.source})`,
    });

    // --- Return combined BLS + AI response ---
    return NextResponse.json({
      location: {
        searched: location,
        matched: wageData.areaName,
        isFallback,
      },
      jobTitle,
      jobLabel,
      company,
      seniorityLevel,
      yearsOfExperience,
      blsWages: adjusted,
      totalEmployment: wageData.totalEmployment,
      dataSource: `BLS OEWS 2024 (${wageData.source})`,
      aiEstimate,
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

async function findWageData(location: string, socCode: string) {
  // 1. Metro (area_type = '4')
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

  // 2. State (area_type = '2')
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