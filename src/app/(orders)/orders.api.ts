// Local in-memory mock with latency and error simulation.
// If NEXT_PUBLIC_API_URL is set, you can switch to real HTTP calls.
// This file centralizes filtering, sorting, pagination, and mutations.

import type { OrdersList, Order, OrderStatus } from '@/lib/types';

type Query = {
  page: number;
  limit: number;
  status?: string;
  provider?: string;
  sort?: keyof Order | 'eta';
  order?: 'asc' | 'desc';
};

// ---- Config knobs via ENV (safe defaults) ----
const DELAY_MS = Number(process.env.NEXT_PUBLIC_MOCK_DELAY_MS ?? 400);
const ERROR_RATE = Number(process.env.NEXT_PUBLIC_MOCK_ERROR_RATE ?? 0); // e.g. 0.15 = 15%

// ---- Demo seed (local only) ----
const PROVIDERS = ['Nauta', 'BlueX', 'Globex'] as const;
const STATUSES: OrderStatus[] = ['created', 'in_transit', 'arrived', 'delivered', 'canceled'];

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

let DB: Order[] = Array.from({ length: 100 }).map((_, i) => {
  const provider = PROVIDERS[i % PROVIDERS.length];
  const status = STATUSES[i % STATUSES.length];
  return {
    id: `ORD-${String(1000 + i)}`,
    provider,
    status,
    eta: daysFromNow((i % 10) - 3),
    createdAt: daysFromNow(-(15 + (i % 7))), // ✅ agrega createdAt
    updatedAt: daysFromNow(-(i % 5)),
  };
});

// ---- Helpers ----
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const maybeFail = () => {
  if (ERROR_RATE > 0 && Math.random() < ERROR_RATE) {
    const err = new Error('Mocked network error');
    // Throw to trigger React Query error path
    throw err;
  }
};

function applyFilters(items: Order[], q: Query) {
  let out = [...items];
  if (q.status) out = out.filter((o) => o.status === q.status);
  if (q.provider) out = out.filter((o) => o.provider === q.provider);

  const dir = q.order === 'desc' ? -1 : 1;
  const key = (q.sort ?? 'eta') as keyof Order;

  out.sort((a, b) => {
    const va = a[key] ?? '';
    const vb = b[key] ?? '';
    return va > vb ? dir : va < vb ? -dir : 0;
  });

  return out;
}

function paginate(items: Order[], page: number, limit: number): OrdersList {
  const p = Math.max(1, page || 1);
  const l = Math.max(1, limit || 10);
  const start = (p - 1) * l;
  const end = start + l;
  return {
    items: items.slice(start, end),
    total: items.length,
    limit: l,
    page: p,
  };
}

// ---- Public API (local-first with optional HTTP) ----
export async function fetchOrders(q: Query): Promise<OrdersList> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) {
    const params = new URLSearchParams({
      page: String(q.page),
      limit: String(q.limit),
      status: q.status ?? '',
      provider: q.provider ?? '',
      sort: q.sort ?? 'eta',
      order: q.order ?? 'asc',
    });
    const res = await fetch(`${base}/orders?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json() as Promise<OrdersList>;
  }

  // Local mock behavior with latency and optional random errors
  await sleep(DELAY_MS);
  maybeFail();

  const filtered = applyFilters(DB, q);
  return paginate(filtered, q.page, q.limit);
}

export async function getOrderById(id: string): Promise<Order> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) {
    const res = await fetch(`${base}/orders/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Not found');
    return res.json() as Promise<Order>;
  }

  await sleep(DELAY_MS);
  const found = DB.find((o) => o.id === id);
  if (!found) throw new Error('Not found');
  return found;
}

export async function patchStatus(id: string, status: OrderStatus) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) {
    const res = await fetch(`${base}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  }

  // Local mock mutation with latency and optional random errors
  await sleep(DELAY_MS);
  maybeFail();

  DB = DB.map((o) => (o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o));
  return { ok: true };
}
