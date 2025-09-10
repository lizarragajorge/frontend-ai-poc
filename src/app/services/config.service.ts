import { Injectable } from '@angular/core';
import { AppConfig } from '../models/config.model';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig = {
    aiFoundry: {
      endpoint: 'https://your-ai-foundry-endpoint.com/api',
      apiKey: 'your-ai-foundry-api-key-here',
      modelId: 'gpt-4'
    },
    azureFabric: {
      tenantId: 'your-azure-tenant-id',
      subscriptionId: 'your-azure-subscription-id',
      resourceGroupName: 'your-resource-group-name',
      workspaceName: 'your-workspace-name',
      apiKey: 'your-azure-fabric-api-key'
    },
    appTitle: 'Frontend AI POC',
    features: {
      aiChat: true,
      productView: true
    }
  };

  constructor() { }

  /**
   * Get the current configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   * @param newConfig - Partial configuration to update
   */
  updateConfig(newConfig: Partial<AppConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get AI Foundry configuration
   */
  getAIFoundryConfig() {
    return this.config.aiFoundry;
  }

  /**
   * Get Azure Fabric configuration
   */
  getAzureFabricConfig() {
    return this.config.azureFabric;
  }

  /**
   * Check if a feature is enabled
   * @param feature - Feature name to check
   */
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }
}