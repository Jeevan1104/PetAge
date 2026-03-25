"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import VisitForm from "@/components/visits/visit-form";

function NewVisitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("petId") || "";

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in">
      <header className="px-6 pt-6 pb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push(`/dashboard/visits?petId=${petId}`)} 
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-border hover:bg-surface text-text-primary transition-colors"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-h2 text-navy">Add Visit</h1>
        </div>
      </header>
      <main className="px-6">
        <VisitForm petId={petId} />
      </main>
    </div>
  );
}

export default function NewVisitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <NewVisitContent />
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
