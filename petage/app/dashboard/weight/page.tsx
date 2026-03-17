"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useWeightStore } from "@/lib/store/weightStore";
import type { WeightLog } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type FirestoreTimestamp = { toDate: () => Date };

function formatTs(ts: unknown): string {
  if (!ts) return "—";
  try {
    return format((ts as FirestoreTimestamp).toDate(), "MMM d, yyyy");
  } catch {
    return "—";
  }
}

function getDisplayWeight(log: WeightLog): string {
  if (log.unit === "lbs") {
    const lbs = log.weight / 0.453592;
    return `${lbs.toFixed(1)} lbs`;
  }
  return `${log.weight.toFixed(2)} kg`;
}

export default function WeightPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("petId");

  const { logs, loading, subscribeToWeightLogs, createLog, deleteLog } = useWeightStore();

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [logDate, setLogDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!petId) { router.push("/dashboard"); return; }
    const unsub = subscribeToWeightLogs(petId);
    return unsub;
  }, [petId, subscribeToWeightLogs, router]);

  function resetForm() {
    setWeight(""); setUnit("kg");
    setLogDate(format(new Date(), "yyyy-MM-dd"));
    setNotes(""); setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!weight || isNaN(w) || w <= 0) {
      setFormError("Please enter a valid weight.");
      return;
    }
    if (!logDate) {
      setFormError("Date is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const result = await createLog({
      petId: petId!,
      weight: w,
      unit,
      logDate,
      notes: notes || undefined,
    });
    setSaving(false);
    if (result.error) { setFormError(result.error); return; }
    resetForm();
    setShowForm(false);
  }

  async function handleDelete(logId: string) {
    setDeletingId(logId);
    await deleteLog(logId);
    setDeletingId(null);
  }

  // Build chart data from logs (oldest → newest)
  const chartData = [...logs]
    .reverse()
    .map((log) => {
      let date = "—";
      try { date = format((log.logDate as unknown as FirestoreTimestamp).toDate(), "MMM d"); } catch {}
      const displayWeight = log.unit === "lbs" ? log.weight / 0.453592 : log.weight;
      return { date, weight: parseFloat(displayWeight.toFixed(2)) };
    });

  const latestLog = logs[0];
  const prevLog = logs[1];
  const weightDiff = latestLog && prevLog
    ? (latestLog.weight - prevLog.weight)
    : null;

  return (
    <div className="min-h-screen bg-surface">
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 md:px-10 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface transition-colors text-text-secondary text-xl"
          aria-label="Go back"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-h2 text-navy">Weight</h1>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Add
          </Button>
        )}
      </div>

      <div className="px-6 md:px-10 py-6 max-w-[640px]">
        {/* Add form */}
        {showForm && (
          <div className="bg-card border border-border rounded-[16px] p-5 mb-6 animate-fade-in">
            <h2 className="text-[15px] font-semibold text-text-primary mb-4">Log Weight</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    label="Weight"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={unit === "kg" ? "e.g. 12.5" : "e.g. 27.6"}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-text-primary mb-2">Unit</label>
                  <div className="flex border border-border rounded-[10px] overflow-hidden">
                    {(["kg", "lbs"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={`px-4 py-[10px] text-[13px] font-medium transition-colors ${
                          unit === u ? "bg-clinical-blue text-white" : "bg-card text-text-secondary hover:bg-surface"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Input
                label="Date"
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
              />
              <Input
                label="Notes (optional)"
                placeholder="After fasting, post-surgery…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {formError && (
                <p className="text-[13px] text-status-red bg-pale-red rounded-[8px] px-3 py-2">{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="submit" loading={saving} className="flex-1">Save</Button>
                <Button type="button" variant="ghost" onClick={() => { resetForm(); setShowForm(false); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-clinical-blue border-t-transparent animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#F0F9FF] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚖️</div>
            <p className="text-[15px] font-medium text-text-primary mb-1">No weight logs yet</p>
            <p className="text-body-sm text-text-secondary">Tap &ldquo;+ Add&rdquo; to start tracking weight.</p>
          </div>
        ) : (
          <>
            {/* Latest + trend */}
            <div className="bg-card border border-border rounded-[16px] px-5 py-4 mb-4">
              <p className="text-caption text-text-tertiary mb-1">Latest reading</p>
              <div className="flex items-baseline gap-3">
                <p className="text-[28px] font-bold text-navy">{getDisplayWeight(latestLog)}</p>
                {weightDiff !== null && (
                  <span className={`text-[13px] font-medium ${weightDiff > 0 ? "text-status-amber" : weightDiff < 0 ? "text-status-green" : "text-text-tertiary"}`}>
                    {weightDiff > 0 ? "▲" : weightDiff < 0 ? "▼" : "—"}{" "}
                    {Math.abs(weightDiff * (latestLog.unit === "lbs" ? 2.20462 : 1)).toFixed(2)} {latestLog.unit}
                  </span>
                )}
              </div>
              <p className="text-caption text-text-tertiary mt-0.5">{formatTs(latestLog.logDate)}</p>
            </div>

            {/* Chart (only when 2+ entries) */}
            {chartData.length >= 2 && (
              <div className="bg-card border border-border rounded-[16px] px-4 pt-4 pb-2 mb-4">
                <p className="text-caption text-text-tertiary mb-3">Weight over time (kg)</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8FA3B4" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#8FA3B4" }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #E8EDF2", fontSize: 12 }}
                      formatter={(v: number) => [`${v} kg`, "Weight"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#2563EB"
                      strokeWidth={2}
                      dot={{ fill: "#2563EB", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Log list */}
            <div className="space-y-2">
              {logs.map((log) => (
                <WeightLogRow
                  key={log.logId}
                  log={log}
                  formatTs={formatTs}
                  getDisplayWeight={getDisplayWeight}
                  onDelete={handleDelete}
                  deleting={deletingId === log.logId}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WeightLogRow({
  log,
  formatTs,
  getDisplayWeight,
  onDelete,
  deleting,
}: {
  log: WeightLog;
  formatTs: (ts: unknown) => string;
  getDisplayWeight: (log: WeightLog) => string;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="bg-card border border-border rounded-[12px] px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <span className="text-[15px] font-semibold text-text-primary">{getDisplayWeight(log)}</span>
        <span className="text-body-sm text-text-secondary ml-3">{formatTs(log.logDate)}</span>
        {log.notes && <p className="text-caption text-text-tertiary truncate mt-0.5">{log.notes}</p>}
      </div>
      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="text-text-tertiary hover:text-status-red transition-colors text-[18px] shrink-0"
          aria-label="Delete"
        >
          ×
        </button>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onDelete(log.logId)}
            disabled={deleting}
            className="text-[12px] font-semibold text-status-red hover:underline disabled:opacity-50"
          >
            {deleting ? "…" : "Delete"}
          </button>
          <button onClick={() => setConfirm(false)} className="text-[12px] text-text-secondary hover:underline">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
