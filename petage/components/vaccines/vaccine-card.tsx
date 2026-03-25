import Link from "next/link";
import StatusPill from "@/components/ui/StatusPill";
import { format } from "date-fns";
import type { Vaccine } from "@/lib/types";
import { parseTimestampString } from "./vaccine-utils";

interface VaccineCardProps {
  vaccine: Vaccine;
  petId: string;
  petName?: string;
}

export default function VaccineCard({ vaccine, petId, petName }: VaccineCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "overdue":
        return "red";
      case "due_soon":
        return "amber";
      case "current":
        return "green";
      default:
        return "blue";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "overdue":
        return "Overdue";
      case "due_soon":
        return "Due Soon";
      case "current":
        return "Current";
      default:
        return "No Expiry";
    }
  };

  const parsedDate = parseTimestampString(vaccine.dateAdministered);
  const formattedDate = parsedDate ? format(parsedDate, "MMM d, yyyy") : "Unknown Date";

  return (
    <Link 
      href={`/dashboard/vaccines/${vaccine.vaccineId}/edit?petId=${petId}`}
      className="group relative flex items-center justify-between min-h-[64px] p-4 bg-card border border-border rounded-md mb-3 transition-colors hover:bg-surface overflow-hidden"
    >
      <div className="flex flex-col gap-1 z-10 w-full pr-4">
        <h3 className="text-[16px] font-semibold text-text-primary leading-tight truncate">
          {vaccine.name}
          {petName && <span className="text-text-tertiary font-normal"> · {petName}</span>}
        </h3>
        <p className="text-caption text-text-secondary leading-tight truncate">
          Given: {formattedDate}
        </p>
      </div>

      <div className="flex items-center gap-3 z-10 shrink-0">
        <StatusPill variant={getStatusVariant(vaccine.status)}>
          {getStatusLabel(vaccine.status)}
        </StatusPill>
        <ChevronRightIcon className="w-5 h-5 text-text-tertiary transition-colors group-hover:text-clinical-blue" />
      </div>
    </Link>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
