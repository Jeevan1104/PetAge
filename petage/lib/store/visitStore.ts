import { create } from "zustand";
import { getAuth } from "@/lib/firebase";
import type { VetVisit } from "@/lib/types";
import type { CreateVisitInput, UpdateVisitInput } from "@/lib/schemas/visit";

interface VisitState {
  visits: VetVisit[];
  loading: boolean;
  error: string | null;

  fetchVisits: (petId: string) => Promise<void>;
  createVisit: (
    petId: string,
    data: CreateVisitInput
  ) => Promise<{ visit?: VetVisit; error?: string }>;
  updateVisit: (
    petId: string,
    visitId: string,
    data: UpdateVisitInput
  ) => Promise<{ error?: string }>;
  deleteVisit: (
    petId: string,
    visitId: string
  ) => Promise<{ error?: string }>;
  uploadPhoto: (
    petId: string,
    file: File
  ) => Promise<{ url?: string; error?: string }>;
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

export const useVisitStore = create<VisitState>((set) => ({
  visits: [],
  loading: false,
  error: null,

  fetchVisits: async (petId) => {
    try {
      set({ loading: true, error: null, visits: [] });
      const token = await getToken();
      const res = await fetch(`/api/pets/${petId}/visits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await safeJson(res);
      if (!res.ok) {
        set({ loading: false, error: (json.error as string) ?? "Failed to load visits" });
        return;
      }
      set({ visits: json.visits as unknown as VetVisit[], loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load visits",
      });
    }
  },

  createVisit: async (petId, data) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/pets/${petId}/visits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await safeJson(res);
      if (!res.ok) return { error: (json.error as string) ?? "Failed to create visit" };

      const visit = json.visit as unknown as VetVisit;
      set((state) => ({ visits: [visit, ...state.visits] }));
      return { visit };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to create visit" };
    }
  },

  updateVisit: async (petId, visitId, data) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/pets/${petId}/visits/${visitId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await safeJson(res);
        return { error: (json.error as string) ?? "Failed to update visit" };
      }
      const json = await safeJson(res);
      const updated = json.visit as unknown as VetVisit;
      set((state) => ({
        visits: state.visits.map((v) => (v.visitId === visitId ? updated : v)),
      }));
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to update visit" };
    }
  },

  deleteVisit: async (petId, visitId) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/pets/${petId}/visits/${visitId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await safeJson(res);
        return { error: (json.error as string) ?? "Failed to delete visit" };
      }
      set((state) => ({
        visits: state.visits.filter((v) => v.visitId !== visitId),
      }));
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to delete visit" };
    }
  },

  uploadPhoto: async (petId, file) => {
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("petId", petId);
      const res = await fetch("/api/storage/visit-photo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await safeJson(res);
      if (!res.ok) return { error: (json.error as string) ?? "Upload failed" };
      return { url: json.url as string };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Upload failed" };
    }
  },
}));
