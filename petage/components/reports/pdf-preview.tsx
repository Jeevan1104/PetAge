"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

function LockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}

interface PDFPreviewProps {
  isPremium: boolean;
  petName: string;
}

export default function PDFPreview({ isPremium, petName }: PDFPreviewProps) {
  return (
    <div className="relative w-full max-w-[320px] mx-auto mt-6">
      {/* Tilted Document Illusion */}
      <div className="absolute top-0 w-full h-full bg-border-strong rounded-[12px] rotate-[-4deg] scale-[0.98] shadow-sm z-0" />
      <div className="absolute top-0 w-full h-full bg-border rounded-[12px] rotate-[2deg] scale-[0.99] shadow-sm z-0" />
      
      {/* Main Document Face */}
      <div className="relative bg-white rounded-[12px] shadow-md border border-border p-6 aspect-[1/1.4] z-10 flex flex-col justify-between overflow-hidden">
        
        <div className="flex flex-col gap-4">
           {/* Document Header Mock */}
           <div className="flex items-center gap-3 border-b border-border pb-4">
             <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden">
                <svg className="w-6 h-6 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h.01M16 20h.01M8 20h.01M12 4v8M8 8l4-4 4 4" />
                </svg>
             </div>
             <div>
               <h3 className="text-[16px] font-bold text-navy leading-none mb-1">{petName}</h3>
               <p className="text-[10px] text-text-secondary uppercase tracking-wider">Health Record · 2024</p>
             </div>
           </div>

           {/* Document Body Mock lines */}
           <div className="flex flex-col gap-2 mt-2">
             <div className="h-2 w-full bg-surface rounded-full" />
             <div className="h-2 w-[80%] bg-surface rounded-full" />
             <div className="h-2 w-[90%] bg-surface rounded-full" />
             <div className="h-2 w-[60%] bg-surface rounded-full mt-4" />
             <div className="h-2 w-full bg-surface rounded-full" />
           </div>

           <div className="bg-surface rounded-md h-16 w-full mt-6 flex items-center justify-center border border-border border-dashed">
             <span className="text-[10px] text-text-tertiary font-medium">Auto-generated Medical Table</span>
           </div>
        </div>

        {/* Action Button */}
        <div className="mt-8">
          <button 
            disabled={!isPremium}
            className={`w-full py-3 rounded-[10px] text-[14px] font-semibold text-white transition-all transform active:scale-95
              ${isPremium ? "bg-gradient-to-r from-clinical-blue to-accent-blue hover:brightness-110 shadow-md" : "bg-border-strong opacity-50 cursor-not-allowed"}
            `}
          >
            {isPremium ? "Generate PDF" : "Locked (Free Tier)"}
          </button>
        </div>

        {/* Free Tier Overlay Cover */}
        {!isPremium && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-white mb-4 shadow-lg">
              <LockIcon className="w-6 h-6" />
            </div>
            <h4 className="text-[16px] font-bold text-navy mb-2">Premium Feature</h4>
            <p className="text-[13px] text-text-secondary leading-tight mb-5">
              Export comprehensive health and vaccination records in a single tap.
            </p>
            <Link href="/upgrade" className="w-full">
               <Button className="w-full shadow-md bg-gradient-to-r from-navy to-[#1a2d42]">
                 Upgrade to Premium
               </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
