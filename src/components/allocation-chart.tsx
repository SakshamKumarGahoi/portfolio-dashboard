"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface AllocationItem {
  name: string;
  value: number;
}

interface AllocationChartProps {
  data: AllocationItem[];
}

const COLORS = [
  "#8de4f2",
  "#63d471",
  "#4fb3c8",
  "#d5f5fa",
  "#6f8f96",
  "#9fb8be",
];

export default function AllocationChart({
  data,
}: AllocationChartProps) {
  const totalAllocation = data.reduce(
    (sum, item) => sum + item.value,
    0
  );

  return (
    <div className="h-full rounded-[28px] bg-[#0c2024] p-6 text-white md:p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8da4aa]">
            Portfolio Allocation
          </p>

          <h2 className="mt-2 font-display text-2xl md:text-3xl">
            Where your money sits
          </h2>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#17343a] text-[#8de4f2]">
          →
        </div>
      </div>

      <div className="relative mt-2 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={96}
              paddingAngle={3}
              stroke="none"
              animationDuration={700}
              animationBegin={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                background: "#10282d",
                border: "1px solid #24434a",
                borderRadius: "12px",
                color: "#ffffff",
                fontSize: "12px",
              }}
              itemStyle={{
                color: "#ffffff",
              }}
              formatter={(value) => [
                `${Number(value).toFixed(2)}%`,
                "Allocation",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="mt-1 text-center">
            <p className="font-display text-3xl font-semibold">
              {data.length}
            </p>

            <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-[#718a90]">
              sectors
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {data.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center gap-2 rounded-xl bg-[#112a2f] px-3 py-2.5"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  COLORS[index % COLORS.length],
              }}
            />

            <span className="min-w-0 truncate text-xs text-[#9fb2b7]">
              {item.name}
            </span>

            <span className="ml-auto text-xs font-semibold text-white">
              {item.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#1d393e] pt-4 text-xs">
        <span className="text-[#718a90]">
          Allocation coverage
        </span>

        <span className="font-semibold text-[#8de4f2]">
          {totalAllocation.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}