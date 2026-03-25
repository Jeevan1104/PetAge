"use client";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function PremiumTable() {
  const features = [
    { name: "Unlimited Pets", free: false, premium: true },
    { name: "Medication Reminders", free: false, premium: true },
    { name: "Health PDF Export", free: false, premium: true },
    { name: "Vet Visit Logging", free: true, premium: true },
    { name: "Vaccination Tracker", free: true, premium: true },
    { name: "Weight Timeline", free: true, premium: true },
  ];

  return (
    <div className="w-full flex-1 pt-6 px-4">
      <div className="bg-white border border-border rounded-[16px] shadow-sm overflow-hidden flex flex-col">
        {/* Header Row */}
        <div className="flex border-b border-border">
          <div className="w-1/3 p-4 bg-surface" />
          <div className="w-1/3 p-4 flex flex-col items-center justify-center border-l border-border bg-white">
            <h3 className="text-[14px] font-bold text-text-primary">Free</h3>
          </div>
          <div className="w-1/3 p-4 flex flex-col items-center justify-center bg-navy border-l border-border relative">
            <h3 className="text-[14px] font-bold text-white">Premium</h3>
            <div className="absolute top-0 left-0 w-full h-[3px] bg-accent-blue" />
          </div>
        </div>

        {/* Feature Rows */}
        {features.map((feature, idx) => (
          <div key={idx} className="flex border-b border-border last:border-b-0">
            <div className="w-1/3 p-3 flex items-center bg-surface">
              <span className="text-[12px] font-medium text-text-secondary leading-tight">
                {feature.name}
              </span>
            </div>
            <div className="w-1/3 p-3 flex items-center justify-center border-l border-border bg-white">
              {feature.free ? (
                <CheckIcon className="w-5 h-5 text-text-secondary" />
              ) : (
                <span className="w-4 h-[2px] bg-text-tertiary rounded-full" />
              )}
            </div>
            <div className="w-1/3 p-3 flex items-center justify-center border-l border-border bg-[#F8FAFC]">
               {feature.premium && (
                 <CheckIcon className="w-5 h-5 text-clinical-blue" />
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
