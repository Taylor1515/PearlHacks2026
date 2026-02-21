import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { jobCategoriesTable } from "@/server/db/schema";

/**
 * GET /api/jobs
 * Returns all job categories for the frontend dropdown.
 *
 * Response:
 * [
 *   { id: 1, label: "Software Engineer", socCodes: ["15-1252"] },
 *   ...
 * ]
 */
export async function GET() {
  try {
    const jobs = await db
      .select()
      .from(jobCategoriesTable)
      .orderBy(jobCategoriesTable.label);

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job categories" },
      { status: 500 }
    );
  }
}
