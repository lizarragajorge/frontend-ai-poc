import { Injectable, signal, computed } from '@angular/core';

export interface DataProduct {
	id: string;
	name: string;
	domain: string;
	psl: string; // product service line (example filter)
	description: string;
	rating?: number;
}

@Injectable({ providedIn: 'root' })
export class DataProductService {
	private products = signal<DataProduct[]>([
		{ id: 'sales-mart', name: 'Sales Mart', domain: 'Sales', psl: 'Gold', description: 'Curated sales performance metrics', rating: 4.6 },
		{ id: 'cust-360', name: 'Customer 360', domain: 'Customer', psl: 'Gold', description: 'Unified customer profile attributes', rating: 4.8 },
		{ id: 'web-analytics', name: 'Web Analytics', domain: 'Digital', psl: 'Silver', description: 'Site traffic and funnel events', rating: 4.2 },
		{ id: 'finance-gl', name: 'Finance GL', domain: 'Finance', psl: 'Platinum', description: 'Ledger & journal entries consolidated', rating: 4.9 }
	]);

		domainFilter = signal<string | null>(null);
		pslFilter = signal<string | null>(null);
		filterTerm = signal<string>('');

		filtered = computed(() => {
			const term = this.filterTerm().toLowerCase();
			return this.products().filter(p =>
				(!this.domainFilter() || p.domain === this.domainFilter()) &&
				(!this.pslFilter() || p.psl === this.pslFilter()) &&
				(!term || p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term))
			);
		});

		popular = computed(() => this.products().slice(0,3));
		topRated = computed(() => [...this.products()].sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,3));
		topUsed = computed(() => this.products().slice(-3)); // placeholder heuristic

	domains = computed(() => Array.from(new Set(this.products().map(p => p.domain))).sort());
	psls = computed(() => Array.from(new Set(this.products().map(p => p.psl))).sort());

		setDomain(d: string | null){ this.domainFilter.set(d); }
		setPsl(p: string | null){ this.pslFilter.set(p); }
		setFilterTerm(v: string){ this.filterTerm.set(v); }

	getById(id: string){ return this.products().find(p => p.id === id); }
}
