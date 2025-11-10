"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus, OrdersList } from "@/lib/types";
import { canTransition, nextStatuses } from "@/lib/transitions";
import { etaClass, etaLabel } from "@/lib/eta";
import { fetchOrders, patchStatus, getOrderById } from "./orders.api";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Chip, StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import OrderDetailModal from "./OrderDetailModal";
import { useQuery as useRQ } from "@tanstack/react-query";

function InlineAlert({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const base =
    type === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900"
      : "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-3 rounded-2xl px-3 py-2 text-xs ring-1 ${base}`}
    >
      {message}
    </div>
  );
}

export default function OrdersTable() {
  const qc = useQueryClient();
  const router = useRouter();

  const getInitialParams = () => {
    const sp =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    const status = sp.get("status") ?? "";
    const provider = sp.get("provider") ?? "";
    const page = Math.max(1, Number(sp.get("page") ?? 1));
    return { status, provider, page };
  };

  const [{ status, provider, page }, setState] = useState(getInitialParams);

  const [limit] = useState(10);
  const sort = "eta" as const;
  const order: "asc" | "desc" = "asc";

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (provider) params.set("provider", provider);
    if (page !== 1) params.set("page", String(page));
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [status, provider, page, router]);

  const ordersKey = useMemo(
    () => ["orders", { status, provider, page, limit, sort, order }] as const,
    [status, provider, page, limit, sort, order]
  );

  const q: UseQueryResult<OrdersList> = useQuery({
    queryKey: ordersKey,
    queryFn: () => fetchOrders({ page, limit, status, provider, sort, order }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const mut = useMutation({
    mutationFn: (p: { id: string; status: OrderStatus }) =>
      patchStatus(p.id, p.status),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["orders"] });
      const prev = qc.getQueryData<OrdersList>(ordersKey);
      if (prev) {
        qc.setQueryData<OrdersList>(ordersKey, {
          ...prev,
          items: prev.items.map((o) =>
            o.id === vars.id
              ? {
                  ...o,
                  status: vars.status,
                  updatedAt: new Date().toISOString(),
                }
              : o
          ),
        });
      }
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(ordersKey, ctx.prev);
      setAlert({
        type: "error",
        message: "Update failed. Changes were reverted.",
      });
    },
    onSuccess: () => {
      setAlert({ type: "success", message: "Status updated successfully." });
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ["orders"] });
      setTimeout(() => setAlert(null), 2200);
    },
  });

  const data: Order[] = q.data?.items ?? [];
  const total = q.data?.total ?? 0;

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const detailQ = useRQ({
    queryKey: ["order", selectedId],
    queryFn: () => getOrderById(selectedId as string),
    enabled: open && !!selectedId,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <Chip aria-label="Total orders">{total} total</Chip>
      </div>

      {alert && <InlineAlert type={alert.type} message={alert.message} />}

      <div className="mb-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setState((s) => ({ ...s, status: e.target.value, page: 1 }));
            }}
          >
            <option value="">All status</option>
            <option value="created">created</option>
            <option value="in_transit">in_transit</option>
            <option value="arrived">arrived</option>
            <option value="delivered">delivered</option>
            <option value="canceled">canceled</option>
          </Select>

          <Select
            aria-label="Filter by provider"
            value={provider}
            onChange={(e) => {
              setState((s) => ({ ...s, provider: e.target.value, page: 1 }));
            }}
          >
            <option value="">All providers</option>
            <option value="Nauta">Nauta</option>
            <option value="BlueX">BlueX</option>
            <option value="Globex">Globex</option>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setState({ status: "", provider: "", page: 1 });
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="max-h-[65vh] overflow-auto rounded-3xl">
          <table className="w-full text-sm">
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
              {q.isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr
                    key={i}
                    data-testid="skeleton-row"
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

              {!q.isLoading && data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6">
                    <EmptyState
                      title="No results"
                      hint="Try adjusting filters."
                    />
                  </td>
                </tr>
              )}

              {data.map((o) => (
                <tr
                  key={o.id}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-900/40"
                  onClick={() => {
                    setSelectedId(o.id);
                    setOpen(true);
                  }}
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {o.id}
                  </td>
                  <td className="px-4 py-3">
                    <Chip>{o.provider}</Chip>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className={`px-4 py-3 ${etaClass(o.eta)}`}>
                    {new Date(o.eta).toLocaleString()}
                    {(() => {
                      const tag = etaLabel(o.eta);
                      return tag ? (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200">
                          {tag}
                        </span>
                      ) : null;
                    })()}
                  </td>
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Select
                      aria-label={`Change status for ${o.id}`}
                      value={o.status}
                      onChange={(e) => {
                        const next = e.target.value as OrderStatus;
                        if (!canTransition(o.status, next)) return;
                        mut.mutate({ id: o.id, status: next });
                      }}
                      className="min-w-[9rem]"
                    >
                      <option value={o.status}>
                        {o.status.replace("_", " ")}
                      </option>
                      {nextStatuses(o.status).map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </Select>
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
            <Button
              aria-label="Previous page"
              variant="secondary"
              size="sm"
              onClick={() =>
                setState((s) => ({ ...s, page: Math.max(1, s.page - 1) }))
              }
              disabled={page === 1 || q.isFetching}
            >
              Prev
            </Button>
            <Button
              aria-label="Next page"
              variant="secondary"
              size="sm"
              onClick={() => setState((s) => ({ ...s, page: s.page + 1 }))}
              disabled={
                q.isFetching ||
                (q.data &&
                typeof q.data.limit === "number" &&
                typeof q.data.total === "number"
                  ? page * q.data.limit >= q.data.total
                  : false)
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <OrderDetailModal
        open={open}
        order={detailQ.data ?? null}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
