# Azure Integration Guide (Draft)

## App Config Injection
Provide window.__APP_CONFIG__ before loading main bundle:
```html
<script>
window.__APP_CONFIG__ = { apiBaseUrl:'/api', aiApiBaseUrl:'/api/ai', aiDeployment:'gpt-4o-mini' };
</script>
```

## Azure Static Web Apps
- staticwebapp.config.json already adds SPA fallback.
- Add your backend (Functions / API) under /api for local dev proxies.

## AI (Azure OpenAI / AI Foundry)
Expected POST: `${aiApiBaseUrl}/chat/completions` body `{ input, deployment }`.
Adjust `AzureOpenAiService` to match the real endpoint (auth header, payload shape).

## Authentication (Placeholder)
Integrate MSAL in `AuthService` (login -> acquireTokenSilent -> store signal).
Add HTTP interceptor to attach bearer tokens for Fabric / AI calls.

## Fabric Access
Create a new gateway implementing `DataProductGateway` calling Fabric endpoints with token.
