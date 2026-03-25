"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import VisitForm from "@/components/visits/visit-form";
import { useVisitStore } from "@/lib/store/visitStore";
import { Suspense } from "react";

function EditVisitContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const petId = searchParams.get("petId") || "";
  const visitId = params.visitId as string;

  const { visits, fetchVisits, deleteVisit } = useVisitStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(true);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (petId) {
      // Fetch latest visits to ensure we have the data
      fetchVisits(petId).finally(() => setInitLoading(false));
    } else {
      setInitLoading(false);
    }
  }, [petId, fetchVisits]);

  const visit = visits.find((v) => v.visitId === visitId);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    const { error } = await deleteVisit(petId, visitId);
    if (!error) {
      router.push(`/dashboard/visits?petId=${petId}`);
    } else {
      setDeleteError(error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in relative">
      <header className="px-6 pt-6 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => router.push(`/dashboard/visits?petId=${petId}`)} 
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-border hover:bg-surface text-text-primary transition-colors"
              aria-label="Go back"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-h2 text-navy">Edit Visit</h1>
          </div>
          {visit && !showDeleteConfirm && (
            <button 
              type="button"
              className="text-status-red text-[14px] font-medium hover:underline px-2 disabled:opacity-50"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              Delete
            </button>
          )}
        </div>
      </header>
      
      {showDeleteConfirm && (
        <div className="px-6 mb-6">
          <div className="bg-pale-red border border-[#FECDD3] rounded-[10px] p-4 text-left">
            <p className="text-[14px] text-status-red font-medium mb-3">
              Delete visit? This action cannot be undone.
            </p>
            {deleteError && (
              <p className="text-[13px] text-status-red mb-3">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-status-red text-white text-[13px] font-semibold rounded-[8px] disabled:opacity-50 hover:brightness-110 transition-all"
              >
                {isDeleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                className="px-4 py-2 border border-border bg-white text-[13px] font-medium rounded-[8px] hover:bg-surface transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="px-6">
        {initLoading ? (
          <div className="flex justify-center py-20">
             <div className="w-8 h-8 rounded-full border-2 border-clinical-blue border-t-transparent animate-spin" />
          </div>
        ) : visit ? (
          <VisitForm petId={petId} initialData={visit} />
        ) : (
          <div className="text-center py-10">
            <p className="text-text-secondary">Visit not found.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function EditVisitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <EditVisitContent />
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
