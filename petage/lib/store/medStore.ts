import { create } from "zustand";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { getDb, getAuth } from "@/lib/firebase";
import type { Medication } from "@/lib/types";

interface MedState {
  meds: Medication[];
  loading: boolean;
  error: string | null;
  subscribeToMeds: (petId: string) => () => void;
  createMed: (data: CreateMedData) => Promise<{ error?: string }>;
  deleteMed: (medId: string) => Promise<{ error?: string }>;
}

interface CreateMedData {
  petId: string;
  name: string;
  isGeneric?: boolean;
  dosageStrength?: string;
  frequency: "daily" | "weekly" | "monthly" | "custom";
  customFreqDays?: number;
  startDate: string;
  reminderEnabled?: boolean;
  notes?: string;
}

async function getToken(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

export const useMedStore = create<MedState>((set) => ({
  meds: [],
  loading: true,
  error: null,

  subscribeToMeds: (petId) => {
    set({ loading: true });
    const q = query(
      collection(getDb(), "medications"),
      where("petId", "==", petId),
      where("isArchived", "==", false),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const meds = snap.docs.map((d) => ({ medicationId: d.id, ...d.data() } as Medication));
        set({ meds, loading: false });
      },
      () => set({ loading: false })
    );
    return unsubscribe;
  },

  createMed: async (data) => {
    try {
      const token = await getToken();
      const res = await fetch("/api/meds", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? "Failed to save medication" };
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to save medication" };
    }
  },

  deleteMed: async (medId) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/meds/${medId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { error: "Failed to archive medication" };
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to archive medication" };
    }
  },
}));
