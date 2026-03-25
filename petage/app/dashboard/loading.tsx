import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="px-6 md:px-10 py-8 animate-fade-in">
      {/* Greeting skeleton */}
      <Skeleton className="h-8 w-48 mb-6" />

      {/* Pet cards row */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-[220px] bg-card rounded-lg border border-border p-4">
            <Skeleton className="w-[52px] h-[52px] rounded-full mx-auto mb-3" />
            <Skeleton className="h-4 w-24 mx-auto mb-2" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>

      {/* Activity feed skeleton */}
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-md border border-border p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
