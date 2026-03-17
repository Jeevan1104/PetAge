"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { useVaccineStore } from "@/lib/store/vaccineStore";
import type { Vaccine } from "@/lib/types";
import StatusPill from "@/components/ui/StatusPill";
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

function vaccineStatusPill(status: Vaccine["status"]) {
  if (status === "overdue") return <StatusPill variant="red" dot>Overdue</StatusPill>;
  if (status === "due_soon") return <StatusPill variant="amber" dot>Due soon</StatusPill>;
  return <StatusPill variant="green" dot>Current</StatusPill>;
}

export default function VaccinesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("petId");

  const { vaccines, loading, subscribeToVaccines, createVaccine, deleteVaccine } = useVaccineStore();

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [dateAdministered, setDateAdministered] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!petId) { router.push("/dashboard"); return; }
    const unsub = subscribeToVaccines(petId);
    return unsub;
  }, [petId, subscribeToVaccines, router]);

  function resetForm() {
    setName(""); setDateAdministered(""); setExpiryDate("");
    setReminderEnabled(true); setNotes(""); setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !dateAdministered) {
      setFormError("Vaccine name and date administered are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const result = await createVaccine({
      petId: petId!,
      name,
      dateAdministered,
      expiryDate: expiryDate || undefined,
      reminderEnabled,
      notes: notes || undefined,
    });
    setSaving(false);
    if (result.error) { setFormError(result.error); return; }
    resetForm();
    setShowForm(false);
  }

  async function handleDelete(vaccineId: string) {
    setDeletingId(vaccineId);
    await deleteVaccine(vaccineId);
    setDeletingId(null);
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 md:px-10 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface transition-colors text-text-secondary text-xl"
          aria-label="Go back"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-h2 text-navy">Vaccines</h1>
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
            <h2 className="text-[15px] font-semibold text-text-primary mb-4">New Vaccine Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Vaccine name"
                placeholder="e.g. Rabies, DHPP, Bordetella"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Date administered"
                type="date"
                value={dateAdministered}
                onChange={(e) => setDateAdministered(e.target.value)}
              />
              <Input
                label="Expiry / next due date (optional)"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
              <Input
                label="Notes (optional)"
                placeholder="Batch number, clinic, reactions…"
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
                <Button type="submit" loading={saving} className="flex-1">Save vaccine</Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { resetForm(); setShowForm(false); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-clinical-blue border-t-transparent animate-spin" />
          </div>
        ) : vaccines.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-blue-tint rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">💉</div>
            <p className="text-[15px] font-medium text-text-primary mb-1">No vaccine records yet</p>
            <p className="text-body-sm text-text-secondary">Tap &ldquo;+ Add&rdquo; to log your first vaccine.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vaccines.map((v) => (
              <VaccineCard
                key={v.vaccineId}
                vaccine={v}
                formatTs={formatTs}
                onDelete={handleDelete}
                deleting={deletingId === v.vaccineId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VaccineCard({
  vaccine,
  formatTs,
  onDelete,
  deleting,
}: {
  vaccine: Vaccine;
  formatTs: (ts: unknown) => string;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="bg-card border border-border rounded-[16px] px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[15px] font-semibold text-text-primary">{vaccine.name}</p>
            {vaccineStatusPill(vaccine.status)}
          </div>
          <p className="text-body-sm text-text-secondary mt-1">
            Given: {formatTs(vaccine.dateAdministered)}
            {vaccine.expiryDate ? ` · Expires: ${formatTs(vaccine.expiryDate)}` : ""}
          </p>
          {vaccine.notes && (
            <p className="text-caption text-text-tertiary mt-1 truncate">{vaccine.notes}</p>
          )}
        </div>
        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            className="text-text-tertiary hover:text-status-red transition-colors text-[18px] shrink-0 mt-0.5"
            aria-label="Delete"
          >
            ×
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onDelete(vaccine.vaccineId)}
              disabled={deleting}
              className="text-[12px] font-semibold text-status-red hover:underline disabled:opacity-50"
            >
              {deleting ? "…" : "Delete"}
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="text-[12px] text-text-secondary hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
