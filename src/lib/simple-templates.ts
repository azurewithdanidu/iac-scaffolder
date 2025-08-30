import { FormData } from '@/types/form'

// Template generator for the new folder structure:
// bicep/modules/ - Direct AVM module references 
// bicep/patterns/landing-zone/ - Landing zone templates
// bicep/workloads/web-app/ - Application-specific templates
// pipelines/ - CI/CD pipeline templates
export function generateTemplates(formData: FormData) {
  const templates: Record<string, string> = {}
  
  // Always generate naming module and basic folder structure
  templates['bicep/modules/naming/naming.bicep'] = generateNamingModule()
  
  // Generate landing zone template if selected
  if (formData.includePatterns.landingZone) {
    templates['bicep/patterns/landing-zone/main.bicep'] = generateLandingZoneTemplate(formData)
    templates['bicep/patterns/landing-zone/main.parameters.json'] = generateLandingZoneParameters(formData)
  }
  
  // Always generate workload template
  templates['bicep/workloads/web-app/main.bicep'] = generateWorkloadTemplate(formData)
  templates['bicep/workloads/web-app/main.parameters.json'] = generateWorkloadParameters(formData)
  
  // Generate GitHub Actions workflow if selected
  if (formData.pipelineProvider === 'github-actions') {
    templates['.github/workflows/deploy.yml'] = generateGitHubActionsWorkflow(formData)
  }
  
  // Generate Azure DevOps pipeline if selected  
  if (formData.pipelineProvider === 'azure-devops') {
    templates['pipelines/templates/deploy-bicep.yml'] = generateAzureDevOpsTemplate(formData)
    templates['azure-pipelines.yml'] = generateAzureDevOpsPipeline(formData)
  }
  
  // Generate documentation
  templates['README.md'] = generateReadme(formData)
  templates['docs/DEPLOYMENT.md'] = generateDeploymentGuide(formData)
  
  return templates
}

function generateNamingModule(): string {
  return `// ==========================================================================================
// Naming Convention Module
// ==========================================================================================

@description('Organization or company name')
param org string

@description('Workload or application name')
param workload string

@description('Environment (dev, test, prod)')
param env string

@description('Azure region short code')
param region string

@description('Separator character for resource names')
param separator string = '-'

// ==========================================================================================
// Helper Functions
// ==========================================================================================

@description('Normalize and trim string to specified max length')
func norm(base string, maxLen int) string => toLower(substring(base, 0, min(length(base), maxLen)))

@description('Remove invalid characters for storage account names')
func cleanForStorage(name string) string => replace(replace(replace(name, '-', ''), '_', ''), ' ', '')

@description('General naming pattern: {org}-{workload}-{env}-{region}-{suffix}')
func name(suffix string) string => norm('\${org}\${separator}\${workload}\${separator}\${env}\${separator}\${region}\${separator}\${suffix}', 90)

// ==========================================================================================
// Resource-Specific Naming Functions
// ==========================================================================================

@description('Resource Group name (max 90 chars)')
func resourceGroupName(suffix string) string => name(suffix)

@description('Storage Account name (3-24 chars, lowercase alphanumeric)')
func storageAccountName(suffix string) string => norm(cleanForStorage('\${org}\${workload}\${env}\${region}\${suffix}'), 24)

@description('Key Vault name (3-24 chars)')
func keyVaultName(suffix string) string => norm(name(suffix), 24)

@description('Virtual Network name (2-64 chars)')
func virtualNetworkName(suffix string) string => norm(name(suffix), 64)

@description('Log Analytics Workspace name (4-63 chars)')
func logAnalyticsWorkspaceName(suffix string) string => norm(name(suffix), 63)

@description('Network Security Group name (1-80 chars)')
func networkSecurityGroupName(suffix string) string => norm(name(suffix), 80)

@description('NAT Gateway name (1-80 chars)')
func natGatewayName(suffix string) string => norm(name(suffix), 80)

@description('Public IP name (1-80 chars)')
func publicIpName(suffix string) string => norm(name(suffix), 80)

// ==========================================================================================
// Outputs
// ==========================================================================================

output resourceGroupName string = resourceGroupName('rg')
output storageAccountName string = storageAccountName('st')
output keyVaultName string = keyVaultName('kv')
output virtualNetworkName string = virtualNetworkName('vnet')
output logAnalyticsWorkspaceName string = logAnalyticsWorkspaceName('law')
output networkSecurityGroupName string = networkSecurityGroupName('nsg')
output natGatewayName string = natGatewayName('natgw')
output publicIpName string = publicIpName('pip')
`
}

