import { create } from "zustand";
import type { WeightLog } from "@/lib/types";
import type { CreateWeightInput, UpdateWeightInput } from "@/lib/schemas/weight";
import { lbsToKg } from "@/lib/schemas/weight";
import { Timestamp } from "firebase/firestore";
import { getAuth } from "@/lib/firebase";

interface WeightState {
  logs: WeightLog[];
  loading: boolean;
  error: string | null;

  fetchLogs: (petId: string) => Promise<void>;
  createLog: (
    petId: string,
    data: CreateWeightInput
  ) => Promise<{ log?: WeightLog; error?: string }>;
  updateLog: (
    petId: string,
    logId: string,
    data: UpdateWeightInput
  ) => Promise<{ error?: string }>;
  deleteLog: (
    petId: string,
    logId: string
  ) => Promise<{ error?: string }>;
}

async function getToken(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

// Helper to safely parse Firebase REST payload Timestamps
function parseRestDate(val: unknown): Date {
  if (!val) return new Date();
  if (typeof val === "string" || typeof val === "number") return new Date(val);
  const obj = val as Record<string, number>;
  if (obj._seconds !== undefined) return new Date(obj._seconds * 1000);
  if (obj.seconds !== undefined) return new Date(obj.seconds * 1000);
  return new Date();
}

export const useWeightStore = create<WeightState>((set) => ({
  logs: [],
  loading: false,
  error: null,

  fetchLogs: async (petId) => {
    try {
      set({ loading: true, error: null, logs: [] });
      const token = await getToken();
      const res = await fetch(`/api/pets/${petId}/weight`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await safeJson(res);
      if (!res.ok) {
        set({ loading: false, error: (json.error as string) ?? "Failed to load weight logs" });
        return;
      }

      // Convert backend dates to Firebase Timestamps to preserve frontend component rendering standards
      const parsedLogs = (json.logs as Record<string, unknown>[]).map(log => ({
        ...log,
        logDate: Timestamp.fromDate(parseRestDate(log.logDate)),
        createdAt: Timestamp.fromDate(parseRestDate(log.createdAt))
      })) as WeightLog[];

      set({ logs: parsedLogs, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load logs",
      });
    }
  },

  createLog: async (petId, data) => {
    try {
      const token = await getToken();
      // Calculate true metric weight if UI submitted lbs before storing
      const weightInKg = data.unit === "lbs" ? lbsToKg(data.weight) : data.weight;
      
      const payload = {
        ...data,
        weight: weightInKg
      };

      const res = await fetch(`/api/pets/${petId}/weight`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await safeJson(res);
      if (!res.ok) {
        return { error: (json.error as string) ?? "Failed to log weight" };
      }

      const log = json.log as Record<string, unknown>;
      const parsedLog: WeightLog = {
        ...log,
        logDate: Timestamp.fromDate(parseRestDate(log.logDate)),
        createdAt: Timestamp.fromDate(parseRestDate(log.createdAt))
      } as WeightLog;

      set((state) => ({ logs: [parsedLog, ...state.logs] }));
      return { log: parsedLog };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to create log" };
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateLog: async (_petId, _logId, _data) => {
    // Phase 8 Implementation strictly omits discrete updates for weight (standard pattern for clinical timeseries)
    // Only creations and deletions are natively permitted.
    throw new Error("Updates are not permitted on core health metrics");
  },

  deleteLog: async (petId, logId) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/pets/${petId}/weight/${logId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const json = await safeJson(res);
        return { error: (json.error as string) ?? "Failed to delete log" };
      }

      set((state) => ({ logs: state.logs.filter((w) => w.logId !== logId) }));
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to delete log" };
    }
  },
}));
