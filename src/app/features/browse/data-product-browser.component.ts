import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DataProductService } from '../../services/data-product.service';

@Component({
	selector: 'app-data-product-browser',
	standalone: true,
	imports: [CommonModule],
	template: `
<div class="browse">
	<h1 class="page-title">Data Product Browser</h1>
	<div class="browser-card">
		<div class="layout">
			<!-- Sidebar -->
			<aside class="side-col">
				<div class="side-section">
					<h2 class="side-heading">Filter</h2>
					<div class="crumbs">All &gt; Data Products<span *ngIf="svc.domainFilter()"> &gt; {{svc.domainFilter()}}</span><span *ngIf="svc.pslFilter()"> &gt; {{svc.pslFilter()}}</span></div>
				</div>
            	<div class="side-section search-wrap">
					<input #query type="text" placeholder="Search" class="search" (input)="onSearch(query.value)">
					<button class="reset-small" (click)="clearAll()" *ngIf="svc.domainFilter() || svc.pslFilter() || svc.filterTerm()">Reset All</button>
				</div>
				<div class="side-section">
					<h3 class="label-lg">Domain</h3>
					<ul class="list">
						<li><button class="list-btn" [class.active]="!svc.domainFilter()" (click)="setDomain(null)">All</button></li>
						<li *ngFor="let d of svc.domains()"><button class="list-btn" [class.active]="svc.domainFilter()===d" (click)="setDomain(d)">{{d}}</button></li>
					</ul>
				</div>
				<div class="side-section">
					<h3 class="label-lg">Product Service Lines</h3>
					<ul class="list">
						<li><button class="list-btn" [class.active]="!svc.pslFilter()" (click)="setPsl(null)">All</button></li>
						<li *ngFor="let p of svc.psls()"><button class="list-btn" [class.active]="svc.pslFilter()===p" (click)="setPsl(p)">{{p}}</button></li>
					</ul>
				</div>
			</aside>

			<!-- Main content -->
			<main class="main-col">
				<section class="block domain-block">
					<h2 class="block-title">Domain</h2>
					<div class="thumbs">
						<button class="thumb" [class.active]="!svc.domainFilter()" (click)="setDomain(null)">All</button>
						<button class="thumb" *ngFor="let d of svc.domains()" [class.active]="svc.domainFilter()===d" (click)="setDomain(d)">{{d}}</button>
					</div>
				</section>

				<section class="block" *ngIf="showCurated && svc.topRated().length">
					<h2 class="block-title">Top Rated</h2>
					<div class="thumbs">
						<button class="thumb" *ngFor="let p of svc.topRated()" (click)="view(p.id)">
							<span class="thumb-name">{{p.name}}</span>
							<span class="thumb-meta">★ {{p.rating}}</span>
						</button>
					</div>
				</section>

				<section class="block" *ngIf="showCurated && svc.topUsed().length">
					<h2 class="block-title">Your Top Used</h2>
					<div class="thumbs">
						<button class="thumb" *ngFor="let p of svc.topUsed()" (click)="view(p.id)">{{p.name}}</button>
					</div>
				</section>

				<div class="toggle-row">
					<button class="toggle" (click)="showCurated=!showCurated" [attr.aria-pressed]="showCurated">{{showCurated? 'Hide Lists':'Show Lists'}}</button>
					<span class="count" *ngIf="svc.filtered().length">{{svc.filtered().length}} items</span>
				</div>

				<div *ngIf="svc.filtered().length; else empty" class="grid">
					<div class="card" *ngFor="let p of svc.filtered()" (click)="view(p.id)" tabindex="0">
						<div class="initial" aria-hidden="true">{{p.name[0]}}</div>
						<div class="card__body">
							<h3>{{p.name}}</h3>
							<p class="desc">{{p.description}}</p>
							<div class="tags"><span>{{p.domain}}</span><span>{{p.psl}}</span></div>
						</div>
					</div>
				</div>
				<ng-template #empty><div class="empty">No products found.</div></ng-template>
			</main>
		</div>
	</div>
</div>
`,
	styleUrls: ['./data-product-browser.component.css']
})
export class DataProductBrowserComponent {
	showCurated = true;
	constructor(public svc: DataProductService, private router: Router){}
	onSearch(v:string){ this.svc.setFilterTerm(v); }
	setDomain(d:string|null){ this.svc.setDomain(d); }
	setPsl(p:string|null){ this.svc.setPsl(p); }
	clearAll(){ this.svc.setDomain(null); this.svc.setPsl(null); this.svc.setFilterTerm(''); }
	view(id:string){ this.router.navigate(['/product', id]); }
}
