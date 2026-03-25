import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import type { Medication } from "@/lib/types";
import { parseTimestampString } from "@/components/vaccines/vaccine-utils";
import { useMedicationStore } from "@/lib/store/medicationStore";
import { useState } from "react";

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

interface MedicationCardProps {
  medication: Medication;
  petId: string;
}

export default function MedicationCard({ medication, petId }: MedicationCardProps) {
  const { markAsGiven } = useMedicationStore();
  const [isMarking, setIsMarking] = useState(false);

  const nextDate = parseTimestampString(medication.nextDueDate);
  
  // Calculate countdown
  let statusColor = "text-text-secondary";
  let statusBg = "bg-surface";
  let countdownText = "Unknown due date";
  
  if (nextDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(nextDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffDays = differenceInDays(dueDate, today);

    if (diffDays < 0) {
      statusColor = "text-status-red";
      statusBg = "bg-pale-red";
      countdownText = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`;
    } else if (diffDays === 0) {
      statusColor = "text-status-amber";
      statusBg = "bg-[#FEF3C7]";
      countdownText = "Due today";
    } else {
      statusColor = "text-status-green";
      statusBg = "bg-[#DCFCE7]";
      countdownText = `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
    }
  }

  const handleMarkGiven = async (e: React.MouseEvent) => {
    e.preventDefault(); // prevent triggering the Link
    e.stopPropagation();
    
    if (isMarking) return;
    setIsMarking(true);
    await markAsGiven(petId, medication.medicationId);
    setIsMarking(false);
  };

  return (
    <div className="relative group mb-3">
      <Link 
        href={`/dashboard/medications/${medication.medicationId}/edit?petId=${petId}`}
        className={`block p-4 bg-card border border-border rounded-[12px] transition-colors hover:bg-surface overflow-hidden ${medication.isArchived ? "opacity-60 grayscale" : ""}`}
      >
        <div className="flex flex-col gap-2 z-10 w-full pr-[80px]">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[16px] font-semibold text-text-primary leading-tight truncate flex items-center gap-2">
              {medication.name}
              {medication.isGeneric && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-border text-text-secondary uppercase tracking-wide">
                  Generic
                </span>
              )}
            </h3>
            <p className="text-caption text-text-secondary leading-tight truncate">
              {medication.dosageStrength ? `${medication.dosageStrength} · ` : ""}
              <span className="capitalize">{medication.frequency}</span>
            </p>
          </div>

          {!medication.isArchived && (
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-md text-[12px] font-semibold ${statusColor} ${statusBg}`}>
                {countdownText}
              </span>
              <span className="text-[12px] text-text-tertiary">
                ({nextDate ? format(nextDate, "MMM d") : ""})
              </span>
            </div>
          )}
        </div>
      </Link>

      {!medication.isArchived && (
        <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20">
          <button
            onClick={handleMarkGiven}
            disabled={isMarking}
            className={`w-[60px] h-[60px] rounded-full flex flex-col items-center justify-center gap-1 transition-all
              ${isMarking ? "opacity-50 scale-95" : "hover:bg-blue-tint hover:scale-105 active:scale-95 text-clinical-blue"}
            `}
            aria-label="Mark as Given"
          >
            <CheckCircleIcon className="w-7 h-7 stroke-[1.5]" />
            <span className="text-[10px] font-medium leading-none">Given</span>
          </button>
        </div>
      )}
    </div>
  );
}
