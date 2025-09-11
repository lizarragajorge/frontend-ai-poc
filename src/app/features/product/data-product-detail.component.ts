import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataProductService } from '../../services/data-product.service';

@Component({
	selector: 'app-data-product-detail',
	standalone: true,
	imports: [CommonModule, RouterLink],
	template: `
<ng-container *ngIf="product; else notFound">
	<div class="detail">
		<button class="back" routerLink="/browse">← Back</button>
		<div class="detail-card">
			<div class="head">
				<div class="avatar" aria-hidden="true">{{product.name[0]}}</div>
				<div class="title-wrap">
					<h1 class="page-title">{{product.name}}</h1>
					<p class="page-sub">{{product.domain}} • {{product.psl}}</p>
					<p class="lead">{{product.description}}</p>
					<div class="tags"><span>{{product.domain}}</span><span>{{product.psl}}</span><span *ngIf="product.rating" class="rate">★ {{product.rating}}</span></div>
				</div>
			</div>
			<div class="main-col">
				<div class="block">
					<h2 class="block-title">Overview</h2>
					<p>This data product serves the <strong>{{product.domain}}</strong> domain. Refresh cadence: daily. Use for analytics, dashboards and ML feature sourcing.</p>
				</div>
				<div class="block">
					<h2 class="block-title">Sample Fields</h2>
					<ul class="fields">
						<li><code>id</code> string – unique id</li>
						<li><code>created_at</code> timestamp – ingestion time</li>
						<li><code>metric_value</code> number – core metric</li>
					</ul>
				</div>
				<div class="actions">
					<button class="primary">Request Access</button>
					<button class="ghost">Lineage</button>
				</div>
			</div>
		</div>
	</div>
</ng-container>
<ng-template #notFound><div class="missing">Product not found.</div></ng-template>
`,
	styleUrls: ['./data-product-detail.component.css']
})
export class DataProductDetailComponent {
	product: any;
	constructor(private route: ActivatedRoute, private svc: DataProductService) {
		const id = this.route.snapshot.paramMap.get('id') || '';
		this.product = this.svc.getById(id);
	}
}
