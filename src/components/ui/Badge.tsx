import clsx from "clsx";
import type { OrderStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    created:
      "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-200",
    in_transit:
      "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/40 dark:text-blue-200",
    arrived:
      "bg-indigo-100 text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200",
    delivered:
      "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200",
    canceled:
      "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-900/40 dark:text-rose-200",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs capitalize",
        map[status]
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-200">
      {children}
    </span>
  );
}
