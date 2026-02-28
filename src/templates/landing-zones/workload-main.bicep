// Workload Landing Zone Template
// Provisions infrastructure for a specific application/workload

targetScope = 'subscription'

@description('Landing Zone Name')
@minLength(3)
@maxLength(63)
param landingZoneName string

@description('Subscription ID')
param subscriptionId string

@description('Primary Azure region')
param primaryRegion string

@description('Cost center or department')
param costCenter string

@description('Environment type')
@allowed(['dev', 'test', 'staging', 'prod'])
param environment string

@description('Owner email')
param ownerEmail string

@description('Additional tags')
param tags object = {}

@description('Workload type')
@allowed(['web', 'api', 'data', 'container', 'function'])
param workloadType string = 'web'

@description('Enable High Availability')
param enableHighAvailability bool = false

// Consolidated tags
var allTags = union(tags, {
  Environment: environment
  CostCenter: costCenter
  Owner: ownerEmail
  ManagedBy: 'WorkloadLZ-Bicep'
  LandingZone: landingZoneName
  WorkloadType: workloadType
})

// Resource naming
var rgName = 'rg-${landingZoneName}-${environment}'
var vnetName = 'vnet-${landingZoneName}-${environment}'
var nsgName = 'nsg-${landingZoneName}-${environment}'
var lawName = 'law-${landingZoneName}-${environment}'
var kvName = 'kv-${take(landingZoneName, 17)}-${environment}-${uniqueString(subscriptionId)}'

// Resource Group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: rgName
  location: primaryRegion
  tags: allTags
}

// Virtual Network
module networking './modules/networking.bicep' = {
  name: 'deploy-networking-${landingZoneName}'
  scope: resourceGroup
  params: {
    vnetName: vnetName
    nsgName: nsgName
    location: primaryRegion
    addressPrefix: '10.0.0.0/16'
    subnets: [
      {
        name: 'snet-workload'
        addressPrefix: '10.0.1.0/24'
        networkSecurityGroupId: nsgName
      }
      {
        name: 'snet-data'
        addressPrefix: '10.0.2.0/24'
        networkSecurityGroupId: nsgName
      }
      {
        name: 'snet-privateendpoints'
        addressPrefix: '10.0.3.0/24'
        privateEndpointNetworkPolicies: 'Disabled'
      }
    ]
    tags: allTags
  }
}

// Log Analytics Workspace
module monitoring './modules/monitoring.bicep' = {
  name: 'deploy-monitoring-${landingZoneName}'
  scope: resourceGroup
  params: {
    workspaceName: lawName
    location: primaryRegion
    sku: environment == 'prod' ? 'PerGB2018' : 'PerGB2018'
    retentionInDays: environment == 'prod' ? 90 : 30
    tags: allTags
  }
}

// Key Vault
module keyVault './modules/keyvault.bicep' = {
  name: 'deploy-keyvault-${landingZoneName}'
  scope: resourceGroup
  params: {
    keyVaultName: kvName
    location: primaryRegion
    enableRbac: true
    enablePurgeProtection: environment == 'prod'
    enableSoftDelete: true
    networkAcls: {
      defaultAction: 'Allow' // Change to Deny with private endpoint for production
      bypass: 'AzureServices'
    }
    diagnosticWorkspaceId: monitoring.outputs.workspaceId
    tags: allTags
  }
}

// Workload-specific resources
module workload './modules/workload-${workloadType}.bicep' = {
  name: 'deploy-workload-${landingZoneName}'
  scope: resourceGroup
  params: {
    landingZoneName: landingZoneName
    location: primaryRegion
    environment: environment
    vnetId: networking.outputs.vnetId
    workloadSubnetId: networking.outputs.subnets[0].id
    keyVaultId: keyVault.outputs.keyVaultId
    logAnalyticsWorkspaceId: monitoring.outputs.workspaceId
    enableHighAvailability: enableHighAvailability
    tags: allTags
  }
}

// Outputs
output resourceGroupName string = resourceGroup.name
output vnetId string = networking.outputs.vnetId
output vnetName string = vnetName
output keyVaultName string = kvName
output logAnalyticsWorkspaceId string = monitoring.outputs.workspaceId
output workloadEndpoint string = workload.outputs.endpoint
output deploymentTimestamp string = utcNow()
