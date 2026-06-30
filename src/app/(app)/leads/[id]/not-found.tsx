import Link from "next/link";

export default function LeadNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="text-5xl font-semibold text-stone-300">404</div>
      <h1 className="mt-4 text-lg font-medium text-stone-900">Lead not found</h1>
      <p className="mt-1 text-sm text-stone-400">
        This lead may have been removed or never existed.
      </p>
      <Link href="/leads" className="btn-primary mt-6">
        Back to leads
      </Link>
    </div>
  );
}
