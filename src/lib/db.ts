import type { Order, OrderStatus, Provider, OrdersList } from './types';

let ORDERS: Order[] | null = null;

const PROVIDERS: Provider[] = ['Nauta', 'BlueX', 'Globex'];
const STATUSES: OrderStatus[] = ['created', 'in_transit', 'arrived', 'delivered', 'canceled'];

const pad4 = (n: number) => n.toString().padStart(4, '0');
const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};
const pick = <T,>(arr: readonly T[], i: number) => arr[i % arr.length];

function seed(count = 100): Order[] {
  const now = new Date();
  const rows: Order[] = [];
  for (let i = 1; i <= count; i++) {
    const id = `ORD-${pad4(i)}`;
    rows.push({
      id,
      provider: pick(PROVIDERS, i),
      status: pick(STATUSES, i),
      eta: addDays(now, i - 10).toISOString(),
      createdAt: addDays(now, -15).toISOString(),
      updatedAt: addDays(now, -1).toISOString(),
    });
  }
  return rows;
}

function ensure() {
  if (!ORDERS) ORDERS = seed(100);
}

export type ListParams = {
  status?: string | null;
  provider?: string | null;
  page?: number;
  limit?: number;
  sort?: 'eta' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
};

export function listOrders(params: ListParams): OrdersList {
  ensure();
  const {
    status,
    provider,
    page = 1,
    limit = 10,
    sort = 'eta',
    order = 'asc',
  } = params;

  let data = ORDERS!;
  if (status) data = data.filter(o => o.status === status);
  if (provider) data = data.filter(o => o.provider === provider);

  const sorted = [...data].sort((a, b) => {
    const av = new Date(a[sort]).getTime();
    const bv = new Date(b[sort]).getTime();
    return order === 'asc' ? av - bv : bv - av;
  });

  const start = (page - 1) * limit;
  const items = sorted.slice(start, start + limit);
  return { items, total: data.length, page, limit };
}

export function getOrder(id: string) {
  ensure();
  return ORDERS!.find(o => o.id === id);
}

export function updateOrder(id: string, patch: Partial<Pick<Order, 'status' | 'provider' | 'eta'>>) {
  ensure();
  const idx = ORDERS!.findIndex(o => o.id === id);
  if (idx === -1) return undefined;
  const updated: Order = { ...ORDERS![idx], ...patch, updatedAt: new Date().toISOString() };
  ORDERS![idx] = updated;
  return updated;
}
