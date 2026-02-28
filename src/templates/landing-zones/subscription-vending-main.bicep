// Subscription Vending Template
// Provisions and configures a new Azure subscription with governance

targetScope = 'managementGroup'

@description('Landing Zone Name')
@minLength(3)
@maxLength(63)
param landingZoneName string

@description('Subscription Display Name')
param subscriptionDisplayName string = landingZoneName

@description('Billing Account ID')
param billingAccountId string

@description('Enrollment Account ID')
param enrollmentAccountId string

@description('Management Group ID for subscription placement')
param targetManagementGroupId string

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

// Consolidated tags
var allTags = union(tags, {
  Environment: environment
  CostCenter: costCenter
  Owner: ownerEmail
  ManagedBy: 'SubscriptionVending-Bicep'
  LandingZone: landingZoneName
})

// Create Subscription (requires EA or MCA)
resource subscription 'Microsoft.Subscription/aliases@2021-10-01' = {
  name: 'sub-${landingZoneName}'
  properties: {
    displayName: subscriptionDisplayName
    workload: environment == 'prod' ? 'Production' : 'DevTest'
    billingScope: '/providers/Microsoft.Billing/billingAccounts/${billingAccountId}/enrollmentAccounts/${enrollmentAccountId}'
    subscriptionId: guid(landingZoneName, billingAccountId)
  }
}

// Move subscription to target Management Group
module subscriptionPlacement './modules/subscription-placement.bicep' = {
  name: 'place-subscription-${landingZoneName}'
  scope: managementGroup(targetManagementGroupId)
  params: {
    subscriptionId: subscription.properties.subscriptionId
    managementGroupId: targetManagementGroupId
  }
}

// Apply tags at subscription level
module subscriptionTags './modules/subscription-tags.bicep' = {
  name: 'tag-subscription-${landingZoneName}'
  scope: subscription(subscription.properties.subscriptionId)
  params: {
    tags: allTags
  }
  dependsOn: [
    subscriptionPlacement
  ]
}

// Deploy resource groups
module resourceGroups './modules/resource-groups.bicep' = {
  name: 'deploy-rgs-${landingZoneName}'
  scope: subscription(subscription.properties.subscriptionId)
  params: {
    landingZoneName: landingZoneName
    location: primaryRegion
    environment: environment
    tags: allTags
  }
  dependsOn: [
    subscriptionTags
  ]
}

// Deploy Log Analytics and Monitoring
module monitoring './modules/monitoring.bicep' = {
  name: 'deploy-monitoring-${landingZoneName}'
  scope: subscription(subscription.properties.subscriptionId)
  params: {
    landingZoneName: landingZoneName
    location: primaryRegion
    resourceGroupName: resourceGroups.outputs.monitoringRgName
    securityContactEmail: ownerEmail
    tags: allTags
  }
  dependsOn: [
    resourceGroups
  ]
}

// Apply Azure Policy
module policy './modules/policy.bicep' = {
  name: 'deploy-policy-${landingZoneName}'
  scope: subscription(subscription.properties.subscriptionId)
  params: {
    environment: environment
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
  }
  dependsOn: [
    monitoring
  ]
}

// Outputs
output subscriptionId string = subscription.properties.subscriptionId
output subscriptionName string = subscriptionDisplayName
output managementGroupId string = targetManagementGroupId
output logAnalyticsWorkspaceId string = monitoring.outputs.logAnalyticsWorkspaceId
output resourceGroups object = resourceGroups.outputs.resourceGroupNames
output deploymentTimestamp string = utcNow()
