import { Routes } from '@angular/router';

export const routes: Routes = [
	{ path: '', loadComponent: () => import('./landing.component').then(m => m.LandingComponent) },
	{ path: 'browse', loadComponent: () => import('./features/browse/data-product-browser.component').then(m => m.DataProductBrowserComponent) },
	{ path: 'product/:id', loadComponent: () => import('./features/product/data-product-detail.component').then(m => m.DataProductDetailComponent) },
	{ path: '**', redirectTo: '' }
];