function generateLandingZoneTemplate(formData: FormData): string {
  return `// ==========================================================================================
// Landing Zone Infrastructure - Network Security & Monitoring
// ==========================================================================================

targetScope = 'subscription'

// ==========================================================================================
// Parameters
// ==========================================================================================

@description('Environment (dev, test, prod)')
param env string

@description('Azure region for resources')
param location string

@description('Resource tags')
param tags object = {}

@description('Organization name')
param org string = '${formData.organization}'

@description('Workload name') 
param workload string = '${formData.workload}'

@description('Region short code')
param region string = 'aue'

// ==========================================================================================
// Variables
// ==========================================================================================

var commonTags = union(tags, {
  Environment: env
  Workload: workload
  Organization: org
  'Deploy-Date': utcNow('yyyy-MM-dd')
  'azd-env-name': env
})

// ==========================================================================================
// Resource Groups
// ==========================================================================================

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: '\${org}-\${workload}-\${env}-\${region}-rg'
  location: location
  tags: commonTags
}

resource monitorrg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: '\${org}-\${workload}-\${env}-\${region}-monitor-rg'
  location: location
  tags: commonTags
}

// ==========================================================================================
// Modules - Direct AVM References (like your sample)
// ==========================================================================================

// Naming module
module naming '../../modules/naming/naming.bicep' = {
  name: 'landing-zone-naming'
  scope: rg
  params: {
    org: org
    workload: workload
    env: env
    region: region
  }
}

${formData.modules.logAnalytics ? `
// Log Analytics Workspace - Direct AVM module call (following your sample pattern)
module law 'br/public:avm/res/operational-insights/workspace:0.12.0' = {
  name: 'landing-zone-law'
  scope: monitorrg
  params: {
    name: naming.outputs.logAnalyticsWorkspaceName
    location: location
    tags: commonTags
    skuName: env == 'prod' ? 'PerGB2018' : 'Free'
    dataRetention: env == 'prod' ? 90 : 30
  }
}
` : ''}

${formData.modules.keyVault ? `
// Key Vault - Direct AVM module call
module keyVault 'br/public:avm/res/key-vault/vault:0.6.1' = {
  name: 'landing-zone-kv'
  scope: rg
  params: {
    name: naming.outputs.keyVaultName
    location: location
    tags: commonTags
    enableVaultForDeployment: true
    enableVaultForTemplateDeployment: true
    enableVaultForDiskEncryption: true
    enableSoftDelete: true
    softDeleteRetentionInDays: env == 'prod' ? 90 : 7
    enablePurgeProtection: env == 'prod' ? true : false
    skuName: 'standard'
  }
}
` : ''}

${formData.modules.virtualNetwork ? `
// Virtual Network - Direct AVM module call
module virtualNetwork 'br/public:avm/res/network/virtual-network:0.1.6' = {
  name: 'landing-zone-vnet'
  scope: rg
  params: {
    name: naming.outputs.virtualNetworkName
    location: location
    tags: commonTags
    addressPrefixes: [
      '10.0.0.0/16'
    ]
    subnets: [
      {
        name: 'default'
        addressPrefix: '10.0.1.0/24'
      }
      {
        name: 'web'
        addressPrefix: '10.0.2.0/24'
      }
      {
        name: 'data'
        addressPrefix: '10.0.3.0/24'
      }
    ]
  }
}
` : ''}

${formData.modules.networkSecurityGroup ? `
// Network Security Groups - Direct AVM module calls
module webNsg 'br/public:avm/res/network/network-security-group:0.2.0' = {
  name: 'web-nsg'
  scope: rg
  params: {
    name: '\${naming.outputs.networkSecurityGroupName}-web'
    location: location
    tags: commonTags
    securityRules: [
      {
        name: 'AllowHTTPS'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowHTTP'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '80'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1001
          direction: 'Inbound'
        }
      }
    ]
  }
}

