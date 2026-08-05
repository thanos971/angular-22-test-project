import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { switchMap } from 'rxjs';

import { CartStore } from '../../../carts/services/cart-store';
import { Product } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cartStore = inject(CartStore);

  protected readonly product = signal<Product | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly quantity = signal(1);

  protected readonly cartQuantity = computed(() => {
    const p = this.product();
    if (!p) {
      return 0;
    }
    return this.cartStore.items().find((item) => item.product.id === p.id)?.quantity ?? 0;
  });

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.loading.set(true);
          this.error.set(null);
          return this.productsService.getOneProduct(Number(params.get('id')));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (product) => {
          this.product.set(product);
          this.loading.set(false);
        },
        error: () => {
          this.error.set("Impossible de charger ce produit. Veuillez réessayer.");
          this.loading.set(false);
        },
      });
  }

  protected incrementQuantity(): void {
    this.quantity.update((value) => value + 1);
  }

  protected decrementQuantity(): void {
    this.quantity.update((value) => Math.max(1, value - 1));
  }

  protected addToCart(): void {
    const p = this.product();
    if (!p) {
      return;
    }
    this.cartStore.addToCart(p, this.quantity());
    this.quantity.set(1);
  }
}
