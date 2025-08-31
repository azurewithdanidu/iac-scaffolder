import { FormData } from '@/types/form'
import Handlebars from 'handlebars'

// Bicep templates
export const bicepTemplates = {
  naming: `// ==========================================================================================
// Parameters
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

@description('Subnet name (1-80 chars)')
func subnetName(suffix string) string => norm(name(suffix), 80)

@description('Log Analytics Workspace name (4-63 chars)')
func logAnalyticsWorkspaceName(suffix string) string => norm(name(suffix), 63)

@description('Network Security Group name (1-80 chars)')
func networkSecurityGroupName(suffix string) string => norm(name(suffix), 80)

@description('Public IP name (1-80 chars)')
func publicIpName(suffix string) string => norm(name(suffix), 80)

@description('Application Insights name (1-260 chars)')
func applicationInsightsName(suffix string) string => norm(name(suffix), 260)

// ==========================================================================================
// Outputs
// ==========================================================================================

output resourceGroupName string = resourceGroupName('rg')
output storageAccountName string = storageAccountName('st')
output keyVaultName string = keyVaultName('kv')
output virtualNetworkName string = virtualNetworkName('vnet')
output logAnalyticsWorkspaceName string = logAnalyticsWorkspaceName('law')`,

  diagnostics: `// ==========================================================================================
// Parameters
// ==========================================================================================

@description('Log Analytics Workspace resource ID')
param logAnalyticsWorkspaceId string

@description('Array of resource IDs to configure diagnostics for')
param resourceIds array

@description('Diagnostic setting name')
param diagnosticSettingName string = 'default'

@description('Categories to enable for logs')
param logCategories array = []

@description('Categories to enable for metrics')
param metricCategories array = []

@description('Log retention in days')
param retentionInDays int = 30

// ==========================================================================================
// Resources
// ==========================================================================================

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = [for resourceId in resourceIds: {
  name: diagnosticSettingName
  scope: resourceId
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [for category in logCategories: {
      category: category
      enabled: true
      retentionPolicy: {
        enabled: true
        days: retentionInDays
      }
    }]
    metrics: [for category in metricCategories: {
      category: category
      enabled: true
      retentionPolicy: {
        enabled: true
        days: retentionInDays
      }
    }]
  }
}]

// ==========================================================================================
// Outputs
// ==========================================================================================

output diagnosticSettingIds array = [for i in range(0, length(resourceIds)): diagnosticSettings[i].id]`,

  virtualNetwork: `// ==========================================================================================
// Parameters
// ==========================================================================================

@description('Virtual Network name')
param name string

@description('Location for the Virtual Network')
param location string = resourceGroup().location

@description('Address space for the Virtual Network')
param addressPrefixes array

@description('Array of subnet configurations')
param subnets array = []

@description('Enable DDoS protection')
param enableDdosProtection bool = false

@description('DDoS protection plan ID (if enabled)')
param ddosProtectionPlanId string = ''

@description('Resource tags')
param tags object = {}

@description('Enable diagnostic settings')
param enableDiagnostics bool = false

@description('Log Analytics Workspace ID for diagnostics')
param logAnalyticsWorkspaceId string = ''

// ==========================================================================================
// Variables
// ==========================================================================================

var ddosProtectionPlan = enableDdosProtection ? {
  id: ddosProtectionPlanId
} : null

// ==========================================================================================
// Resources
// ==========================================================================================

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: addressPrefixes
    }
    subnets: [for subnet in subnets: {
      name: subnet.name
      properties: {
        addressPrefix: subnet.addressPrefix
        networkSecurityGroup: contains(subnet, 'networkSecurityGroupId') ? {
          id: subnet.networkSecurityGroupId
        } : null
        routeTable: contains(subnet, 'routeTableId') ? {
          id: subnet.routeTableId
        } : null
        serviceEndpoints: contains(subnet, 'serviceEndpoints') ? subnet.serviceEndpoints : []
        delegations: contains(subnet, 'delegations') ? subnet.delegations : []
      }
    }]
    enableDdosProtection: enableDdosProtection
    ddosProtectionPlan: ddosProtectionPlan
  }
}

// Diagnostic settings
module diagnostics '../shared/diagnostics.bicep' = if (enableDiagnostics && !empty(logAnalyticsWorkspaceId)) {
  name: '\${name}-diagnostics'
  params: {
    logAnalyticsWorkspaceId: logAnalyticsWorkspaceId
    resourceIds: [virtualNetwork.id]
    logCategories: ['VMProtectionAlerts']
    metricCategories: ['AllMetrics']
  }
}

// ==========================================================================================
// Outputs
// ==========================================================================================

output id string = virtualNetwork.id
output name string = virtualNetwork.name
output addressSpace array = virtualNetwork.properties.addressSpace.addressPrefixes
output subnets array = [for i in range(0, length(subnets)): {
  name: virtualNetwork.properties.subnets[i].name
  id: virtualNetwork.properties.subnets[i].id
  addressPrefix: virtualNetwork.properties.subnets[i].properties.addressPrefix
}]`,

  keyVault: `// ==========================================================================================
// Parameters
// ==========================================================================================

@description('Key Vault name')
param name string

@description('Location for the Key Vault')
param location string = resourceGroup().location

@description('SKU for the Key Vault')
@allowed(['standard', 'premium'])
param sku string = 'standard'

@description('Enable RBAC authorization')
param enableRbacAuthorization bool = true

@description('Enable soft delete')
param enableSoftDelete bool = true

@description('Soft delete retention days')
@minValue(7)
@maxValue(90)
param softDeleteRetentionInDays int = 90

@description('Enable purge protection')
param enablePurgeProtection bool = true

@description('Resource tags')
param tags object = {}

@description('Network access rules')
param networkAcls object = {
  defaultAction: 'Allow'
  bypass: 'AzureServices'
}

@description('Enable diagnostic settings')
param enableDiagnostics bool = false

@description('Log Analytics Workspace ID for diagnostics')
param logAnalyticsWorkspaceId string = ''

// ==========================================================================================
// Resources
// ==========================================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: sku
    }
    tenantId: tenant().tenantId
    enableRbacAuthorization: enableRbacAuthorization
    enableSoftDelete: enableSoftDelete
    softDeleteRetentionInDays: softDeleteRetentionInDays
    enablePurgeProtection: enablePurgeProtection
    networkAcls: networkAcls
  }
}

// Diagnostic settings
module diagnostics '../shared/diagnostics.bicep' = if (enableDiagnostics && !empty(logAnalyticsWorkspaceId)) {
  name: '\${name}-diagnostics'
  params: {
    logAnalyticsWorkspaceId: logAnalyticsWorkspaceId
    resourceIds: [keyVault.id]
    logCategories: ['AuditEvent', 'AzurePolicyEvaluationDetails']
    metricCategories: ['AllMetrics']
  }
}

// ==========================================================================================
// Outputs
// ==========================================================================================

output id string = keyVault.id
output name string = keyVault.name
output uri string = keyVault.properties.vaultUri
output tenantId string = keyVault.properties.tenantId`,

  logAnalytics: `// ==========================================================================================
// Parameters
// ==========================================================================================

@description('Log Analytics Workspace name')
param name string

@description('Location for the Log Analytics Workspace')
param location string = resourceGroup().location

@description('SKU for the Log Analytics Workspace')
@allowed(['PerGB2018', 'Free', 'Standalone', 'PerNode', 'Standard', 'Premium'])
param sku string = 'PerGB2018'

@description('Data retention in days')
@minValue(30)
@maxValue(730)
param retentionInDays int = 30

@description('Daily quota in GB')
param dailyQuotaGb int = -1

@description('Resource tags')
param tags object = {}

@description('Enable public network access')
param publicNetworkAccessForIngestion string = 'Enabled'

@description('Enable public network access for queries')
param publicNetworkAccessForQuery string = 'Enabled'

// ==========================================================================================
// Resources
// ==========================================================================================

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      name: sku
    }
    retentionInDays: retentionInDays
    workspaceCapping: dailyQuotaGb > 0 ? {
      dailyQuotaGb: dailyQuotaGb
    } : null
    publicNetworkAccessForIngestion: publicNetworkAccessForIngestion
    publicNetworkAccessForQuery: publicNetworkAccessForQuery
  }
}

// ==========================================================================================
// Outputs
// ==========================================================================================

output id string = logAnalyticsWorkspace.id
output name string = logAnalyticsWorkspace.name
output customerId string = logAnalyticsWorkspace.properties.customerId
output primarySharedKey string = logAnalyticsWorkspace.listKeys().primarySharedKey`,

  platform: `// ==========================================================================================
// Platform Infrastructure - Shared Components
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
param org string = '{{organization}}'

@description('Workload name')
param workload string = '{{workload}}'

@description('Region short code')
param region string = '{{#each environments}}{{#if this.enabled}}{{this.regionShortCode}}{{/if}}{{/each}}'

@description('Enable Virtual Network')
param enableVirtualNetwork bool = {{modules.virtualNetwork}}

@description('Enable Key Vault')
param enableKeyVault bool = {{modules.keyVault}}

@description('Enable Log Analytics Workspace')
param enableLogAnalytics bool = {{modules.logAnalytics}}

@description('Virtual Network address space')
param vnetAddressSpace array = ['10.0.0.0/16']

@description('Subnet configurations')
param subnets array = [
  {
    name: 'default'
    addressPrefix: '10.0.1.0/24'
  }
]

// ==========================================================================================
// Modules
// ==========================================================================================

// Naming module
module naming 'modules/naming/naming.bicep' = {
  name: 'platform-naming'
  params: {
    org: org
    workload: workload
    env: env
    region: region
  }
}

// Log Analytics Workspace
module logAnalytics 'modules/avm/observability/logAnalytics.bicep' = if (enableLogAnalytics) {
  name: 'platform-law'
  params: {
    name: naming.outputs.logAnalyticsWorkspaceName
    location: location
    tags: tags
    retentionInDays: env == 'prod' ? 90 : 30
  }
}

// Key Vault
module keyVault 'modules/avm/security/keyVault.bicep' = if (enableKeyVault) {
  name: 'platform-kv'
  params: {
    name: naming.outputs.keyVaultName
    location: location
    tags: tags
    enableDiagnostics: enableLogAnalytics
    logAnalyticsWorkspaceId: enableLogAnalytics ? logAnalytics.outputs.id : ''
  }
}

// Virtual Network
module virtualNetwork 'modules/avm/network/virtualNetwork.bicep' = if (enableVirtualNetwork) {
  name: 'platform-vnet'
  params: {
    name: naming.outputs.virtualNetworkName
    location: location
    addressPrefixes: vnetAddressSpace
    subnets: subnets
    tags: tags
    enableDiagnostics: enableLogAnalytics
    logAnalyticsWorkspaceId: enableLogAnalytics ? logAnalytics.outputs.id : ''
  }
}

// ==========================================================================================
// Outputs
// ==========================================================================================

output resourceGroupName string = resourceGroup().name
output location string = location

output logAnalyticsWorkspace object = enableLogAnalytics ? {
  id: logAnalytics.outputs.id
  name: logAnalytics.outputs.name
  customerId: logAnalytics.outputs.customerId
} : {}

output keyVault object = enableKeyVault ? {
  id: keyVault.outputs.id
  name: keyVault.outputs.name
  uri: keyVault.outputs.uri
} : {}

output virtualNetwork object = enableVirtualNetwork ? {
  id: virtualNetwork.outputs.id
  name: virtualNetwork.outputs.name
  addressSpace: virtualNetwork.outputs.addressSpace
  subnets: virtualNetwork.outputs.subnets
} : {}`,

  landingzone: `// ==========================================================================================
// Landing Zone Infrastructure - Application Specific Components
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
param org string = '{{organization}}'

@description('Workload name')
param workload string = '{{workload}}'

@description('Region short code')
param region string = '{{#each environments}}{{#if this.enabled}}{{this.regionShortCode}}{{/if}}{{/each}}'

@description('Spoke Virtual Network address space')
param spokeAddressSpace array = ['10.1.0.0/16']

@description('Subnet configurations for spoke network')
param spokeSubnets array = [
  {
    name: 'app'
    addressPrefix: '10.1.1.0/24'
  }
  {
    name: 'data'
    addressPrefix: '10.1.2.0/24'
  }
]

@description('Platform Log Analytics Workspace ID')
param platformLogAnalyticsWorkspaceId string = ''

// ==========================================================================================
// Modules
// ==========================================================================================

// Naming module
module naming 'modules/naming/naming.bicep' = {
  name: 'landingzone-naming'
  params: {
    org: org
    workload: workload
    env: env
    region: region
  }
}

// Spoke Virtual Network
module spokeVirtualNetwork 'modules/avm/network/virtualNetwork.bicep' = {
  name: 'landingzone-spoke-vnet'
  params: {
    name: '\${naming.outputs.virtualNetworkName}-spoke'
    location: location
    addressPrefixes: spokeAddressSpace
    subnets: spokeSubnets
    tags: tags
    enableDiagnostics: !empty(platformLogAnalyticsWorkspaceId)
    logAnalyticsWorkspaceId: platformLogAnalyticsWorkspaceId
  }
}

// ==========================================================================================
// Outputs
// ==========================================================================================

output spokeVirtualNetwork object = {
  id: spokeVirtualNetwork.outputs.id
  name: spokeVirtualNetwork.outputs.name
  addressSpace: spokeVirtualNetwork.outputs.addressSpace
  subnets: spokeVirtualNetwork.outputs.subnets
}`
}

