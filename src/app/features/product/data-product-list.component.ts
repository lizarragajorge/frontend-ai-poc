import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataProductService } from '../../services/data-product.service';

@Component({
	selector: 'app-data-product-list',
	standalone: true,
	imports: [CommonModule],
	template: `
		<ul class="list">
			<li class="list-item" *ngFor="let p of svc.filtered()" (click)="select.emit(p.id)">{{p.name}}</li>
		</ul>
	`
})
export class DataProductListComponent {
	@Output() select = new EventEmitter<string>();
	constructor(public svc: DataProductService){}
}
