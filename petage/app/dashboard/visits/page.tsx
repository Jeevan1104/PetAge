"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { useVisitStore } from "@/lib/store/visitStore";
import type { VetVisit } from "@/lib/types";
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

export default function VisitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("petId");

  const { visits, loading, subscribeToVisits, createVisit, deleteVisit } = useVisitStore();

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [visitDate, setVisitDate] = useState("");
  const [reason, setReason] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [vetName, setVetName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!petId) { router.push("/dashboard"); return; }
    const unsub = subscribeToVisits(petId);
    return unsub;
  }, [petId, subscribeToVisits, router]);

  function resetForm() {
    setVisitDate(""); setReason(""); setClinicName("");
    setVetName(""); setNotes(""); setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!visitDate || !reason) {
      setFormError("Visit date and reason are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const result = await createVisit({
      petId: petId!,
      visitDate,
      reason,
      clinicName: clinicName || undefined,
      vetName: vetName || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    if (result.error) { setFormError(result.error); return; }
    resetForm();
    setShowForm(false);
  }

  async function handleDelete(visitId: string) {
    setDeletingId(visitId);
    await deleteVisit(visitId);
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
          <h1 className="text-h2 text-navy">Vet Visits</h1>
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
            <h2 className="text-[15px] font-semibold text-text-primary mb-4">New Vet Visit</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Visit date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
              <Input
                label="Reason for visit"
                placeholder="e.g. Annual checkup, Ear infection"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Input
                label="Clinic name (optional)"
                placeholder="e.g. City Animal Hospital"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
              />
              <Input
                label="Vet name (optional)"
                placeholder="e.g. Dr. Smith"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
              />
              <Input
                label="Notes (optional)"
                placeholder="Diagnosis, treatment, follow-up…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {formError && (
                <p className="text-[13px] text-status-red bg-pale-red rounded-[8px] px-3 py-2">{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="submit" loading={saving} className="flex-1">Save visit</Button>
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
        ) : visits.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-pale-green rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📋</div>
            <p className="text-[15px] font-medium text-text-primary mb-1">No vet visits yet</p>
            <p className="text-body-sm text-text-secondary">Tap "+ Add" to log your first visit.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => (
              <VisitCard
                key={v.visitId}
                visit={v}
                formatTs={formatTs}
                onDelete={handleDelete}
                deleting={deletingId === v.visitId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VisitCard({
  visit,
  formatTs,
  onDelete,
  deleting,
}: {
  visit: VetVisit;
  formatTs: (ts: unknown) => string;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="bg-card border border-border rounded-[16px] px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-text-primary">{visit.reason}</p>
          <p className="text-body-sm text-text-secondary mt-1">
            {formatTs(visit.visitDate)}
            {visit.clinicName ? ` · ${visit.clinicName}` : ""}
            {visit.vetName ? ` · ${visit.vetName}` : ""}
          </p>
          {visit.notes && (
            <p className="text-caption text-text-tertiary mt-1 line-clamp-2">{visit.notes}</p>
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
              onClick={() => onDelete(visit.visitId)}
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
    </div>
  );
}
