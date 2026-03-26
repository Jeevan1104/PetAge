import { useState, useMemo } from "react";
import type { Medication } from "@/lib/types";
import MedicationCard from "./medication-card";
import { PillIcon, ChevronDownIcon, ChevronUpIcon } from "./med-icons";

interface MedicationListProps {
  medications: Medication[];
  petId: string;
}

export default function MedicationList({ medications, petId }: MedicationListProps) {
  const [showArchived, setShowArchived] = useState(false);

  const { activeMeds, archivedMeds } = useMemo(() => {
    const active = medications.filter(m => !m.isArchived);
    const archived = medications.filter(m => m.isArchived);
    active.sort((a, b) => (a.nextDueDate?.toMillis?.() ?? 0) - (b.nextDueDate?.toMillis?.() ?? 0));
    archived.sort((a, b) => a.name.localeCompare(b.name));
    return { activeMeds: active, archivedMeds: archived };
  }, [medications]);

  if (medications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-blue-tint text-clinical-blue flex items-center justify-center">
          <PillIcon className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h2 className="text-[18px] font-semibold text-text-primary mb-2">No medications</h2>
        <p className="text-[14px] text-text-secondary max-w-[280px]">
          Track active prescriptions, preventatives, and set schedules to get reminders.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {activeMeds.length > 0 && (
        <div className="flex flex-col">
          {activeMeds.map((med) => (
            <MedicationCard key={med.medicationId} medication={med} petId={petId} />
          ))}
        </div>
      )}

      {archivedMeds.length > 0 && (
        <div className="flex flex-col border-t border-border pt-4 mt-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center justify-between py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <span className="text-[14px] font-medium">
              Archived Medications ({archivedMeds.length})
            </span>
            {showArchived ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
          
          {showArchived && (
            <div className="flex flex-col mt-3 animate-fade-in">
              {archivedMeds.map((med) => (
                <MedicationCard key={med.medicationId} medication={med} petId={petId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
