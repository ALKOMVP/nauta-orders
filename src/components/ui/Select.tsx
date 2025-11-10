import * as React from "react";
import clsx from "clsx";

type Props = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...rest }: Props) {
  return (
    <select
      className={clsx(
        "h-9 rounded-2xl border border-slate-200 bg-white px-3 pr-8 text-sm",
        "outline-none transition-shadow focus:ring-2 focus:ring-blue-500/40",
        "dark:bg-slate-900 dark:border-slate-700",
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
