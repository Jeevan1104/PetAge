"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import BottomNav from "@/components/ui/BottomNav";

// Protected layout — requires authentication
// Web uses sidebar nav (md+), mobile uses bottom tab bar

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, firebaseUser, loading, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push("/login");
    }
  }, [firebaseUser, loading, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-clinical-blue border-t-transparent animate-spin" />
          <p className="text-body-sm text-text-secondary">Loading your pets...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!firebaseUser) return null;

  // Use Firestore user data if available, fall back to Firebase Auth data
  const displayEmail = user?.email ?? firebaseUser.email ?? "";
  const displayTier = user?.tier ?? "free";

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[240px] bg-card border-r border-border flex-col z-30">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <span className="text-navy font-semibold text-[18px]">PetAge</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <SidebarLink href="/dashboard" icon="🏠" label="Home" />
          <SidebarLink href="/dashboard/vaccines" icon="💉" label="Vaccines" />
          <SidebarLink href="/dashboard/visits" icon="📋" label="Vet Visits" />
          <SidebarLink href="/dashboard/meds" icon="💊" label="Medications" />
          <SidebarLink href="/dashboard/weight" icon="⚖️" label="Weight" />
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <SidebarLink href="/dashboard/settings" icon="⚙️" label="Settings" />
          <div className="px-3 py-2 mt-2">
            <p className="text-[12px] text-text-tertiary truncate">
              {displayEmail}
            </p>
            <div className="mt-1 flex items-center justify-between">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                displayTier === "premium"
                  ? "bg-pale-amber text-status-amber"
                  : "bg-[#EDE9FE] text-[#5B21B6]"
              }`}>
                {displayTier === "premium" ? "★ Premium" : "Free"}
              </span>
              <button
                onClick={handleLogout}
                className="text-[11px] text-text-tertiary hover:text-status-red transition-colors duration-150"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="md:ml-[240px] pb-20 md:pb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}

// Sidebar link component
function SidebarLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-colors duration-150 ${
        isActive
          ? "bg-blue-tint text-clinical-blue font-semibold"
          : "text-text-secondary hover:bg-blue-tint hover:text-clinical-blue font-medium"
      }`}
    >
      <span className="text-[16px] w-5 text-center">{icon}</span>
      <span>{label}</span>
    </a>
  );
}
