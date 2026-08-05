import { Product } from '../../../features/products/models/product.model';

export interface Cart {
  id: number;
  userId: number;
  products: Product[];
}