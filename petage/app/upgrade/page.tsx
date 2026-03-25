"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PremiumTable from "@/components/premium/premium-table";
import Button from "@/components/ui/Button";

export default function UpgradePage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center">
      {/* Top Banner & Header */}
      <div className="w-full bg-navy text-white px-6 pt-12 pb-24 relative overflow-hidden flex flex-col items-center text-center">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white opacity-5 rounded-full" />
        <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-white opacity-5 rounded-full" />

        <button 
          onClick={() => router.back()}
          className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <h1 className="text-[28px] font-bold tracking-tight mb-2">PetAge Premium</h1>
        <p className="text-[15px] opacity-80 max-w-[280px]">
          Unlock unlimited access and keep your pet&apos;s advanced health records actively synced.
        </p>
      </div>

      {/* Main Content Area overlapping the banner */}
      <div className="w-full max-w-md -mt-16 px-4 flex flex-col gap-6 relative z-10 pb-20">
        
        {/* Toggle Switch */}
        <div className="bg-white rounded-full p-1.5 shadow-md flex relative border border-border mx-auto">
          <button 
             onClick={() => setIsAnnual(false)}
             className={`w-[120px] py-2 text-[14px] font-semibold rounded-full transition-all z-10
               ${!isAnnual ? "text-navy shadow-sm bg-white" : "text-text-secondary bg-transparent"}
             `}
          >
            Monthly
          </button>
          <button 
             onClick={() => setIsAnnual(true)}
             className={`w-[120px] py-2 text-[14px] font-semibold rounded-full transition-all z-10 flex items-center justify-center gap-1.5
               ${isAnnual ? "text-navy shadow-sm bg-white" : "text-text-secondary bg-transparent"}
             `}
          >
            Annually
          </button>
          
          {/* Slider background logic (css hack for simplicity) */}
          <div className={`absolute top-1.5 bottom-1.5 w-[120px] bg-surface rounded-full transition-transform duration-300 z-0 ${isAnnual ? "translate-x-[120px]" : "translate-x-0"}`} />
          
          <div className="absolute -top-3 -right-3 bg-accent-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
             Save 33%
          </div>
        </div>

        {/* Comparison Graphic */}
        <PremiumTable />

        {/* Pricing CTA Box */}
        <div className="bg-white rounded-[16px] shadow-sm border border-border p-6 flex flex-col text-center">
           <h2 className="text-[32px] font-bold text-navy leading-none mb-1">
             ${isAnnual ? "3.99" : "5.99"}
           </h2>
           <p className="text-[13px] text-text-secondary mb-6">
             {isAnnual ? "per month, billed annually at $47.88" : "per month, cancel anytime"}
           </p>
           
           <Button className="w-full bg-gradient-to-r from-clinical-blue to-accent-blue py-4 text-[16px] shadow-md hover:brightness-110 h-auto">
             Upgrade Now
           </Button>
           
           <button className="text-[12px] text-text-tertiary mt-4 hover:underline">
             Restore Purchases
           </button>
        </div>
      </div>
    </div>
  );
}
