"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

// Design Brief §05: 64px + safe area
// Active: #1C5EA8 icon + #E8F2FB bg
// Inactive: #8896AA
// 5 items max

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/dashboard/vaccines", label: "Vaccines", icon: "💉" },
  { href: "/dashboard/visits", label: "Visits", icon: "📋" },
  { href: "/dashboard/meds", label: "Meds", icon: "💊" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-40
      bg-card border-t border-border
      flex justify-around items-center
      h-16 pb-[env(safe-area-inset-bottom)]
      md:hidden
    ">
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center gap-1
              px-3.5 py-1.5 rounded-[10px]
              min-w-[44px] min-h-[44px]
              transition-colors duration-150
              ${isActive
                ? "bg-blue-tint text-clinical-blue"
                : "text-text-tertiary hover:text-text-secondary"
              }
            `}
          >
            <span className="text-[16px]">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
