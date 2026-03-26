import { useEffect, useMemo } from "react";
import type { Vaccine } from "@/lib/types";
import VaccineCard from "./vaccine-card";
import { usePetStore } from "@/lib/store/petStore";

interface VaccineListProps {
  vaccines: Vaccine[];
  petId: string;
}

export default function VaccineList({ vaccines, petId }: VaccineListProps) {
  const { pets, fetchPets } = usePetStore();

  useEffect(() => {
    if (!petId && pets.length === 0) {
      fetchPets();
    }
  }, [petId, pets.length, fetchPets]);

  // Sort: Overdue → Due Soon → Current
  const { overdueVaccines, otherVaccines } = useMemo(() => {
    const order: Record<string, number> = { overdue: 1, due_soon: 2, current: 3 };
    const sorted = [...vaccines].sort((a, b) => (order[a.status] || 4) - (order[b.status] || 4));
    return {
      overdueVaccines: sorted.filter(v => v.status === "overdue"),
      otherVaccines: sorted.filter(v => v.status !== "overdue"),
    };
  }, [vaccines]);

  if (vaccines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-blue-tint text-clinical-blue flex items-center justify-center">
          <SyringeIcon className="w-12 h-12" />
        </div>
        <h2 className="text-[18px] font-semibold text-text-primary mb-2">No vaccines recorded</h2>
        <p className="text-[14px] text-text-secondary max-w-[280px]">
          Keep track of important vaccinations to ensure your pet stays healthy and up to date.
        </p>
      </div>
    );
  }

  const getPetName = (vPetId: string) => {
    if (petId) return undefined; // single pet view doesn't need pet name
    const pet = pets.find((p) => p.petId === vPetId);
    return pet ? pet.name : undefined;
  };

  return (
    <div className="flex flex-col gap-6">
      {overdueVaccines.length > 0 && (
        <section>
          <div className="sticky top-0 z-20 bg-pale-red text-status-red text-[12px] font-semibold px-4 py-2 rounded-md mb-3 flex items-center gap-2">
            <AlertCircleIcon className="w-4 h-4" />
            Action Required
          </div>
          <div className="flex flex-col">
            {overdueVaccines.map((vaccine) => (
              <VaccineCard key={vaccine.vaccineId} vaccine={vaccine} petId={vaccine.petId} petName={getPetName(vaccine.petId)} />
            ))}
          </div>
        </section>
      )}

      {otherVaccines.length > 0 && (
        <section>
          <div className="flex flex-col">
            {otherVaccines.map((vaccine) => (
              <VaccineCard key={vaccine.vaccineId} vaccine={vaccine} petId={vaccine.petId} petName={getPetName(vaccine.petId)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SyringeIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <path d="m18 2 4 4"/>
      <path d="m17 7 3-3"/>
      <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-1.6-1.6c-1-1-1-2.5 0-3.4L15 4"/>
      <path d="m9 11 4 4"/>
      <path d="m5 19-3 3"/>
      <path d="m14 4 6 6"/>
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" x2="12" y1="8" y2="12"/>
      <line x1="12" x2="12.01" y1="16" y2="16"/>
    </svg>
  );
}
