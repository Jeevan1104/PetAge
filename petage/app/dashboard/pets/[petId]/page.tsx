"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { differenceInYears, differenceInMonths } from "date-fns";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { usePetStore } from "@/lib/store/petStore";
import type { Pet } from "@/lib/types";

const speciesEmoji: Record<string, string> = {
  dog: "🐕",
  cat: "🐈",
  exotic: "🦎",
  other: "🐾",
};

const healthTiles = [
  {
    icon: "💉",
    label: "Vaccines",
    href: "vaccines",
    bg: "bg-blue-tint",
    text: "text-clinical-blue",
  },
  {
    icon: "📋",
    label: "Vet Visits",
    href: "visits",
    bg: "bg-pale-green",
    text: "text-status-green",
  },
  {
    icon: "💊",
    label: "Medications",
    href: "meds",
    bg: "bg-pale-amber",
    text: "text-status-amber",
  },
  {
    icon: "⚖️",
    label: "Weight",
    href: "weight",
    bg: "bg-[#F0F9FF]",
    text: "text-teal",
  },
];

function formatAge(dateOfBirth: Pet["dateOfBirth"]): string {
  if (!dateOfBirth) return "";

  let date: Date;
  if (
    typeof dateOfBirth === "object" &&
    "toDate" in (dateOfBirth as unknown as Record<string, unknown>)
  ) {
    date = (dateOfBirth as unknown as { toDate: () => Date }).toDate();
  } else {
    return "";
  }

  const years = differenceInYears(new Date(), date);
  if (years >= 1) return `${years} yr${years > 1 ? "s" : ""} old`;
  const months = differenceInMonths(new Date(), date);
  if (months > 0) return `${months} mo old`;
  return "< 1 month old";
}

export default function PetDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.petId as string;
  const { deletePet } = usePetStore();

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!petId) return;
    const ref = doc(db, "pets", petId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setPet({ petId: snap.id, ...snap.data() } as Pet);
      }
      setLoading(false);
    });
    return unsub;
  }, [petId]);

  async function handleDelete() {
    setDeleting(true);
    await deletePet(petId);
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-clinical-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-text-secondary">Pet not found.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 text-clinical-blue text-sm underline"
        >
          Back to home
        </button>
      </div>
    );
  }

  const age = formatAge(pet.dateOfBirth);

  return (
    <div className="min-h-screen bg-surface animate-fade-in">
      {/* Hero photo header */}
      <div className="relative w-full h-[200px] md:h-[240px] bg-navy overflow-hidden">
        {pet.photoURL ? (
          <Image
            src={pet.photoURL}
            alt={pet.name}
            fill
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[80px]">
            {speciesEmoji[pet.species] ?? "🐾"}
          </div>
        )}

        {/* Back */}
        <button
          onClick={() => router.push("/dashboard")}
          className="absolute top-4 left-4 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors text-lg"
          aria-label="Back"
        >
          ←
        </button>

        {/* Name / breed overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 pt-10 bg-gradient-to-t from-navy/90 to-transparent">
          <h1 className="text-[22px] font-semibold text-white">{pet.name}</h1>
          {(pet.breed || age) && (
            <p className="text-[13px] text-white/70 mt-0.5">
              {[pet.breed, age].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Health record tiles */}
      <div className="px-6 md:px-10 py-6">
        <p className="section-label mb-4">Health records</p>
        <div className="grid grid-cols-2 gap-3">
          {healthTiles.map((tile) => (
            <button
              key={tile.label}
              onClick={() =>
                router.push(`/dashboard/${tile.href}?petId=${petId}`)
              }
              className="card p-5 flex flex-col items-start gap-3 hover:border-mid-blue active:scale-[0.97] transition-all duration-100 text-left"
            >
              <div
                className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-xl ${tile.bg} ${tile.text}`}
              >
                {tile.icon}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-text-primary">
                  {tile.label}
                </p>
                <p className="text-caption text-text-tertiary mt-0.5">
                  No records yet
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pet details */}
      <div className="px-6 md:px-10 pb-6">
        <p className="section-label mb-4">Details</p>
        <div className="card divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-body-sm text-text-secondary">Species</span>
            <span className="text-body-sm text-text-primary font-medium capitalize">
              {pet.species}
            </span>
          </div>
          {pet.breed && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-body-sm text-text-secondary">Breed</span>
              <span className="text-body-sm text-text-primary font-medium">
                {pet.breed}
              </span>
            </div>
          )}
          {age && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-body-sm text-text-secondary">Age</span>
              <span className="text-body-sm text-text-primary font-medium">
                {age}
              </span>
            </div>
          )}
          {pet.microchipId && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-body-sm text-text-secondary">
                Microchip
              </span>
              <span className="font-mono text-mono text-text-primary">
                {pet.microchipId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Remove pet */}
      <div className="px-6 md:px-10 pb-16">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-[13px] text-status-red hover:underline"
          >
            Remove {pet.name}
          </button>
        ) : (
          <div className="bg-pale-red border border-[#FECDD3] rounded-[10px] p-4">
            <p className="text-[14px] text-status-red font-medium mb-3">
              Remove {pet.name}? This will archive all their records.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-status-red text-white text-[13px] font-semibold rounded-[8px] disabled:opacity-50 hover:brightness-110 transition-all"
              >
                {deleting ? "Removing…" : "Yes, remove"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-border text-[13px] font-medium rounded-[8px] hover:bg-surface transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