// Pipeline templates
export const pipelineTemplates = {
  buildTemplate: `parameters:
  - name: templateFilePath
    displayName: 'Path to Bicep Template File'
    type: string
  - name: parameterFilePath
    displayName: 'Path to Parameter File'
    type: string
    default: ""
  - name: continueOnFailedTests
    displayName: 'Continue on Test Failures'
    type: boolean
    default: false
  - name: skipTests
    displayName: 'ARM-TTK Tests to Skip'
    type: string
    default: "none"
  - name: testCondition
    displayName: 'Condition to Run Tests'
    type: string
    default: "succeeded()"
  - name: svcConnection
    displayName: 'Azure Service Connection'
    type: string
  - name: buildArtifactName
    displayName: 'Build Artifact Name'
    type: string
    default: 'infrastructure-build'

stages:
  - stage: Build_Infrastructure
    displayName: 'Build Infrastructure Templates'
    jobs:
      - job: BuildBicep
        displayName: 'Build Bicep Templates'
        pool:
          vmImage: ubuntu-latest
        variables:
          buildFolder: '$(Build.ArtifactStagingDirectory)/build'
          testResultFolder: '$(Build.ArtifactStagingDirectory)/results'

        steps:
          - checkout: self
            displayName: 'Checkout Source Code'

          - task: AzureCLI@2
            displayName: 'Build Bicep Templates'
            inputs:
              azureSubscription: \${{ parameters.svcConnection }}
              scriptLocation: 'inlineScript'
              scriptType: 'pscore'
              inlineScript: |
                Write-Host "Creating build directory..."
                New-Item -ItemType Directory -Path '$(buildFolder)' -Force
                
                Write-Host "Building main Bicep template..."
                az bicep build --file \${{ parameters.templateFilePath }} --outdir '$(buildFolder)'
                
                # Handle parameter files
                if ("\${{ parameters.parameterFilePath }}" -ne "") {
                  if ("\${{ parameters.parameterFilePath }}" -like "*.bicepparam") {
                    Write-Host "Building Bicep parameter file..."
                    bicep build-params "\${{ parameters.parameterFilePath }}" --outfile '$(buildFolder)/parameters.json'
                  } else {
                    Write-Host "Copying JSON parameter file..."
                    Copy-Item -Path "\${{ parameters.parameterFilePath }}" -Destination '$(buildFolder)'
                  }
                }
                
                # Build any additional Bicep modules
                Get-ChildItem -Path "infra/bicep/modules" -Filter "*.bicep" -Recurse | ForEach-Object {
                  Write-Host "Building module: \$(\$_.Name)"
                  az bicep build --file \$_.FullName --outdir '$(buildFolder)/modules'
                }

          - task: PowerShell@2
            displayName: 'Run ARM Template Tests'
            condition: \${{ parameters.testCondition }}
            inputs:
              targetType: 'inline'
              script: |
                # Install required modules
                Write-Host "Installing ARM-TTK and Pester..."
                Install-Module Pester -Force -Scope CurrentUser -RequiredVersion 4.10.1 -SkipPublisherCheck
                
                # Download ARM-TTK
                Invoke-WebRequest -Uri "https://aka.ms/arm-ttk-latest" -OutFile "arm-ttk.zip"
                Expand-Archive -Path "arm-ttk.zip" -DestinationPath "."
                Import-Module "./arm-ttk/arm-ttk.psd1"
                
                # Create test results directory
                New-Item -ItemType Directory -Path '$(testResultFolder)' -Force
                
                # Get template file
                \$templateFile = Get-Item "\${{ parameters.templateFilePath }}"
                \$armTemplate = "$(buildFolder)/" + \$templateFile.Name.Replace('.bicep', '.json')
                
                # Create test script
                \$testScript = @"
                param(\$exclusions = "")
                Test-AzTemplate -TemplatePath '\$armTemplate' -Skip \$exclusions -Pester
                "@
                \$testScript | Out-File -FilePath "$(buildFolder)/armttk.tests.ps1" -Force
                
                # Run tests
                if ("\${{ parameters.skipTests }}" -ne "none") {
                  \$results = Invoke-Pester -Script @{Path="$(buildFolder)/armttk.tests.ps1"; Parameters=@{exclusions="\${{ parameters.skipTests }}"}} -OutputFormat NUnitXml -OutputFile "$(testResultFolder)/TEST-armttk.xml" -PassThru
                } else {
                  \$results = Invoke-Pester -Script @{Path="$(buildFolder)/armttk.tests.ps1"} -OutputFormat NUnitXml -OutputFile "$(testResultFolder)/TEST-armttk.xml" -PassThru
                }
                
                # Check test results
                if ("\${{ parameters.continueOnFailedTests }}" -eq "false" -and \$results.FailedCount -gt 0) {
                  Write-Error "ARM Template tests failed!"
                  exit 1
                }

          - task: PublishTestResults@2
            displayName: 'Publish Test Results'
            condition: \${{ parameters.testCondition }}
            inputs:
              testResultsFormat: 'NUnit'
              testResultsFiles: '$(testResultFolder)/**/*.xml'
              failTaskOnFailedTests: true

          - task: PublishPipelineArtifact@1
            displayName: 'Publish Build Artifacts'
            inputs:
              targetPath: '$(buildFolder)'
              artifactName: '\${{ parameters.buildArtifactName }}'
              publishLocation: 'pipeline'`,

  deployTemplate: `parameters:
  - name: stage
    displayName: 'Deployment Stage Name'
    type: string
  - name: dependsOn
    displayName: 'Stage Dependencies'
    type: string
    default: ""
  - name: condition
    displayName: 'Stage Condition'
    type: string
    default: "succeeded()"
  - name: environment
    displayName: 'Azure DevOps Environment'
    type: string
  - name: location
    displayName: 'Azure Region'
    type: string
  - name: subscriptionId
    displayName: 'Azure Subscription ID'
    type: string
  - name: resourceGroupName
    displayName: 'Resource Group Name'
    type: string
  - name: templateFileName
    displayName: 'ARM Template File Name'
    type: string
    default: 'main.json'
  - name: parameterFileName
    displayName: 'Parameter File Name'
    type: string
    default: 'parameters.json'
  - name: deploymentName
    displayName: 'Deployment Name'
    type: string
  - name: svcConnection
    displayName: 'Azure Service Connection'
    type: string
  - name: previewChanges
    displayName: 'Preview Changes (What-If)'
    type: boolean
    default: true
  - name: buildArtifactName
    displayName: 'Build Artifact Name'
    type: string
    default: 'infrastructure-build'

stages:
  # What-If Preview Stage
  - \${{ if eq(parameters.previewChanges, true) }}:
    - stage: Preview_\${{ parameters.stage }}
      displayName: 'Preview Changes - \${{ parameters.stage }}'
      dependsOn: \${{ parameters.dependsOn }}
      condition: \${{ parameters.condition }}
      jobs:
        - job: WhatIfDeploy
          displayName: 'What-If Deployment Preview'
          pool:
            vmImage: ubuntu-latest
          steps:
            - checkout: none

            - task: DownloadPipelineArtifact@2
              displayName: 'Download Build Artifacts'
              inputs:
                artifactName: '\${{ parameters.buildArtifactName }}'
                downloadPath: '$(Pipeline.Workspace)/deploy'

            - task: AzureCLI@2
              displayName: 'Preview Resource Group Deployment'
              inputs:
                azureSubscription: \${{ parameters.svcConnection }}
                scriptType: 'pscore'
                scriptLocation: 'inlineScript'
                inlineScript: |
                  Write-Host "Setting subscription context..."
                  az account set --subscription "\${{ parameters.subscriptionId }}"
                  
                  Write-Host "Ensuring resource group exists..."
                  az group create --name "\${{ parameters.resourceGroupName }}" --location "\${{ parameters.location }}" --output none
                  
                  Write-Host "Running What-If deployment preview..."
                  az deployment group what-if \
                    --resource-group "\${{ parameters.resourceGroupName }}" \
                    --template-file "$(Pipeline.Workspace)/deploy/\${{ parameters.templateFileName }}" \
                    --parameters "$(Pipeline.Workspace)/deploy/\${{ parameters.parameterFileName }}" \
                    --name "\${{ parameters.deploymentName }}-whatif" \
                    --verbose

  # Deployment Stage
  - stage: Deploy_\${{ parameters.stage }}
    displayName: 'Deploy - \${{ parameters.stage }}'
    dependsOn: \${{ parameters.dependsOn }}
    condition: \${{ parameters.condition }}
    jobs:
      - deployment: DeployInfrastructure
        displayName: 'Deploy Infrastructure'
        pool:
          vmImage: ubuntu-latest
        environment: '\${{ parameters.environment }}'
        strategy:
          runOnce:
            deploy:
              steps:
                - checkout: none

                - task: DownloadPipelineArtifact@2
                  displayName: 'Download Build Artifacts'
                  inputs:
                    artifactName: '\${{ parameters.buildArtifactName }}'
                    downloadPath: '$(Pipeline.Workspace)/deploy'

                - task: AzureCLI@2
                  displayName: 'Deploy to Resource Group'
                  inputs:
                    azureSubscription: \${{ parameters.svcConnection }}
                    scriptType: 'pscore'
                    scriptLocation: 'inlineScript'
                    inlineScript: |
                      Write-Host "Setting subscription context..."
                      az account set --subscription "\${{ parameters.subscriptionId }}"
                      
                      Write-Host "Ensuring resource group exists..."
                      az group create --name "\${{ parameters.resourceGroupName }}" --location "\${{ parameters.location }}" --output none
                      
                      Write-Host "Deploying ARM template..."
                      az deployment group create \
                        --resource-group "\${{ parameters.resourceGroupName }}" \
                        --template-file "$(Pipeline.Workspace)/deploy/\${{ parameters.templateFileName }}" \
                        --parameters "$(Pipeline.Workspace)/deploy/\${{ parameters.parameterFileName }}" \
                        --name "\${{ parameters.deploymentName }}" \
                        --verbose

                - task: AzureCLI@2
                  displayName: 'Validate Deployment'
                  inputs:
                    azureSubscription: \${{ parameters.svcConnection }}
                    scriptType: 'pscore'
                    scriptLocation: 'inlineScript'
                    inlineScript: |
                      Write-Host "Checking deployment status..."
                      \$deployment = az deployment group show \
                        --resource-group "\${{ parameters.resourceGroupName }}" \
                        --name "\${{ parameters.deploymentName }}" \
                        --query "properties.provisioningState" \
                        --output tsv
                      
                      if (\$deployment -eq "Succeeded") {
                        Write-Host "✅ Deployment completed successfully!"
                      } else {
                        Write-Error "❌ Deployment failed with status: \$deployment"
                        exit 1
                      }`,

  main: `name: 'Infrastructure Deployment Pipeline'

trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - 'infra/**'
      - 'pipelines/**'

pr:
  branches:
    include:
      - main
  paths:
    include:
      - 'infra/**'
      - 'pipelines/**'

variables:
  - name: workloadName
    value: '{{workload}}'
  - name: organizationName
    value: '{{organization}}'
  - name: buildArtifactName
    value: 'infrastructure-build'

stages:
  # Build Stage
  - template: templates/build-template.yml
    parameters:
      templateFilePath: 'infra/bicep/main.bicep'
      parameterFilePath: ''
      continueOnFailedTests: false
      skipTests: \${{ variables.skipArmTtkTests }}
      testCondition: "succeeded()"
      svcConnection: '{{azureServiceConnection}}'
      buildArtifactName: \$(buildArtifactName)

{{#each environments}}
{{#if this.enabled}}
  # Deploy to {{this.name}} Environment
  - template: templates/deploy-template.yml
    parameters:
      stage: '{{this.name}}'
      dependsOn: 'Build_Infrastructure'
      condition: "and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))"
      environment: '{{this.name}}'
      location: '{{this.region}}'
      subscriptionId: '{{../subscriptionId}}'
      resourceGroupName: '{{../organization}}-{{../workload}}-{{this.name}}-{{this.regionShortCode}}-rg'
      templateFileName: 'main.json'
      parameterFileName: '{{this.name}}.parameters.json'
      deploymentName: '{{../workload}}-{{this.name}}-deployment'
      svcConnection: '{{../azureServiceConnection}}'
      previewChanges: {{#if this.previewChanges}}{{this.previewChanges}}{{else}}true{{/if}}
      buildArtifactName: \$(buildArtifactName)

{{/if}}
{{/each}}`,

  // GitHub Actions Templates
  githubBuildTemplate: `name: 'Build Infrastructure'

on:
  workflow_call:
    inputs:
      template_file_path:
        description: 'Path to Bicep template file'
        type: string
        required: true
      continue_on_failed_tests:
        description: 'Continue pipeline on test failures'
        type: boolean
        required: false
        default: false
      skip_tests:
        description: 'ARM-TTK tests to skip'
        type: string
        required: false
        default: "'apiVersions Should Be Recent','Template Should Not Contain Blanks'"
      test_trigger:
        description: 'Event that triggers tests'
        type: string
        required: true
        default: 'pull_request'

env:
  build_folder: 'build'
  test_result_folder: 'test-results'

jobs:
  build_infrastructure:
    name: 'Build Bicep Templates'
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Azure CLI
        uses: azure/CLI@v1
        with:
          azcliversion: latest

      - name: Build Bicep Templates
        env:
          BUILD_PATH: \${{ runner.temp }}/\${{ env.build_folder }}
          TEST_PATH: \${{ runner.temp }}/\${{ env.test_result_folder }}
        run: |
          echo "Creating build directory..."
          mkdir -p "\$BUILD_PATH"
          
          echo "Building main Bicep template..."
          az bicep build --file \${{ inputs.template_file_path }} --outdir "\$BUILD_PATH"
          
          # Build parameter files if they exist
          if [[ "\${{ inputs.template_file_path }}" == *".bicepparam" ]]; then
            echo "Building Bicep parameter file..."
            bicep build-params "\${{ inputs.template_file_path }}" --outfile "\$BUILD_PATH/parameters.json"
          else
            # Copy JSON parameter files
            find . -name "*.parameters.json" -exec cp {} "\$BUILD_PATH/" \\;
          fi
          
          # Build additional modules
          find infra/bicep/modules -name "*.bicep" -type f | while read file; do
            echo "Building module: \$file"
            az bicep build --file "\$file" --outdir "\$BUILD_PATH/modules"
          done
        shell: bash

      - name: Run ARM Template Tests
        if: \${{ inputs.test_trigger == 'pull_request' }}
        env:
          SKIP_TESTS: '\${{ inputs.skip_tests }}'
          BUILD_PATH: \${{ runner.temp }}/\${{ env.build_folder }}
          TEST_PATH: \${{ runner.temp }}/\${{ env.test_result_folder }}
        run: |
          # Install required modules
          echo "Installing ARM-TTK and Pester..."
          sudo pwsh -Command "Install-Module Pester -Force -Scope AllUsers -RequiredVersion 4.10.1 -SkipPublisherCheck"
          
          # Download ARM-TTK
          wget -q https://aka.ms/arm-ttk-latest -O arm-ttk.zip
          unzip -q arm-ttk.zip
          
          # Create test directory
          mkdir -p "\$TEST_PATH"
          
          # Get template file name
          TEMPLATE_FILE=\$(basename "\${{ inputs.template_file_path }}")
          ARM_TEMPLATE="\$BUILD_PATH/\${TEMPLATE_FILE%.bicep}.json"
          
          # Create test script
          cat > "\$BUILD_PATH/armttk.tests.ps1" << 'EOF'
          param(\$exclusions = "")
          Import-Module "./arm-ttk/arm-ttk.psd1"
          Test-AzTemplate -TemplatePath \$env:ARM_TEMPLATE -Skip \$exclusions -Pester
          EOF
          
          # Run tests
          if [[ "\$SKIP_TESTS" != "none" ]]; then
            sudo pwsh -Command "
              \$env:ARM_TEMPLATE='\$ARM_TEMPLATE'
              \$results = Invoke-Pester -Script @{Path='\$BUILD_PATH/armttk.tests.ps1'; Parameters=@{exclusions='\$SKIP_TESTS'}} -OutputFormat NUnitXml -OutputFile '\$TEST_PATH/TEST-armttk.xml' -PassThru
              if ('\${{ inputs.continue_on_failed_tests }}' -eq 'false' -and \$results.FailedCount -gt 0) {
                Write-Error 'ARM Template tests failed!'
                exit 1
              }
            "
          else
            sudo pwsh -Command "
              \$env:ARM_TEMPLATE='\$ARM_TEMPLATE'
              \$results = Invoke-Pester -Script '\$BUILD_PATH/armttk.tests.ps1' -OutputFormat NUnitXml -OutputFile '\$TEST_PATH/TEST-armttk.xml' -PassThru
              if ('\${{ inputs.continue_on_failed_tests }}' -eq 'false' -and \$results.FailedCount -gt 0) {
                Write-Error 'ARM Template tests failed!'
                exit 1
              }
            "
          fi
        shell: bash

      - name: Upload Test Results
        if: \${{ inputs.test_trigger == 'pull_request' }}
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: \${{ runner.temp }}/\${{ env.test_result_folder }}

      - name: Upload Build Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: infrastructure-build
          path: \${{ runner.temp }}/\${{ env.build_folder }}
          retention-days: 30`,

  githubDeployTemplate: `name: 'Deploy Infrastructure'

on:
  workflow_call:
    inputs:
      environment:
        description: 'Deployment environment'
        type: string
        required: true
      resource_group_name:
        description: 'Azure Resource Group name'
        type: string
        required: true
      location:
        description: 'Azure region for deployment'
        type: string
        required: true
      template_file_name:
        description: 'ARM template file name'
        type: string
        required: false
        default: 'main.json'
      parameter_file_name:
        description: 'Parameter file name'
        type: string
        required: false
        default: 'parameters.json'
      deployment_name:
        description: 'Azure deployment name'
        type: string
        required: true
      preview_changes:
        description: 'Run what-if preview'
        type: boolean
        required: false
        default: true

permissions:
  id-token: write
  contents: read

jobs:
  # What-If Preview Job
  preview_deployment:
    if: \${{ inputs.preview_changes == true }}
    name: 'Preview Changes'
    runs-on: ubuntu-latest
    environment: \${{ inputs.environment }}-preview
    
    steps:
      - name: Download Build Artifacts
        uses: actions/download-artifact@v4
        with:
          name: infrastructure-build
          path: ./deploy

      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: \${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: \${{ secrets.AZURE_TENANT_ID }}
          subscription-id: \${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Preview Resource Group Deployment
        run: |
          echo "Setting subscription context..."
          az account set --subscription "\${{ secrets.AZURE_SUBSCRIPTION_ID }}"
          
          echo "Ensuring resource group exists..."
          az group create --name "\${{ inputs.resource_group_name }}" --location "\${{ inputs.location }}" --output none
          
          echo "Running What-If deployment preview..."
          az deployment group what-if \\
            --resource-group "\${{ inputs.resource_group_name }}" \\
            --template-file "./deploy/\${{ inputs.template_file_name }}" \\
            --parameters "./deploy/\${{ inputs.parameter_file_name }}" \\
            --name "\${{ inputs.deployment_name }}-whatif" \\
            --verbose

  # Deployment Job
  deploy_infrastructure:
    name: 'Deploy Infrastructure'
    runs-on: ubuntu-latest
    environment: \${{ inputs.environment }}
    needs: [preview_deployment]
    if: \${{ always() && (needs.preview_deployment.result == 'success' || needs.preview_deployment.result == 'skipped') }}
    
    steps:
      - name: Download Build Artifacts
        uses: actions/download-artifact@v4
        with:
          name: infrastructure-build
          path: ./deploy

      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: \${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: \${{ secrets.AZURE_TENANT_ID }}
          subscription-id: \${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Deploy to Azure
        run: |
          echo "Setting subscription context..."
          az account set --subscription "\${{ secrets.AZURE_SUBSCRIPTION_ID }}"
          
          echo "Ensuring resource group exists..."
          az group create --name "\${{ inputs.resource_group_name }}" --location "\${{ inputs.location }}" --output none
          
          echo "Deploying ARM template..."
          az deployment group create \\
            --resource-group "\${{ inputs.resource_group_name }}" \\
            --template-file "./deploy/\${{ inputs.template_file_name }}" \\
            --parameters "./deploy/\${{ inputs.parameter_file_name }}" \\
            --name "\${{ inputs.deployment_name }}" \\
            --verbose

      - name: Validate Deployment
        run: |
          echo "Checking deployment status..."
          DEPLOYMENT_STATUS=\$(az deployment group show \\
            --resource-group "\${{ inputs.resource_group_name }}" \\
            --name "\${{ inputs.deployment_name }}" \\
            --query "properties.provisioningState" \\
            --output tsv)
          
          if [[ "\$DEPLOYMENT_STATUS" == "Succeeded" ]]; then
            echo "✅ Deployment completed successfully!"
          else
            echo "❌ Deployment failed with status: \$DEPLOYMENT_STATUS"
            exit 1
          fi`,

  githubMain: `name: 'Infrastructure Deployment'

on:
  push:
    branches: [main, develop]
    paths: ['infra/**', '.github/workflows/**']
  pull_request:
    branches: [main]
    paths: ['infra/**', '.github/workflows/**']
  workflow_dispatch:

env:
  WORKLOAD_NAME: '{{workload}}'
  ORGANIZATION_NAME: '{{organization}}'

jobs:
  # Build Job
  build:
    name: 'Build Infrastructure'
    uses: ./.github/workflows/build-template.yml
    with:
      template_file_path: 'infra/bicep/main.bicep'
      continue_on_failed_tests: false
      skip_tests: "'apiVersions Should Be Recent','Template Should Not Contain Blanks'"
      test_trigger: \${{ github.event_name }}

{{#each environments}}
{{#if this.enabled}}
  # Deploy to {{this.name}} Environment
  deploy_{{this.name}}:
    name: 'Deploy to {{this.name}}'
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-template.yml
    with:
      environment: '{{this.name}}'
      resource_group_name: '{{../organization}}-{{../workload}}-{{this.name}}-{{this.regionShortCode}}-rg'
      location: '{{this.region}}'
      template_file_name: 'main.json'
      parameter_file_name: '{{this.name}}.parameters.json'
      deployment_name: '{{../workload}}-{{this.name}}-deployment'
      preview_changes: {{#if this.previewChanges}}{{this.previewChanges}}{{else}}true{{/if}}
    secrets: inherit

{{/if}}
{{/each}}`
}

