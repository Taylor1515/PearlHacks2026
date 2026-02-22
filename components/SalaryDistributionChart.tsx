"use client";

import {
  Area,
  AreaChart,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WageDistribution {
  annual: {
    p10: number | null;
    p25: number | null;
    median: number | null;
    p75: number | null;
    p90: number | null;
    mean: number | null;
  };
  seniorityAdjusted: {
    label: string;
    targetAnnual: number | null;
    rangeAnnual: { low: number | null; high: number | null };
  };
}

interface RecommendedSalary {
  point: number;
  rangeLow: number;
  rangeHigh: number;
}

interface SalaryChartProps {
  blsWages: WageDistribution;
  aiEstimate: {
    recommendedSalary: RecommendedSalary;
    confidenceLevel: "high" | "medium" | "low";
  };
  jobLabel: string;
  matchedLocation: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts BLS percentile points into a smooth bell-curve-like dataset.
 * We assign approximate "density" values to each percentile to simulate
 * the shape of a normal distribution centered around the median.
 */
function buildChartData(annual: WageDistribution["annual"]) {
  const points = [
    { percentile: "P10", salary: annual.p10, density: 0.15, label: "10th" },
    { percentile: "P25", salary: annual.p25, density: 0.55, label: "25th" },
    { percentile: "P50", salary: annual.median, density: 1.0, label: "Median" },
    { percentile: "P75", salary: annual.p75, density: 0.55, label: "75th" },
    { percentile: "P90", salary: annual.p90, density: 0.15, label: "90th" },
  ];

  // Filter out null salary points
  return points.filter((p) => p.salary !== null) as {
    percentile: string;
    salary: number;
    density: number;
    label: string;
  }[];
}

function formatSalary(value: number) {
  return `$${(value / 1000).toFixed(0)}k`;
}

function formatFullSalary(value: number) {
  return `$${value.toLocaleString()}`;
}

const confidenceColors = {
  high: "hsl(142, 71%, 45%)",
  medium: "hsl(38, 92%, 50%)",
  low: "hsl(0, 84%, 60%)",
};

const confidenceLabels = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { label: string; salary: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-foreground">{data.label} percentile</p>
      <p className="text-muted-foreground">{formatFullSalary(data.salary)}/year</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SalaryDistributionChart({
  blsWages,
  aiEstimate,
  jobLabel,
  matchedLocation,
}: SalaryChartProps) {
  const chartData = buildChartData(blsWages.annual);
  const { recommendedSalary, confidenceLevel } = aiEstimate;
  const { seniorityAdjusted } = blsWages;

  if (chartData.length < 3) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Insufficient data to display chart for this location.
      </div>
    );
  }

  const confidenceColor = confidenceColors[confidenceLevel];

  // Find the x-axis position of the recommended salary
  // by interpolating between percentile points
  const salaries = chartData.map((d) => d.salary);
  const minSalary = Math.min(...salaries);
  const maxSalary = Math.max(...salaries);

  // We use the salary value directly as x-axis — Recharts will place it correctly
  const recommendedPoint = recommendedSalary.point;

  const chartConfig = {
    density: {
      label: "Market Distribution",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-base text-foreground">
            Salary Distribution
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {jobLabel} · {matchedLocation}
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          style={{
            backgroundColor: `${confidenceColor}18`,
            color: confidenceColor,
            border: `1px solid ${confidenceColor}40`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: confidenceColor }}
          />
          {confidenceLabels[confidenceLevel]}
        </div>
      </div>

      {/* Chart */}
      <ChartContainer config={chartConfig} className="h-[220px] w-full">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="salaryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--chart-1))"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--chart-1))"
                stopOpacity={0.02}
              />
            </linearGradient>

            {/* Gradient for the recommended range highlight */}
            <linearGradient id="recommendedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={confidenceColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={confidenceColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
          />

          <XAxis
            dataKey="salary"
            tickFormatter={formatSalary}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis hide />

          <Tooltip content={<CustomTooltip />} />

          {/* Main distribution area */}
          <Area
            type="monotone"
            dataKey="density"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            fill="url(#salaryGradient)"
            dot={false}
            activeDot={{
              r: 4,
              fill: "hsl(var(--chart-1))",
              stroke: "hsl(var(--background))",
              strokeWidth: 2,
            }}
          />

          {/* Recommended salary line */}
          <ReferenceLine
            x={recommendedPoint}
            stroke={confidenceColor}
            strokeWidth={2.5}
            strokeDasharray="0"
            label={{
              value: formatSalary(recommendedPoint),
              position: "top",
              fontSize: 11,
              fontWeight: 600,
              fill: confidenceColor,
              offset: 8,
            }}
          />

          {/* Seniority range low marker */}
          {seniorityAdjusted.rangeAnnual.low && (
            <ReferenceLine
              x={seniorityAdjusted.rangeAnnual.low}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
          )}

          {/* Seniority range high marker */}
          {seniorityAdjusted.rangeAnnual.high && (
            <ReferenceLine
              x={seniorityAdjusted.rangeAnnual.high}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
          )}
        </AreaChart>
      </ChartContainer>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div
            className="h-0.5 w-4 rounded-full"
            style={{ backgroundColor: "hsl(var(--chart-1))" }}
          />
          <span>Market distribution</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="h-4 w-0.5 rounded-full"
            style={{ backgroundColor: confidenceColor }}
          />
          <span>Recommended: {formatFullSalary(recommendedPoint)}/yr</span>
        </div>
        {(seniorityAdjusted.rangeAnnual.low || seniorityAdjusted.rangeAnnual.high) && (
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 border-t border-dashed border-muted-foreground/60" />
            <span>{seniorityAdjusted.label} range</span>
          </div>
        )}
      </div>

      {/* Percentile callouts */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {[
          { label: "25th percentile", value: blsWages.annual.p25, note: "entry floor" },
          { label: "Median", value: blsWages.annual.median, note: "market midpoint" },
          { label: "75th percentile", value: blsWages.annual.p75, note: "senior target" },
        ].map(({ label, value, note }) => (
          <div
            key={label}
            className="rounded-lg border bg-muted/30 px-3 py-2 text-center"
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {value ? formatFullSalary(value) : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">{note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
