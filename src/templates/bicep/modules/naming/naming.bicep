// ==========================================================================================
// Naming Convention Module
// ==========================================================================================

@description('Organization or company name')
param org string

@description('Workload or application name')
param workload string

@description('Environment name (e.g., dev, test, prod)')
param environment string

@description('Azure region short code (e.g., eus, wus, uks)')
param regionShortCode string

@description('Instance number for resources that need uniqueness')
param instance string = '001'

// ==========================================================================================
// Naming Outputs
// ==========================================================================================

@description('Resource group name')
output resourceGroupName string = '${org}-${workload}-${environment}-${regionShortCode}-rg'

@description('Storage account name (max 24 chars, lowercase, no special chars)')
output storageAccountName string = take('${toLower(org)}${toLower(workload)}${toLower(environment)}${toLower(regionShortCode)}st${instance}', 24)

@description('Key vault name')
output keyVaultName string = '${org}-${workload}-${environment}-${regionShortCode}-kv-${instance}'

@description('App Service plan name')
output appServicePlanName string = '${org}-${workload}-${environment}-${regionShortCode}-asp-${instance}'

@description('App Service name')
output appServiceName string = '${org}-${workload}-${environment}-${regionShortCode}-app-${instance}'

@description('Application Insights name')
output applicationInsightsName string = '${org}-${workload}-${environment}-${regionShortCode}-appi-${instance}'

@description('Log Analytics workspace name')
output logAnalyticsWorkspaceName string = '${org}-${workload}-${environment}-${regionShortCode}-law-${instance}'

@description('Container Registry name (max 50 chars, alphanumeric only)')
output containerRegistryName string = take('${toLower(org)}${toLower(workload)}${toLower(environment)}${toLower(regionShortCode)}cr${instance}', 50)

@description('Container App Environment name')
output containerAppEnvironmentName string = '${org}-${workload}-${environment}-${regionShortCode}-cae-${instance}'

@description('Container App name')
output containerAppName string = '${org}-${workload}-${environment}-${regionShortCode}-ca-${instance}'

@description('Virtual Network name')
output virtualNetworkName string = '${org}-${workload}-${environment}-${regionShortCode}-vnet-${instance}'

@description('Network Security Group name')
output networkSecurityGroupName string = '${org}-${workload}-${environment}-${regionShortCode}-nsg-${instance}'

@description('Public IP name')
output publicIPName string = '${org}-${workload}-${environment}-${regionShortCode}-pip-${instance}'

@description('Load Balancer name')
output loadBalancerName string = '${org}-${workload}-${environment}-${regionShortCode}-lb-${instance}'

@description('SQL Server name')
output sqlServerName string = '${org}-${workload}-${environment}-${regionShortCode}-sql-${instance}'

@description('SQL Database name')
output sqlDatabaseName string = '${org}-${workload}-${environment}-${regionShortCode}-sqldb-${instance}'

@description('Cosmos DB account name')
output cosmosDbAccountName string = '${org}-${workload}-${environment}-${regionShortCode}-cosmos-${instance}'

@description('Redis Cache name')
output redisCacheName string = '${org}-${workload}-${environment}-${regionShortCode}-redis-${instance}'

@description('Service Bus namespace name')
output serviceBusNamespaceName string = '${org}-${workload}-${environment}-${regionShortCode}-sb-${instance}'

@description('Event Hub namespace name')
output eventHubNamespaceName string = '${org}-${workload}-${environment}-${regionShortCode}-evhns-${instance}'

@description('Managed Identity name')
output managedIdentityName string = '${org}-${workload}-${environment}-${regionShortCode}-mi-${instance}'

@description('Private DNS Zone name')
output privateDnsZoneName string = '${environment}.${workload}.${org}.private'

@description('API Management service name')
output apiManagementName string = '${org}-${workload}-${environment}-${regionShortCode}-apim-${instance}'

@description('Function App name')
output functionAppName string = '${org}-${workload}-${environment}-${regionShortCode}-func-${instance}'

@description('Static Web App name')
output staticWebAppName string = '${org}-${workload}-${environment}-${regionShortCode}-swa-${instance}'
