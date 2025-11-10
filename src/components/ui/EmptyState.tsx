export function EmptyState({ title, hint }: { title: string; hint?: string }) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
        <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800" />
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
  