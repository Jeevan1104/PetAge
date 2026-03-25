"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

/**
 * Sidebar navigation link for the dashboard layout.
 * Uses Next.js `Link` for proper client-side navigation.
 */

interface SidebarLinkProps {
  href: string;
  icon: string;
  label: string;
}

export default function SidebarLink({ href, icon, label }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive =
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-colors duration-150 ${
        isActive
          ? "bg-blue-tint text-clinical-blue font-semibold"
          : "text-text-secondary hover:bg-blue-tint hover:text-clinical-blue font-medium"
      }`}
    >
      <span className="text-[16px] w-5 text-center">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
