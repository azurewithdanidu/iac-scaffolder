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
   
   Go to Configuration > Application settings and add:
   
   ```
   NODE_ENV = production
   WEBSITE_NODE_DEFAULT_VERSION = 18-lts
   SCM_DO_BUILD_DURING_DEPLOYMENT = true
   ```

   **Important:** Do NOT set `WEBSITE_RUN_FROM_PACKAGE = 1` as this prevents the build from running.

## ⚠️ Build Configuration (Required)

**Problem:** Azure App Service may try to start the app before building it, causing errors like:
```
Error: ENOENT: no such file or directory, open '/home/site/wwwroot/.next/server/app-paths-manifest.json'
```

**Solution:** The following files ensure the app builds before starting:

### 1. oryx-post-build.sh
This script runs automatically after `npm install`:
```bash
#!/bin/bash
echo "Building Next.js application..."
npm run build
```

Make it executable:
```bash
chmod +x oryx-post-build.sh
```

### 2. .deployment
Tells Azure to use the custom deployment script:
```
[config]
command = deploy.sh
```

### 3. deploy.sh
Complete deployment script with build step:
```bash
#!/bin/bash
cd /home/site/wwwroot
npm ci --production=false
npm run build
```

### 4. package.json
Ensure these settings are present:
```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "scripts": {
    "build": "next build",
    "start": "node server.js"
  }
}
```

### Deploy These Files
```bash
git add .deployment deploy.sh oryx-post-build.sh package.json
git commit -m "Add Azure build configuration"
git push
```

After pushing, redeploy the App Service. Check the deployment logs to verify you see:
```
Building Next.js application...
Compiled successfully
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
