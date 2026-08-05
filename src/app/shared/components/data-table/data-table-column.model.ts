export type DataTableFilterType = 'text' | 'number' | 'date' | 'select';

export interface NumberRange {
  min?: number;
  max?: number;
}

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface DataTableColumn<T = unknown> {
  /** Property name on `T` (or a virtual key when `getValue` is provided). */
  key: string;
  /** Header label. */
  label: string;
  /** Enables `matSort` for this column. Defaults to `false`. */
  sortable?: boolean;
  /** Enables filtering for this column. Defaults to `false`. */
  filterable?: boolean;
  /** Filter control/behavior for this column. Defaults to `'text'`. */
  filterType?: DataTableFilterType;
  /** Whether the column is visible initially. Defaults to `true`. */
  visible?: boolean;
  /** Derives the comparable/filterable value for a row. Defaults to `row[key]`. */
  getValue?: (row: T) => unknown;
  /**
   * Overrides the default filter logic for this column.
   * Receives the raw filter value: a string for `'text'`, a `NumberRange` for
   * `'number'`, a `DateRange` for `'date'`, or a `string[]` for `'select'`.
   */
  filterPredicate?: (row: T, filterValue: unknown) => boolean;
}
