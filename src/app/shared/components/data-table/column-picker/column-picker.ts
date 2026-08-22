import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

/** Minimal column descriptor needed by the picker (key + label only). */
export interface PickableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'app-column-picker',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatMenuModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
  templateUrl: './column-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnPicker {
  readonly columns = input<PickableColumn[]>([]);
  readonly visibleKeys = input<Set<string>>(new Set());

  readonly visibilityToggle = output<string>();
  readonly orderChange = output<{ previousIndex: number; currentIndex: number }>();

  protected onDrop(event: CdkDragDrop<PickableColumn[]>): void {
    this.orderChange.emit({ previousIndex: event.previousIndex, currentIndex: event.currentIndex });
  }
}
