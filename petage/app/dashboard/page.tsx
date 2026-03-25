"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { usePetStore } from "@/lib/store/petStore";
import { PetCard, AddPetCard } from "@/components/ui/PetCard";
import { useRouter } from "next/navigation";

// Screen 4 — Home Dashboard
// Stitch ref: af9f3b2a

export default function DashboardPage() {
  const router = useRouter();
  const { user, firebaseUser } = useAuthStore();
  const { pets, loading: petsLoading, error: petsError, subscribeToUserPets, setActivePet, activePetId } = usePetStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Subscribe for real-time updates; falls back to the API if Firestore rules
  // haven't been deployed yet.
  useEffect(() => {
    const uid = firebaseUser?.uid;
    if (uid) {
      const unsubscribe = subscribeToUserPets(uid);
      return () => unsubscribe();
    }
  }, [firebaseUser?.uid, subscribeToUserPets]);

  const handlePetClick = (petId: string) => {
    setActivePet(petId);
    router.push(`/dashboard/pets/${petId}`);
  };

  const handleAddPet = () => {
    const isPremium = user?.tier === "premium";
    if (!isPremium && pets.length >= 2) {
      setShowUpgradeModal(true);
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
        {petsError && (
          <div className="mb-4 px-4 py-3 bg-pale-red rounded-[10px] text-[13px] text-status-red">
            Could not load pets: {petsError}
          </div>
        )}
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {petsLoading && pets.length === 0 ? (
            <div className="flex items-center gap-2 text-body-sm text-text-secondary py-2">
              <div className="w-4 h-4 rounded-full border-2 border-clinical-blue border-t-transparent animate-spin" />
              Loading pets...
            </div>
          ) : null}
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

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="w-full max-w-[360px] bg-card rounded-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl mb-4 text-center">🐾</div>
            <h2 className="text-h2 text-navy text-center mb-2">
              Free plan limit reached
            </h2>
            <p className="text-body-sm text-text-secondary text-center mb-6">
              You&apos;ve added 2 pets — the maximum on the free plan. Upgrade
              to Premium for unlimited pets and more.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  router.push("/dashboard/premium");
                }}
                className="w-full py-3 rounded-[10px] bg-navy text-white text-[15px] font-semibold hover:bg-navy/90 transition-colors"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-3 rounded-[10px] text-text-secondary text-[14px] hover:text-text-primary transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
