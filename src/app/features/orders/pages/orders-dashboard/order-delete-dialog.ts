import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { Order } from '../../models/order.model';

@Component({
  selector: 'app-order-delete-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Supprimer la commande</h2>
    <mat-dialog-content>
      <p>
        Confirmer la suppression de la commande <strong>#{{ order.id }}</strong> de
        <strong>{{ order.customerName }}</strong
        >&nbsp;?
      </p>
      <p class="warn">Cette action est irréversible.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-flat-button color="warn" (click)="confirm()">Supprimer</button>
    </mat-dialog-actions>
  `,
  styles: ['.warn { color: var(--mat-sys-error); font-size: 13px; margin: 4px 0 0; }'],
})
export class OrderDeleteDialog {
  protected readonly order = inject<Order>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<OrderDeleteDialog>);

  protected confirm(): void {
    this.dialogRef.close(true);
  }
}
