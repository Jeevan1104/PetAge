"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import PDFPreview from "@/components/reports/pdf-preview";
import Button from "@/components/ui/Button";

function ReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("petId") || "";

  // Mock checking user tier logic
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // Look for a local storage mock or just set randomly / permanently to false to show the upsell
    setIsPremium(false);
  }, []);

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in relative">
      <header className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => router.push(petId ? `/dashboard/pets/${petId}` : "/dashboard")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-border hover:bg-surface text-text-primary transition-colors"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-h1 text-navy">Health Records</h1>
        </div>
        <p className="text-[14px] text-text-secondary pl-12">
          Export your pet&apos;s complete medical history, vaccines, and weight logs.
        </p>
      </header>

      <main className="px-6 pt-6">
        <PDFPreview isPremium={isPremium} petName="Bella" />

        <div className="mt-12 bg-white rounded-[16px] border border-border p-5 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-tint text-clinical-blue flex items-center justify-center mx-auto mb-3">
             <DownloadIcon className="w-6 h-6" />
          </div>
          <h3 className="text-[16px] font-semibold text-text-primary mb-2">Share with your Vet</h3>
          <p className="text-[14px] text-text-secondary mb-4 px-2">
            The generated PDF contains a comprehensive overview of all active medications, upcoming vaccines, and growth charts. Perfect for printing or emailing ahead of a visit.
          </p>
          <Button 
            className="w-full"
            variant="secondary"
            onClick={() => {
              if (isPremium) {
                alert("Generating PDF...");
              } else {
                router.push("/upgrade");
              }
            }}
          >
            {isPremium ? "Download Sample" : "Learn More"}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <ReportsContent />
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

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}
