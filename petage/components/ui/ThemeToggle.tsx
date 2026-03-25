"use client";

import { useThemeStore } from "@/lib/store/themeStore";

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const cycle = () => {
    const order = ["light", "dark", "system"] as const;
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const icon = theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "💻";
  const label =
    theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] text-text-secondary hover:bg-surface border border-border transition-colors duration-200 w-full"
      aria-label={`Theme: ${label}. Click to switch.`}
    >
      <span className="text-[16px]">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}
