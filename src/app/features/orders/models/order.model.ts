export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  date: Date;
  status: OrderStatus;
  total: number;
  items: number;
  country: string;
  active: boolean;
}
