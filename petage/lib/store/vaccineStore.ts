import { create } from "zustand";
import { getAuth } from "@/lib/firebase";
import type { Vaccine } from "@/lib/types";
import type { CreateVaccineInput, UpdateVaccineInput } from "@/lib/schemas/vaccine";

interface VaccineState {
  vaccines: Vaccine[];
  loading: boolean;
  error: string | null;

  fetchVaccines: (petId?: string) => Promise<void>;
  createVaccine: (
    petId: string,
    data: CreateVaccineInput
  ) => Promise<{ vaccine?: Vaccine; error?: string }>;
  updateVaccine: (
    petId: string,
    vaccineId: string,
    data: UpdateVaccineInput
  ) => Promise<{ error?: string }>;
  deleteVaccine: (
    petId: string,
    vaccineId: string
  ) => Promise<{ error?: string }>;
}

async function getToken(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

// Safely parse JSON from a Response without throwing on empty/HTML bodies
async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export const useVaccineStore = create<VaccineState>((set) => ({
  vaccines: [],
  loading: false,
  error: null,

  fetchVaccines: async (petId) => {
    try {
      set({ loading: true, error: null });
      const token = await getToken();
      const url = petId ? `/api/pets/${petId}/vaccines` : `/api/vaccines`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await safeJson(res);
      if (!res.ok) {
        set({ loading: false, error: (json.error as string) ?? "Failed to load vaccines" });
        return;
      }
      set({ vaccines: json.vaccines as unknown as Vaccine[], loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load vaccines",
      });
    }
  },

  createVaccine: async (petId, data) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/pets/${petId}/vaccines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await safeJson(res);
      if (!res.ok) return { error: (json.error as string) ?? "Failed to create vaccine" };

      const vaccine = json.vaccine as unknown as Vaccine;
      set((state) => ({ vaccines: [...state.vaccines, vaccine] }));
      return { vaccine };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Failed to create vaccine",
      };
    }
  },

  updateVaccine: async (petId, vaccineId, data) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/pets/${petId}/vaccines/${vaccineId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await safeJson(res);
        return { error: (json.error as string) ?? "Failed to update vaccine" };
      }
      return {};
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Failed to update vaccine",
      };
    }
  },

  deleteVaccine: async (petId, vaccineId) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/pets/${petId}/vaccines/${vaccineId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await safeJson(res);
        return { error: (json.error as string) ?? "Failed to delete vaccine" };
      }
      set((state) => ({
        vaccines: state.vaccines.filter((v) => v.vaccineId !== vaccineId),
      }));
      return {};
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Failed to delete vaccine",
      };
    }
  },
}));
