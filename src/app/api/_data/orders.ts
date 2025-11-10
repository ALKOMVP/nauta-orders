// app/api/_data/orders.ts
export type OrderStatus = "created" | "in_transit" | "arrived" | "delivered" | "canceled" ;

export type Order = {
  id: number;
  reference: string;
  provider: string;
  status: OrderStatus;
  eta?: string;            // ISO 8601
  origin?: string;
  destination?: string;
  createdAt?: string;
  updatedAt?: string;
};

let nextId = 41;

export let ORDERS: Order[] = Array.from({ length: 40 }).map((_, i) => ({
  id: i + 1,
  reference: `ORD-${String(i + 1).padStart(4, "0")}`,
  provider: i % 3 === 0 ? "Nauta" : i % 3 === 1 ? "BlueX" : "Globex",
  status: (["created", "in_transit", "arrived", "delivered", "canceled"] as OrderStatus[])[i % 5],
  eta: new Date(Date.now() + (i - 10) * 24 * 3600 * 1000).toISOString(),
  origin: ["SCL", "EZE", "LIM", "BOG"][i % 4],
  destination: ["MIA", "GIG", "SCL", "EZE"][i % 4],
  createdAt: new Date(Date.now() - (15 - i % 15) * 24 * 3600 * 1000).toISOString(),
  updatedAt: new Date().toISOString()
}));

export function updateOrder(id: number, patch: Partial<Order>) {
  ORDERS = ORDERS.map(o => (o.id === id ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o));
}

export function createOrder(input: Omit<Order, "id">) {
  const order = { ...input, id: nextId++ };
  ORDERS.push(order);
  return order;
}
