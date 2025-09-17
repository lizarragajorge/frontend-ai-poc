import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataProductService } from './services/data-product.service';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterLink, CommonModule],
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.css']
})
export class LandingComponent {
    constructor(public products: DataProductService) {}

    totalProducts = computed(() => this.products.filtered().length || 0);
    totalDomains = computed(() => this.products.domains().length || 0);
    totalPsls = computed(() => this.products.psls().length || 0);
    topThree = computed(() => this.products.topRated());
}
