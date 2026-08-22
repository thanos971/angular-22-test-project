import { NgClass, NgTemplateOutlet } from '@angular/common';
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
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
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
import { ColumnPicker } from './column-picker/column-picker';
import { ColumnFilterCell } from './column-filter-cell/column-filter-cell';

@Component({
  selector: 'app-data-table',
  imports: [
    NgClass,
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
    MatProgressSpinnerModule,
    ColumnPicker,
    ColumnFilterCell,
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
  readonly selectionChange = output<T[]>();

  readonly selectionMode = input<'none' | 'single' | 'multiple'>('none');
  readonly rowClass = input<(row: T) => string>(() => '');
  readonly rowDisabled = input<(row: T) => boolean>(() => false);

  private readonly cellDefs = contentChildren(DataTableCellDefDirective);

  protected readonly searchTerm = signal('');
  protected readonly columnFilters = signal<Record<string, unknown>>({});
  protected readonly visibleColumns = linkedSignal<Set<string>>(
    () =>
      new Set(
        this.columns()
          .filter((c) => c.visible !== false)
          .map((c) => c.key),
      ),
  );

  protected readonly columnOrder = linkedSignal<string[]>(() => this.columns().map((c) => c.key));
  protected readonly selection = signal(new Set<T>());

  protected readonly dataSource = new MatTableDataSource<T>([]);

  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);

  private readonly columnsByKey = computed(
    () => new Map(this.columns().map((c) => [c.key, c] as const)),
  );

  protected readonly orderedColumns = computed(() => {
    const byKey = this.columnsByKey();
    return this.columnOrder()
      .map((key) => byKey.get(key)!)
      .filter(Boolean);
  });

  protected readonly displayedColumns = computed(() => {
    const cols = this.columnOrder().filter((key) => this.visibleColumns().has(key));
    return this.selectionMode() !== 'none' ? ['__select__', ...cols] : cols;
  });

  protected readonly isAllSelected = computed(() => {
    const rows = this.filteredRows().filter((r) => !this.rowDisabled()(r));
    const sel = this.selection();
    return rows.length > 0 && rows.every((r) => sel.has(r));
  });

  protected readonly isSomeSelected = computed(() => {
    const rows = this.filteredRows().filter((r) => !this.rowDisabled()(r));
    const sel = this.selection();
    return sel.size > 0 && rows.some((r) => sel.has(r)) && !rows.every((r) => sel.has(r));
  });

  protected readonly showFilters = signal(false);

  protected readonly hasTextSearch = computed(() =>
    this.columns().some((c) => c.filterable && (c.filterType ?? 'text') === 'text'),
  );

  protected readonly hasFilterableColumns = computed(() =>
    this.columns().some((c) => c.filterable),
  );

  protected readonly filterDisplayedColumns = computed(() => {
    const cols = this.columnOrder()
      .filter((key) => this.visibleColumns().has(key))
      .map((key) => key + '__f');
    return this.selectionMode() !== 'none' ? ['__select____f', ...cols] : cols;
  });

  protected readonly hasActiveFilters = computed(
    () => this.searchTerm().trim().length > 0 || this.hasActiveColumnFilters(),
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
        if (!col.filterable) continue;
        const filterValue = filters[col.key];
        if (filterValue == null || filterValue === '') continue;
        const predicate = col.filterPredicate ?? this.defaultPredicate.bind(this, col);
        if (!predicate(row, filterValue)) return false;
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

    // Remove stale references from selection when data is replaced
    effect(() => {
      const validSet = new Set(this.data());
      untracked(() => {
        const current = this.selection();
        const cleaned = new Set([...current].filter((r) => validSet.has(r)));
        if (cleaned.size !== current.size) {
          this.selection.set(cleaned);
          this.selectionChange.emit([...cleaned]);
        }
      });
    });

    this.dataSource.sortingDataAccessor = (row, sortHeaderId) => {
      const col = this.columnsByKey().get(sortHeaderId);
      const value = col ? this.rawValue(row, col) : (row as Record<string, unknown>)[sortHeaderId];
      return typeof value === 'string' ? value.toLowerCase() : ((value as string | number) ?? '');
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

  protected setColumnFilter(key: string, value: unknown): void {
    this.columnFilters.update((filters) => ({ ...filters, [key]: value }));
  }

  protected isSelected(row: T): boolean {
    return this.selection().has(row);
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.columnFilters.set({});
  }

  protected toggleRow(row: T): void {
    const mode = this.selectionMode();
    if (mode === 'none') return;
    if (this.rowDisabled()(row)) return;
    const next = new Set(this.selection());
    if (next.has(row)) {
      next.delete(row);
    } else {
      if (mode === 'single') next.clear();
      next.add(row);
    }
    this.selection.set(next);
    this.selectionChange.emit([...next]);
  }

  protected toggleAll(): void {
    const rows = this.filteredRows().filter((r) => !this.rowDisabled()(r));
    const next = new Set(this.selection());
    if (rows.every((r) => next.has(r))) {
      rows.forEach((r) => next.delete(r));
    } else {
      rows.forEach((r) => next.add(r));
    }
    this.selection.set(next);
    this.selectionChange.emit([...next]);
  }

  protected moveColumn(event: { previousIndex: number; currentIndex: number }): void {
    const order = [...this.columnOrder()];
    moveItemInArray(order, event.previousIndex, event.currentIndex);
    this.columnOrder.set(order);
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

  protected onRetry(): void {
    this.retry.emit();
  }

  protected hasActiveColumnFilters(): boolean {
    return Object.values(this.columnFilters()).some((value) => this.isFilterValueActive(value));
  }

  protected activeColumnFilterCount(): number {
    return Object.values(this.columnFilters()).filter((value) => this.isFilterValueActive(value))
      .length;
  }

  private isFilterValueActive(value: unknown): boolean {
    if (value == null || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).some((v) => v != null);
    }
    return true;
  }

  private defaultTextPredicate(col: DataTableColumn<T>, row: T, term: unknown): boolean {
    const t = String(term ?? '')
      .trim()
      .toLowerCase();
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
