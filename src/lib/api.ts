export type Order = {
    id: string;
    reference: string;
    provider: string;
    status: string;
    eta: string;
  };

  export async function listOrders(): Promise<Order[]> {
    return [];
  }
  