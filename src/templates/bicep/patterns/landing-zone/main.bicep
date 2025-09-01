// ==========================================================================================
// Landing Zone Template with Azure Verified Modules (AVM) and Naming Convention
// ==========================================================================================
// This template deploys a secure, compliant landing zone infrastructure using Azure 
// Verified Modules (AVM) with standardized naming conventions that customers can customize.
// ==========================================================================================

targetScope = 'subscription'

// ==========================================================================================
// Parameters
// ==========================================================================================

@description('Organization or company name')
param organization string = '{{organization}}'

@description('Azure region for resource deployment')
param location string = '{{location}}'

@description('Environment name (e.g., dev, test, prod)')
param environment string = '{{environment}}'

@description('Azure region short code (e.g., eus, wus, uks)')
param regionShortCode string = '{{regionShortCode}}'

@description('Custom naming convention template')
param namingTemplate string = '{org}-{workload}-{env}-{region}-{resourceType}-{instance}'

@description('Custom resource type abbreviations')
param resourceAbbreviations object = {}

@description('Enable hub and spoke networking topology')
param enableHubSpoke bool = false

@description('Enable Azure Firewall in hub network')
param enableFirewall bool = false

@description('Enable DDoS Protection Standard')
param enableDdosProtection bool = false

@description('Enable monitoring and logging')
param enableMonitoring bool = true

@description('Deployment timestamp')
param deploymentTimestamp string = utcNow()

@description('Tags to apply to all resources')
param tags object = {
  Organization: organization
  Environment: environment
  DeployedBy: 'CloudBlueprint'
  DeployedOn: deploymentTimestamp
}

// ==========================================================================================
// Variables - Resource Names with Customer Customizable Naming Convention
// ==========================================================================================

// Merge default and custom abbreviations
var defaultAbbreviations = {
  'Microsoft.Resources/resourceGroups': 'rg'
  'Microsoft.Storage/storageAccounts': 'st'
  'Microsoft.KeyVault/vaults': 'kv'
  'Microsoft.OperationalInsights/workspaces': 'law'
  'Microsoft.Network/virtualNetworks': 'vnet'
}
var mergedAbbreviations = union(defaultAbbreviations, resourceAbbreviations)

// Build naming components
var namingComponents = {
  org: organization
  workload: 'landingzone'
  env: environment
  region: regionShortCode
  instance: '001'
}

// Base naming template
var baseResourceName = replace(
  replace(
    replace(
      replace(
        replace(
          namingTemplate,
          '{org}', namingComponents.org
        ),
        '{workload}', namingComponents.workload
      ),
      '{env}', namingComponents.env
    ),
    '{region}', namingComponents.region
  ),
  '{instance}', namingComponents.instance
)

// Resource names using customer-customizable naming convention
var resourceNames = {
  coreResourceGroup: replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Resources/resourceGroups'])
  storageAccount: take(toLower('${namingComponents.org}${namingComponents.workload}${namingComponents.env}${namingComponents.region}${mergedAbbreviations['Microsoft.Storage/storageAccounts']}${namingComponents.instance}'), 24)
  keyVault: replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.KeyVault/vaults'])
  logAnalyticsWorkspace: replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.OperationalInsights/workspaces'])
  hubVirtualNetwork: replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Network/virtualNetworks'])
}

var hubNetworkConfig = {
  addressSpace: '10.0.0.0/16'
  subnets: [
    {
      name: 'GatewaySubnet'
      addressPrefix: '10.0.1.0/27'
    }
    {
      name: 'AzureFirewallSubnet'
      addressPrefix: '10.0.2.0/26'
    }
    {
      name: 'SharedServicesSubnet'
      addressPrefix: '10.0.3.0/24'
    }
  ]
}

// ==========================================================================================
// Core Resource Group (AVM)
// ==========================================================================================