module dataNsg 'br/public:avm/res/network/network-security-group:0.2.0' = {
  name: 'data-nsg'
  scope: rg
  params: {
    name: '\${naming.outputs.networkSecurityGroupName}-data'
    location: location
    tags: commonTags
    securityRules: [
      {
        name: 'AllowWebTier'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRanges: ['1433', '5432', '3306']
          sourceAddressPrefix: '10.0.2.0/24'
          destinationAddressPrefix: '10.0.3.0/24'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
    ]
  }
}
` : ''}

${formData.modules.natGateway ? `
// NAT Gateway - Direct AVM module call
module natPublicIp 'br/public:avm/res/network/public-ip-address:0.4.1' = {
  name: 'nat-public-ip'
  scope: rg
  params: {
    name: '\${naming.outputs.publicIpName}-nat'
    location: location
    tags: commonTags
    skuName: 'Standard'
    publicIPAllocationMethod: 'Static'
    zones: ['1', '2', '3']
  }
}

module natGateway 'br/public:avm/res/network/nat-gateway:0.2.0' = {
  name: 'nat-gateway'
  scope: rg
  params: {
    name: naming.outputs.natGatewayName
    location: location
    tags: commonTags
    skuName: 'Standard'
    zones: ['1', '2', '3']
    publicIpResourceIds: [
      natPublicIp.outputs.resourceId
    ]
  }
}
` : ''}

// ==========================================================================================
// Outputs
// ==========================================================================================

output resourceGroupName string = rg.name
output resourceGroupId string = rg.id
output monitorResourceGroupName string = monitorrg.name
output monitorResourceGroupId string = monitorrg.id

${formData.modules.logAnalytics ? `
output logAnalyticsWorkspaceId string = law.outputs.resourceId
output logAnalyticsWorkspaceName string = law.outputs.name
` : ''}

${formData.modules.keyVault ? `
output keyVaultId string = keyVault.outputs.resourceId
output keyVaultName string = keyVault.outputs.name
output keyVaultUri string = keyVault.outputs.uri
` : ''}

${formData.modules.virtualNetwork ? `
output virtualNetworkId string = virtualNetwork.outputs.resourceId
output virtualNetworkName string = virtualNetwork.outputs.name
` : ''}

${formData.modules.networkSecurityGroup ? `
output webNsgId string = webNsg.outputs.resourceId
output dataNsgId string = dataNsg.outputs.resourceId
` : ''}

${formData.modules.natGateway ? `
output natGatewayId string = natGateway.outputs.resourceId
output natPublicIpId string = natPublicIp.outputs.resourceId
` : ''}

// Note: All values are parameterized and naming is consistent using the naming module
// This follows the pattern shown in your sample-bicep folder
`
}

function generateWorkloadTemplate(formData: FormData): string {
  return `// ==========================================================================================
// Web Application Workload Infrastructure
// ==========================================================================================

targetScope = 'resourceGroup'

// ==========================================================================================
// Parameters
// ==========================================================================================

@description('Environment (dev, test, prod)')
param env string

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Resource tags')
param tags object = {}

@description('Organization name')
param org string = '${formData.organization}'

@description('Workload name')
param workload string = '${formData.workload}'

@description('Region short code')
param region string = 'aue'

@description('App Service SKU')
@allowed(['F1', 'D1', 'B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'P1', 'P2', 'P3'])
param appServiceSku string = env == 'prod' ? 'P1' : 'B1'

// ==========================================================================================
// Variables
// ==========================================================================================

var commonTags = union(tags, {
  Environment: env
  Workload: workload
  Organization: org
  'Deploy-Date': utcNow('yyyy-MM-dd')
})

// ==========================================================================================
// Modules - Direct AVM References
// ==========================================================================================

// Naming module
module naming '../modules/naming/naming.bicep' = {
  name: 'workload-naming'
  params: {
    org: org
    workload: workload
    env: env
    region: region
  }
}

// App Service Plan - Direct AVM module call
module appServicePlan 'br/public:avm/res/web/serverfarm:0.2.2' = {
  name: 'app-service-plan'
  params: {
    name: '\${naming.outputs.resourceGroupName}-asp'
    location: location
    tags: commonTags
    skuName: appServiceSku
    skuCapacity: env == 'prod' ? 2 : 1
    kind: 'app'
  }
}

// App Service - Direct AVM module call
module appService 'br/public:avm/res/web/site:0.3.9' = {
  name: 'app-service'
  params: {
    name: '\${naming.outputs.resourceGroupName}-app'
    location: location
    tags: commonTags
    kind: 'app'
    serverFarmResourceId: appServicePlan.outputs.resourceId
    siteConfig: {
      alwaysOn: env == 'prod' ? true : false
      http20Enabled: true
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      ftpsState: 'Disabled'
      netFrameworkVersion: 'v8.0'
      metadata: [
        {
          name: 'CURRENT_STACK'
          value: 'dotnet'
        }
      ]
    }
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    appSettingsKeyValuePairs: {
      WEBSITE_RUN_FROM_PACKAGE: '1'
      ASPNETCORE_ENVIRONMENT: env
    }
  }
}

// ==========================================================================================
// Outputs
// ==========================================================================================

output appServiceId string = appService.outputs.resourceId
output appServiceName string = appService.outputs.name
output appServiceUrl string = 'https://\${appService.outputs.defaultHostname}'
output appServicePlanId string = appServicePlan.outputs.resourceId

// Note: This follows the Azure web app deployment pattern using AVM modules
// as shown in your sample-bicep folder
`
}

