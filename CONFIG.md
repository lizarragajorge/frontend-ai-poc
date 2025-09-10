# Frontend AI POC Configuration Guide

This file contains examples and instructions for configuring your Frontend AI POC application.

## Configuration Files

### Main Configuration: `src/app/services/config.service.ts`

Update the following configuration object with your actual values:

```typescript
private config: AppConfig = {
  aiFoundry: {
    endpoint: 'https://your-ai-foundry-endpoint.com/api',
    apiKey: 'your-ai-foundry-api-key-here',
    modelId: 'gpt-4' // or 'gpt-3.5-turbo', etc.
  },
  azureFabric: {
    tenantId: 'your-azure-tenant-id',
    subscriptionId: 'your-azure-subscription-id',
    resourceGroupName: 'your-resource-group-name',
    workspaceName: 'your-workspace-name',
    apiKey: 'your-azure-fabric-api-key'
  },
  appTitle: 'Your Company - AI Data Platform',
  features: {
    aiChat: true,
    productView: true
  }
};
```

## AI Foundry Configuration

### Required Properties:
- `endpoint`: Your AI Foundry API endpoint URL
- `apiKey`: Authentication key for AI Foundry
- `modelId`: (Optional) Specific model to use for chat responses

### Example:
```typescript
aiFoundry: {
  endpoint: 'https://my-company-ai-foundry.azureml.io/chat/completions',
  apiKey: 'sk-1234567890abcdef',
  modelId: 'gpt-4'
}
```

## Azure Fabric Configuration

### Required Properties:
- `tenantId`: Your Azure tenant ID
- `subscriptionId`: Azure subscription ID
- `resourceGroupName`: Resource group containing your Fabric workspace
- `workspaceName`: Name of your Fabric workspace
- `apiKey`: (Optional) API key for authentication

### Example:
```typescript
azureFabric: {
  tenantId: '12345678-1234-1234-1234-123456789012',
  subscriptionId: '87654321-4321-4321-4321-210987654321',
  resourceGroupName: 'my-fabric-resources',
  workspaceName: 'my-data-workspace',
  apiKey: 'optional-api-key'
}
```

## Feature Toggles

You can enable or disable specific features:

```typescript
features: {
  aiChat: true,        // Show/hide AI Chat tab
  productView: true    // Show/hide Product View tab
}
```

## Environment-Specific Configuration

For different environments (development, staging, production), consider using Angular environment files:

### 1. Create environment files:
- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

### 2. Example environment file:
```typescript
export const environment = {
  production: false,
  aiFoundry: {
    endpoint: 'https://dev-ai-foundry.com/api',
    apiKey: 'dev-api-key',
    modelId: 'gpt-3.5-turbo'
  },
  azureFabric: {
    tenantId: 'dev-tenant-id',
    subscriptionId: 'dev-subscription-id',
    resourceGroupName: 'dev-fabric-rg',
    workspaceName: 'dev-workspace'
  }
};
```

### 3. Import in config service:
```typescript
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig = {
    aiFoundry: environment.aiFoundry,
    azureFabric: environment.azureFabric,
    // ... rest of config
  };
}
```

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables for sensitive data**
3. **Implement proper authentication flows**
4. **Use HTTPS for all API communications**

## Deployment Configuration

### Development
```bash
ng serve --configuration development
```

### Production
```bash
ng build --configuration production
```

## Customization Options

### App Title
Change the application title in the header:
```typescript
appTitle: 'Your Company - Data Discovery Platform'
```

### Theme Colors
Modify `src/custom-theme.scss` to change Material Design colors:
```scss
@use '@angular/material' as mat;

$primary-palette: mat.define-palette(mat.$blue-palette);
$accent-palette: mat.define-palette(mat.$green-palette);
```

### Default Data Products
Update the placeholder data in the services to match your actual data structure:
- `src/app/services/ai-foundry.ts`
- `src/app/services/azure-fabric.ts`

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure your API endpoints allow requests from your domain
2. **Authentication Failures**: Verify API keys and endpoint URLs
3. **Build Errors**: Check TypeScript types and imports

### Debug Mode:
Enable Angular development mode for detailed error messages:
```typescript
// In main.ts
if (!environment.production) {
  // Development mode is enabled by default
}
```

## Support

For additional configuration help:
1. Check the main README.md file
2. Review the source code comments
3. Create an issue in the repository