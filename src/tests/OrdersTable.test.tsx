import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    // Minimal router used by the component for router.replace(...)
    useRouter: () => ({
      replace: vi.fn(),
      push: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    }),
    // Provide an empty URLSearchParams for tests (no filters by default)
    useSearchParams: () => new URLSearchParams(''),
  };
});

import { render, screen, waitFor } from '@testing-library/react';
import OrdersTable from '@/app/(orders)/OrdersTable';
import { renderWithQuery } from './renderWithQueryClient';

// Mock the exact module imported by the component
vi.mock('@/app/(orders)/orders.api', () => {
  return {
    fetchOrders: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'ORD-1001',
          provider: 'Nauta',
          status: 'created',
          eta: '2030-01-01T10:00:00.000Z',
          updatedAt: '2030-01-01T08:00:00.000Z',
        },
      ],
      total: 1,
      limit: 10,
      page: 1,
    }),
    patchStatus: vi.fn().mockResolvedValue({ ok: true }),
  };
});

describe('OrdersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list after loading', async () => {
    const { container } = render(renderWithQuery(<OrdersTable />));

    // Loading -> skeletons
    const skeletons = container.querySelectorAll('[data-testid="skeleton-row"]');
    expect(skeletons.length).toBeGreaterThan(0);

    // Then the mocked row appears
    await waitFor(() => expect(screen.getByText('Nauta')).toBeInTheDocument());
  });

  it('shows empty state', async () => {
    const api = await import('@/app/(orders)/orders.api');
    (api.fetchOrders as unknown as { mockResolvedValueOnce: (v: unknown) => void })
      .mockResolvedValueOnce({ items: [], total: 0, limit: 10, page: 1 });

    render(renderWithQuery(<OrdersTable />));

    await waitFor(() =>
      expect(screen.getByText(/No results/i)).toBeInTheDocument()
    );
  });
});
