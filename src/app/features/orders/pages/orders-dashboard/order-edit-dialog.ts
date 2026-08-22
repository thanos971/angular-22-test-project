import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Order, OrderStatus } from '../../models/order.model';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'processing', label: 'En cours' },
  { value: 'shipped', label: 'Expédié' },
  { value: 'delivered', label: 'Livré' },
  { value: 'cancelled', label: 'Annulé' },
];

@Component({
  selector: 'app-order-edit-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './order-edit-dialog.html',
  styleUrl: './order-edit-dialog.css',
})
export class OrderEditDialog {
  private readonly dialogRef = inject(MatDialogRef<OrderEditDialog>);
  protected readonly statusOptions = STATUS_OPTIONS;
  protected formData: Order = { ...inject<Order>(MAT_DIALOG_DATA) };

  protected save(): void {
    this.dialogRef.close(this.formData);
  }
}
