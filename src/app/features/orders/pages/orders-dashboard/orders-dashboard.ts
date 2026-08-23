import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { DataTableCellDefDirective } from '../../../../shared/components/data-table/data-table-cell-def.directive';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table-column.model';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { Order, OrderStatus } from '../../models/order.model';
import { OrdersService } from '../../services/orders.service';
import { OrderEditDialog } from './order-edit-dialog';
import { OrderDeleteDialog } from './order-delete-dialog';
import { MatBadgeModule } from '@angular/material/badge';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  processing: 'En cours',
  shipped: 'Expédié',
  delivered: 'Livré',
  cancelled: 'Annulé',
};

const COLUMNS: DataTableColumn<Order>[] = [
  { key: 'id', label: 'N° commande', sortable: true },
  { key: 'customerName', label: 'Client', sortable: true, filterable: true, filterType: 'text' },
  { key: 'customerEmail', label: 'Email', filterable: true, filterType: 'text', visible: false },
  { key: 'date', label: 'Date', sortable: true, filterable: true, filterType: 'date' },
  {
    key: 'status',
    label: 'Statut',
    sortable: true,
    filterable: true,
    filterType: 'select',
    getValue: (o) => STATUS_LABELS[o.status],
    filterPredicate: (o, v) =>
      !!(v as string[])?.length && (v as string[]).includes(STATUS_LABELS[o.status]),
  },
  { key: 'country', label: 'Pays', sortable: true, filterable: true, filterType: 'select' },
  {
    key: 'items',
    label: 'Articles',
    sortable: true,
    getValue: (o) => o.items.reduce((s, i) => s + i.quantity, 0),
    filterable: true,
    filterType: 'text',
    filterPredicate: (o, term) => {
      const t = String(term ?? '')
        .trim()
        .toLowerCase();
      if (!t) return true;
      return o.items.some(
        (i) => i.productName.toLowerCase().includes(t) || String(i.quantity).includes(t),
      );
    },
  },
  { key: 'total', label: 'Total', sortable: true, filterable: true, filterType: 'number' },
  { key: 'active', label: 'Actif', sortable: true },
  { key: 'actions', label: '' },
];

@Component({
  selector: 'app-orders-dashboard',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatBadgeModule,
    MatIconModule,
    MatSlideToggleModule,
    MatCardModule,
    DataTable,
    DataTableCellDefDirective,
  ],
  templateUrl: './orders-dashboard.html',
  styleUrl: './orders-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersDashboard {
  private readonly ordersService = inject(OrdersService);
  private readonly dialog = inject(MatDialog);

  protected readonly columns = COLUMNS;

  protected readonly orders = signal<Order[]>(this.ordersService.getOrders());
  protected readonly selectedOrders = signal<Order[]>([]);

  private readonly table = viewChild<DataTable<Order>>('ordersTable');

  protected readonly totalCount = computed(() => this.table()?.totalCount() ?? 0);
  protected readonly filteredCount = computed(() => this.table()?.filteredCount() ?? 0);

  protected readonly pendingCount = computed(
    () => this.orders().filter((o) => o.status === 'pending' || o.status === 'processing').length,
  );

  protected readonly revenue = computed(() =>
    (this.table()?.filteredRows() ?? []).reduce((sum, o) => sum + o.total, 0),
  );

  protected readonly averageOrder = computed(() => {
    const rows = this.table()?.filteredRows() ?? [];
    return rows.length ? rows.reduce((s, o) => s + o.total, 0) / rows.length : 0;
  });

  protected readonly selectionRevenue = computed(() =>
    this.selectedOrders().reduce((s, o) => s + o.total, 0),
  );

  protected readonly orderRowClass = (order: Order): string => (order.active ? '' : 'row-inactive');
  protected readonly orderRowDisabled = (order: Order): boolean => !order.active;

  protected statusLabel(status: OrderStatus): string {
    return STATUS_LABELS[status];
  }

  protected statusClass(status: OrderStatus): string {
    return `status-badge status-${status}`;
  }

  protected onSelectionChange(orders: Order[]): void {
    this.selectedOrders.set(orders);
  }

  protected toggleActive(order: Order, event: MouseEvent): void {
    event.stopPropagation();
    this.orders.update((list) =>
      list.map((o) => (o.id === order.id ? { ...o, active: !o.active } : o)),
    );
  }

  protected editOrder(order: Order, event: MouseEvent): void {
    event.stopPropagation();
    this.dialog
      .open(OrderEditDialog, { data: order, minWidth: '800px' })
      .afterClosed()
      .subscribe((updated: Order | null) => {
        if (updated) {
          this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
        }
      });
  }

  protected deleteOrder(order: Order, event: MouseEvent): void {
    event.stopPropagation();
    this.dialog
      .open(OrderDeleteDialog, { data: order, width: '400px' })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (confirmed) {
          this.orders.update((list) => list.filter((o) => o.id !== order.id));
        }
      });
  }

  protected addNewOrder(): void {
    this.dialog
      .open(OrderEditDialog, { data: null, width: '800px' })
      .afterClosed()
      .subscribe((newOrder: Order | null) => {
        if (newOrder) {
          this.orders.update((list) => [...list, newOrder]);
        }
      });
  }
}
