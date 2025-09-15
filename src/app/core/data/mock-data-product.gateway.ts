import { Injectable, signal } from '@angular/core';
import { DataProductGateway, ProductListParams } from './data-product.gateway';
import { DataProduct } from '../../services/data-product.service';

@Injectable({ providedIn: 'root' })
export class MockDataProductGateway implements DataProductGateway {
  private products = signal<DataProduct[]>([
    { id: 'sales-mart', name: 'Sales Mart', domain: 'Sales', psl: 'Gold', description: 'Curated sales performance metrics', rating: 4.6 },
    { id: 'cust-360', name: 'Customer 360', domain: 'Customer', psl: 'Gold', description: 'Unified customer profile attributes', rating: 4.8 },
    { id: 'web-analytics', name: 'Web Analytics', domain: 'Digital', psl: 'Silver', description: 'Site traffic and funnel events', rating: 4.2 },
    { id: 'finance-gl', name: 'Finance GL', domain: 'Finance', psl: 'Platinum', description: 'Ledger & journal entries consolidated', rating: 4.9 }
  ]);
  async list(params?: ProductListParams): Promise<DataProduct[]> {
    const { domain, psl, search } = params || {};
    const term = (search||'').toLowerCase();
    return this.products().filter(p =>
      (!domain || p.domain === domain) &&
      (!psl || p.psl === psl) &&
      (!term || p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term))
    );
  }
  async get(id: string){ return this.products().find(p => p.id === id); }
  async metrics(){ const list = this.products(); return { total:list.length, domains:new Set(list.map(p=>p.domain)).size, psls:new Set(list.map(p=>p.psl)).size }; }
}
