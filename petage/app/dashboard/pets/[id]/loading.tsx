import { Skeleton } from "@/components/ui/Skeleton";

export default function PetLoading() {
  return (
    <div className="animate-fade-in">
      {/* Hero header */}
      <Skeleton className="w-full h-[200px] rounded-none" />

      {/* Tile grid */}
      <div className="px-6 md:px-10 py-6">
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-md border border-border p-5">
              <Skeleton className="w-8 h-8 rounded-full mb-3" />
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-10" />
            </div>
          ))}
        </div>

        {/* Activity feed */}
        <Skeleton className="h-5 w-28 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-md border border-border p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
