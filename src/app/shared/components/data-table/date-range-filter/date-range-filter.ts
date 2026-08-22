import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDivider } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

import { DateRange } from '../data-table-column.model';

interface DatePreset {
  label: string;
  from: Date;
  to: Date;
}

function buildPresets(): DatePreset[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const last7 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
  const last30 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);
  const thisYearEnd = new Date(now.getFullYear(), 11, 31);
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

  return [
    { label: "Aujourd'hui", from: today, to: today },
    { label: 'Hier', from: yesterday, to: yesterday },
    { label: '7 derniers jours', from: last7, to: today },
    { label: '30 derniers jours', from: last30, to: today },
    { label: 'Ce mois-ci', from: thisMonthStart, to: thisMonthEnd },
    { label: 'Mois dernier', from: lastMonthStart, to: lastMonthEnd },
    { label: 'Cette année', from: thisYearStart, to: thisYearEnd },
    { label: 'Année dernière', from: lastYearStart, to: lastYearEnd },
  ];
}

@Component({
  selector: 'app-date-range-filter',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDivider,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './date-range-filter.html',
  styleUrl: './date-range-filter.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeFilter {
  readonly value = input<DateRange>({});
  readonly valueChange = output<DateRange | null>();

  protected readonly presets: DatePreset[] = buildPresets();

  protected readonly customFrom = signal<Date | null>(null);
  protected readonly customTo = signal<Date | null>(null);
  protected readonly activeLabel = signal<string | null>(null);

  protected readonly hasValue = computed(() => !!(this.value()?.from || this.value()?.to));

  constructor() {
    // Sync internal date fields when the filter is cleared externally
    effect(() => {
      const v = this.value();
      untracked(() => {
        this.customFrom.set(v?.from ?? null);
        this.customTo.set(v?.to ?? null);
        if (!v?.from && !v?.to) this.activeLabel.set(null);
      });
    });
  }

  protected applyPreset(preset: DatePreset): void {
    this.customFrom.set(preset.from);
    this.customTo.set(preset.to);
    this.activeLabel.set(preset.label);
    this.valueChange.emit({ from: preset.from, to: preset.to });
  }

  protected onCustomChange(): void {
    const from = this.customFrom();
    const to = this.customTo();
    this.activeLabel.set('Personnalisé');
    this.valueChange.emit(from || to ? { from: from ?? undefined, to: to ?? undefined } : null);
  }

  protected clear(event: MouseEvent): void {
    event.stopPropagation();
    this.customFrom.set(null);
    this.customTo.set(null);
    this.activeLabel.set(null);
    this.valueChange.emit(null);
  }
}
