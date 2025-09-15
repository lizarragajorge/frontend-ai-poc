import { Injectable } from '@angular/core';

@Injectable({ providedIn:'root' })
export class TelemetryService {
  trackEvent(name: string, props?: Record<string, any>){ console.debug('[telemetry]', name, props); }
  trackError(error: any, props?: Record<string, any>){ console.error('[telemetry-error]', error, props); }
}
