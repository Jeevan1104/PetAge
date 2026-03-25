import Link from "next/link";
import { format } from "date-fns";
import type { VetVisit } from "@/lib/types";
import { parseTimestampString } from "@/components/vaccines/vaccine-utils"; // Reuse the timestamp utility

interface VisitCardProps {
  visit: VetVisit;
  petId: string;
}

export default function VisitCard({ visit, petId }: VisitCardProps) {
  const parsedDate = parseTimestampString(visit.visitDate);
  const formattedDate = parsedDate ? format(parsedDate, "MMM d, yyyy") : "Unknown Date";

  const getSubtext = () => {
    const parts = [];
    if (visit.clinicName) parts.push(visit.clinicName);
    if (visit.vetName) parts.push(visit.vetName);
    if (parts.length > 0) return parts.join(" · ");
    return "No clinic specified";
  };

  return (
    <Link 
      href={`/dashboard/visits/${visit.visitId}/edit?petId=${petId}`}
      className="group relative flex items-center justify-between min-h-[64px] p-4 bg-card border border-border rounded-md mb-3 transition-colors hover:bg-surface overflow-hidden"
    >
      <div className="flex flex-col gap-1 z-10 w-full pr-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-[16px] font-semibold text-text-primary leading-tight truncate">
            {visit.reason}
          </h3>
          {visit.cost !== undefined && visit.cost > 0 && (
            <span className="text-[14px] font-medium text-text-secondary whitespace-nowrap">
              ${visit.cost}
            </span>
          )}
        </div>
        <p className="text-caption text-text-secondary leading-tight truncate">
          {formattedDate} · {getSubtext()}
        </p>
      </div>

      {/* Hover state Edit hint */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-blue-tint flex items-center justify-end pr-4 opacity-0 transition-opacity group-hover:opacity-100 z-0 rounded-r-[12px]">
        <span className="text-[13px] font-medium text-clinical-blue">Edit</span>
      </div>
    </Link>
  );
}
