import { create } from "zustand";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { getDb, getAuth } from "@/lib/firebase";
import type { Vaccine } from "@/lib/types";

interface VaccineState {
  vaccines: Vaccine[];
  loading: boolean;
  error: string | null;
  subscribeToVaccines: (petId: string) => () => void;
  createVaccine: (data: CreateVaccineData) => Promise<{ error?: string }>;
  deleteVaccine: (vaccineId: string) => Promise<{ error?: string }>;
}

interface CreateVaccineData {
  petId: string;
  name: string;
  dateAdministered: string;
  expiryDate?: string;
  reminderEnabled?: boolean;
  notes?: string;
}

async function getToken(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

export const useVaccineStore = create<VaccineState>((set) => ({
  vaccines: [],
  loading: true,
  error: null,

  subscribeToVaccines: (petId) => {
    set({ loading: true });
    const q = query(
      collection(getDb(), "vaccines"),
      where("petId", "==", petId),
      orderBy("dateAdministered", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const vaccines = snap.docs.map((d) => ({ vaccineId: d.id, ...d.data() } as Vaccine));
        set({ vaccines, loading: false });
      },
      () => set({ loading: false })
    );
    return unsubscribe;
  },

  createVaccine: async (data) => {
    try {
      const token = await getToken();
      const res = await fetch("/api/vaccines", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? "Failed to save vaccine" };
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to save vaccine" };
    }
  },

  deleteVaccine: async (vaccineId) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/vaccines/${vaccineId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { error: "Failed to delete vaccine" };
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to delete vaccine" };
    }
  },
}));
