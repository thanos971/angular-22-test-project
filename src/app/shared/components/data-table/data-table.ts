import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChildren,
  effect,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { DataTableCellDefDirective } from './data-table-cell-def.directive';
import { DataTableColumn, DateRange, NumberRange } from './data-table-column.model';

@Component({
  selector: 'app-data-table',
  imports: [
    NgTemplateOutlet,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable<T> {
  readonly data = input<T[]>([]);
  readonly columns = input<DataTableColumn<T>[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);
  readonly pageSize = input(10);
  readonly searchPlaceholder = input('Rechercher...');
  readonly noDataMessage = input('Aucun résultat ne correspond à votre recherche.');

  readonly retry = output<void>();

  private readonly cellDefs = contentChildren(DataTableCellDefDirective);

  protected readonly searchTerm = signal('');
  protected readonly columnFilters = signal<Record<string, unknown>>({});
  protected readonly visibleColumns = linkedSignal<Set<string>>(
    () => new Set(this.columns().filter((c) => c.visible !== false).map((c) => c.key))
  );

  protected readonly dataSource = new MatTableDataSource<T>([]);

  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);

  private readonly columnsByKey = computed(
    () => new Map(this.columns().map((c) => [c.key, c] as const))
  );

  protected readonly displayedColumns = computed(() =>
    this.columns()
      .filter((c) => this.visibleColumns().has(c.key))
      .map((c) => c.key)
  );

  protected readonly hasTextSearch = computed(() =>
    this.columns().some((c) => c.filterable && (c.filterType ?? 'text') === 'text')
  );

  protected readonly controlFilterColumns = computed(() =>
    this.columns().filter((c) => c.filterable && (c.filterType ?? 'text') !== 'text')
  );

  protected readonly hasActiveFilters = computed(
    () => this.searchTerm().trim().length > 0 || this.hasActiveColumnFilters()
  );

  /** Filtered rows (pre-pagination). Public so consumers can derive aggregates from it. */
  readonly filteredRows = computed(() => {
    const rows = this.data();
    const term = this.searchTerm().trim().toLowerCase();
    const filters = this.columnFilters();
    const cols = this.columns();

    return rows.filter((row) => {
      if (term) {
        const matchesSearch = cols
          .filter((c) => c.filterable && (c.filterType ?? 'text') === 'text')
          .some((c) => (c.filterPredicate ?? this.defaultTextPredicate.bind(this, c))(row, term));
        if (!matchesSearch) {
          return false;
        }
      }

      for (const col of cols) {
        if (!col.filterable || (col.filterType ?? 'text') === 'text') {
          continue;
        }
        const filterValue = filters[col.key];
        if (filterValue == null) {
          continue;
        }
        const predicate = col.filterPredicate ?? this.defaultPredicate.bind(this, col);
        if (!predicate(row, filterValue)) {
          return false;
        }
      }
      return true;
    });
  });

  /** Public so consumers can read counts/derive aggregates via a template reference variable. */
  readonly totalCount = computed(() => this.data().length);
  readonly filteredCount = computed(() => this.filteredRows().length);

  constructor() {
    effect(() => {
      this.dataSource.data = this.filteredRows();
    });

    effect(() => {
      const sort = this.sort();
      if (sort) {
        this.dataSource.sort = sort;
      }
    });

    effect(() => {
      const paginator = this.paginator();
      if (paginator) {
        this.dataSource.paginator = paginator;
      }
    });

    effect(() => {
      this.searchTerm();
      this.columnFilters();
      untracked(() => this.paginator()?.firstPage());
    });

    this.dataSource.sortingDataAccessor = (row, sortHeaderId) => {
      const col = this.columnsByKey().get(sortHeaderId);
      const value = col ? this.rawValue(row, col) : (row as Record<string, unknown>)[sortHeaderId];
      return typeof value === 'string' ? value.toLowerCase() : (value as string | number) ?? '';
    };
  }

  protected rawValue(row: T, col: DataTableColumn<T>): unknown {
    return col.getValue ? col.getValue(row) : (row as Record<string, unknown>)[col.key];
  }

  protected displayValue(row: T, col: DataTableColumn<T>): string {
    const value = this.rawValue(row, col);
    if (value == null) {
      return '';
    }
    return value instanceof Date ? value.toLocaleDateString() : String(value);
  }

  protected cellTemplate(key: string): TemplateRef<{ $implicit: T }> | null {
    return this.cellDefs().find((d) => d.column() === key)?.templateRef ?? null;
  }

  protected distinctValues(col: DataTableColumn<T>): string[] {
    const values = this.data().map((row) => String(this.rawValue(row, col) ?? ''));
    return Array.from(new Set(values)).sort();
  }

  protected isColumnVisible(key: string): boolean {
    return this.visibleColumns().has(key);
  }

  protected toggleColumn(key: string): void {
    const next = new Set(this.visibleColumns());
    if (next.has(key)) {
      if (next.size === 1) {
        return;
      }
      next.delete(key);
    } else {
      next.add(key);
    }
    this.visibleColumns.set(next);
  }

  protected setColumnFilter(key: string, value: unknown): void {
    this.columnFilters.update((filters) => ({ ...filters, [key]: value }));
  }

  protected selectFilterValue(key: string): string[] {
    return (this.columnFilters()[key] as string[] | undefined) ?? [];
  }

  protected numberFilterValue(key: string): NumberRange {
    return (this.columnFilters()[key] as NumberRange | undefined) ?? {};
  }

  protected setNumberFilter(key: string, part: keyof NumberRange, raw: string): void {
    const current = this.numberFilterValue(key);
    const parsed = raw === '' || raw == null ? undefined : Number(raw);
    this.setColumnFilter(key, { ...current, [part]: parsed });
  }

  protected dateFilterValue(key: string): DateRange {
    return (this.columnFilters()[key] as DateRange | undefined) ?? {};
  }

  protected setDateFilter(key: string, part: keyof DateRange, value: Date | null): void {
    const current = this.dateFilterValue(key);
    this.setColumnFilter(key, { ...current, [part]: value ?? undefined });
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.columnFilters.set({});
  }

  protected onRetry(): void {
    this.retry.emit();
  }

  private hasActiveColumnFilters(): boolean {
    return Object.values(this.columnFilters()).some((value) => {
      if (value == null) {
        return false;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).some((v) => v != null);
      }
      return true;
    });
  }

  private defaultTextPredicate(col: DataTableColumn<T>, row: T, term: unknown): boolean {
    const t = String(term ?? '').trim().toLowerCase();
    if (!t) {
      return true;
    }
    return String(this.rawValue(row, col) ?? '')
      .toLowerCase()
      .includes(t);
  }

  private defaultPredicate(col: DataTableColumn<T>, row: T, filterValue: unknown): boolean {
    const raw = this.rawValue(row, col);
    switch (col.filterType) {
      case 'number':
        return this.numberPredicate(raw, filterValue as NumberRange);
      case 'date':
        return this.datePredicate(raw, filterValue as DateRange);
      case 'select':
        return this.selectPredicate(raw, filterValue as string[]);
      default:
        return this.defaultTextPredicate(col, row, filterValue);
    }
  }

  private numberPredicate(raw: unknown, range: NumberRange | undefined): boolean {
    if (!range) {
      return true;
    }
    const value = Number(raw);
    if (range.min != null && value < range.min) {
      return false;
    }
    if (range.max != null && value > range.max) {
      return false;
    }
    return true;
  }

  private datePredicate(raw: unknown, range: DateRange | undefined): boolean {
    if (!range) {
      return true;
    }
    const value = raw instanceof Date ? raw : new Date(raw as string | number);
    if (range.from && value < range.from) {
      return false;
    }
    if (range.to && value > range.to) {
      return false;
    }
    return true;
  }

  private selectPredicate(raw: unknown, selected: string[] | undefined): boolean {
    if (!selected || !selected.length) {
      return true;
    }
    return selected.includes(String(raw));
  }
}
