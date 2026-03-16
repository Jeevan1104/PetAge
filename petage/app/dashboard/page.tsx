"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { differenceInYears, differenceInMonths } from "date-fns";
import { useAuthStore } from "@/lib/store/authStore";
import { usePetStore } from "@/lib/store/petStore";
import { PetCard, AddPetCard } from "@/components/ui/PetCard";
import type { Pet } from "@/lib/types";

function getGreeting(displayName?: string): string {
  const hour = new Date().getHours();
  const time =
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const firstName = displayName?.split(" ")[0];
  return `Good ${time}${firstName ? `, ${firstName}` : ""}`;
}

function formatPetAge(dateOfBirth: Pet["dateOfBirth"]): string | undefined {
  if (!dateOfBirth) return undefined;

  let date: Date;
  if (
    typeof dateOfBirth === "object" &&
    "toDate" in (dateOfBirth as unknown as Record<string, unknown>)
  ) {
    date = (dateOfBirth as unknown as { toDate: () => Date }).toDate();
  } else {
    return undefined;
  }

  const years = differenceInYears(new Date(), date);
  if (years >= 1) return `${years}y`;
  const months = differenceInMonths(new Date(), date);
  if (months > 0) return `${months}mo`;
  return "< 1mo";
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { pets, loading, subscribeToUserPets } = usePetStore();

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToUserPets(user.uid);
    return unsubscribe;
  }, [user?.uid, subscribeToUserPets]);

  return (
    <div className="px-6 md:px-10 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 text-navy">
          {getGreeting(user?.displayName ?? undefined)}
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          {pets.length > 0
            ? `${pets.length} pet${pets.length > 1 ? "s" : ""} in your care`
            : "Start building your pet's health passport"}
        </p>
      </div>

      {/* Pet Cards row */}
      {loading ? (
        <div className="flex gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="w-[220px] h-[100px] bg-border rounded-lg animate-pulse shrink-0"
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 md:-mx-10 md:px-10">
          {pets.map((pet) => (
            <PetCard
              key={pet.petId}
              name={pet.name}
              breed={pet.breed}
              age={formatPetAge(pet.dateOfBirth)}
              species={pet.species}
              photoURL={pet.photoURL ?? undefined}
              isActive={false}
              onClick={() => router.push(`/dashboard/pets/${pet.petId}`)}
            />
          ))}
          <AddPetCard onClick={() => router.push("/dashboard/pets/new")} />
        </div>
      )}

      {/* Empty state */}
      {!loading && pets.length === 0 && (
        <div className="mt-8 card p-10 flex flex-col items-center text-center">
          <span className="text-5xl mb-4">🐾</span>
          <h2 className="text-h2 text-navy mb-2">Add your first pet</h2>
          <p className="text-body-sm text-text-secondary max-w-[280px] mb-6">
            Track vaccines, vet visits, medications and weight — all in one
            place.
          </p>
          <button
            onClick={() => router.push("/dashboard/pets/new")}
            className="px-6 py-3 bg-clinical-blue text-white rounded-[10px] text-[14px] font-semibold hover:brightness-110 active:scale-[0.97] transition-all"
          >
            Add pet
          </button>
        </div>
      )}

      {/* Quick-access tiles — only when pets exist */}
      {!loading && pets.length > 0 && (
        <div className="mt-8">
          <p className="section-label mb-4">Quick access</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "💉", label: "Vaccines", href: "/dashboard/vaccines" },
              { icon: "📋", label: "Vet Visits", href: "/dashboard/visits" },
              { icon: "💊", label: "Medications", href: "/dashboard/meds" },
              { icon: "⚖️", label: "Weight", href: "/dashboard/weight" },
            ].map((tile) => (
              <a
                key={tile.label}
                href={tile.href}
                className="card p-4 flex flex-col items-center gap-2 hover:border-mid-blue active:scale-[0.97] transition-all duration-100 cursor-pointer"
              >
                <span className="text-[28px]">{tile.icon}</span>
                <span className="text-[13px] font-medium text-text-secondary">
                  {tile.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