module coreResourceGroup 'br/public:avm/res/resources/resource-group:0.4.0' = {
  name: 'core-resource-group'
  params: {
    name: resourceNames.coreResourceGroup
    location: location
    tags: union(tags, {
      Purpose: 'Landing zone core infrastructure'
      NamingTemplate: namingTemplate
    })
  }
}

// ==========================================================================================
// Monitoring Infrastructure (AVM)
// ==========================================================================================

module logAnalyticsWorkspace 'br/public:avm/res/operational-insights/workspace:0.7.0' = if (enableMonitoring) {
  name: 'core-log-analytics'
  scope: resourceGroup(coreResourceGroup.name)
  params: {
    name: resourceNames.logAnalyticsWorkspace
    location: location
    dataRetention: 90
    tags: tags
  }
}

module storageAccount 'br/public:avm/res/storage/storage-account:0.14.3' = if (enableMonitoring) {
  name: 'core-storage-account'
  scope: resourceGroup(coreResourceGroup.name)
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
// Core Key Vault (AVM)
// ==========================================================================================

module keyVault 'br/public:avm/res/key-vault/vault:0.9.0' = {
  name: 'core-key-vault'
  scope: resourceGroup(coreResourceGroup.name)
  params: {
    name: resourceNames.keyVault
    location: location
    sku: 'standard'
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    enableRbacAuthorization: true
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
    tags: tags
  }
}

// ==========================================================================================
// Hub Virtual Network (AVM)
// ==========================================================================================

module hubVirtualNetwork 'br/public:avm/res/network/virtual-network:0.5.4' = if (enableHubSpoke) {
  name: 'hub-virtual-network'
  scope: resourceGroup(coreResourceGroup.name)
  params: {
    name: resourceNames.hubVirtualNetwork
    location: location
    addressPrefixes: [hubNetworkConfig.addressSpace]
    subnets: hubNetworkConfig.subnets
    ddosProtectionPlanResourceId: enableDdosProtection ? '/subscriptions/${subscription().subscriptionId}/resourceGroups/NetworkWatcherRG/providers/Microsoft.Network/ddosProtectionPlans/default-ddos-plan' : ''
    tags: tags
  }
}

// ==========================================================================================
// Outputs
// ==========================================================================================

@description('Core Resource Group name')
output coreResourceGroupName string = coreResourceGroup.name

@description('Naming configuration used (customers can modify the namingTemplate parameter)')
output namingConfig object = {
  organization: organization
  environment: environment
  regionShortCode: regionShortCode
  namingTemplate: namingTemplate
  resourceAbbreviations: mergedAbbreviations
  exampleResourceNames: resourceNames
}

@description('Log Analytics Workspace name')
output logAnalyticsWorkspaceName string = enableMonitoring ? logAnalyticsWorkspace!.outputs.name : ''

@description('Log Analytics Workspace resource ID')
output logAnalyticsWorkspaceId string = enableMonitoring ? logAnalyticsWorkspace!.outputs.resourceId : ''

@description('Storage Account name')
output storageAccountName string = enableMonitoring ? storageAccount!.outputs.name : ''

@description('Key Vault name')
output keyVaultName string = keyVault.outputs.name

@description('Key Vault URI')
output keyVaultUri string = keyVault.outputs.uri

@description('Hub Virtual Network name')
output hubVirtualNetworkName string = enableHubSpoke ? hubVirtualNetwork!.outputs.name : ''

@description('Hub Virtual Network resource ID')
output hubVirtualNetworkId string = enableHubSpoke ? hubVirtualNetwork!.outputs.resourceId : ''

@description('Deployment timestamp')
output deploymentTimestamp string = deploymentTimestamp

@description('Landing zone configuration')
output landingZoneConfig object = {
  organization: organization
  environment: environment
  location: location
  enableHubSpoke: enableHubSpoke
  enableFirewall: enableFirewall
  enableDdosProtection: enableDdosProtection
  enableMonitoring: enableMonitoring
}
