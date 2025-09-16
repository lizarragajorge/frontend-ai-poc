import { Component } from '@angular/core';
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
	product: any;
	constructor(private route: ActivatedRoute, private svc: DataProductService) {
		const id = this.route.snapshot.paramMap.get('id') || '';
		this.product = this.svc.getById(id);
	}
}
