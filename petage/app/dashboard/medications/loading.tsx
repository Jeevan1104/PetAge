import { Skeleton } from "@/components/ui/Skeleton";

export default function MedicationsLoading() {
  return (
    <div className="px-6 md:px-10 py-8 animate-fade-in">
      <Skeleton className="h-8 w-40 mb-6" />
      <div className="space-y-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 min-h-[64px] border-b border-border bg-card">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
