import Link from "next/link";
import Button from "@/components/ui/Button";

// Screen 1 — Splash / Onboarding
// Design Brief: Hero + CTA, DM Serif Display heading

export default function Home() {
  return (
    <div className="min-h-screen bg-navy relative overflow-hidden flex flex-col">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-16 w-80 h-80 rounded-full border border-white/[0.06]" />
      <div className="absolute bottom-20 -left-24 w-64 h-64 rounded-full border border-white/[0.04]" />
      <div className="absolute top-1/2 right-10 w-48 h-48 rounded-full border border-white/[0.03]" />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center relative z-10">
        {/* Logo/Icon */}
        <div className="w-20 h-20 rounded-2xl bg-clinical-blue/20 border border-clinical-blue/30 flex items-center justify-center mb-8">
          <span className="text-4xl">🐾</span>
        </div>

        {/* Eyebrow */}
        <p className="text-[11px] tracking-[0.14em] uppercase text-[#7DD3FC] font-medium mb-4">
          PetAge
        </p>

        {/* Title */}
        <h1 className="font-serif text-[42px] md:text-[56px] leading-[1.08] text-white mb-4 max-w-[600px]">
          The Health Passport<br />
          Every Pet <em className="text-[#7DD3FC]">Deserves</em>
        </h1>

        {/* Subtitle */}
        <p className="text-[15px] md:text-[17px] text-[#94A3B8] max-w-[480px] leading-[1.7] mb-10">
          Track vaccines, vet visits, medications, and weight — all in one place.
          Owner-first. Vet-optional. Built to keep your pets healthy.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[340px]">
          <Link href="/signup" className="flex-1">
            <Button variant="primary" size="lg" className="w-full">
              Get Started
            </Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button
              variant="secondary"
              size="lg"
              className="w-full text-white border-white/30 hover:bg-white/10"
            >
              Log In
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom tags */}
      <div className="flex flex-wrap justify-center gap-2 px-6 pb-10">
        {["Web · iOS · Android", "Free Tier", "No Vet Required", "Export PDF"].map(
          (tag) => (
            <span
              key={tag}
              className="text-[11px] px-3 py-1 rounded-full bg-white/[0.08] border border-white/[0.12] text-[#CBD5E1]"
            >
              {tag}
            </span>
          )
        )}
      </div>
    </div>
  );
}
