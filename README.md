# WageWise
> Data-backed salary insights and cost-of-living analysis for tech professionals.

Built for **Pearl Hacks 2026** by [Sarah Glenn](https://github.com/skglenn07) and [Taylor Morris](https://github.com/Taylor1515)

[**Live Demo**](https://wagewiseapp.vercel.app/)

---

## Overview
WageWise helps tech professionals make informed career decisions by combining real Bureau of Labor Statistics wage data with AI-powered personalization. Enter your job details to get a recommended salary range, negotiation tips, and an analysis of whether that salary is actually livable in your target city.

---

## Features

### Salary Estimate Tool
- Input your job title, seniority, years of experience, company type, and location
- Get a recommended salary point and negotiation range backed by BLS OEWS 2024 data
- See wage percentile distributions (P10–P90) for your occupation and metro area
- Receive AI-generated rationale and negotiation tips tailored to your situation
- Supports competing offers and specialized skills as additional context

### City Affordability Tool
- Enter a gross salary and a US city to see if the pay is livable
- Calculates estimated monthly take-home and expenses (rent, groceries, transport, utilities, healthcare)
- Returns an affordability verdict: comfortable, tight, or difficult
- Interactive pie chart showing your projected budget breakdown
- AI-generated commentary on your financial situation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, Shadcn/UI, Lucide React |
| Charts | Recharts & Shadcn|
| Database | PostgreSQL via Supabase, Drizzle ORM |
| AI | Google Gemini 3 Flash |
| Wage Data | Bureau of Labor Statistics OEWS 2024 |
| Geocoding | Nominatim (OpenStreetMap) |

---

## Project Structure

```
├── app/
│   ├── page.tsx               # Home page
│   ├── salary/page.tsx        # Salary estimate form & results
│   ├── affordability/page.tsx # Affordability calculator
│   └── api/
│       ├── estimate/          # POST /api/estimate
│       ├── affordability/     # POST /api/affordability
│       └── jobs/              # GET /api/jobs
├── server/
│   ├── db/                    # Drizzle ORM schema & connection
│   ├── gemini.ts              # Salary AI generation
│   └── gemini-affordability.ts# Affordability AI generation
├── components/
│   ├── SalaryDistributionChart.tsx
│   └── ui/                    # Shadcn/UI components
└── data/                      # Static data files
```

---

## How It Works

1. **BLS Data** — Wage percentile data from the BLS Occupational Employment and Wage Statistics (OEWS) 2024 survey is seeded into a PostgreSQL database, indexed by SOC occupation code and geographic area.

2. **Salary Estimation** — When a user submits the salary form, the API looks up BLS wage data for their occupation and location (falling back from metro → state → national). This data is passed to Gemini along with user context to generate a personalized salary recommendation, negotiation range, and tips.

3. **Affordability Analysis** — The affordability API applies a cost-of-living index for 54 US cities to estimate monthly expenses, calculates take-home pay at an effective ~28% tax rate, and uses Gemini to generate a plain-language affordability summary.

---

## Team
Built at Pearl Hacks 2026 by [Sarah Glenn](https://github.com/skglenn07) and [Taylor Morris](https://github.com/Taylor1515).
