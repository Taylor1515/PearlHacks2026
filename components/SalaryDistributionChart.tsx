"use client";

import {
  Area,
  AreaChart,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  ChartContainer,
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

interface SalaryChartProps {
  blsWages: WageDistribution;
  aiEstimate: {
    recommendedSalary: {
      point: number;
      rangeLow: number;
      rangeHigh: number;
    };
    confidenceLevel: "high" | "medium" | "low";
  };
  jobLabel: string;
  matchedLocation: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/**
 * Builds chart data using index as x-axis (0-4) so ReferenceLine can work.
 * Each point also stores its salary for tooltip display.
 * We interpolate the recommended salary position as a fractional index.
 */
function buildChartData(annual: WageDistribution["annual"]) {
  const rawPoints = [
    { key: "P10", salary: annual.p10, density: 0.15, label: "10th percentile" },
    { key: "P25", salary: annual.p25, density: 0.55, label: "25th percentile" },
    { key: "P50", salary: annual.median, density: 1.0,  label: "Median" },
    { key: "P75", salary: annual.p75, density: 0.55, label: "75th percentile" },
    { key: "P90", salary: annual.p90, density: 0.15, label: "90th percentile" },
  ].filter((p) => p.salary !== null) as {
    key: string;
    salary: number;
    density: number;
    label: string;
  }[];

  // Add index so ReferenceLine can reference by integer position
  return rawPoints.map((p, i) => ({ ...p, index: i }));
}

/**
 * Given a salary value, returns its fractional index position in the chart
 * by linear interpolation between adjacent percentile points.
 * e.g. a salary halfway between P25 (index 1) and P50 (index 2) → 1.5
 */
function salaryToIndex(
  salary: number,
  data: ReturnType<typeof buildChartData>
): number {
  if (data.length === 0) return 0;
  if (salary <= data[0].salary) return 0;
  if (salary >= data[data.length - 1].salary) return data.length - 1;

  for (let i = 0; i < data.length - 1; i++) {
    const lo = data[i];
    const hi = data[i + 1];
    if (salary >= lo.salary && salary <= hi.salary) {
      const fraction = (salary - lo.salary) / (hi.salary - lo.salary);
      return lo.index + fraction;
    }
  }
  return data.length - 1;
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ReturnType<typeof buildChartData>[number] }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-foreground">{d.label}</p>
      <p className="text-muted-foreground">{formatFullSalary(d.salary)}/year</p>
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
  const confidenceColor = confidenceColors[confidenceLevel];

  if (chartData.length < 3) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Insufficient data to display chart for this location.
      </div>
    );
  }

  const recommendedIndex = salaryToIndex(recommendedSalary.point, chartData);

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
          margin={{ top: 20, right: 16, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="salaryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
          />

          {/* X axis: use index as numeric axis, format as salary */}
          <XAxis
            dataKey="index"
            type="number"
            domain={[0, chartData.length - 1]}
            ticks={chartData.map((d) => d.index)}
            tickFormatter={(i) => {
              const point = chartData[Math.round(i)];
              return point ? formatSalary(point.salary) : "";
            }}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis hide />

          <Tooltip content={<CustomTooltip />} />

          {/* Bell curve area */}
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

          {/* Recommended salary solid line */}
          <ReferenceLine
            x={recommendedIndex}
            stroke={confidenceColor}
            strokeWidth={2.5}
            label={{
              value: formatSalary(recommendedSalary.point),
              position: "top",
              fontSize: 11,
              fontWeight: 600,
              fill: confidenceColor,
              offset: 6,
            }}
          />
        </AreaChart>
      </ChartContainer>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {/* <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
          <span>Market distribution</span>
        </div> */}
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-0.5 rounded-full" style={{ backgroundColor: confidenceColor }} />
          <span>Recommended: {formatFullSalary(recommendedSalary.point)}/yr</span>
        </div>
      </div>

      {/* Percentile callouts */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {[
          { label: "25th percentile", value: blsWages.annual.p25, note: "entry floor" },
          { label: "Median", value: blsWages.annual.median, note: "market midpoint" },
          { label: "75th percentile", value: blsWages.annual.p75, note: "senior target" },
        ].map(({ label, value, note }) => (
          <div key={label} className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
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
