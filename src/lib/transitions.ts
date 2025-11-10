import type { OrderStatus } from './types';

const FLOW: Record<OrderStatus, OrderStatus[]> = {
  created: ['in_transit', 'canceled'],
  in_transit: ['arrived', 'canceled'],
  arrived: ['delivered'],
  delivered: [],
  canceled: [],
};

export function nextStatuses(s: OrderStatus): OrderStatus[] {
  return FLOW[s] ?? [];
}

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return FLOW[from]?.includes(to) ?? false;
}
