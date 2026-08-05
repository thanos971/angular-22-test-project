import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { CartStore } from './features/carts/services/cart-store';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly cartStore = inject(CartStore);
}
