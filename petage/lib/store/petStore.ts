import { create } from "zustand";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { getDb, getAuth } from "@/lib/firebase";
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
  fetchPets: () => Promise<void>;
  subscribeToUserPets: (userId: string) => () => void;
  createPet: (
    data: CreatePetData
  ) => Promise<{ pet?: Pet; error?: string; code?: string }>;
  deletePet: (petId: string) => Promise<{ error?: string }>;
}

async function getToken(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

export const usePetStore = create<PetState>((set) => ({
  pets: [],
  activePetId: null,
  loading: true,
  error: null,

  setActivePet: (petId) => set({ activePetId: petId }),

  fetchPets: async () => {
    try {
      set({ loading: true, error: null });
      const token = await getToken();
      const res = await fetch("/api/pets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        set({ loading: false, error: json.error ?? "Failed to load pets" });
        return;
      }
      const pets = (json.pets as Pet[])
        .filter((p) => !p.isArchived)
        .sort((a, b) => {
          const aTs = (a.createdAt as unknown as { toMillis: () => number })?.toMillis?.() ?? 0;
          const bTs = (b.createdAt as unknown as { toMillis: () => number })?.toMillis?.() ?? 0;
          return aTs - bTs;
        });
      set({ pets, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load pets",
      });
    }
  },

  subscribeToUserPets: (userId) => {
    set({ loading: true });

    // Single-field query avoids composite index requirement
    const q = query(
      collection(getDb(), "pets"),
      where("ownerId", "==", userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const pets = snap.docs
          .map((d) => ({ petId: d.id, ...d.data() } as Pet))
          .filter((p) => !p.isArchived)
          .sort((a, b) => {
            const aTs = (a.createdAt as unknown as { toMillis: () => number })?.toMillis?.() ?? 0;
            const bTs = (b.createdAt as unknown as { toMillis: () => number })?.toMillis?.() ?? 0;
            return aTs - bTs;
          });
        set({ pets, loading: false, error: null });
      },
      (err) => {
        console.error("Pet subscription error (falling back to API):", err);
        // Firestore rules may not be deployed — fall back to the REST API
        getToken()
          .then((token) =>
            fetch("/api/pets", { headers: { Authorization: `Bearer ${token}` } })
          )
          .then((res) => res.json())
          .then((json) => {
            const pets = ((json.pets as Pet[]) ?? [])
              .filter((p) => !p.isArchived)
              .sort((a, b) => {
                const aTs = (a.createdAt as unknown as { toMillis: () => number })?.toMillis?.() ?? 0;
                const bTs = (b.createdAt as unknown as { toMillis: () => number })?.toMillis?.() ?? 0;
                return aTs - bTs;
              });
            set({ pets, loading: false, error: null });
          })
          .catch(() => set({ loading: false, error: err.message }));
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
