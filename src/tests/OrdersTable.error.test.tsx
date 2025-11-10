import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useRouter: () => ({
      replace: vi.fn(),
      push: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(''),
  };
});

import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import OrdersTable from '@/app/(orders)/OrdersTable';
import { renderWithQuery } from './renderWithQueryClient';

// Mock the exact API module the component imports
vi.mock('@/app/(orders)/orders.api', () => {
  return {
    fetchOrders: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'ORD-1000',
          provider: 'Nauta',
          status: 'created', // allowed next: in_transit / canceled
          eta: '2030-01-01T10:00:00.000Z',
          updatedAt: '2030-01-01T08:00:00.000Z',
        },
      ],
      total: 1,
      limit: 10,
      page: 1,
    }),
    // Force the mutation to fail to test rollback + alert
    patchStatus: vi.fn().mockRejectedValue(new Error('boom')),
    getOrderById: vi.fn().mockResolvedValue({
      id: 'ORD-1000',
      provider: 'Nauta',
      status: 'created',
      eta: '2030-01-01T10:00:00.000Z',
      updatedAt: '2030-01-01T08:00:00.000Z',
    }),
  };
});

describe('OrdersTable - mutation error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error alert and rolls back status when patch fails', async () => {
    render(renderWithQuery(<OrdersTable />));

    await waitFor(() => expect(screen.getByText('ORD-1000')).toBeInTheDocument());

    // Open the select and choose a valid next status (created -> in_transit)
    const cell = screen.getByLabelText(/Change status for ORD-1000/i).closest('td')!;
    const select = within(cell).getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'in_transit' } });

    // Error alert appears
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/Update failed/i)
    );

    // Value rolls back to the original 'created'
    expect(select.value).toBe('created');
  });
});
