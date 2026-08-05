import { Directive, TemplateRef, inject, input } from '@angular/core';

export interface DataTableCellContext<T> {
  $implicit: T;
}

/**
 * Marks an `<ng-template>` as the custom renderer for one column of `<app-data-table>`.
 *
 * @example
 * <ng-template dtCell="price" let-product>
 *   {{ product.price | currency: 'USD' }}
 * </ng-template>
 */
@Directive({
  selector: 'ng-template[dtCell]',
})
export class DataTableCellDefDirective<T = unknown> {
  readonly column = input.required<string>({ alias: 'dtCell' });
  readonly templateRef = inject<TemplateRef<DataTableCellContext<T>>>(TemplateRef);
}
