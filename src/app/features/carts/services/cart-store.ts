import { Injectable, computed, signal } from '@angular/core';

import { Product } from '../../products/models/product.model';
import { CartItem } from '../models/cart-item.model';

const STORAGE_KEY = 'cart-items';

function readFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _items = signal<CartItem[]>(readFromStorage());

  readonly items = this._items.asReadonly();
  readonly totalItems = computed(() => this._items().reduce((sum, item) => sum + item.quantity, 0));
  readonly totalPrice = computed(() =>
    this._items().reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  );

  addToCart(product: Product, quantity = 1): void {
    this.update((items) => {
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) {
        return items.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }
      return [...items, { product, quantity }];
    });
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity < 1) {
      this.removeFromCart(productId);
      return;
    }
    this.update((items) =>
      items.map((item) => (item.product.id === productId ? { ...item, quantity } : item)),
    );
  }

  removeFromCart(productId: number): void {
    this.update((items) => items.filter((item) => item.product.id !== productId));
  }

  clear(): void {
    this.update(() => []);
  }

  private update(updater: (items: CartItem[]) => CartItem[]): void {
    const next = updater(this._items());
    this._items.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}
