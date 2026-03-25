import { create } from "zustand";
import { getAuth } from "@/lib/firebase";
import type { Medication } from "@/lib/types";
import type { CreateMedicationInput, UpdateMedicationInput } from "@/lib/schemas/medication";

interface MedicationState {
  medications: Medication[];
  archivedMedications: Medication[];
  loading: boolean;
  error: string | null;

  fetchMedications: (petId: string) => Promise<void>;
  createMedication: (
    petId: string,
    data: CreateMedicationInput
  ) => Promise<{ medication?: Medication; error?: string }>;
  updateMedication: (
    petId: string,
    medicationId: string,
    data: UpdateMedicationInput
  ) => Promise<{ error?: string }>;
  deleteMedication: (
    petId: string,
    medicationId: string
  ) => Promise<{ error?: string }>;
  markAsGiven: (
    petId: string,
    medicationId: string
  ) => Promise<{ medication?: Medication; error?: string }>;
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

export const useMedicationStore = create<MedicationState>((set) => ({
  medications: [],
  archivedMedications: [],
  loading: false,
  error: null,

  fetchMedications: async (petId) => {
    try {
      set({ loading: true, error: null, medications: [], archivedMedications: [] });
      const token = await getToken();
      const res = await fetch(`/api/pets/${petId}/medications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await safeJson(res);
      if (!res.ok) {
        set({ loading: false, error: (json.error as string) ?? "Failed to load medications" });
        return;
      }
      set({
        medications: json.medications as unknown as Medication[],
        archivedMedications: json.archivedMedications as unknown as Medication[],
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load medications",
      });
    }
  },

  createMedication: async (petId, data) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/pets/${petId}/medications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await safeJson(res);
      if (!res.ok) return { error: (json.error as string) ?? "Failed to create medication" };

      const medication = json.medication as unknown as Medication;
      set((state) => ({ medications: [...state.medications, medication] }));
      return { medication };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to create medication" };
    }
  },

  updateMedication: async (petId, medicationId, data) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/pets/${petId}/medications/${medicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await safeJson(res);
        return { error: (json.error as string) ?? "Failed to update medication" };
      }
      const json = await safeJson(res);
      const updated = json.medication as unknown as Medication;
      set((state) => ({
        medications: state.medications.map((m) =>
          m.medicationId === medicationId ? updated : m
        ),
      }));
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to update medication" };
    }
  },

  deleteMedication: async (petId, medicationId) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/pets/${petId}/medications/${medicationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await safeJson(res);
        return { error: (json.error as string) ?? "Failed to delete medication" };
      }
      // Move from active list to archived list
      set((state) => {
        const med = state.medications.find((m) => m.medicationId === medicationId);
        return {
          medications: state.medications.filter((m) => m.medicationId !== medicationId),
          archivedMedications: med
            ? [{ ...med, isArchived: true }, ...state.archivedMedications]
            : state.archivedMedications,
        };
      });
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to delete medication" };
    }
  },

  markAsGiven: async (petId, medicationId) => {
    try {
      const token = await getToken();
      const res = await fetch(
        `/api/pets/${petId}/medications/${medicationId}/mark-given`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const json = await safeJson(res);
        return { error: (json.error as string) ?? "Failed to mark as given" };
      }
      const json = await safeJson(res);
      const updated = json.medication as unknown as Medication;
      set((state) => ({
        medications: state.medications.map((m) =>
          m.medicationId === medicationId ? updated : m
        ),
      }));
      return { medication: updated };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to mark as given" };
    }
  },
}));
