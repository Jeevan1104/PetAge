"use client";

import { ReactNode } from "react";

// Design Brief §05: 56×56px, 50% radius, #1C5EA8
// Shadow: 0 4px 16px rgba(28,94,168,.35)
// Springs in when scroll stops (scale-in animation)
// ONLY element with a drop shadow

interface FABProps {
  onClick?: () => void;
  icon?: ReactNode;
  label?: string;
  className?: string;
}

export default function FAB({ onClick, icon, label, className = "" }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label || "Add new"}
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        bg-clinical-blue text-white
        flex items-center justify-center
        shadow-fab
        hover:brightness-110
        active:scale-[0.97] transition-transform duration-100
        animate-scale-in
        cursor-pointer
        ${className}
      `}
    >
      {icon || (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      )}
    </button>
  );
}
