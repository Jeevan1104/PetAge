import { ReactNode } from "react";

/**
 * Standardised error banner used across auth forms, forgot-password,
 * verify-email, and add-pet pages.
 */

interface ErrorBannerProps {
  children: ReactNode;
  className?: string;
}

export default function ErrorBanner({ children, className = "" }: ErrorBannerProps) {
  return (
    <div
      className={`rounded-md bg-pale-red px-4 py-3 text-[13px] text-status-red ${className}`}
      role="alert"
    >
      {children}
    </div>
  );
}
