// Azure Landing Zone (ALZ) Enterprise-Scale Template
// Based on Azure Verified Modules - Management Groups and Policy

targetScope = 'managementGroup'

@description('Management Group ID where the landing zone will be created')
param parentManagementGroupId string

@description('Landing Zone Name')
@minLength(3)
@maxLength(63)
param landingZoneName string

@description('Subscription ID for the landing zone')
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

@description('Hub VNet Resource ID for connectivity')
param hubVnetResourceId string = ''

@description('Enable DDoS Protection')
param enableDdosProtection bool = false

@description('Enable Azure Firewall')
param enableFirewall bool = true

@description('Enable Azure Security Center')
param enableSecurityCenter bool = true

@description('Security contact email')
param securityContactEmail string

// Consolidated tags
var allTags = union(tags, {
  Environment: environment
  CostCenter: costCenter
  Owner: ownerEmail
  ManagedBy: 'ALZ-Bicep'
  LandingZone: landingZoneName
})

// Management Group for Landing Zone
resource landingZoneMG 'Microsoft.Management/managementGroups@2021-04-01' = {
  name: 'mg-${landingZoneName}'
  properties: {
    displayName: 'Landing Zone - ${landingZoneName}'
    details: {
      parent: {
        id: tenantResourceId('Microsoft.Management/managementGroups', parentManagementGroupId)
      }
    }
  }
}

// Associate Subscription with Management Group
resource subscriptionAssociation 'Microsoft.Management/managementGroups/subscriptions@2021-04-01' = {
  parent: landingZoneMG
  name: subscriptionId
}

// Deploy Hub-Spoke Network at subscription scope
module networking './modules/networking.bicep' = {
  name: 'deploy-networking-${landingZoneName}'
  scope: subscription(subscriptionId)
  params: {
    landingZoneName: landingZoneName
    location: primaryRegion
    hubVnetResourceId: hubVnetResourceId
    enableDdosProtection: enableDdosProtection
    enableFirewall: enableFirewall
    tags: allTags
  }
}

// Deploy Monitoring and Security
module monitoring './modules/monitoring.bicep' = {
  name: 'deploy-monitoring-${landingZoneName}'
  scope: subscription(subscriptionId)
  params: {
    landingZoneName: landingZoneName
    location: primaryRegion
    enableSecurityCenter: enableSecurityCenter
    securityContactEmail: securityContactEmail
    tags: allTags
  }
}

// Deploy Governance (Policy Assignments)
module governance './modules/governance.bicep' = {
  name: 'deploy-governance-${landingZoneName}'
  scope: managementGroup('mg-${landingZoneName}')
  params: {
    landingZoneName: landingZoneName
    environment: environment
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
  }
  dependsOn: [
    landingZoneMG
    monitoring
  ]
}

// Outputs
output managementGroupId string = landingZoneMG.id
output subscriptionId string = subscriptionId
output spokeVnetId string = networking.outputs.spokeVnetId
output logAnalyticsWorkspaceId string = monitoring.outputs.logAnalyticsWorkspaceId
output deploymentTimestamp string = utcNow()
