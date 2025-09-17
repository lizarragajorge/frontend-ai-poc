import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface DataProduct {
	id: string;              // unique key (catalog.schema)
	name: string;            // display name
	domain: string;          // category_domain (c10)
	psl: string;             // PSL (c12)
	description: string;     // composed description
	owner?: string;          // owner (c9)
	sensitivity?: string;    // sensitivity / classification (c11)
	catalog?: string;        // catalog (c0)
	schema?: string;         // schema (c1)
	createdAt?: string;      // created timestamp (c5)
	updatedAt?: string;      // updated timestamp (c7)
	rating?: number;         // placeholder (computed/mock)
}

@Injectable({ providedIn: 'root' })
export class DataProductService {
	private products = signal<DataProduct[]>([]);
	private loading = signal<boolean>(false);
	private error = signal<string | null>(null);

	domainFilter = signal<string | null>(null);
	pslFilter = signal<string | null>(null);
	filterTerm = signal<string>('');

	// Public readonly selectors
	filtered = computed(() => {
		const term = this.filterTerm().toLowerCase();
		return this.products().filter(p =>
			(!this.domainFilter() || p.domain === this.domainFilter()) &&
			(!this.pslFilter() || p.psl === this.pslFilter()) &&
			(!term || p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term))
		);
	});
	popular = computed(() => this.products().slice(0, 3));
	topRated = computed(() => [...this.products()].sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,3));
	topUsed = computed(() => this.products().slice(-3));
	domains = computed(() => Array.from(new Set(this.products().map(p => p.domain))).sort());
	psls = computed(() => Array.from(new Set(this.products().map(p => p.psl))).sort());

	// Expose loading/error
	isLoading = () => this.loading();
	loadError = () => this.error();

	private readonly apiBase = environment.apiBaseUrl.replace(/\/+$/, '');

	constructor(private http: HttpClient) {
		// Auto-load on service instantiation
		this.refresh();
	}

	refresh(limit = 100) {
		this.loading.set(true);
		this.error.set(null);
		this.http.get<DatabricksRowsResponse>(`${this.apiBase}/data-products?limit=${limit}`)
			.pipe(finalize(() => this.loading.set(false)))
			.subscribe({
				next: resp => {
					if (!resp.success) {
						this.error.set(resp.error || 'Unknown error');
						this.products.set([]);
						return;
					}
						const mapped = resp.rows.map(r => this.mapRow(r));
						this.products.set(mapped);
				},
				error: err => {
					this.error.set(err.message || 'Network error');
					this.products.set([]);
				}
			});
	}

	private mapRow(row: Record<string, any>): DataProduct {
		// Current backend returns generic c0..c12 keys. Map them explicitly.
		// If backend later aliases columns, update mapping accordingly.
		const catalog = row.c0 as string | undefined;
		const schema = row.c1 as string | undefined;
		const display = (row.c2 as string | undefined) || schema || 'Unknown';
		const owner = row.c9 as string | undefined;
		const domain = row.c10 as string | undefined || 'Unknown';
		const sensitivity = row.c11 as string | undefined;
		const psl = row.c12 as string | undefined || 'N/A';
		const createdAt = row.c5 as string | undefined;
		const updatedAt = row.c7 as string | undefined;
		const id = [catalog, schema].filter(Boolean).join('.');
		return {
			id,
			name: display,
			domain,
			psl,
			description: `${owner ? owner + ' • ' : ''}${sensitivity || ''}`.trim(),
			owner,
			sensitivity,
			catalog,
			schema,
			createdAt,
			updatedAt,
			rating: this.deriveRating(psl, sensitivity)
		};
	}

	private deriveRating(psl?: string, sensitivity?: string): number | undefined {
		if (!psl) return undefined;
		// Simple placeholder heuristic for PoC
		const base = psl.length * 0.5 + (sensitivity === 'Sensitive' ? 0.2 : 0.4);
		return Math.min(5, Math.max(3, parseFloat(base.toFixed(1))));
	}

	setDomain(d: string | null) { this.domainFilter.set(d); }
	setPsl(p: string | null) { this.pslFilter.set(p); }
	setFilterTerm(v: string) { this.filterTerm.set(v); }

	getById(id: string) { return this.products().find(p => p.id === id); }
}

interface DatabricksRowsResponse {
	success: boolean;
	error?: string | null;
	rows: Array<Record<string, any>>;
	statementId?: string;
	count?: number;
	sql?: string;
}
