export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8 h-8 w-48 animate-pulse rounded-lg bg-white/5" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="mt-6 h-64 animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}
