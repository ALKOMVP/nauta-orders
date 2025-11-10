// src/lib/types.ts
export type OrderStatus = 'created' | 'in_transit' | 'arrived' | 'delivered' | 'canceled';

export type Order = {
  id: string;
  provider: string;
  status: OrderStatus;
  eta: string;
  updatedAt?: string;
};

export type OrdersList = {
  items: Order[];
  total: number;
  limit: number;
  page: number;
};
