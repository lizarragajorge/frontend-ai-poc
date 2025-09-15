import { InjectionToken } from '@angular/core';
import { DataProduct } from '../../services/data-product.service';

export interface ProductListParams { domain?: string | null; psl?: string | null; search?: string; }

export interface DataProductGateway {
  list(params?: ProductListParams): Promise<DataProduct[]>;
  get(id: string): Promise<DataProduct | undefined>;
  metrics(): Promise<{ total: number; domains: number; psls: number }>; 
}

export const DATA_PRODUCT_GATEWAY = new InjectionToken<DataProductGateway>('DATA_PRODUCT_GATEWAY');
