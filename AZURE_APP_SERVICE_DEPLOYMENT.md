# CloudBlueprint - Azure App Service Deployment

This guide will help you deploy CloudBlueprint to Azure App Service for full Next.js functionality.

## Quick Deployment (Recommended)

### Option 1: Deploy via Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-cloudblueprint --location "Australia East"

# Deploy the App Service using Bicep
az deployment group create \
  --resource-group rg-cloudblueprint \
  --template-file azure-app-service.bicep \
  --parameters webAppName=cloudblueprint-app

# Get the deployment credentials
az webapp deployment list-publishing-profiles \
  --resource-group rg-cloudblueprint \
  --name cloudblueprint-app
```

### Option 2: Deploy via Azure Portal

1. **Create App Service**
   - Go to [Azure Portal](https://portal.azure.com)
   - Search for "App Services" and click "Create"
   - **Resource Group**: Create `rg-cloudblueprint`
   - **Name**: `cloudblueprint-app`
   - **Runtime**: Node 18 LTS
   - **Operating System**: Linux
   - **Pricing Plan**: Basic B1 (or Free F1 for testing)

2. **Configure Deployment**
   - In your App Service, go to "Deployment Center"
   - **Source**: GitHub
   - **Repository**: azurewithdanidu/iac-scaffolder
   - **Branch**: main
   - **Build Provider**: GitHub Actions

3. **Configure Application Settings**
   ```
   NODE_ENV = production
   WEBSITE_NODE_DEFAULT_VERSION = 18-lts
   WEBSITE_RUN_FROM_PACKAGE = 1
   ```

## GitHub Actions Setup

### Configure Secrets

In your GitHub repository, add these secrets:

1. **Get Publish Profile**
   ```bash
   az webapp deployment list-publishing-profiles \
     --resource-group rg-cloudblueprint \
     --name cloudblueprint-app \
     --xml
   ```

2. **Add to GitHub Secrets**
   - Go to GitHub repo > Settings > Secrets and variables > Actions
   - Add secret: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Paste the entire XML from step 1

### Disable Static Web Apps Workflow

Since we're switching to App Service, disable the Static Web Apps workflow:

```bash
# Rename or delete the Static Web Apps workflow
mv .github/workflows/azure-static-web-apps-calm-mushroom-0cac30400.yml .github/workflows/azure-static-web-apps-calm-mushroom-0cac30400.yml.disabled
```

## Advantages of App Service over Static Web Apps

✅ **Full Next.js Support**
- Server-side rendering (SSR)
- Client-side hydration works perfectly
- All React hooks and state management
- Dynamic routing and API routes

✅ **Proper Asset Handling**
- CSS loads correctly
- JavaScript bundles work as expected
- Images and fonts served properly

✅ **Interactive Components**
- Buttons and forms work correctly
- State management functions properly
- ZIP download functionality works
- Preview features work correctly

✅ **Better Performance**
- Optimized Next.js builds
- Automatic code splitting
- Better caching strategies

## Costs

- **Free Tier (F1)**: $0/month (60 CPU minutes/day)
- **Basic (B1)**: ~$13/month (recommended for production)
- **Standard (S1)**: ~$56/month (auto-scaling, custom domains)

## Testing the Deployment

Once deployed, your app will be available at:
`https://cloudblueprint-app.azurewebsites.net`

Test these features:
- ✅ CSS styling displays correctly
- ✅ Buttons are clickable and functional
- ✅ 7-step wizard works completely
- ✅ Download ZIP functionality works
- ✅ Preview features work
- ✅ All interactive elements respond

## Monitoring

App Service provides built-in monitoring:
- Application logs
- Performance metrics
- Health checks
- Application Insights integration

## Next Steps

1. **Deploy the infrastructure** using the Bicep template
2. **Configure GitHub Actions** with the publish profile
3. **Test the application** to ensure everything works
4. **Set up custom domain** (optional)
5. **Configure monitoring** and alerts

The main advantage: **Everything will work correctly** - CSS, JavaScript, interactivity, and all Next.js features!
