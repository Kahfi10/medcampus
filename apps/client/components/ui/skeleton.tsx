import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[#F0F0F5]",
        className
      )}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-[16px] border border-[#F0F0F5] p-5">
      <Skeleton className="w-10 h-10 rounded-xl mb-4" />
      <Skeleton className="w-16 h-8 mb-2" />
      <Skeleton className="w-24 h-4 mb-1" />
      <Skeleton className="w-32 h-3" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className={`h-4 ${i === 0 ? "w-32" : i === cols - 1 ? "w-16" : "w-24"}`} />
        </td>
      ))}
    </tr>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="w-48 h-6 mb-2" />
          <Skeleton className="w-32 h-4" />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-[16px] border border-[#F0F0F5] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0F0F5]">
          <Skeleton className="w-40 h-5 mb-1" />
          <Skeleton className="w-24 h-3" />
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F0F0F5]">
              {[1, 2, 3, 4].map(i => (
                <th key={i} className="px-6 py-3">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F7]">
            {[1, 2, 3, 4, 5].map(i => <TableRowSkeleton key={i} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
