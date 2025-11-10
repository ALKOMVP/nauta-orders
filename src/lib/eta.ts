// Utilities to handle ETA proximity and highlight logic.

/** Returns hours until a given ISO date. */
export function hoursUntil(dateIso: string): number {
  const now = Date.now();
  const target = new Date(dateIso).getTime();
  return (target - now) / 36e5; // ms → hours
}

/** Returns true if the ETA is already past. */
export function isOverdue(dateIso: string | null | undefined): boolean {
  if (!dateIso) return false;
  return hoursUntil(dateIso) < 0;
}

/** Returns true if the ETA is within 72 hours in the future. */
export function isNear(dateIso: string | null | undefined): boolean {
  if (!dateIso) return false;
  const h = hoursUntil(dateIso);
  return h >= 0 && h <= 72;
}

/** Returns a Tailwind color class based on ETA proximity. */
export function etaClass(iso: string): string {
  const h = hoursUntil(iso);
  if (h < 0) return "text-red-600 dark:text-red-400"; // overdue
  if (h <= 72) return "text-amber-600 dark:text-amber-400"; // soon
  return "text-slate-600 dark:text-slate-300"; // normal
}

/** Optional: label for UI (Overdue / Soon / empty). */
export function etaLabel(iso: string): string {
  const h = hoursUntil(iso);
  if (h < 0) return "Overdue";
  if (h <= 72) return "Soon";
  return "";
}
