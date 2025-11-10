"use client";

import { useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { fetchOrders, patchStatus } from "./orders.api";
import type { Order, OrderStatus, OrdersList } from "@/lib/types";
import { canTransition, nextStatuses } from "@/lib/transitions";
import { isOverdue, isNear } from "@/lib/eta";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeList(payload: any): {
  items: Order[];
  total: number;
  limit?: number;
} {
  const items: Order[] = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  const total =
    typeof payload?.total === "number" ? payload.total : items.length;
  const limit = typeof payload?.limit === "number" ? payload.limit : undefined;
  return { items, total, limit };
}

function currentSearch(): URLSearchParams {
  return typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
}

function buildQS(overrides: Record<string, string | undefined>): Route {
  const q = currentSearch();
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined || v === "") q.delete(k);
    else q.set(k, v);
  }
  const s = q.toString();
  return (s ? `/?${s}` : "/") as Route;
}

export default function OrdersPage() {
  const router = useRouter();

  const sp = currentSearch();
  const page = Math.max(1, Number(sp.get("page") || "1"));
  const limit = Math.max(1, Number(sp.get("limit") || "10"));
  const status = sp.get("status") || "";
  const provider = sp.get("provider") || "";

  const qc = useQueryClient();

  const queryKey = useMemo(
    () => ["orders", { page, limit, status, provider }] as const,
    [page, limit, status, provider]
  );

  const { data, isLoading, isFetching, isError } = useQuery<OrdersList>({
    queryKey,
    queryFn: () => fetchOrders({ page, limit, status, provider }),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const { items, total, limit: apiLimit } = normalizeList(data);
  const effectiveLimit = apiLimit ?? limit;

  const mut = useMutation({
    mutationFn: (p: { id: string; status: OrderStatus }) =>
      patchStatus(String(p.id), p.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const applyFilter = (k: "status" | "provider", v: string) => {
    router.push(buildQS({ [k]: v || undefined, page: "1" }));
  };

  const goPrev = () => {
    if (page <= 1) return;
    router.push(buildQS({ page: String(page - 1) }));
  };

  const hasNext = total > page * effectiveLimit;
  const goNext = () => {
    if (!hasNext) return;
    router.push(buildQS({ page: String(page + 1) }));
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-200">
          {total} total
        </span>
      </div>

      {isError && (
        <div
          role="alert"
          className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
        >
          Failed to load orders. Please try again.
        </div>
      )}

      <div className="mb-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by status"
            className="h-9 rounded-2xl border border-slate-200 bg-white px-3 pr-8 text-sm outline-none transition-shadow focus:ring-2 focus:ring-blue-500/40 dark:bg-slate-900 dark:border-slate-700"
            value={status}
            onChange={(e) => applyFilter("status", e.target.value)}
            disabled={isFetching}
          >
            <option value="">All status</option>
            <option value="created">created</option>
            <option value="in_transit">in_transit</option>
            <option value="arrived">arrived</option>
            <option value="delivered">delivered</option>
            <option value="canceled">canceled</option>
          </select>

          <select
            aria-label="Filter by provider"
            className="h-9 rounded-2xl border border-slate-200 bg-white px-3 pr-8 text-sm outline-none transition-shadow focus:ring-2 focus:ring-blue-500/40 dark:bg-slate-900 dark:border-slate-700"
            value={provider}
            onChange={(e) => applyFilter("provider", e.target.value)}
            disabled={isFetching}
          >
            <option value="">All providers</option>
            <option value="Nauta">Nauta</option>
            <option value="BlueX">BlueX</option>
            <option value="Globex">Globex</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl bg-transparent px-3 text-xs font-medium transition-colors hover:bg-slate-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-white dark:hover:bg-slate-800/60 dark:ring-offset-slate-950 h-8"
              onClick={() =>
                router.push(
                  buildQS({
                    status: undefined,
                    provider: undefined,
                    page: "1",
                  })
                )
              }
              disabled={isFetching || (!status && !provider)}
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="max-h-[65vh] overflow-auto rounded-3xl">
          <table
            className="w-full text-sm"
            role="table"
            aria-label="Orders table"
          >
            <thead className="sticky top-0 z-10 bg-white/80 backdrop-blur dark:bg-slate-950/80">
              <tr className="text-left text-slate-500">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">ETA</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr
                      key={`sk-${i}`}
                      className="animate-pulse border-t border-slate-100 dark:border-slate-800"
                    >
                      <td className="px-4 py-4">
                        <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-20 rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-5 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-40 rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-9 w-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6">
                    <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
                      <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800" />
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        No results
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Try adjusting filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {items.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-slate-100 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-900/40"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {o.id}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-200">
                      {o.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs capitalize bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-200">
                      {String(o.status).replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    <span
                      className={
                        isOverdue(o.eta)
                          ? "text-red-600"
                          : isNear(o.eta)
                            ? "text-amber-600"
                            : ""
                      }
                    >
                      {o.eta ? new Date(o.eta).toLocaleString() : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Change status for ${o.id}`}
                      className="min-w-[9rem] h-9 rounded-2xl border border-slate-200 bg-white px-3 pr-8 text-sm outline-none transition-shadow focus:ring-2 focus:ring-blue-500/40 dark:bg-slate-900 dark:border-slate-700"
                      value={o.status}
                      disabled={mut.isPending}
                      onChange={(e) => {
                        const next = e.target.value as OrderStatus;
                        if (!canTransition(o.status, next)) return;
                        mut.mutate({ id: String(o.id), status: next });
                      }}
                    >
                      {nextStatuses(o.status).map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-3 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Page{" "}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {page}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              aria-label="Previous page"
              className="inline-flex h-8 items-center justify-center rounded-2xl bg-slate-100 px-3 text-xs text-slate-900 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              onClick={goPrev}
              disabled={page <= 1 || isFetching}
            >
              Prev
            </button>
            <button
              aria-label="Next page"
              className="inline-flex h-8 items-center justify-center rounded-2xl bg-slate-100 px-3 text-xs text-slate-900 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              onClick={goNext}
              disabled={!hasNext || isFetching}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