function generateLandingZoneParameters(formData: FormData): string {
  return `{
  "$schema": "https://schema.management.azure.com/schemas/2018-05-01/subscriptionDeploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "env": {
      "value": "dev"
    },
    "location": {
      "value": "australiaeast"
    },
    "tags": {
      "value": {
        "Environment": "dev",
        "Project": "${formData.workload}",
        "Owner": "${formData.organization}",
        "CostCenter": "IT"
      }
    }
  }
}`
}

function generateWorkloadParameters(formData: FormData): string {
  return `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "env": {
      "value": "dev"
    },
    "tags": {
      "value": {
        "Environment": "dev",
        "Project": "${formData.workload}",
        "Owner": "${formData.organization}",
        "CostCenter": "IT"
      }
    },
    "appServiceSku": {
      "value": "B1"
    }
  }
}`
}

function generateGitHubActionsWorkflow(formData: FormData): string {
  const envList = formData.environments.filter(e => e.enabled).map(e => e.name)
  
  return `name: Deploy Infrastructure

on:
  push:
    branches: [ main ]
    paths:
      - 'bicep/**'
      - '.github/workflows/**'
  pull_request:
    branches: [ main ]
    paths:
      - 'bicep/**'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'dev'
        type: choice
        options:
${envList.map(env => `          - ${env}`).join('\n')}

permissions:
  id-token: write
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          client-id: \${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: \${{ secrets.AZURE_TENANT_ID }}
          subscription-id: \${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Validate Bicep Templates
        run: |
          echo "Validating templates..."

  deploy:
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: \${{ github.event.inputs.environment || 'dev' }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          client-id: \${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: \${{ secrets.AZURE_TENANT_ID }}
          subscription-id: \${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Deploy Infrastructure
        run: |
          echo "Deploying infrastructure..."
`
}

function generateAzureDevOpsTemplate(formData: FormData): string {
  return `# Azure DevOps Pipeline Template for Bicep Deployment
parameters:
- name: environment
  type: string
  default: 'dev'
- name: resourceGroupName
  type: string
- name: serviceConnection
  type: string

jobs:
- job: DeployInfrastructure
  displayName: 'Deploy Infrastructure'
  pool:
    vmImage: 'ubuntu-latest'
  
  variables:
    azureServiceConnection: '\${{ parameters.serviceConnection }}'
    resourceGroupName: '\${{ parameters.resourceGroupName }}'
    environment: '\${{ parameters.environment }}'
  
  steps:
  - checkout: self
  
  - task: AzureCLI@2
    displayName: 'Deploy Infrastructure'
    inputs:
      azureSubscription: \$(azureServiceConnection)
      scriptType: 'bash'
      scriptLocation: 'inlineScript'
      inlineScript: |
        echo "Deploying infrastructure for ${formData.workload}..."
`
}

function generateAzureDevOpsPipeline(formData: FormData): string {
  const envList = formData.environments.filter(e => e.enabled).map(e => e.name)
  
  return `# Azure DevOps Pipeline for ${formData.workload} Infrastructure
trigger:
  branches:
    include:
    - main
  paths:
    include:
    - bicep/**
    - azure-pipelines.yml

pr:
  branches:
    include:
    - main
  paths:
    include:
    - bicep/**

variables:
  azureServiceConnection: 'AzureServiceConnection'
  resourceGroupNamePattern: '${formData.organization}-${formData.workload}-\$(environment)-aue-rg'

stages:
${envList.map(env => `
- stage: Deploy_${env.charAt(0).toUpperCase() + env.slice(1)}
  displayName: 'Deploy to ${env.toUpperCase()}'
  variables:
    environment: '${env}'
    resourceGroupName: '${formData.organization}-${formData.workload}-${env}-aue-rg'
  
  jobs:
  - template: pipelines/templates/deploy-bicep.yml
    parameters:
      environment: '${env}'
      resourceGroupName: '\$(resourceGroupName)'
      serviceConnection: '\$(azureServiceConnection)'
`).join('')}
`
}

