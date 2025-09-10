export interface AIFoundryConfig {
  endpoint: string;
  apiKey: string;
  modelId?: string;
}

export interface AzureFabricConfig {
  tenantId: string;
  subscriptionId: string;
  resourceGroupName: string;
  workspaceName: string;
  apiKey?: string;
}

export interface AppConfig {
  aiFoundry: AIFoundryConfig;
  azureFabric: AzureFabricConfig;
  appTitle: string;
  features: {
    aiChat: boolean;
    productView: boolean;
  };
}