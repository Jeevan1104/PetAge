import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "system",
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== "undefined") {
      localStorage.setItem("petage-theme", theme);
    }
  },
}));

// Initialize from localStorage (called once on app mount)
export function initThemeFromStorage() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("petage-theme") as Theme | null;
  if (stored) {
    useThemeStore.getState().setTheme(stored);
  }
}
