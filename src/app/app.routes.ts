import { Routes } from '@angular/router';
import { Home } from './features/home/pages/home/home';
import { ProductsTable } from './features/products/components/products-table/products-table';
import { ProductDetail } from './features/products/pages/product-detail/product-detail';
import { Collection } from './features/products/pages/collection/collection';
import { Cart } from './features/carts/pages/cart/cart';

export const routes: Routes = [
  {
    path: '',
   component: Home,
   title: 'Accueil'
  },
  {
    path: 'products',
    component: ProductsTable,
    title: 'Produits',
  },
  {
    path: 'products/:id',
    component: ProductDetail,
    title: 'Détail du produit',
  },
  {
    path: 'collections/:category',
    component: Collection,
    title: 'Collection',
  },
  {
    path: 'cart',
    component: Cart,
    title: 'Panier',
  },
];
