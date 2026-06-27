export default function SkeletonCard() {
  return (
    <div className="border border-zinc-200 dark:border-[#2E3730] rounded overflow-hidden shadow-sm h-full flex flex-col">
      <div className="aspect-square bg-zinc-200 dark:bg-[#161B18] animate-pulse"></div>
      <div className="p-4 space-y-3">
        <div className="h-3 w-1/3 bg-zinc-200 dark:bg-[#161B18] animate-pulse rounded"></div>
        <div className="h-5 w-3/4 bg-zinc-200 dark:bg-[#161B18] animate-pulse rounded"></div>
        <div className="h-4 w-1/2 bg-zinc-200 dark:bg-[#161B18] animate-pulse rounded"></div>
      </div>
    </div>
  );
}