import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { DataTableCellDefDirective } from '../../../../shared/components/data-table/data-table-cell-def.directive';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table-column.model';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { Product } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';

const COLUMNS: DataTableColumn<Product>[] = [
  { key: 'image', label: 'Image' },
  { key: 'id', label: 'ID', sortable: true, visible: false },
  { key: 'title', label: 'Titre', sortable: true, filterable: true, filterType: 'text' },
  {
    key: 'category',
    label: 'Catégorie',
    sortable: true,
    filterable: true,
    filterType: 'select',
  },
  { key: 'price', label: 'Prix', sortable: true, filterable: true, filterType: 'number' },
  {
    key: 'description',
    label: 'Description',
    filterable: true,
    filterType: 'text',
    visible: false,
  },
];

@Component({
  selector: 'app-products-table',
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    DataTable,
    DataTableCellDefDirective,
  ],
  templateUrl: './products-table.html',
  styleUrl: './products-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsTable {
  private readonly productsService = inject(ProductsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly columns = COLUMNS;

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly table = viewChild<DataTable<Product>>('productsTable');

  protected readonly categories = computed(() =>
    Array.from(new Set(this.products().map((p) => p.category))).sort(),
  );

  protected readonly totalCount = computed(() => this.table()?.totalCount() ?? 0);
  protected readonly filteredCount = computed(() => this.table()?.filteredCount() ?? 0);

  protected readonly hasResults = computed(() => this.filteredCount() > 0);

  protected readonly averagePrice = computed(() => {
    const rows = this.table()?.filteredRows() ?? [];
    if (!rows.length) {
      return 0;
    }
    return rows.reduce((sum, product) => sum + product.price, 0) / rows.length;
  });

  constructor() {
    this.reload();
  }

  protected reload(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productsService
      .getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les produits. Veuillez réessayer.');
          this.loading.set(false);
        },
      });
  }

  protected categoryColorIndex(category: string): number {
    const index = this.categories().indexOf(category);
    return index === -1 ? 0 : index % 3;
  }
}
