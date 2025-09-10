import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataProduct, AccessRequest } from '../models/product.model';
import { AiFoundry } from './ai-foundry';
import { AzureFabric } from './azure-fabric';

@Injectable({
  providedIn: 'root'
})
export class Product {
  private productsSubject = new BehaviorSubject<DataProduct[]>([]);
  public products$ = this.productsSubject.asObservable();

  private accessRequestsSubject = new BehaviorSubject<AccessRequest[]>([]);
  public accessRequests$ = this.accessRequestsSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(
    private aiFoundry: AiFoundry,
    private azureFabric: AzureFabric
  ) { }

  /**
   * Load all data products from both AI Foundry and Azure Fabric
   */
  loadAllProducts(): void {
    this.isLoadingSubject.next(true);

    forkJoin({
      aiFoundryProducts: this.aiFoundry.getDataProducts(),
      azureFabricProducts: this.azureFabric.getDataProducts()
    }).pipe(
      map(({ aiFoundryProducts, azureFabricProducts }) => [
        ...aiFoundryProducts,
        ...azureFabricProducts
      ])
    ).subscribe({
      next: (allProducts) => {
        this.productsSubject.next(allProducts);
        this.isLoadingSubject.next(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  /**
   * Request access to a data product
   * @param productId - The ID of the product to request access to
   * @param reason - Optional reason for the access request
   */
  requestAccess(productId: string, reason?: string): void {
    const newRequest: AccessRequest = {
      id: this.generateId(),
      productId,
      requestedBy: 'current-user', // In a real app, this would come from auth service
      status: 'pending',
      requestedAt: new Date(),
      reason
    };

    const currentRequests = this.accessRequestsSubject.value;
    this.accessRequestsSubject.next([...currentRequests, newRequest]);

    // In a real implementation, this would make an API call to the backend
    console.log('Access request submitted:', newRequest);
  }

  /**
   * Filter products by source
   * @param source - The source to filter by
   */
  filterBySource(source: 'ai-foundry' | 'azure-fabric' | 'all'): Observable<DataProduct[]> {
    if (source === 'all') {
      return this.products$;
    }
    
    return this.products$.pipe(
      map(products => products.filter(product => product.source === source))
    );
  }

  /**
   * Filter products by access level
   * @param accessLevel - The access level to filter by
   */
  filterByAccessLevel(accessLevel: 'public' | 'restricted' | 'private' | 'all'): Observable<DataProduct[]> {
    if (accessLevel === 'all') {
      return this.products$;
    }
    
    return this.products$.pipe(
      map(products => products.filter(product => product.accessLevel === accessLevel))
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
