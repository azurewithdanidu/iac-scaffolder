// Azure App Service deployment for CloudBlueprint Next.js app
// This creates the necessary Azure resources to host the application

@description('The name of the web app')
param webAppName string = 'cloudblueprint-${uniqueString(resourceGroup().id)}'

@description('Location for all resources')
param location string = resourceGroup().location

@description('The SKU of the App Service Plan')
@allowed([
  'F1'  // Free
  'B1'  // Basic
  'S1'  // Standard
  'P1v2' // Premium v2
])
param appServicePlanSku string = 'B1'

@description('Environment tags')
param tags object = {
  Environment: 'Production'
  Application: 'CloudBlueprint'
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${webAppName}-plan'
  location: location
  tags: tags
  sku: {
    name: appServicePlanSku
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// Web App
resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appCommandLine: 'npm start'
      appSettings: [
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '18-lts'
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
      ]
      alwaysOn: appServicePlanSku != 'F1' ? true : false
      http20Enabled: true
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      ftpsState: 'Disabled'
    }
    httpsOnly: true
    clientAffinityEnabled: false
  }
}

// Outputs
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output webAppName string = webApp.name
output resourceGroupName string = resourceGroup().name
