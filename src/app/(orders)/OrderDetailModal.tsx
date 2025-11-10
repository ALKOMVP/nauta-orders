"use client";

import { useEffect } from "react";
import type { Order } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Chip, StatusBadge } from "@/components/ui/Badge";

type Props = {
  open: boolean;
  order?: Order | null;
  onClose: () => void;
};

// Simple modal without external deps (accessible enough for the challenge).
export default function OrderDetailModal({ open, order, onClose }: Props) {

  useEffect(() => {
    let prevOverflow: string | null = null;
    if (open) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (prevOverflow !== null) {
        document.body.style.overflow = prevOverflow;
      }
    };
  }, [open]);

  if (!open || !order) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Order details"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-[560px] max-w-[92vw] rounded-3xl bg-white p-5 shadow-xl dark:bg-slate-950">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Order {order.id}</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </Button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Provider</span>
            <Chip>{order.provider}</Chip>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Status</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">ETA</span>
            <span>{new Date(order.eta).toLocaleString()}</span>
          </div>
          {order.updatedAt && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Updated</span>
              <span>{new Date(order.updatedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
