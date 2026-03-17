import { create } from "zustand";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { getDb, getAuth } from "@/lib/firebase";
import type { WeightLog } from "@/lib/types";

interface WeightState {
  logs: WeightLog[];
  loading: boolean;
  error: string | null;
  subscribeToWeightLogs: (petId: string) => () => void;
  createLog: (data: CreateLogData) => Promise<{ error?: string }>;
  deleteLog: (logId: string) => Promise<{ error?: string }>;
}

interface CreateLogData {
  petId: string;
  weight: number;
  unit: "kg" | "lbs";
  logDate: string;
  notes?: string;
}

async function getToken(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

export const useWeightStore = create<WeightState>((set) => ({
  logs: [],
  loading: true,
  error: null,

  subscribeToWeightLogs: (petId) => {
    set({ loading: true });
    const q = query(
      collection(getDb(), "weightLogs"),
      where("petId", "==", petId),
      orderBy("logDate", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const logs = snap.docs.map((d) => ({ logId: d.id, ...d.data() } as WeightLog));
        set({ logs, loading: false });
      },
      () => set({ loading: false })
    );
    return unsubscribe;
  },

  createLog: async (data) => {
    try {
      const token = await getToken();
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? "Failed to save weight log" };
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to save weight log" };
    }
  },

  deleteLog: async (logId) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/weight/${logId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { error: "Failed to delete log" };
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to delete log" };
    }
  },
}));
