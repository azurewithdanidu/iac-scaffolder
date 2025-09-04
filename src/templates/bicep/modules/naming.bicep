// ==========================================================================================
// Azure Resource Naming Convention Module
// ==========================================================================================
// This module provides standardized Azure resource naming conventions that can be 
// customized by customers. It follows Microsoft's recommended naming conventions
// while allowing flexibility for organizational standards.
// ==========================================================================================

@description('Organization or company identifier')
param organization string

@description('Workload or application name')
param workload string

@description('Environment name (dev, test, staging, prod)')
param environment string

@description('Azure region short code')
param regionShortCode string

@description('Resource instance number (001, 002, etc.)')
param instance string = '001'

@description('Custom naming convention template - use {org}, {workload}, {env}, {region}, {instance}, {resourceType}')
param namingTemplate string = '{org}-{workload}-{env}-{region}-{resourceType}-{instance}'

@description('Custom resource type abbreviations override')
param resourceAbbreviations object = {}

// ==========================================================================================
// Default Resource Type Abbreviations (Microsoft CAF Standard)
// ==========================================================================================

var defaultAbbreviations = {
  // Compute
  'Microsoft.Web/sites': 'app'
  'Microsoft.Web/serverfarms': 'asp'
  'Microsoft.Compute/virtualMachines': 'vm'
  'Microsoft.ContainerInstance/containerGroups': 'ci'
  'Microsoft.Web/staticSites': 'stapp'
  
  // Storage
  'Microsoft.Storage/storageAccounts': 'st'
  'Microsoft.DocumentDB/databaseAccounts': 'cosmos'
  'Microsoft.Sql/servers': 'sql'
  'Microsoft.DBforPostgreSQL/servers': 'psql'
  'Microsoft.Cache/Redis': 'redis'
  
  // Networking
  'Microsoft.Network/virtualNetworks': 'vnet'
  'Microsoft.Network/networkSecurityGroups': 'nsg'
  'Microsoft.Network/publicIPAddresses': 'pip'
  'Microsoft.Network/loadBalancers': 'lb'
  'Microsoft.Network/applicationGateways': 'agw'
  
  // Security & Identity
  'Microsoft.KeyVault/vaults': 'kv'
  'Microsoft.ManagedIdentity/userAssignedIdentities': 'id'
  
  // Monitoring
  'Microsoft.Insights/components': 'appi'
  'Microsoft.OperationalInsights/workspaces': 'law'
  
  // Management
  'Microsoft.Resources/resourceGroups': 'rg'
  'Microsoft.Authorization/policyAssignments': 'pa'
  
  // Integration
  'Microsoft.ServiceBus/namespaces': 'sb'
  'Microsoft.EventHub/namespaces': 'evh'
  'Microsoft.Logic/workflows': 'logic'
}

// ==========================================================================================
// Variables
// ==========================================================================================

var mergedAbbreviations = union(defaultAbbreviations, resourceAbbreviations)

// Build base naming components
var namingComponents = {
  org: organization
  workload: workload
  env: environment
  region: regionShortCode
  instance: instance
}

// Generate resource name using naming template
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

// ==========================================================================================
// Outputs - All Possible Resource Names
// ==========================================================================================

// Resource Groups
@description('Resource Group name')
output resourceGroupName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Resources/resourceGroups'])

// Compute Resources
@description('App Service name')
output appServiceName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Web/sites'])

@description('App Service Plan name')
output appServicePlanName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Web/serverfarms'])

@description('Virtual Machine name')
output virtualMachineName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Compute/virtualMachines'])

@description('Container Instance name')
output containerInstanceName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.ContainerInstance/containerGroups'])

@description('Static Web App name')
output staticWebAppName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Web/staticSites'])

// Storage Resources
@description('Storage Account name (alphanumeric only)')
output storageAccountName string = take(toLower('${namingComponents.org}${namingComponents.workload}${namingComponents.env}${namingComponents.region}${mergedAbbreviations['Microsoft.Storage/storageAccounts']}${namingComponents.instance}'), 24)

@description('Cosmos DB name')
output cosmosDbName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.DocumentDB/databaseAccounts'])

@description('SQL Server name')
output sqlServerName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Sql/servers'])

@description('PostgreSQL Server name')
output postgreSqlServerName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.DBforPostgreSQL/servers'])

@description('Redis Cache name')
output redisCacheName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Cache/Redis'])

// Networking Resources
@description('Virtual Network name')
output virtualNetworkName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Network/virtualNetworks'])

@description('Network Security Group name')
output networkSecurityGroupName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Network/networkSecurityGroups'])

@description('Public IP name')
output publicIpName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Network/publicIPAddresses'])

@description('Load Balancer name')
output loadBalancerName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Network/loadBalancers'])

@description('Application Gateway name')
output applicationGatewayName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Network/applicationGateways'])

// Security & Identity
@description('Key Vault name')
output keyVaultName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.KeyVault/vaults'])

@description('User Assigned Managed Identity name')
output managedIdentityName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.ManagedIdentity/userAssignedIdentities'])

// Monitoring
@description('Application Insights name')
output applicationInsightsName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Insights/components'])

@description('Log Analytics Workspace name')
output logAnalyticsWorkspaceName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.OperationalInsights/workspaces'])

// Integration
@description('Service Bus Namespace name')
output serviceBusNamespaceName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.ServiceBus/namespaces'])

@description('Event Hub Namespace name')
output eventHubNamespaceName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.EventHub/namespaces'])

@description('Logic App name')
output logicAppName string = replace(baseResourceName, '{resourceType}', mergedAbbreviations['Microsoft.Logic/workflows'])

// ==========================================================================================
// Naming Configuration Output
// ==========================================================================================

@description('Current naming configuration')
output namingConfig object = {
  organization: organization
  workload: workload
  environment: environment
  regionShortCode: regionShortCode
  instance: instance
  namingTemplate: namingTemplate
  resourceAbbreviations: mergedAbbreviations
}
