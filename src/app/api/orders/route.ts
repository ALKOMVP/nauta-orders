import { NextRequest, NextResponse } from 'next/server';
import { listOrders } from '@/lib/db';

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Accept both JSON Server and our own param names
  const page = Number(searchParams.get('page') ?? searchParams.get('_page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? searchParams.get('_limit') ?? '10');
  const status = searchParams.get('status');
  const provider = searchParams.get('provider');
  const sort = (searchParams.get('_sort') as any) ?? 'eta';
  const order = (searchParams.get('_order') as any) ?? 'asc';

  const data = listOrders({ status, provider, page, limit, sort, order });
  return NextResponse.json(data);
}
