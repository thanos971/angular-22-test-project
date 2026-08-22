import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';

import { DataTableFilterType, DateRange, NumberRange } from '../data-table-column.model';
import { DateRangeFilter } from '../date-range-filter/date-range-filter';

export interface FilterableColumn {
  filterType?: DataTableFilterType;
}

@Component({
  selector: 'app-column-filter-cell',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    DateRangeFilter,
  ],
  templateUrl: './column-filter-cell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnFilterCell {
  readonly column = input.required<FilterableColumn>();
  readonly value = input<unknown>(undefined);
  readonly selectOptions = input<string[]>([]);
  readonly numberBounds = input<{ min: number; max: number }>({ min: 0, max: 100 });
  readonly valueChange = output<unknown>();

  protected textValue(): string {
    return (this.value() as string | undefined) ?? '';
  }

  protected numberValue(): NumberRange {
    return (this.value() as NumberRange | undefined) ?? {};
  }

  protected dateValue(): DateRange {
    return (this.value() as DateRange | undefined) ?? {};
  }

  protected selectValue(): string[] {
    return (this.value() as string[] | undefined) ?? [];
  }

  protected setNumberPart(part: keyof NumberRange, value: string | number): void {
    const parsed = value === '' || value == null ? undefined : Number(value);
    this.valueChange.emit({ ...this.numberValue(), [part]: parsed });
  }
}