// Documentation templates
export const docTemplates = {
  readme: `# {{workload}} - Azure Infrastructure

This repository contains the Infrastructure as Code (IaC) for the {{workload}} application using Azure Bicep.

## Quick Start

### Prerequisites

- Azure CLI installed and configured
- Bicep CLI extension installed
- Appropriate Azure permissions for the target subscription

### Setup

1. Login to Azure:
   \`\`\`bash
   az login
   az account set --subscription "<your-subscription-id>"
   \`\`\`

2. Set required variables:
   \`\`\`bash
   # Set your target environment
   export ENV="dev"  # or test, prod
   \`\`\`

### Deployment

Deploy the infrastructure in the following order:

#### 1. Platform Components (Shared)

\`\`\`bash
# Deploy platform infrastructure
az deployment group create \\
  --resource-group "{{organization}}-{{workload}}-\${ENV}-{{defaultRegionShortCode}}-rg" \\
  --template-file "infra/bicep/platform.bicep" \\
  --parameters "@infra/bicep/parameters/\${ENV}.json"
\`\`\`

#### 2. Landing Zone Components

\`\`\`bash
# Deploy landing zone infrastructure
az deployment group create \\
  --resource-group "{{organization}}-{{workload}}-\${ENV}-{{defaultRegionShortCode}}-rg" \\
  --template-file "infra/bicep/landingzone.bicep" \\
  --parameters "@infra/bicep/parameters/\${ENV}.json"
\`\`\`

## Environment-Specific Deployments

{{#each environments}}
{{#if this.enabled}}
### {{this.name}} Environment

\`\`\`bash
# Create resource group
az group create \\
  --name "{{../organization}}-{{../workload}}-{{this.name}}-{{this.regionShortCode}}-rg" \\
  --location "{{this.region}}"

# Deploy platform
az deployment group create \\
  --resource-group "{{../organization}}-{{../workload}}-{{this.name}}-{{this.regionShortCode}}-rg" \\
  --template-file "infra/bicep/platform.bicep" \\
  --parameters "@infra/bicep/parameters/{{this.name}}.json"

# Deploy landing zone
az deployment group create \\
  --resource-group "{{../organization}}-{{../workload}}-{{this.name}}-{{this.regionShortCode}}-rg" \\
  --template-file "infra/bicep/landingzone.bicep" \\
  --parameters "@infra/bicep/parameters/{{this.name}}.json"
\`\`\`

{{/if}}
{{/each}}

## GitHub Actions Setup

This repository includes GitHub Actions workflows for automated deployment.

### Required Secrets

Set the following secrets in your GitHub repository:

- \`AZURE_CLIENT_ID\` - Service Principal Client ID
- \`AZURE_TENANT_ID\` - Azure Tenant ID  
- \`AZURE_SUBSCRIPTION_ID\` - Target Azure Subscription ID

### Service Principal Setup

Create a service principal with appropriate permissions:

\`\`\`bash
# Create service principal
az ad sp create-for-rbac \\
  --name "sp-{{workload}}-github" \\
  --role "Contributor" \\
  --scopes "/subscriptions/<subscription-id>" \\
  --sdk-auth false

# Configure OIDC
az ad app federated-credential create \\
  --id <client-id> \\
  --parameters '{
    "name": "github-{{workload}}",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:<your-org>/<your-repo>:ref:refs/heads/main",
    "description": "GitHub Actions OIDC",
    "audiences": ["api://AzureADTokenExchange"]
  }'
\`\`\`

## Architecture

See [Architecture Documentation](docs/architecture.md) for detailed information about the infrastructure design.

## Naming Conventions

See [Naming Conventions](docs/naming.md) for details about resource naming standards.

## Contributing

1. Create feature branch
2. Make changes
3. Test deployments in dev environment
4. Create pull request
5. Automated deployment will run after merge to main

## Support

For questions or issues, please create an issue in this repository.`,

  naming: `# Naming Conventions

This document describes the naming conventions used for Azure resources in this infrastructure.

## Naming Pattern

The default naming pattern follows the format:
\`{org}-{workload}-{env}-{region}-{suffix}\`

Where:
- **org**: Organization name ({{organization}})
- **workload**: Application/workload name ({{workload}})
- **env**: Environment ({{#each environments}}{{#if this.enabled}}{{this.name}}{{#unless @last}}, {{/unless}}{{/if}}{{/each}})
- **region**: Azure region short code
- **suffix**: Resource type specific suffix

## Regional Codes

{{#each environments}}
{{#if this.enabled}}
- **{{this.region}}**: {{this.regionShortCode}}
{{/if}}
{{/each}}

## Resource Type Limits and Examples

| Resource Type | Max Length | Suffix | Example |
|---------------|------------|--------|---------|
| Resource Group | 90 | rg | {{organization}}-{{workload}}-dev-{{defaultRegionShortCode}}-rg |
| Storage Account | 24 | st | {{storageExample}} |
| Key Vault | 24 | kv | {{organization}}-{{workload}}-dev-{{defaultRegionShortCode}}-kv |
| Virtual Network | 64 | vnet | {{organization}}-{{workload}}-dev-{{defaultRegionShortCode}}-vnet |
| Subnet | 80 | snet | {{organization}}-{{workload}}-dev-{{defaultRegionShortCode}}-app-snet |
| Log Analytics | 63 | law | {{organization}}-{{workload}}-dev-{{defaultRegionShortCode}}-law |

## Naming Rules by Resource Type

### Storage Accounts
- Must be lowercase
- Alphanumeric characters only (no hyphens)
- 3-24 characters
- Example: {{storageExample}}

### Key Vault
- Alphanumeric and hyphens only
- Must start with letter
- 3-24 characters
- Example: {{organization}}-{{workload}}-dev-{{defaultRegionShortCode}}-kv

### Virtual Networks
- Alphanumeric, hyphens, underscores, and periods
- Start and end with alphanumeric
- 2-64 characters
- Example: {{organization}}-{{workload}}-dev-{{defaultRegionShortCode}}-vnet

## Environment-Specific Examples

{{#each environments}}
{{#if this.enabled}}
### {{this.name}} Environment ({{this.region}})

| Resource | Name |
|----------|------|
| Resource Group | {{../organization}}-{{../workload}}-{{this.name}}-{{this.regionShortCode}}-rg |
| Key Vault | {{../organization}}-{{../workload}}-{{this.name}}-{{this.regionShortCode}}-kv |
| Virtual Network | {{../organization}}-{{../workload}}-{{this.name}}-{{this.regionShortCode}}-vnet |
| Log Analytics | {{../organization}}-{{../workload}}-{{this.name}}-{{this.regionShortCode}}-law |

{{/if}}
{{/each}}

## Validation

The naming module (\`infra/bicep/modules/naming/naming.bicep\`) automatically:
- Enforces maximum length limits
- Converts to appropriate case
- Removes invalid characters
- Validates naming patterns

## Override Options

While the standard pattern is recommended, you can override resource names by:
1. Modifying parameters in environment-specific parameter files
2. Updating the naming module logic
3. Specifying explicit names in template calls

## Compliance

These naming conventions follow:
- Azure resource naming best practices
- Cloud Adoption Framework recommendations
- Organization governance policies`,

  architecture: `# Architecture Overview

This document describes the architecture and design patterns used in this Azure infrastructure.

## High-Level Architecture

\`\`\`mermaid
graph TB
    subgraph "Azure Subscription"
        subgraph "Platform Resources"
            LAW[Log Analytics Workspace]
            KV[Key Vault]
            PVNET[Platform VNet]
        end
        
        subgraph "Landing Zone Resources"
            SVNET[Spoke VNet]
            APP[Application Resources]
            DATA[Data Resources]
        end
        
        subgraph "Shared Services"
            DIAG[Diagnostic Settings]
            MON[Monitoring]
            SEC[Security Policies]
        end
    end
    
    PVNET -.-> SVNET
    LAW --> DIAG
    KV --> SEC
    DIAG --> APP
    DIAG --> DATA
\`\`\`

## Design Principles

### 1. Separation of Concerns
- **Platform**: Shared infrastructure components
- **Landing Zone**: Application-specific resources
- **Modules**: Reusable components with specific purposes

### 2. Hub and Spoke Network Design
- Platform VNet acts as hub for shared services
- Landing zone VNets are spokes for applications
- Network segmentation for security and isolation

### 3. Enterprise Naming Standards
- Consistent naming across all resources
- Environment and region identification
- Resource type classification

### 4. Observability by Design
- Centralized logging with Log Analytics
- Diagnostic settings on all supported resources
- Monitoring and alerting capabilities

## Component Architecture

### Platform Layer (\`platform.bicep\`)

**Purpose**: Provides shared infrastructure services

**Components**:
{{#if modules.logAnalytics}}
- **Log Analytics Workspace**: Centralized logging and monitoring
{{/if}}
{{#if modules.keyVault}}
- **Key Vault**: Secrets, keys, and certificate management
{{/if}}
{{#if modules.virtualNetwork}}
- **Platform Virtual Network**: Hub network for shared services
{{/if}}
{{#if modules.diagnostics}}
- **Diagnostic Settings**: Automated logging configuration
{{/if}}

**Responsibilities**:
- Shared service provisioning
- Security and compliance baseline
- Centralized monitoring setup
- Network hub configuration

### Landing Zone Layer (\`landingzone.bicep\`)

**Purpose**: Application-specific infrastructure

**Components**:
- **Spoke Virtual Network**: Isolated network for applications
- **Application Subnets**: Segmented network for different tiers
- **Resource Integration**: Connection to platform services

**Responsibilities**:
- Application infrastructure
- Network spoke configuration
- Platform service integration
- Environment-specific settings

### Module Architecture

#### Naming Module (\`modules/naming/\`)
- Centralized naming logic
- Resource type specific rules
- Length and character validation
- Environment and region awareness

#### AVM Wrapper Modules (\`modules/avm/\`)
- Thin wrappers around Azure Verified Modules
- Organizational defaults and standards
- Simplified parameter interfaces
- Consistent tagging and diagnostics

#### Shared Modules (\`modules/shared/\`)
- Cross-cutting concerns
- Diagnostic configuration
- Common utilities
- Reusable components

## Network Architecture

### Address Space Design

{{#each environments}}
{{#if this.enabled}}
#### {{this.name}} Environment
- **Platform VNet**: 10.{{@index}}.0.0/16
- **Spoke VNet**: 10.{{add @index 10}}.0.0/16
  - Application Subnet: 10.{{add @index 10}}.1.0/24
  - Data Subnet: 10.{{add @index 10}}.2.0/24

{{/if}}
{{/each}}

### Network Segmentation
- **Platform Tier**: Shared services and management
- **Application Tier**: Application components
- **Data Tier**: Database and storage services
- **Management Tier**: Monitoring and security tools

## Security Architecture

### Identity and Access
- Azure RBAC for resource access
- Service principals for automation
- Managed identities where possible
- Key Vault integration for secrets

### Network Security
- Network Security Groups (NSGs)
- Virtual network isolation
- Service endpoints where applicable
- Private endpoints for sensitive services

### Data Protection
- Encryption at rest (Azure Storage/SQL)
- Encryption in transit (TLS/HTTPS)
- Key management through Key Vault
- Backup and disaster recovery

## Deployment Architecture

### CI/CD Pipeline Design

\`\`\`mermaid
graph LR
    DEV[Development] --> BUILD[Build & Validate]
    BUILD --> TEST[Test Environment]
    TEST --> PROD[Production]
    
    subgraph "Build Stage"
        BICEP[Bicep Build]
        VALIDATE[Template Validation]
        LINT[Linting]
    end
    
    subgraph "Deploy Stage"
        PLATFORM[Platform Deploy]
        LANDING[Landing Zone Deploy]
        VERIFY[Deployment Verification]
    end
    
    BUILD --> BICEP
    BICEP --> VALIDATE
    VALIDATE --> LINT
    LINT --> PLATFORM
    PLATFORM --> LANDING
    LANDING --> VERIFY
\`\`\`

### Environment Promotion
1. **Development**: Feature development and testing
2. **Test**: Integration testing and validation
3. **Production**: Live workload environment

### Deployment Order
1. **Platform Infrastructure**: Shared services first
2. **Landing Zone Infrastructure**: Application components
3. **Application Deployment**: Application code and configuration

## Monitoring and Observability

### Logging Strategy
- Centralized logging via Log Analytics
- Diagnostic settings on all resources
- Application and infrastructure logs
- Security and audit logging

### Monitoring Approach
- Infrastructure monitoring
- Application performance monitoring
- Security monitoring
- Cost monitoring and optimization

## Disaster Recovery

### Backup Strategy
- Automated backup for stateful services
- Cross-region replication for critical data
- Infrastructure as Code for rapid recovery
- Documentation for recovery procedures

### High Availability
- Multi-zone deployment where available
- Load balancing and redundancy
- Database high availability
- Application resilience patterns

## Cost Optimization

### Resource Sizing
- Environment-appropriate sizing
- Auto-scaling where applicable
- Reserved instances for predictable workloads
- Development environment automation

### Monitoring and Alerts
- Cost budgets and alerts
- Resource utilization monitoring
- Unused resource identification
- Cost optimization recommendations

## Compliance and Governance

### Azure Policy Integration
- Compliance policy enforcement
- Resource governance rules
- Security baseline policies
- Cost management policies

### Tagging Strategy
- Mandatory tags for all resources
- Cost center and ownership tracking
- Environment and application identification
- Lifecycle management tags

## Next Steps

1. **Review and customize** templates for your specific requirements
2. **Set up CI/CD pipeline** using the provided GitHub Actions workflows
3. **Configure monitoring** and alerting for your environment
4. **Implement backup** and disaster recovery procedures
5. **Review security** settings and compliance requirements`
}

