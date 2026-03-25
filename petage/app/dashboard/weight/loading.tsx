import { Skeleton } from "@/components/ui/Skeleton";

export default function WeightLoading() {
  return (
    <div className="px-6 md:px-10 py-8 animate-fade-in">
      <Skeleton className="h-8 w-40 mb-6" />

      {/* Chart skeleton */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-20 rounded-[8px]" />
        </div>
        <Skeleton className="w-full h-[250px] rounded-md" />
      </div>

      {/* Log entries */}
      <Skeleton className="h-5 w-24 mb-4" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between bg-card rounded-md border border-border px-4 py-3">
            <div>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}
