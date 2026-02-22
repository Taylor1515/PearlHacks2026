"use client";

import { useState } from "react";
import { SalaryDistributionChart } from "@/components/SalaryDistributionChart";

// Mock response matching the real API shape
const MOCK_RESPONSE = {
  location: {
    searched: "San Francisco",
    matched: "San Francisco-Oakland-Fremont, CA",
    isFallback: false,
  },
  jobTitle: "Senior Frontend Engineer",
  jobLabel: "Software Engineer",
  company: "Google",
  seniorityLevel: "senior",
  yearsOfExperience: 6,
  blsWages: {
    annual: {
      p10: 128140,
      p25: 160060,
      median: 174910,
      p75: 213420,
      p90: null,
      mean: 187840,
    },
    hourly: {
      p10: 61.61,
      p25: 76.95,
      median: 84.09,
      p75: 102.61,
      p90: null,
      mean: 90.31,
    },
    seniorityAdjusted: {
      label: "Senior Level",
      targetAnnual: 213420,
      rangeAnnual: { low: 174910, high: null },
      targetHourly: 102.61,
      rangeHourly: { low: 84.09, high: null },
    },
  },
  totalEmployment: 76900,
  dataSource: "BLS OEWS 2024 (metro)",
  aiEstimate: {
    recommendedSalary: {
      point: 215000,
      rangeLow: 205000,
      rangeHigh: 230000,
    },
    rationale:
      "Based on the BLS data for the San Francisco metro area, the 75th percentile for software engineers is $213,420. As a Senior Frontend Engineer at Google, you should view this as your baseline, not your ceiling. With 6 years of experience and a competing offer in hand, you are in a strong negotiating position.",
    negotiationTips: [
      "Anchor your negotiation on the BLS 75th percentile of $213,420 as your market floor.",
      "Use your competing offer as leverage — frame it as a strong alternative, not a threat.",
      "Ask about the full compensation package including RSUs and sign-on bonus.",
    ],
    confidenceLevel: "high" as const,
    confidenceReason:
      "Local BLS data available for San Francisco metro area with strong sample size.",
  },
};

export default function ChartTestPage() {
  const [useMockData, setUseMockData] = useState(true);
  const [formData, setFormData] = useState({
    location: "San Francisco",
    jobLabel: "Software Engineer",
    jobTitle: "Senior Frontend Engineer",
    company: "Google",
    seniorityLevel: "senior",
    yearsOfExperience: 6,
    extraContext: "Competing offer from a Series B startup for $185k.",
  });
  const [response, setResponse] = useState<typeof MOCK_RESPONSE | null>(
    MOCK_RESPONSE
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Chart Test Page</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Testing the salary distribution chart component
          </p>
        </div>

        {/* Toggle mock vs real */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setUseMockData(true);
              setResponse(MOCK_RESPONSE);
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              useMockData
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            Use mock data
          </button>
          <button
            onClick={() => {
              setUseMockData(false);
              setResponse(null);
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              !useMockData
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            Use real API
          </button>
        </div>

        {/* Real API form */}
        {!useMockData && (
          <form onSubmit={handleSubmit} className="space-y-3 border rounded-lg p-4">
            <h2 className="font-semibold text-sm">API Request</h2>
            {[
              { key: "location", label: "Location" },
              { key: "jobLabel", label: "Job Category (must match /api/jobs)" },
              { key: "jobTitle", label: "Job Title" },
              { key: "company", label: "Company" },
              { key: "extraContext", label: "Extra Context (optional)" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground">{label}</label>
                <input
                  className="w-full mt-1 px-3 py-1.5 text-sm border rounded-md bg-background"
                  value={formData[key as keyof typeof formData] as string}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Seniority</label>
                <select
                  className="w-full mt-1 px-3 py-1.5 text-sm border rounded-md bg-background"
                  value={formData.seniorityLevel}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, seniorityLevel: e.target.value }))
                  }
                >
                  <option value="entry">Entry</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Years of Experience</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-1.5 text-sm border rounded-md bg-background"
                  value={formData.yearsOfExperience}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      yearsOfExperience: parseInt(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Fetching estimate... (this takes ~5 seconds)" : "Get Estimate"}
            </button>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </form>
        )}

        {/* Chart display */}
        {response && (
          <div className="border rounded-xl p-6 space-y-6">
            <SalaryDistributionChart
              blsWages={response.blsWages}
              aiEstimate={response.aiEstimate}
              jobLabel={response.jobLabel}
              matchedLocation={response.location.matched}
            />

            {/* AI Recommendation */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold">
                  ${response.aiEstimate.recommendedSalary.point.toLocaleString()}
                </span>
                <span className="text-muted-foreground text-sm">
                  recommended / year
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Range: ${response.aiEstimate.recommendedSalary.rangeLow.toLocaleString()} –{" "}
                ${response.aiEstimate.recommendedSalary.rangeHigh.toLocaleString()}
              </p>
              <p className="text-sm leading-relaxed">{response.aiEstimate.rationale}</p>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Negotiation Tips</p>
                <ul className="space-y-1.5">
                  {response.aiEstimate.negotiationTips.map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
