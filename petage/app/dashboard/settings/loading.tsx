import { Skeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="px-6 md:px-10 py-8 max-w-[600px] animate-fade-in">
      <Skeleton className="h-8 w-28 mb-8" />

      {/* Account section */}
      <Skeleton className="h-3 w-16 mb-3" />
      <div className="bg-card rounded-lg border border-border p-5 mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>

      {/* Notifications section */}
      <Skeleton className="h-3 w-24 mb-3" />
      <div className="bg-card rounded-lg border border-border divide-y divide-border mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <div>
              <Skeleton className="h-4 w-28 mb-1" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="w-[44px] h-[24px] rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
