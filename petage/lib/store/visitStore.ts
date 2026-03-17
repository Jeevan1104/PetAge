import { create } from "zustand";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { getDb, getAuth } from "@/lib/firebase";
import type { VetVisit } from "@/lib/types";

interface VisitState {
  visits: VetVisit[];
  loading: boolean;
  error: string | null;
  subscribeToVisits: (petId: string) => () => void;
  createVisit: (data: CreateVisitData) => Promise<{ error?: string }>;
  deleteVisit: (visitId: string) => Promise<{ error?: string }>;
}

interface CreateVisitData {
  petId: string;
  visitDate: string;
  reason: string;
  clinicName?: string;
  vetName?: string;
  notes?: string;
}

async function getToken(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

export const useVisitStore = create<VisitState>((set) => ({
  visits: [],
  loading: true,
  error: null,

  subscribeToVisits: (petId) => {
    set({ loading: true });
    const q = query(
      collection(getDb(), "vetVisits"),
      where("petId", "==", petId),
      orderBy("visitDate", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const visits = snap.docs.map((d) => ({ visitId: d.id, ...d.data() } as VetVisit));
        set({ visits, loading: false });
      },
      () => set({ loading: false })
    );
    return unsubscribe;
  },

  createVisit: async (data) => {
    try {
      const token = await getToken();
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? "Failed to save visit" };
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to save visit" };
    }
  },

  deleteVisit: async (visitId) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/visits/${visitId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { error: "Failed to delete visit" };
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to delete visit" };
    }
  },
}));
