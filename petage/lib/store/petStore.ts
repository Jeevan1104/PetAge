import { create } from "zustand";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { Pet } from "@/lib/types";

interface CreatePetData {
  name: string;
  species: "dog" | "cat" | "exotic" | "other";
  breed?: string;
  dateOfBirth?: string; // ISO date string
  microchipId?: string;
  photoURL?: string;
}

interface PetState {
  pets: Pet[];
  activePetId: string | null;
  loading: boolean;
  error: string | null;

  setActivePet: (petId: string | null) => void;
  subscribeToUserPets: (userId: string) => () => void;
  createPet: (
    data: CreatePetData
  ) => Promise<{ pet?: Pet; error?: string; code?: string }>;
  deletePet: (petId: string) => Promise<{ error?: string }>;
}

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

export const usePetStore = create<PetState>((set) => ({
  pets: [],
  activePetId: null,
  loading: true,
  error: null,

  setActivePet: (petId) => set({ activePetId: petId }),

  subscribeToUserPets: (userId) => {
    set({ loading: true });

    const q = query(
      collection(db, "pets"),
      where("ownerId", "==", userId),
      where("isArchived", "==", false),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const pets = snap.docs.map((d) => ({ ...d.data() } as Pet));
        set({ pets, loading: false, error: null });
      },
      (err) => {
        console.error("Pet subscription error:", err);
        set({ loading: false, error: err.message });
      }
    );

    return unsubscribe;
  },

  createPet: async (data) => {
    try {
      const token = await getToken();
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) return { error: json.error, code: json.code };
      return { pet: json.pet };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Failed to create pet",
      };
    }
  },

  deletePet: async (petId) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/pets/${petId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const json = await res.json();
        return { error: json.error };
      }
      return {};
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Failed to remove pet",
      };
    }
  },
}));
