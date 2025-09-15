import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { APP_CONFIG, AppConfigService } from './app/core/config/app-config.service';
import { DATA_PRODUCT_GATEWAY } from './app/core/data/data-product.gateway';
import { MockDataProductGateway } from './app/core/data/mock-data-product.gateway';
import { AppComponent } from './app/app.component';
import { routes } from './app/routes';

bootstrapApplication(AppComponent, {
	providers: [
		provideRouter(routes),
		provideAnimations(),
		{
			provide: APP_CONFIG,
			useFactory: () => new AppConfigService().load()
		},
		{ provide: DATA_PRODUCT_GATEWAY, useClass: MockDataProductGateway }
	]
}).catch(err => console.error(err));