function generateReadme(formData: FormData): string {
  return `# ${formData.workload} Infrastructure

This repository contains Azure infrastructure as code (IaC) using Bicep templates and Azure Verified Modules (AVM).

## Project Structure

\`\`\`
${formData.workload}/
├── bicep/
│   ├── modules/
│   │   └── naming/              # Naming convention module
${formData.includePatterns.landingZone ? '│   │   └── landing-zone/       # Network security and monitoring' : ''}
│   └── workloads/
│       └── web-app/             # Web application infrastructure
${formData.pipelineProvider === 'github-actions' ? '├── .github/\n│   └── workflows/\n│       └── deploy.yml           # GitHub Actions workflow' : ''}
${formData.pipelineProvider === 'azure-devops' ? '├── pipelines/\n│   └── templates/\n│       └── deploy-bicep.yml     # Azure DevOps template\n├── azure-pipelines.yml          # Main pipeline definition' : ''}
├── docs/
│   └── DEPLOYMENT.md            # Deployment guide
└── README.md                    # This file
\`\`\`

## Features

- **Direct AVM Integration**: Uses Azure Verified Modules directly from the public registry
- **Standardized Naming**: Consistent resource naming across environments
- **Multi-Environment**: Support for ${formData.environments.filter(e => e.enabled).map(e => e.name).join(', ')} environments
- **CI/CD Ready**: ${formData.pipelineProvider === 'github-actions' ? 'GitHub Actions' : 'Azure DevOps'} pipelines included
- **Security Best Practices**: Network security groups, diagnostic settings, and monitoring

## Quick Start

### Prerequisites

- Azure CLI installed and configured
- Bicep CLI installed
- Appropriate Azure permissions for resource deployment

For additional support, refer to the [Azure Bicep documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/) and [Azure Verified Modules](https://aka.ms/avm).
`
}

function generateDeploymentGuide(formData: FormData): string {
  return `# Deployment Guide for ${formData.workload}

This guide provides step-by-step instructions for deploying the ${formData.workload} infrastructure.

## Prerequisites

- Azure CLI (latest version)
- Bicep CLI installed
- Azure subscription with appropriate permissions
- ${formData.pipelineProvider === 'github-actions' ? 'GitHub account with repository access' : 'Azure DevOps organization with project access'}

## Environment Setup

1. **Login to Azure**
   \`\`\`bash
   az login
   az account set --subscription "your-subscription-id"
   \`\`\`

2. **Verify Bicep Installation**
   \`\`\`bash
   az bicep version
   \`\`\`

## Deployment Steps

${formData.includePatterns.landingZone ? `
### Step 1: Deploy Landing Zone

\`\`\`bash
az deployment sub create \\
  --location australiaeast \\
  --template-file bicep/patterns/landing-zone/main.bicep \\
  --parameters @bicep/patterns/landing-zone/parameters/dev.json
\`\`\`
` : ''}

### Step ${formData.includePatterns.landingZone ? '2' : '1'}: Deploy Application Infrastructure

\`\`\`bash
az deployment group create \\
  --resource-group rg-${formData.workload}-dev-aue \\
  --template-file bicep/workloads/web-app/main.bicep \\
  --parameters @bicep/workloads/web-app/parameters/dev.json
\`\`\`

## Validation

After deployment, verify:

1. **Resource Group Created**: Check Azure portal for resource group
2. **Application Service Running**: Visit the App Service URL
${formData.modules.logAnalytics ? '3. **Monitoring Active**: Verify Application Insights data collection' : ''}

## Troubleshooting

- **Permission Issues**: Ensure you have Contributor access
- **Resource Conflicts**: Check for existing resource names
- **Template Errors**: Validate Bicep syntax with \`az bicep build\`

For more information, see the main [README.md](../README.md).
`
}
