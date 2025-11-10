// src/lib/types.ts
export type OrderStatus = 'created' | 'in_transit' | 'arrived' | 'delivered' | 'canceled';

export type Order = {
  id: string;
  provider: Provider;
  status: OrderStatus;
  eta: string;
  createdAt: string;
  updatedAt: string;
};

export type OrdersList = {
  items: Order[];
  total: number;
  limit: number;
  page: number;
};

export const PROVIDERS = ['Nauta', 'BlueX', 'Globex'] as const;

export type Provider = 'Nauta' | 'BlueX' | 'Globex';
