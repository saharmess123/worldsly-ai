"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type CredibilityTrendPoint = {
  id: string;
  sourceName: string;
  score: number;
  confidence: number;
  startedAt: string;
};

type CredibilityTrendChartProps = {
  points: CredibilityTrendPoint[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CredibilityTrendChart({
  points,
}: CredibilityTrendChartProps) {
  const chartData = points.map((point) => ({
    ...point,
    label: formatDate(point.startedAt),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-3xl border border-dashed border-slate-300 text-center dark:border-white/10">
        <div>
          <p className="font-black">
            No credibility history yet
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Successful AI source scans will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 20,
            left: -10,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            opacity={0.2}
          />

          <XAxis
            dataKey="label"
            tick={{
              fontSize: 12,
            }}
            minTickGap={24}
          />

          <YAxis
            domain={[0, 100]}
            tick={{
              fontSize: 12,
            }}
            tickFormatter={(value) =>
              `${value}%`
            }
          />

          <Tooltip
            formatter={(
              value,
              name,
            ) => [
              `${Number(value)}%`,
              name === "score"
                ? "Credibility"
                : "Confidence",
            ]}
            labelFormatter={(
              _label,
              payload,
            ) => {
              const point =
                payload?.[0]?.payload as
                  | (CredibilityTrendPoint & {
                      label: string;
                    })
                  | undefined;

              return point
                ? `${point.sourceName} · ${formatDate(
                    point.startedAt,
                  )}`
                : "";
            }}
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              fontWeight: 700,
            }}
          />

          <Line
            type="monotone"
            dataKey="score"
            name="Credibility"
            stroke="#06b6d4"
            strokeWidth={3}
            dot={{
              r: 4,
            }}
            activeDot={{
              r: 6,
            }}
          />

          <Line
            type="monotone"
            dataKey="confidence"
            name="Confidence"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{
              r: 3,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
