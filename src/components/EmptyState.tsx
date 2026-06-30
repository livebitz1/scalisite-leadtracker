export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-stone-50 px-6 py-16 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-stone-100 text-stone-400">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-stone-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-stone-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
