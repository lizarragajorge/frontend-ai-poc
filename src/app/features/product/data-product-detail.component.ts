import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataProductService } from '../../services/data-product.service';

@Component({
	selector: 'app-data-product-detail',
	standalone: true,
	imports: [CommonModule, RouterLink],
	templateUrl: './data-product-detail.component.html',
	styleUrls: ['./data-product-detail.component.css']
})
export class DataProductDetailComponent {
	private productIdSignal = signal<string>('');
	product = computed(() => this.svc.getById(this.productIdSignal()));
	// UI state for preview toggles keyed by fully-qualified table name
	private previewOpen = signal<Record<string, boolean>>({});

	// Group tables by schema for the current product
	tableGroups = computed(() => {
		const p = this.product();
		if (!p) return [] as Array<{ schema: string; tables: Record<string, any>[] }>;
		const list = this.svc.tablesFor(p.name);
		const map = new Map<string, Record<string, any>[]>();
		for (const t of list) {
			const schema = (t.table_schema || t.c1 || 'unknown') as string;
			if (!map.has(schema)) map.set(schema, []);
			map.get(schema)!.push(t);
		}
		return Array.from(map.entries()).map(([schema, tables]) => ({ schema, tables }));
	});
	constructor(private route: ActivatedRoute, public svc: DataProductService) {
		const id = this.route.snapshot.paramMap.get('id') || '';
		this.productIdSignal.set(id);
		effect(() => {
			const p = this.product();
			if (p) {
				this.svc.loadTablesByProduct(p.name);
			}
		});
	}

	private fqtn(t: Record<string, any>) {
		const c = t.table_catalog || t.c0;
		const s = t.table_schema || t.c1;
		const n = t.table_name || t.c2;
		return `${c}.${s}.${n}`;
	}

	isOpen(t: Record<string, any>) {
		return !!this.previewOpen()[this.fqtn(t)];
	}

	togglePreview(t: Record<string, any>) {
		const key = this.fqtn(t);
		const next = { ...this.previewOpen() };
		next[key] = !next[key];
		this.previewOpen.set(next);
		if (next[key]) {
			// load sample if not already present
			const sample = this.svc.sampleFor(t.table_catalog || t.c0, t.table_schema || t.c1, t.table_name || t.c2);
			if (!sample.loading && !sample.error && (!sample.rows || sample.rows.length === 0)) {
				this.svc.loadTableSample(t.table_catalog || t.c0, t.table_schema || t.c1, t.table_name || t.c2, 5);
			}
		}
	}

	sampleColumnsFor(t: Record<string, any>): string[] {
		const sample = this.svc.sampleFor(t.table_catalog || t.c0, t.table_schema || t.c1, t.table_name || t.c2);
		if (!sample.rows || sample.rows.length === 0) return [];
		return Object.keys(sample.rows[0]);
	}
}
