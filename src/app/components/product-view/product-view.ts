import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Product } from '../../services/product';
import { DataProduct } from '../../models/product.model';

@Component({
  selector: 'app-product-view',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatBadgeModule,
    MatDialogModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './product-view.html',
  styleUrl: './product-view.css'
})
export class ProductView implements OnInit, OnDestroy {
  products: DataProduct[] = [];
  filteredProducts: DataProduct[] = [];
  isLoading = false;
  
  // Filter options
  selectedSource = 'all';
  selectedAccessLevel = 'all';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private productService: Product,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Subscribe to products
    this.subscriptions.push(
      this.productService.products$.subscribe(products => {
        this.products = products;
        this.applyFilters();
      })
    );

    // Subscribe to loading state
    this.subscriptions.push(
      this.productService.isLoading$.subscribe(loading => {
        this.isLoading = loading;
      })
    );

    // Load products on init
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadProducts(): void {
    this.productService.loadAllProducts();
  }

  applyFilters(): void {
    let filtered = [...this.products];

    // Filter by source
    if (this.selectedSource !== 'all') {
      filtered = filtered.filter(product => product.source === this.selectedSource);
    }

    // Filter by access level
    if (this.selectedAccessLevel !== 'all') {
      filtered = filtered.filter(product => product.accessLevel === this.selectedAccessLevel);
    }

    this.filteredProducts = filtered;
  }

  onSourceFilterChange(): void {
    this.applyFilters();
  }

  onAccessLevelFilterChange(): void {
    this.applyFilters();
  }

  requestAccess(product: DataProduct): void {
    const reason = prompt(`Request access to "${product.name}". Please provide a reason (optional):`);
    if (reason !== null) { // User didn't cancel
      this.productService.requestAccess(product.id, reason || undefined);
      // Show confirmation
      alert(`Access request submitted for "${product.name}"`);
    }
  }

  getAccessLevelColor(accessLevel: string): string {
    switch (accessLevel) {
      case 'public': return 'primary';
      case 'restricted': return 'accent';
      case 'private': return 'warn';
      default: return '';
    }
  }

  getSourceIcon(source: string): string {
    switch (source) {
      case 'ai-foundry': return 'psychology';
      case 'azure-fabric': return 'cloud';
      default: return 'storage';
    }
  }
}
