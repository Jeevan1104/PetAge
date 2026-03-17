"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { usePetStore } from "@/lib/store/petStore";
import { PetCard, AddPetCard } from "@/components/ui/PetCard";
import { useRouter } from "next/navigation";

// Screen 4 — Home Dashboard
// Stitch ref: af9f3b2a

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { pets, subscribeToUserPets, setActivePet, activePetId } = usePetStore();

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToUserPets(user.uid);
      return () => unsubscribe();
    }
  }, [user?.uid, subscribeToUserPets]);

  const handlePetClick = (petId: string) => {
    setActivePet(petId);
    router.push(`/dashboard/pets/${petId}`);
  };

  const handleAddPet = () => {
    // Check limit on client for better UX (actual check is server-side)
    if (user?.tier === "free" && pets.length >= 2) {
      router.push("/dashboard/premium?reason=limit_reached");
      return;
    }
    router.push("/dashboard/pets/new");
  };

  return (
    <div className="px-6 md:px-10 py-8">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-h1 text-navy mb-1">
          Good morning, {user?.displayName || "Pet Owner"} 👋
        </h1>
        <p className="text-body-sm text-text-secondary">
          Your pets&apos; health records are up to date.
        </p>
      </header>

      {/* Pet Horizontal List */}
      <section className="mb-12">
        <div className="section-label mb-4">My Pets</div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {pets.map((pet) => (
            <PetCard
              key={pet.petId}
              name={pet.name}
              breed={pet.breed}
              species={pet.species}
              photoURL={pet.photoURL}
              isActive={activePetId === pet.petId}
              onClick={() => handlePetClick(pet.petId)}
              // alertCount and alertType would come from real calculations in Phase 4-6
              alertCount={0} 
            />
          ))}
          <AddPetCard onClick={handleAddPet} />
        </div>
      </section>

      {/* Quick Summary or Activity Feed */}
      <section className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="section-label mb-4">Upcoming Reminders</div>
          <div className="card p-8 flex flex-col items-center justify-center text-center min-h-[160px]">
             <span className="text-2xl mb-2">✨</span>
             <p className="text-body-sm text-text-tertiary">All caught up! No reminders for the next 7 days.</p>
          </div>
        </div>

        <div>
          <div className="section-label mb-4">Recent Activity</div>
           <div className="card overflow-hidden">
             {pets.length === 0 ? (
               <div className="p-8 text-center">
                 <p className="text-body-sm text-text-tertiary">No activity yet. Add a pet to get started.</p>
               </div>
             ) : (
               <div className="divide-y divide-border">
                 {/* This would be populated from a real activity collection later */}
                 <div className="px-4 py-3 text-[13px] text-text-secondary">
                    Welcome to PetAge! Start by adding your pet&apos;s records.
                 </div>
               </div>
             )}
           </div>
        </div>
      </section>
    </div>
  );
}
