import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DataProductService } from '../../services/data-product.service';

@Component({
	selector: 'app-data-product-browser',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './data-product-browser.component.html',
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
