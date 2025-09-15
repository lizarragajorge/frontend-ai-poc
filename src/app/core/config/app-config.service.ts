import { Injectable, InjectionToken } from '@angular/core';

export interface AppConfig {
  apiBaseUrl: string;
  aiApiBaseUrl: string;
  aiDeployment: string;
  tenantId?: string;
  featureFlags?: Record<string, boolean>;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  constructor() {}
  load(): AppConfig {
    const win: any = window as any;
    return win.__APP_CONFIG__ || {
      apiBaseUrl: '/api',
      aiApiBaseUrl: '/api/ai',
      aiDeployment: 'gpt-4o-mini',
      featureFlags: {}
    };
  }
}
