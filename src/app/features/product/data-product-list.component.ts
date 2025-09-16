import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataProductService } from '../../services/data-product.service';

@Component({
	selector: 'app-data-product-list',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './data-product-list.component.html'
})
export class DataProductListComponent {
	@Output() select = new EventEmitter<string>();
	constructor(public svc: DataProductService){}
}
