"""
seed_supabase.py
----------------
Reads the BLS OEWS "All data" Excel file and seeds it into Supabase.

Prerequisites:
  pip install supabase pandas openpyxl python-dotenv

Usage:
  python seed_supabase.py

Expected file layout:
  PearlHacks2026/
    data/
      all_data_M_2024.xlsx   ← downloaded from BLS
    seed_supabase.py
    schema.sql
    .env

.env contents:
  SUPABASE_URL=https://your-project-id.supabase.co
  SUPABASE_SERVICE_KEY=your-service-role-key
"""

import os
import sys
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

DATA_FILE = Path("data/all_data_M_2024.xlsx")

JOB_CATEGORIES = {
    "Software Engineer":            ["15-1252"],
    "Data Scientist / ML Engineer": ["15-2051"],
    "Data Analyst":                 ["15-1211"],
    "Product Manager":              ["11-3021"],
    "UX / UI Designer":             ["15-1255"],
    "DevOps / Cloud Engineer":      ["15-1244"],
    "Cybersecurity Analyst":        ["15-1212"],
    "Database Administrator":       ["15-1242"],
    "IT Project Manager":           ["15-1299"],
    "Web Developer":                ["15-1254"],
    "Software QA / Test Engineer":  ["15-1253"],
    "Computer Programmer":          ["15-1251"],
    "Network / Cloud Architect":    ["15-1241"],
    "Operations Research Analyst":  ["15-2031"],
    "Hardware Engineer":            ["17-2061"],
    "Robotics Engineer":            ["17-2199"],
}

TARGET_SOC_CODES = {
    code for codes in JOB_CATEGORIES.values() for code in codes
}

# BLS column name -> our database column name
COL_MAP = {
    "AREA":       "area_code",
    "AREA_TITLE": "area_name",
    "AREA_TYPE":  "area_type",
    "OCC_CODE":   "soc_code",
    "OCC_TITLE":  "occ_title",
    "TOT_EMP":    "total_employment",
    "H_MEAN":     "hourly_mean",
    "A_MEAN":     "annual_mean",
    "H_PCT10":    "hourly_p10",
    "H_PCT25":    "hourly_p25",
    "H_MEDIAN":   "hourly_median",
    "H_PCT75":    "hourly_p75",
    "H_PCT90":    "hourly_p90",
    "A_PCT10":    "annual_p10",
    "A_PCT25":    "annual_p25",
    "A_MEDIAN":   "annual_median",
    "A_PCT75":    "annual_p75",
    "A_PCT90":    "annual_p90",
}

NUMERIC_COLS = [
    "total_employment",
    "hourly_mean", "hourly_p10", "hourly_p25", "hourly_median", "hourly_p75", "hourly_p90",
    "annual_mean", "annual_p10", "annual_p25", "annual_median", "annual_p75", "annual_p90",
]

