import { NextRequest, NextResponse } from 'next/server';
import { getOrder, updateOrder } from '@/lib/db';
import { canTransition } from '@/lib/transitions';
import type { OrderStatus } from '@/lib/types';

function coerceId(raw: string) {
  return /^\d+$/.test(raw) ? `ORD-${raw.padStart(4, '0')}` : raw;
}

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: raw } = await ctx.params;
  const id = coerceId(String(raw));
  const order = getOrder(id);
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: raw } = await ctx.params;
  const id = coerceId(String(raw));

  const body = await req.json().catch(() => null);
  const next: OrderStatus | undefined = body?.status;

  const current = getOrder(id);
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!next) return NextResponse.json({ error: 'Missing status' }, { status: 400 });

  if (next === current.status) {
    return NextResponse.json(current);
  }
  if (!canTransition(current.status, next)) {
    return NextResponse.json({ error: 'Invalid transition', from: current.status, to: next }, { status: 422 });
  }

  const updated = updateOrder(id, { status: next });
  return NextResponse.json(updated);
}
