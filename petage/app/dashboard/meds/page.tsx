"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { useMedStore } from "@/lib/store/medStore";
import type { Medication, MedFrequency } from "@/lib/types";
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

const freqOptions: { value: MedFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
];

function freqLabel(freq: MedFrequency, customDays?: number | null): string {
  if (freq === "custom" && customDays) return `Every ${customDays} days`;
  return freqOptions.find((f) => f.value === freq)?.label ?? freq;
}

export default function MedsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("petId");

  const { meds, loading, subscribeToMeds, createMed, deleteMed } = useMedStore();

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [isGeneric, setIsGeneric] = useState(false);
  const [dosageStrength, setDosageStrength] = useState("");
  const [frequency, setFrequency] = useState<MedFrequency>("daily");
  const [customFreqDays, setCustomFreqDays] = useState("");
  const [startDate, setStartDate] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!petId) { router.push("/dashboard"); return; }
    const unsub = subscribeToMeds(petId);
    return unsub;
  }, [petId, subscribeToMeds, router]);

  function resetForm() {
    setName(""); setIsGeneric(false); setDosageStrength("");
    setFrequency("daily"); setCustomFreqDays(""); setStartDate("");
    setReminderEnabled(true); setNotes(""); setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !startDate) {
      setFormError("Medication name and start date are required.");
      return;
    }
    if (frequency === "custom" && !customFreqDays) {
      setFormError("Please enter custom frequency days.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const result = await createMed({
      petId: petId!,
      name,
      isGeneric,
      dosageStrength: dosageStrength || undefined,
      frequency,
      customFreqDays: frequency === "custom" ? Number(customFreqDays) : undefined,
      startDate,
      reminderEnabled,
      notes: notes || undefined,
    });
    setSaving(false);
    if (result.error) { setFormError(result.error); return; }
    resetForm();
    setShowForm(false);
  }

  async function handleDelete(medId: string) {
    setDeletingId(medId);
    await deleteMed(medId);
    setDeletingId(null);
  }

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
          <h1 className="text-h2 text-navy">Medications</h1>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Add
          </Button>
        )}
      </div>

      <div className="px-6 md:px-10 py-6 max-w-[640px]">
        {showForm && (
          <div className="bg-card border border-border rounded-[16px] p-5 mb-6 animate-fade-in">
            <h2 className="text-[15px] font-semibold text-text-primary mb-4">New Medication</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Medication name"
                placeholder="e.g. Bravecto, Heartgard"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGeneric}
                    onChange={(e) => setIsGeneric(e.target.checked)}
                    className="w-4 h-4 accent-clinical-blue"
                  />
                  <span className="text-[14px] text-text-primary">Generic medication</span>
                </label>
              </div>

              <Input
                label="Dosage / strength (optional)"
                placeholder="e.g. 500mg, 1 tablet"
                value={dosageStrength}
                onChange={(e) => setDosageStrength(e.target.value)}
              />

              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">Frequency</label>
                <div className="grid grid-cols-4 gap-2">
                  {freqOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFrequency(opt.value)}
                      className={`py-2 px-3 rounded-[10px] border text-[13px] font-medium transition-all ${
                        frequency === opt.value
                          ? "border-clinical-blue bg-blue-tint text-clinical-blue"
                          : "border-border bg-card text-text-secondary hover:border-border-strong"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {frequency === "custom" && (
                <Input
                  label="Every how many days?"
                  type="number"
                  min="1"
                  placeholder="e.g. 3"
                  value={customFreqDays}
                  onChange={(e) => setCustomFreqDays(e.target.value)}
                />
              )}

              <Input
                label="Start date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <Input
                label="Notes (optional)"
                placeholder="Instructions, side effects to watch…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`w-10 h-6 rounded-full transition-colors ${reminderEnabled ? "bg-clinical-blue" : "bg-border-strong"} relative`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${reminderEnabled ? "translate-x-5" : "translate-x-1"}`} />
                </div>
                <span className="text-[14px] text-text-primary">Enable reminder</span>
              </label>

              {formError && (
                <p className="text-[13px] text-status-red bg-pale-red rounded-[8px] px-3 py-2">{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="submit" loading={saving} className="flex-1">Save medication</Button>
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
        ) : meds.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-pale-amber rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">💊</div>
            <p className="text-[15px] font-medium text-text-primary mb-1">No medications yet</p>
            <p className="text-body-sm text-text-secondary">Tap "+ Add" to track a medication.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meds.map((m) => (
              <MedCard
                key={m.medicationId}
                med={m}
                formatTs={formatTs}
                freqLabel={freqLabel}
                onDelete={handleDelete}
                deleting={deletingId === m.medicationId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MedCard({
  med,
  formatTs,
  freqLabel,
  onDelete,
  deleting,
}: {
  med: Medication;
  formatTs: (ts: unknown) => string;
  freqLabel: (freq: MedFrequency, customDays?: number | null) => string;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="bg-card border border-border rounded-[16px] px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[15px] font-semibold text-text-primary">{med.name}</p>
            {med.isGeneric && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface text-text-tertiary border border-border">Generic</span>
            )}
          </div>
          <p className="text-body-sm text-text-secondary mt-1">
            {freqLabel(med.frequency, med.customFreqDays)}
            {med.dosageStrength ? ` · ${med.dosageStrength}` : ""}
          </p>
          <p className="text-caption text-text-tertiary mt-0.5">
            Started: {formatTs(med.startDate)} · Next due: {formatTs(med.nextDueDate)}
          </p>
          {med.notes && (
            <p className="text-caption text-text-tertiary mt-1 truncate">{med.notes}</p>
          )}
        </div>
        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            className="text-text-tertiary hover:text-status-red transition-colors text-[18px] shrink-0 mt-0.5"
            aria-label="Archive"
          >
            ×
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onDelete(med.medicationId)}
              disabled={deleting}
              className="text-[12px] font-semibold text-status-red hover:underline disabled:opacity-50"
            >
              {deleting ? "…" : "Archive"}
            </button>
            <button onClick={() => setConfirm(false)} className="text-[12px] text-text-secondary hover:underline">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
