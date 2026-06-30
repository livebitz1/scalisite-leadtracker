export default function LeadDetailLoading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 h-4 w-24 animate-pulse rounded bg-stone-200/60" />
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-stone-200/70" />
          <div className="h-4 w-64 animate-pulse rounded bg-stone-200/50" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded-lg bg-stone-200/60" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-80 animate-pulse rounded-2xl bg-stone-200/50" />
          <div className="h-56 animate-pulse rounded-2xl bg-stone-200/50" />
        </div>
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-2xl bg-stone-200/50" />
          <div className="h-48 animate-pulse rounded-2xl bg-stone-200/50" />
        </div>
      </div>
    </div>
  );
}
