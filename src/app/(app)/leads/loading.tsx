export default function LeadsLoading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-stone-200/70" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-stone-200/70" />
      </div>
      <div className="mb-5 h-10 w-full animate-pulse rounded-lg bg-stone-200/60" />
      <div className="card overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-4 last:border-0"
          >
            <div className="h-4 w-40 animate-pulse rounded bg-stone-200/70" />
            <div className="h-4 w-24 animate-pulse rounded bg-stone-200/50" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-stone-200/60" />
            <div className="h-4 w-20 animate-pulse rounded bg-stone-200/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
