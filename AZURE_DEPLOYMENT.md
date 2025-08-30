# CloudBlueprint - Azure Static Web Apps Deployment

This document provides step-by-step instructions to deploy CloudBlueprint to Azure Static Web Apps.

## Prerequisites

- Azure subscription
- Azure CLI installed
- GitHub repository with your CloudBlueprint code
- GitHub account with repository access

## Deployment Steps

### Option A: Deploy via Azure Portal (Recommended)

1. **Navigate to Azure Portal**
   - Go to [Azure Portal](https://portal.azure.com)
   - Search for "Static Web Apps" and click "Create"

2. **Configure Static Web App**
   - **Subscription**: Select your Azure subscription
   - **Resource Group**: Create new or select existing
   - **Name**: `cloudblueprint-app` (or your preferred name)
   - **Plan Type**: Free (for development) or Standard (for production)
   - **Region**: Select closest to your users
   - **Source**: GitHub
   - **GitHub Account**: Sign in to your GitHub account
   - **Organization**: azurewithdanidu
   - **Repository**: iac-scaffolder
   - **Branch**: main

3. **Build Configuration**
   - **Build Presets**: Custom
   - **App location**: `/` (root)
   - **Output location**: `out`
   - **Api location**: (leave empty)

4. **Click "Review + Create" then "Create"**

### Option B: Deploy via Azure CLI

```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name rg-cloudblueprint --location "Australia East"

# Create static web app
az staticwebapp create \
  --name cloudblueprint-app \
  --resource-group rg-cloudblueprint \
  --source https://github.com/azurewithdanidu/iac-scaffolder \
  --location "Australia East" \
  --branch main \
  --app-location "/" \
  --output-location "out" \
  --login-with-github
```

### Option C: Manual Deployment (for testing)

```bash
# Build the application locally
npm run build

# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Deploy to existing Static Web App
swa deploy ./out --deployment-token <YOUR_DEPLOYMENT_TOKEN>
```

## Configuration Files Created

The following files have been added to support Azure Static Web Apps deployment:

1. **`.eslintrc.json`** - ESLint configuration for code quality
2. **`staticwebapp.config.json`** - Static Web Apps routing configuration
3. **`.github/workflows/azure-static-web-apps.yml`** - GitHub Actions deployment workflow
4. **`next.config.js`** - Updated for static export

## Post-Deployment Configuration

### 1. Get Deployment Token
After creating the Static Web App in Azure:
1. Go to your Static Web App in Azure Portal
2. Click "Manage deployment token"
3. Copy the token

### 2. Configure GitHub Secrets
Add the deployment token to your GitHub repository:
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add new secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`
4. Paste the deployment token as the value

### 3. Verify Deployment
1. Push changes to the main branch
2. Check GitHub Actions tab for deployment status
3. Visit your Static Web App URL

## Custom Domain (Optional)

To configure a custom domain:
1. In Azure Portal, go to your Static Web App
2. Click "Custom domains"
3. Add your domain and follow DNS configuration steps

## Environment Variables

If you need environment variables:
1. In Azure Portal, go to your Static Web App
2. Click "Configuration"
3. Add application settings as needed

## Monitoring

Enable Application Insights for monitoring:
1. In Azure Portal, go to your Static Web App
2. Click "Application Insights"
3. Enable and configure monitoring

## Troubleshooting

### Build Failures
- Check the GitHub Actions log for detailed error messages
- Ensure all dependencies are listed in package.json
- Verify the output location is set to "out"

### Routing Issues
- Check staticwebapp.config.json for routing rules
- Ensure the SPA fallback is configured correctly

### Performance
- Static Web Apps automatically provides global CDN
- Consider enabling compression for better performance

## Next Steps

1. **Custom Domain**: Configure your own domain name
2. **Authentication**: Add Azure AD or social logins if needed
3. **API Integration**: Add Azure Functions if backend functionality is required
4. **Monitoring**: Set up Application Insights and alerts
5. **Cost Management**: Monitor usage and optimize as needed

## Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Next.js Static Export](https://nextjs.org/docs/advanced-features/static-html-export)
- [GitHub Actions for Azure](https://docs.microsoft.com/azure/static-web-apps/github-actions-workflow)
