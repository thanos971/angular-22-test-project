import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { CartStore } from '../../services/cart-store';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cart {
  protected readonly cartStore = inject(CartStore);

  protected decrement(productId: number, quantity: number): void {
    this.cartStore.updateQuantity(productId, quantity - 1);
  }

  protected increment(productId: number, quantity: number): void {
    this.cartStore.updateQuantity(productId, quantity + 1);
  }

  protected remove(productId: number): void {
    this.cartStore.removeFromCart(productId);
  }
}
