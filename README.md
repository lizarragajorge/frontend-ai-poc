# Frontend AI POC

A streamlined Angular application for AI-powered data product discovery and management. This template provides a plug-and-play solution for organizations to quickly deploy a frontend interface that connects to AI Foundry and Azure Fabric.

![AI Chat Interface](https://github.com/user-attachments/assets/8c6580f2-b77f-421b-9f47-58bb559c04fa)
![Product View Interface](https://github.com/user-attachments/assets/ae85b715-6dae-4f72-a94d-fca67f20a5ac)

## 🚀 Features

### AI Chat Tab
- **Conversational AI Interface**: Chat with an LLM to understand available data products
- **Real-time Messaging**: Interactive chat experience with loading indicators
- **Smart Suggestions**: Built-in prompts to help users get started
- **AI Foundry Integration**: Connects to your AI Foundry endpoint for intelligent responses

### Product View Tab
- **Data Product Discovery**: Browse and explore available data products
- **Multi-Source Support**: Displays products from both AI Foundry and Azure Fabric
- **Advanced Filtering**: Filter by source (AI Foundry/Azure Fabric) and access level (Public/Restricted/Private)
- **Access Management**: Request access to restricted and private data products
- **Rich Metadata**: View detailed information including tags, categories, owners, and last updated dates

### Plug-and-Play Architecture
- **Easy Configuration**: Simple configuration files for quick deployment
- **Modular Services**: Separate services for AI Foundry and Azure Fabric connections
- **Extensible Design**: Easy to add new data sources or features
- **Responsive UI**: Works seamlessly on desktop and mobile devices

## 🛠️ Technology Stack

- **Frontend Framework**: Angular 19
- **UI Components**: Angular Material
- **Styling**: CSS with Material Design
- **HTTP Client**: Angular HttpClient
- **State Management**: RxJS Observables
- **Build Tool**: Angular CLI
- **Package Manager**: npm

## 📋 Prerequisites

- Node.js (version 18 or higher)
- npm (version 9 or higher)
- Angular CLI (optional, but recommended)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd frontend-ai-poc
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Your Connections
Edit the configuration file at `src/app/services/config.service.ts`:

```typescript
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
  appTitle: 'Your App Title',
  features: {
    aiChat: true,
    productView: true
  }
};
```

### 4. Start the Development Server
```bash
npm start
```

The application will be available at `http://localhost:4200`

### 5. Build for Production
```bash
npm run build
```

## 🔧 Configuration

### AI Foundry Setup
1. Update the `endpoint` with your AI Foundry API URL
2. Add your `apiKey` for authentication
3. Specify the `modelId` you want to use (e.g., 'gpt-4', 'gpt-3.5-turbo')

### Azure Fabric Setup
1. Provide your Azure `tenantId`
2. Add your `subscriptionId`
3. Specify the `resourceGroupName` and `workspaceName`
4. Include your Azure Fabric `apiKey`

### Feature Toggles
You can enable/disable features by modifying the `features` section in the config:
```typescript
features: {
  aiChat: true,        // Enable/disable AI Chat tab
  productView: true    // Enable/disable Product View tab
}
```

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ai-chat/           # AI Chat component
│   │   └── product-view/      # Product View component
│   ├── services/
│   │   ├── ai-foundry.ts      # AI Foundry service
│   │   ├── azure-fabric.ts    # Azure Fabric service
│   │   ├── chat.ts            # Chat management service
│   │   ├── product.ts         # Product management service
│   │   └── config.service.ts  # Configuration service
│   ├── models/
│   │   ├── chat.model.ts      # Chat-related interfaces
│   │   ├── product.model.ts   # Product-related interfaces
│   │   └── config.model.ts    # Configuration interfaces
│   ├── app.ts                 # Main app component
│   ├── app.html               # Main app template
│   └── app.css                # Main app styles
├── index.html                 # Entry point
└── styles.css                 # Global styles
```

## 🔌 API Integration

### AI Foundry Integration
The `AiFoundry` service (`src/app/services/ai-foundry.ts`) provides:
- `sendMessage()`: Send messages to the LLM
- `getDataProducts()`: Retrieve data products from AI Foundry
- `setConfig()`: Update AI Foundry configuration

### Azure Fabric Integration
The `AzureFabric` service (`src/app/services/azure-fabric.ts`) provides:
- `getDataProducts()`: Retrieve data products from Azure Fabric
- `testConnection()`: Test connectivity to Azure Fabric
- `setConfig()`: Update Azure Fabric configuration

## 🎨 Customization

### Styling
- Modify `src/app/app.css` for global styles
- Update component-specific CSS files for individual components
- Customize Material Design theme in `src/custom-theme.scss`

### Adding New Data Sources
1. Create a new service in `src/app/services/`
2. Implement the required interfaces from the models
3. Update the product service to include the new source
4. Add filtering options in the Product View component

### UI Customization
- Modify component templates in `.html` files
- Update Angular Material theme colors
- Add new components as needed

## 🧪 Development

### Running Tests
```bash
npm run test
```

### Linting
```bash
ng lint
```

### Building
```bash
ng build --configuration production
```

## 📚 Key Services

### Chat Service
Manages chat conversations and integrates with AI Foundry for responses.

### Product Service
Aggregates data products from multiple sources and provides filtering capabilities.

### Config Service
Centralized configuration management for easy deployment customization.

## 🔒 Security Considerations

- Store API keys securely (consider using environment variables)
- Implement proper authentication and authorization
- Validate user inputs
- Use HTTPS for all API communications
- Regularly update dependencies

## 🚀 Deployment

### Development Deployment
```bash
npm start
```

### Production Deployment
1. Build the application: `npm run build`
2. Deploy the `dist/` folder to your web server
3. Configure environment-specific settings
4. Set up proper routing for single-page application

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions or support, please create an issue in the repository or contact the development team.

---

**Ready to deploy?** Simply update the configuration files with your AI Foundry and Azure Fabric credentials, and you're ready to go!