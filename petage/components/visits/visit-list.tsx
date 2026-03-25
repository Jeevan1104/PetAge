import type { VetVisit } from "@/lib/types";
import VisitCard from "./visit-card";

function StethoscopeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
      <circle cx="20" cy="10" r="2"/>
    </svg>
  );
}

interface VisitListProps {
  visits: VetVisit[];
  petId: string;
}

export default function VisitList({ visits, petId }: VisitListProps) {
  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-blue-tint text-clinical-blue flex items-center justify-center">
          <StethoscopeIcon className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h2 className="text-[18px] font-semibold text-text-primary mb-2">No visits recorded</h2>
        <p className="text-[14px] text-text-secondary max-w-[280px]">
          Keep track of veterinary appointments, checkups, and procedures.
        </p>
      </div>
    );
  }

  // Sort: newest first
  const sortedVisits = [...visits].sort((a, b) => {
    const aTs = a.visitDate?.toMillis?.() ?? 0;
    const bTs = b.visitDate?.toMillis?.() ?? 0;
    return bTs - aTs;
  });

  return (
    <div className="flex flex-col">
      {sortedVisits.map((visit) => (
        <VisitCard key={visit.visitId} visit={visit} petId={petId} />
      ))}
    </div>
  );
}