export function generateTemplates(formData: FormData) {
  const context = {
    ...formData,
    defaultLocation: formData.environments.find(e => e.enabled)?.region || 'australiaeast',
    defaultRegionShortCode: formData.environments.find(e => e.enabled)?.name === 'dev' ? 'aue' : 
                           formData.environments.find(e => e.enabled)?.name === 'test' ? 'aue' : 'ause',
    storageExample: formData.organization.slice(0,3) + formData.workload.slice(0,3) + 'devst'
  }
  
  // Add region short codes to environments
  context.environments = formData.environments.map(env => ({
    ...env,
    regionShortCode: getRegionShortCode(env.region)
  }))
  
  const compiledTemplates: Record<string, string> = {}
  
  // Compile Bicep templates
  Object.entries(bicepTemplates).forEach(([key, template]) => {
    compiledTemplates[key] = Handlebars.compile(template)(context)
  })
  
  // Compile pipeline templates
  Object.entries(pipelineTemplates).forEach(([key, template]) => {
    compiledTemplates[`pipeline_${key}`] = Handlebars.compile(template)(context)
  })
  
  // Compile documentation templates
  Object.entries(docTemplates).forEach(([key, template]) => {
    compiledTemplates[`doc_${key}`] = Handlebars.compile(template)(context)
  })
  
  return compiledTemplates
}

function getRegionShortCode(region: string): string {
  const regionMap: Record<string, string> = {
    'australiaeast': 'aue',
    'australiasoutheast': 'ause',
    'eastus': 'eus',
    'eastus2': 'eus2',
    'westus': 'wus',
    'westus2': 'wus2',
    'centralus': 'cus',
    'northeurope': 'neu',
    'westeurope': 'weu',
    'uksouth': 'uks',
    'ukwest': 'ukw',
    'southeastasia': 'sea',
    'eastasia': 'ea'
  }
  return regionMap[region] || region.slice(0, 3)
}

// Helper for Handlebars
Handlebars.registerHelper('add', function(a: number, b: number) {
  return a + b
})
