/**
 * This file defines the database schema for the salary estimation platform.
 * 
 * The tables defined here already exist in Supabase (created via schema.sql +
 * seeded with seed_supabase.py), so do NOT run `drizzle-kit push` — that would
 * try to recreate them. This file is purely so Drizzle can type your queries.
 */

import { pgTable, serial, text, integer, numeric } from "drizzle-orm/pg-core";

/**
 * job_categories table
 * Maps user-facing job labels to BLS SOC codes.
 * e.g. "Software Engineer" -> ["15-1252"]
 */
export const jobCategoriesTable = pgTable("job_categories", {
  id: serial("id").primaryKey(),
  label: text("label").notNull().unique(),  // e.g. "Software Engineer"
  socCodes: text("soc_codes").array().notNull(),  // e.g. ["15-1252"]
});

/**
 * wage_data table
 * One row per (area, soc_code) combination.
 * Sourced from BLS OEWS 2024 data.
 */
export const wageDataTable = pgTable("wage_data", {
  id: serial("id").primaryKey(),
  areaCode: text("area_code"),
  areaName: text("area_name").notNull(),   // e.g. "San Francisco-Oakland-Hayward, CA"
  areaType: text("area_type"),             // "1"=national, "2"=state, "3"=metro
  source: text("source"),                  // "metro" | "state" | "national"
  socCode: text("soc_code").notNull(),     // e.g. "15-1252"
  occTitle: text("occ_title"),             // e.g. "Software Developers"
  totalEmployment: integer("total_employment"),

  // Annual wages (dollars)
  annualMean: numeric("annual_mean"),
  annualP10: numeric("annual_p10"),
  annualP25: numeric("annual_p25"),
  annualMedian: numeric("annual_median"),
  annualP75: numeric("annual_p75"),
  annualP90: numeric("annual_p90"),

  // Hourly wages (dollars)
  hourlyMean: numeric("hourly_mean"),
  hourlyP10: numeric("hourly_p10"),
  hourlyP25: numeric("hourly_p25"),
  hourlyMedian: numeric("hourly_median"),
  hourlyP75: numeric("hourly_p75"),
  hourlyP90: numeric("hourly_p90"),
});

// Convenience types for use in API route handlers
export type JobCategory = typeof jobCategoriesTable.$inferSelect;
export type WageData = typeof wageDataTable.$inferSelect;
