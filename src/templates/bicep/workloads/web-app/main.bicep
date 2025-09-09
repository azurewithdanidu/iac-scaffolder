// ==========================================================================================
// Web Application Workload Template
// ==========================================================================================
// This template deploys a complete web application infrastructure using Azure Verified 
// Modules (AVM) including:
// - Resource Group for workload resources
// - App Service Plan and App Service
// - Application Insights for monitoring
// - Key Vault for secrets management
// - Storage Account for application data
// ==========================================================================================

targetScope = 'subscription'

// ==========================================================================================
// Parameters
// ==========================================================================================

@description('Organization or company name')
param organization string = '{{organization}}'

@description('Workload or application name')
param workload string = '{{workload}}'

@description('Azure region for resource deployment')
param location string = '{{location}}'

@description('Environment name (e.g., dev, test, prod)')
param environment string = '{{environment}}'

@description('Azure region short code (e.g., eus, wus, uks)')
param regionShortCode string = '{{regionShortCode}}'

@description('App Service Plan SKU')
@allowed(['F1', 'D1', 'B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'P1V2', 'P2V2', 'P3V2', 'P1V3', 'P2V3', 'P3V3'])
param appServicePlanSku string = 'B1'

@description('Enable Application Insights')
param enableApplicationInsights bool = true

@description('Enable Key Vault')
param enableKeyVault bool = true

@description('Enable storage account')
param enableStorage bool = true

@description('App Service runtime stack')
@allowed(['DOTNETCORE|8.0', 'DOTNETCORE|6.0', 'NODE|18-lts', 'NODE|16-lts', 'PYTHON|3.11', 'PYTHON|3.9', 'PHP|8.2', 'JAVA|17-java17'])
param runtimeStack string = 'DOTNETCORE|8.0'

@description('Deployment timestamp')
param deploymentTimestamp string = utcNow()

@description('Tags to apply to all resources')
param tags object = {
  Organization: organization
  Workload: workload
  Environment: environment
  DeployedBy: 'CloudBlueprint'
  DeployedOn: deploymentTimestamp
}

// ==========================================================================================
// Resource Group (AVM)
// ==========================================================================================

module workloadResourceGroup 'br/public:avm/res/resources/resource-group:0.4.0' = {
  name: 'workload-resource-group'
  params: {
    name: '${organization}-${workload}-${environment}-${regionShortCode}-rg'
    location: location
    tags: union(tags, {
      Purpose: 'Web application workload resources'
    })
  }
}

// ==========================================================================================
// Naming Module (deployed in the resource group)
// ==========================================================================================

module naming '../../modules/naming/naming.bicep' = {
  name: 'naming-web-app'
  scope: resourceGroup(workloadResourceGroup.name)
  params: {
    org: organization
    workload: workload
    environment: environment
    regionShortCode: regionShortCode
    instance: '001'
  }
}

// ==========================================================================================
// Variables - Resource Names from Naming Module
// ==========================================================================================

var resourceNames = {
  resourceGroup: workloadResourceGroup.name
  storageAccount: naming.outputs.storageAccountName
  keyVault: naming.outputs.keyVaultName
  appServicePlan: naming.outputs.appServicePlanName
  appService: naming.outputs.appServiceName
  applicationInsights: naming.outputs.applicationInsightsName
  logAnalyticsWorkspace: naming.outputs.logAnalyticsWorkspaceName
}

// ==========================================================================================
// Storage Account (AVM)
// ==========================================================================================

module storageAccount 'br/public:avm/res/storage/storage-account:0.14.3' = if (enableStorage) {
  name: 'workload-storage-account'
  scope: resourceGroup(workloadResourceGroup.name)
  params: {
    name: resourceNames.storageAccount
    location: location
    kind: 'StorageV2'
    skuName: 'Standard_LRS'
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    tags: tags
  }
}

// ==========================================================================================
// Application Insights (AVM)
// ==========================================================================================

// ==========================================================================================
// Log Analytics Workspace for Application Insights (AVM)
// ==========================================================================================

module logAnalyticsWorkspace 'br/public:avm/res/operational-insights/workspace:0.7.0' = if (enableApplicationInsights) {
  name: 'workload-log-analytics'
  scope: resourceGroup(workloadResourceGroup.name)
  params: {
    name: resourceNames.logAnalyticsWorkspace
    location: location
    dataRetention: 30
    tags: tags
  }
}

module applicationInsights 'br/public:avm/res/insights/component:0.4.1' = if (enableApplicationInsights) {
  name: 'workload-app-insights'
  scope: resourceGroup(workloadResourceGroup.name)
  params: {
    name: resourceNames.applicationInsights
    location: location
    kind: 'web'
    applicationType: 'web'
    workspaceResourceId: enableApplicationInsights ? logAnalyticsWorkspace!.outputs.resourceId : ''
    tags: tags
  }
}

// ==========================================================================================
// Key Vault (AVM)
// ==========================================================================================

module keyVault 'br/public:avm/res/key-vault/vault:0.9.0' = if (enableKeyVault) {
  name: 'workload-key-vault'
  scope: resourceGroup(workloadResourceGroup.name)
  params: {
    name: resourceNames.keyVault
    location: location
    sku: 'standard'
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: false
    enableRbacAuthorization: true
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
    tags: tags
  }
}

// ==========================================================================================
// App Service Plan (AVM)
// ==========================================================================================

module appServicePlan 'br/public:avm/res/web/serverfarm:0.3.0' = {
  name: 'workload-app-service-plan'
  scope: resourceGroup(workloadResourceGroup.name)
  params: {
    name: resourceNames.appServicePlan
    location: location
    skuName: appServicePlanSku
    kind: 'Windows'
    tags: tags
  }
}

// ==========================================================================================
// App Service (AVM)
// ==========================================================================================

module appService 'br/public:avm/res/web/site:0.10.0' = {
  name: 'workload-app-service'
  scope: resourceGroup(workloadResourceGroup.name)
  params: {
    name: resourceNames.appService
    location: location
    kind: 'app'
    serverFarmResourceId: appServicePlan.outputs.resourceId
    managedIdentities: {
      systemAssigned: true
    }
    httpsOnly: true
    siteConfig: {
      minTlsVersion: '1.2'
      ftpsState: 'FtpsOnly'
      linuxFxVersion: contains(runtimeStack, 'NODE') || contains(runtimeStack, 'PYTHON') ? runtimeStack : null
      netFrameworkVersion: contains(runtimeStack, 'DOTNETCORE') ? 'v8.0' : null
      appSettings: [
        {
          name: 'ENVIRONMENT'
          value: environment
        }
      ]
    }
    tags: tags
  }
}

// ==========================================================================================
// Outputs
// ==========================================================================================

@description('Resource Group name')
output resourceGroupName string = workloadResourceGroup.outputs.name

@description('App Service name')
output appServiceName string = appService.outputs.name

@description('App Service hostname')
output appServiceHostname string = appService.outputs.defaultHostname

@description('App Service URL')
output appServiceUrl string = 'https://${appService.outputs.defaultHostname}'

@description('App Service Plan name')
output appServicePlanName string = appServicePlan.outputs.name

@description('Application Insights name')
output applicationInsightsName string = enableApplicationInsights ? applicationInsights!.outputs.name : ''

@description('Application Insights Instrumentation Key')
output applicationInsightsInstrumentationKey string = enableApplicationInsights ? applicationInsights!.outputs.instrumentationKey : ''

@description('Application Insights Connection String')
output applicationInsightsConnectionString string = enableApplicationInsights ? applicationInsights!.outputs.connectionString : ''

@description('Key Vault name')
output keyVaultName string = enableKeyVault ? keyVault!.outputs.name : ''

@description('Key Vault URI')
output keyVaultUri string = enableKeyVault ? keyVault!.outputs.uri : ''

@description('Storage Account name')
output storageAccountName string = enableStorage ? storageAccount!.outputs.name : ''

@description('App Service Managed Identity Principal ID')
output appServicePrincipalId string = appService.outputs.systemAssignedMIPrincipalId

@description('Deployment timestamp')
output deploymentTimestamp string = deploymentTimestamp

@description('Workload configuration')
output workloadConfig object = {
  organization: organization
  workload: workload
  environment: environment
  location: location
  appServicePlanSku: appServicePlanSku
  runtimeStack: runtimeStack
  enableApplicationInsights: enableApplicationInsights
  enableKeyVault: enableKeyVault
  enableStorage: enableStorage
}
