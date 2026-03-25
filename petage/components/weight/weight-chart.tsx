"use client";

import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import type { WeightLog } from "@/lib/types";
import { kgToLbs } from "@/lib/schemas/weight";
import { parseTimestampString } from "@/components/vaccines/vaccine-utils";

interface WeightChartProps {
  logs: WeightLog[];
}

export default function WeightChart({ logs }: WeightChartProps) {
  const [unitPref, setUnitPref] = useState<"lbs" | "kg">("lbs");

  // Process data for Recharts — must run before any early return (rules of hooks)
  const chartData = useMemo(() => {
    if (logs.length === 0) return [];

    const sorted = [...logs].sort((a, b) => {
      const aTs = a.logDate?.toMillis?.() ?? 0;
      const bTs = b.logDate?.toMillis?.() ?? 0;
      return aTs - bTs;
    });

    return sorted.map((log) => {
      const dateObj = parseTimestampString(log.logDate);
      const displayWeight = unitPref === "lbs" ? kgToLbs(log.weight) : log.weight;

      return {
        date: dateObj ? format(dateObj, "MMM d") : "",
        fullDate: dateObj ? format(dateObj, "MMM d, yyyy") : "",
        timestamp: dateObj ? dateObj.getTime() : 0,
        weight: parseFloat(displayWeight.toFixed(1)),
        rawWeight: log.weight,
        logId: log.logId,
      };
    });
  }, [logs, unitPref]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card border border-border rounded-[16px]">
        <div className="w-20 h-20 mb-4 rounded-full bg-blue-tint text-clinical-blue flex items-center justify-center">
          <svg className="w-10 h-10 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </div>
        <h2 className="text-[16px] font-semibold text-text-primary mb-1">No weight logs</h2>
        <p className="text-[13px] text-text-secondary">
          Add your pet&apos;s first weight entry to trace their health curve.
        </p>
      </div>
    );
  }

  // Calculate domain min/max to give the chart some padding
  const weights = chartData.map(d => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const padding = (maxWeight - minWeight) * 0.2 || 2; // if all same, add 2 bounds

  return (
    <div className="flex flex-col gap-4">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-text-primary">Weight History</h2>
        <div className="flex bg-border rounded-lg p-0.5">
          <button
            onClick={() => setUnitPref("lbs")}
            className={`px-3 py-1 text-[13px] font-semibold rounded-md transition-colors ${unitPref === "lbs" ? "bg-white text-navy shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
          >
            lbs
          </button>
          <button
            onClick={() => setUnitPref("kg")}
            className={`px-3 py-1 text-[13px] font-semibold rounded-md transition-colors ${unitPref === "kg" ? "bg-white text-navy shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
          >
            kg
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full min-w-0 relative h-[280px] bg-card border border-border rounded-[16px] pt-6 pb-2 pr-6 pl-0 text-sm">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
            <XAxis 
              dataKey="logId" 
              type="category"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#8896AA', fontSize: 12 }}
              tickFormatter={(val) => {
                const node = chartData.find(d => d.logId === val);
                return node ? node.date : "";
              }}
              dy={10}
            />
            <YAxis 
              domain={[Math.max(0, minWeight - padding), maxWeight + padding]}
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#8896AA', fontSize: 12 }}
              tickFormatter={(val) => val.toFixed(0)}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-navy px-3 py-2 rounded-lg shadow-lg">
                      <p className="text-[12px] text-white/80 mb-0.5">{payload[0].payload.fullDate}</p>
                      <p className="text-[14px] font-semibold text-white">
                        {payload[0].value} {unitPref}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ stroke: '#DDE4EF', strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Line 
              type="natural" 
              dataKey="weight" 
              stroke="#3B82C4" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#3B82C4', strokeWidth: 2, stroke: '#FFFFFF' }}
              activeDot={{ r: 6, fill: '#1C5EA8', strokeWidth: 2, stroke: '#FFFFFF' }}
              animationDuration={600}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Logs List underneath */}
      <div className="flex flex-col gap-3 mt-4">
        {[...chartData].reverse().map((entry) => (
          <div key={entry.logId} className="flex items-center justify-between p-4 bg-card border border-border rounded-[12px]">
            <span className="text-[15px] font-medium text-text-primary">{entry.fullDate}</span>
            <span className="text-[15px] font-semibold text-navy">{entry.weight} {unitPref}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
