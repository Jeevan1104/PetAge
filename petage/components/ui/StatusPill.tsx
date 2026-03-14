import { ReactNode } from "react";

// Design Brief §05: 24px height, 6px radius, 500 weight
// Never use status colors decoratively

type PillVariant = "green" | "amber" | "red" | "blue" | "purple";

interface StatusPillProps {
  variant: PillVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<PillVariant, string> = {
  green: "bg-pale-green text-status-green",
  amber: "bg-pale-amber text-status-amber",
  red: "bg-pale-red text-status-red",
  blue: "bg-blue-tint text-clinical-blue",
  purple: "bg-[#EDE9FE] text-[#5B21B6]",
};

export default function StatusPill({ variant, children, dot = false, className = "" }: StatusPillProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-3 h-6
        rounded-[6px] text-[12px] font-medium whitespace-nowrap
        transition-colors duration-300
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