BATCH_SIZE = 500


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("✗ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def df_to_records(df: pd.DataFrame) -> list[dict]:
    """Convert DataFrame rows to dicts, replacing NaN with None."""
    records = []
    for row in df.to_dict(orient="records"):
        clean = {}
        for k, v in row.items():
            if not isinstance(v, str) and pd.isna(v):
                clean[k] = None
            elif k == "total_employment" and v is not None:
                clean[k] = int(float(v))
            else:
                clean[k] = v
        records.append(clean)
    return records


def upsert_in_batches(supabase: Client, table: str, records: list[dict], on_conflict: str):
    total = len(records)
    for i in range(0, total, BATCH_SIZE):
        batch = records[i: i + BATCH_SIZE]
        supabase.table(table).upsert(batch, on_conflict=on_conflict).execute()
        print(f"  Upserted rows {i + 1}–{min(i + BATCH_SIZE, total)} / {total}")


# ---------------------------------------------------------------------------
# Steps
# ---------------------------------------------------------------------------

def seed_job_categories(supabase: Client):
    print("\n[1/3] Seeding job_categories...")
    records = [{"label": label, "soc_codes": codes} for label, codes in JOB_CATEGORIES.items()]
    supabase.table("job_categories").upsert(records, on_conflict="label").execute()
    print(f"  ✓ {len(records)} job categories upserted")


def seed_wage_data(supabase: Client):
    print("\n[2/3] Reading and processing BLS data...")

    if not DATA_FILE.exists():
        print(f"  ✗ File not found: {DATA_FILE}")
        print("  Make sure all_data_M_2024.xlsx is in the data/ folder.")
        sys.exit(1)

    print(f"  Reading {DATA_FILE} (this may take ~30 seconds)...")
    df = pd.read_excel(DATA_FILE, dtype=str)
    print(f"  ✓ {len(df):,} raw rows loaded")

    # Normalize column names (BLS sometimes uses mixed case)
    df.columns = [c.strip().upper() for c in df.columns]

    # Keep only columns we need
    available = {k: v for k, v in COL_MAP.items() if k in df.columns}
    missing = set(COL_MAP) - set(available)
    if missing:
        print(f"  ⚠ Columns not found in file (will be skipped): {missing}")
    df = df[list(available.keys())].rename(columns=available)

    # Filter to our target job SOC codes only
    df = df[df["soc_code"].isin(TARGET_SOC_CODES)].copy()
    print(f"  ✓ {len(df):,} rows match target job categories")

    # Convert wage columns to numbers (BLS uses "*" for suppressed data)
    for col in NUMERIC_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            df[col] = df[col].where(df[col].notna(), other=None)

    # Cast total_employment to int (Postgres expects integer, not float)
    if "total_employment" in df.columns:
        df["total_employment"] = df["total_employment"].apply(
            lambda x: int(x) if x is not None and not pd.isna(x) else None
        )

    # Label each row's source based on BLS area_type code
    # 1 = national, 2 = state, 3 = metro, 4 = nonmetro
    area_type_to_source = {"1": "national", "2": "state", "3": "territory", "4": "metro", "6": "nonmetro"}
    df["source"] = df["area_type"].map(area_type_to_source).fillna("other")

    # Deduplicate: for the same (area, soc_code) keep metro > state > national
    priority = {"metro": 0, "state": 1, "national": 2, "other": 3}
    df["_priority"] = df["source"].map(priority)
    df = (
        df
        .sort_values("_priority")
        .drop_duplicates(subset=["area_name", "soc_code"], keep="first")
        .drop(columns=["_priority"])
    )
    print(f"  ✓ {len(df):,} rows after deduplication")

    print("\n[3/3] Upserting into Supabase...")
    records = df_to_records(df)
    upsert_in_batches(supabase, "wage_data", records, on_conflict="area_name,soc_code")


def verify(supabase: Client):
    print("\n--- Verification ---")
    wage_count = supabase.table("wage_data").select("id", count="exact").execute()
    cat_count  = supabase.table("job_categories").select("id", count="exact").execute()
    print(f"  wage_data rows:      {wage_count.count:,}")
    print(f"  job_categories rows: {cat_count.count}")

    print("\n  Testing fuzzy_area_lookup('San Francisco', '15-1252')...")
    result = supabase.rpc(
        "fuzzy_area_lookup",
        {"search_area": "San Francisco", "p_soc_code": "15-1252"}
    ).execute()

    if result.data:
        row = result.data[0]
        print(f"  Matched area:          {row['area_name']}")
        print(f"  Annual P25/Median/P75: ${row['annual_p25']:,.0f} / ${row['annual_median']:,.0f} / ${row['annual_p75']:,.0f}")
        print(f"  Is fallback:           {row['is_fallback']}")
        print("  ✓ Fuzzy lookup working correctly")
    else:
        print("  ✗ No results — make sure you ran schema.sql in Supabase first")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 55)
    print("  Salary Platform — Supabase Seed Script")
    print("=" * 55)

    supabase = get_supabase_client()
    print(f"✓ Connected to Supabase: {SUPABASE_URL}")

    seed_job_categories(supabase)
    seed_wage_data(supabase)
    verify(supabase)

    print("\n🎉 Done! Your Supabase database is ready.")
    print("   Next step: build the FastAPI /estimate endpoint.")


if __name__ == "__main__":
    main()
