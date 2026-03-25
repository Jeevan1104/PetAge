"use client";

import Link from "next/link";
import { ReactNode } from "react";

/**
 * Shared split-panel layout for auth pages (login, signup, forgot-password).
 *
 * Left panel: branding with decorative circles (desktop only).
 * Right panel: form content.
 */

interface AuthLayoutProps {
  /** Hero heading — supports JSX for line breaks and emphasis. */
  heading: ReactNode;
  /** Subtitle below the heading. */
  subtitle: string;
  /** Optional feature tags shown below the subtitle on the branding panel. */
  tags?: string[];
  /** Form content rendered in the right panel. */
  children: ReactNode;
}

export default function AuthLayout({
  heading,
  subtitle,
  tags,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Left — Branding panel (desktop) */}
      <div className="hidden md:flex md:w-[45%] bg-navy flex-col justify-center px-12 py-16 relative overflow-hidden">
        <div className="absolute -top-20 -right-16 w-80 h-80 rounded-full border border-white/[0.06]" />
        <div className="absolute bottom-20 -left-12 w-52 h-52 rounded-full border border-white/[0.04]" />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-12">
            <span className="text-2xl">🐾</span>
            <span className="text-white font-semibold text-[18px]">
              PetAge
            </span>
          </Link>

          <h2 className="font-serif text-[36px] leading-[1.1] text-white mb-4">
            {heading}
          </h2>
          <p className="text-[15px] text-[#94A3B8] leading-[1.7] max-w-[380px]">
            {subtitle}
          </p>

          {tags && tags.length > 0 && (
            <div className="flex gap-3 mt-8">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-3 py-1 rounded-full bg-white/[0.08] border border-white/[0.12] text-[#CBD5E1]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-8 md:hidden"
          >
            <span className="text-2xl">🐾</span>
            <span className="text-navy font-semibold text-[18px]">PetAge</span>
          </Link>

          {children}
        </div>
      </div>
    </div>
  );
}
