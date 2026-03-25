"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import MedicationList from "@/components/medications/medication-list";
import FAB from "@/components/ui/FAB";
import { useMedicationStore } from "@/lib/store/medicationStore";

function MedicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("petId") || "";

  const { medications, archivedMedications, loading, error, fetchMedications } = useMedicationStore();

  useEffect(() => {
    if (petId) {
      fetchMedications(petId);
    }
  }, [petId, fetchMedications]);

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in relative">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => router.push(petId ? `/dashboard/pets/${petId}` : "/dashboard")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-border hover:bg-surface text-text-primary transition-colors"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-h1 text-navy">Medications</h1>
        </div>
      </header>

      {/* List */}
      <main className="px-6">
        {error ? (
          <div className="p-4 bg-pale-red text-status-red rounded-md text-sm">
            {error}
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-clinical-blue border-t-transparent animate-spin" />
          </div>
        ) : (
          <MedicationList medications={[...medications, ...archivedMedications]} petId={petId} />
        )}
      </main>

      {!!petId && (
        <FAB 
          onClick={() => router.push(`/dashboard/medications/new?petId=${petId}`)} 
        />
      )}
    </div>
  );
}

export default function MedicationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <MedicationsContent />
    </Suspense>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2.5" 
      strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <path d="m15 18-6-6 6-6"/>
    </svg>
  );
}
