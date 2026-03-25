"use client";

import { useThemeStore } from "@/lib/store/themeStore";

/**
 * A small floating circle button for mobile screens.
 * Sits above the bottom nav, left side.
 * Cycles through: Light → Dark → System.
 */
export default function MobileThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const cycle = () => {
    const order = ["light", "dark", "system"] as const;
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const icon = theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "💻";

  return (
    <button
      onClick={cycle}
      className="
        fixed bottom-20 left-4 z-50
        w-10 h-10 rounded-full
        bg-card border border-border
        flex items-center justify-center
        shadow-sm
        active:scale-95 transition-transform duration-100
        md:hidden
      "
      aria-label={`Theme: ${theme}. Tap to switch.`}
    >
      <span className="text-[16px]">{icon}</span>
    </button>
  );
}
