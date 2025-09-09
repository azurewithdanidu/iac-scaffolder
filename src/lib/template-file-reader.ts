import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { FormData } from '@/types/form'
import Handlebars from 'handlebars'

/**
 * Template file reader that loads actual template files from the filesystem
 */
export class TemplateFileReader {
  private static templateRoot = join(process.cwd(), 'src', 'templates')
  private static samplePipelineRoot = join(process.cwd(), 'sample-pipeline')

  /**
   * Generate all templates by reading actual files
   */
  static async generateAllTemplates(formData: FormData): Promise<Record<string, string>> {
    const templates: Record<string, string> = {}
    
    try {
      // Generate documentation
      templates['README.md'] = this.generateReadme(formData)
      templates['docs/DEPLOYMENT.md'] = this.generateDeploymentGuide(formData)
      
      // Always include naming module
      templates['bicep/modules/naming/naming.bicep'] = this.readTemplateFile('bicep/modules/naming/naming.bicep')
      
      // Generate landing zone if selected
      if (formData.includePatterns.landingZone) {
        templates['bicep/patterns/landing-zone/main.bicep'] = this.processTemplate('bicep/patterns/landing-zone/main.bicep', formData)
        templates['bicep/patterns/landing-zone/main.bicepparam'] = this.processTemplate('bicep/patterns/landing-zone/main.bicepparam', formData)
      }
      
      // Always generate workload template
      templates['bicep/workloads/web-app/main.bicep'] = this.processTemplate('bicep/workloads/web-app/main.bicep', formData)
      templates['bicep/workloads/web-app/main.bicepparam'] = this.processTemplate('bicep/workloads/web-app/main.bicepparam', formData)
      
      // Generate pipeline templates based on provider
      if (formData.pipelineProvider === 'azure-devops' || formData.pipelineProvider === 'both') {
        // Copy exact templates from sample-pipeline
        templates['ado-pipelines/templates/build-template.yml'] = this.readSampleFile('azure-pipelines/build-template.yml')
        templates['ado-pipelines/templates/deploy-template.yml'] = this.readSampleFile('azure-pipelines/deploy-template.yml')
        
        // Generate main pipelines
        templates['ado-pipelines/landing-zone.yml'] = this.generateAdoLandingZonePipeline(formData)
        templates['ado-pipelines/workload.yml'] = this.generateAdoWorkloadPipeline(formData)
      }
      
      if (formData.pipelineProvider === 'github-actions' || formData.pipelineProvider === 'both') {
        // Copy exact templates from sample-pipeline
        templates['.github/workflows/templates/build.yml'] = this.readSampleFile('github-pipelines/build.yml')
        templates['.github/workflows/templates/deploy.yml'] = this.readSampleFile('github-pipelines/deploy.yml')
        
        // Generate main workflows
        templates['.github/workflows/landing-zone.yml'] = this.generateGitHubLandingZoneWorkflow(formData)
        templates['.github/workflows/workload.yml'] = this.generateGitHubWorkloadWorkflow(formData)
      }
      
      return templates
    } catch (error) {
      console.error('Error generating templates:', error)
      return {}
    }
  }
  
  /**
   * Read a template file and process it with Handlebars
   */
  private static processTemplate(relativePath: string, formData: FormData): string {
    const content = this.readTemplateFile(relativePath)
    const template = Handlebars.compile(content)
    return template(formData)
  }
  
  /**
   * Read a template file from the templates folder
   */
  private static readTemplateFile(relativePath: string): string {
    const fullPath = join(this.templateRoot, relativePath)
    if (!existsSync(fullPath)) {
      throw new Error(`Template file not found: ${fullPath}`)
    }
    return readFileSync(fullPath, 'utf-8')
  }
  
  /**
   * Read a sample pipeline file
   */
  private static readSampleFile(relativePath: string): string {
    const fullPath = join(this.samplePipelineRoot, relativePath)
    if (!existsSync(fullPath)) {
      throw new Error(`Sample file not found: ${fullPath}`)
    }
    return readFileSync(fullPath, 'utf-8')
  }

  /**
   * Generate README.md
   */
  private static generateReadme(formData: FormData): string {
    const template = `# {{organization}} - {{workload}} Infrastructure

This repository contains the Infrastructure as Code (IaC) for the {{workload}} workload using Azure Bicep templates.

## 🏗️ Architecture Overview

- **Organization**: {{organization}}
- **Workload**: {{workload}}
- **Pipeline Provider**: {{pipelineProvider}}
{{#if includePatterns.landingZone}}
- **Landing Zone**: Included
{{/if}}

## 📁 Repository Structure

\`\`\`
{{#if includePatterns.landingZone}}
bicep/patterns/landing-zone/     # Landing zone infrastructure
{{/if}}
bicep/workloads/web-app/         # Web application infrastructure
bicep/modules/naming/            # Naming convention module
{{#if (eq pipelineProvider "azure-devops")}}
ado-pipelines/                   # Azure DevOps pipelines
{{/if}}
{{#if (eq pipelineProvider "github-actions")}}
.github/workflows/               # GitHub Actions workflows
{{/if}}
{{#if (eq pipelineProvider "both")}}
ado-pipelines/                   # Azure DevOps pipelines
.github/workflows/               # GitHub Actions workflows
{{/if}}
docs/                           # Documentation
\`\`\`

## 🚀 Quick Start

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd {{workload}}-infrastructure
   \`\`\`

2. **Review and update parameters**
   - Update \`main.bicepparam\` files with your specific values
   - Review environment-specific configurations

3. **Deploy infrastructure**
{{#if (eq pipelineProvider "azure-devops")}}
   - Configure Azure DevOps service connections
   - Run the deployment pipeline
{{/if}}
{{#if (eq pipelineProvider "github-actions")}}
   - Configure GitHub environments and secrets
   - Trigger the workflow
{{/if}}

## 📖 Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) - Detailed deployment instructions
- [Architecture Decisions](docs/DECISIONS.md) - Key architectural decisions and rationale

## 🔧 Customization

To customize the infrastructure for your needs:

1. Modify the Bicep templates in the \`bicep/\` directory
2. Update parameter files with your specific values
3. Adjust pipeline configurations as needed

## 🛡️ Security

- All secrets are managed through Azure Key Vault
- RBAC is configured following least privilege principles
- Network security groups restrict traffic appropriately

## 📞 Support

For questions or issues, please contact the {{organization}} DevOps team.

---

*Generated by CloudBlueprint - Azure Infrastructure Scaffolding Tool*`

    const compiled = Handlebars.compile(template)
    return compiled(formData)
  }

  /**
   * Generate deployment guide
   */
  private static generateDeploymentGuide(formData: FormData): string {
    const template = `# Deployment Guide

This guide provides detailed instructions for deploying the {{workload}} infrastructure.

## Prerequisites

- Azure subscription with appropriate permissions
- Azure CLI installed and configured
{{#if (eq pipelineProvider "azure-devops")}}
- Azure DevOps project with service connections configured
{{/if}}
{{#if (eq pipelineProvider "github-actions")}}
- GitHub repository with environments and secrets configured
{{/if}}
- Bicep CLI installed

## Environment Setup

{{#each environments}}
{{#if this.enabled}}
### {{this.name}} Environment

- **Region**: {{this.region}}
- **Resource Group**: {{../organization}}-{{../workload}}-{{this.name}}-{{this.regionShortCode}}-rg
- **Subscription**: {{../subscriptionId}}

{{/if}}
{{/each}}

## Deployment Steps

{{#if includePatterns.landingZone}}
### 1. Deploy Landing Zone

The landing zone provides foundational infrastructure including:
- Resource groups for organization
- Shared Key Vault for secrets
- Central logging and monitoring
- Networking foundation (if enabled)

\`\`\`bash
# Deploy to subscription scope
az deployment sub create \\
  --name "landing-zone-deployment" \\
  --location "{{location}}" \\
  --template-file "bicep/patterns/landing-zone/main.bicep" \\
  --parameters "bicep/patterns/landing-zone/main.bicepparam"
\`\`\`

{{/if}}
### {{#if includePatterns.landingZone}}2{{else}}1{{/if}}. Deploy Workload Infrastructure

The workload infrastructure includes:
- App Service Plan and App Service
- Application Insights for monitoring
- Key Vault for application secrets
- Storage Account for application data

\`\`\`bash
# Deploy to resource group scope
az deployment group create \\
  --resource-group "{{organization}}-{{workload}}-<environment>-<region>-rg" \\
  --template-file "bicep/workloads/web-app/main.bicep" \\
  --parameters "bicep/workloads/web-app/main.bicepparam"
\`\`\`

## Pipeline Deployment

{{#if (eq pipelineProvider "azure-devops")}}
### Azure DevOps

1. **Import the repository** into your Azure DevOps project
2. **Configure service connections** for each target environment
3. **Create environments** in Azure DevOps for deployment approvals
4. **Run the pipeline** to deploy infrastructure

Key pipelines:
- \`ado-pipelines/landing-zone.yml\` - Landing zone deployment
- \`ado-pipelines/workload.yml\` - Application workload deployment

{{/if}}
{{#if (eq pipelineProvider "github-actions")}}
### GitHub Actions

1. **Configure repository secrets**:
   - \`AZURE_CLIENT_ID\` - Azure App Registration Client ID
   - \`AZURE_TENANT_ID\` - Azure AD Tenant ID
   - \`AZURE_SUBSCRIPTION_ID\` - Target Azure Subscription

2. **Set up environments** in GitHub for deployment protection rules

3. **Trigger workflows**:
   - \`.github/workflows/landing-zone.yml\` - Landing zone deployment
   - \`.github/workflows/workload.yml\` - Application workload deployment

{{/if}}

## Validation

After deployment, verify:

1. **Resource Groups** are created with proper naming conventions
2. **App Service** is running and accessible
3. **Application Insights** is collecting telemetry
4. **Key Vault** has appropriate access policies
5. **RBAC assignments** are correctly configured

## Troubleshooting

### Common Issues

- **Permission Errors**: Ensure service principal has appropriate RBAC roles
- **Naming Conflicts**: Check for existing resources with same names
- **Parameter Validation**: Verify all required parameters are provided

### Useful Commands

\`\`\`bash
# Check deployment status
az deployment group show --resource-group <rg-name> --name <deployment-name>

# View deployment logs
az deployment group list --resource-group <rg-name> --query "[0].properties"

# Test Bicep template
az deployment group validate --resource-group <rg-name> --template-file <template>
\`\`\`

---

*For additional support, contact the {{organization}} DevOps team.*`

    const compiled = Handlebars.compile(template)
    return compiled(formData)
  }
  
  /**
   * Generate Azure DevOps Landing Zone Pipeline
   */
  private static generateAdoLandingZonePipeline(formData: FormData): string {
    const template = `name: Deploy Landing Zone Infrastructure

trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - 'bicep/patterns/landing-zone/**'
      - 'ado-pipelines/**'

pr:
  branches:
    include:
      - main
  paths:
    include:
      - 'bicep/patterns/landing-zone/**'

variables:
  - name: workloadName
    value: '{{workload}}'
  - name: serviceConnection
    value: '{{azureServiceConnection}}'

stages:
  # Build Landing Zone Templates
  - template: templates/build-template.yml
    parameters:
      templateFilePath: 'bicep/patterns/landing-zone/main.bicep'
      parameterFilePath: 'bicep/patterns/landing-zone/main.bicepparam'
      continueOnFailedTests: false
      skipTests: "none"
      testCondition: eq(variables['Build.Reason'], 'PullRequest')
      svcConnection: $(serviceConnection)

{{#each environments}}
{{#if this.enabled}}
  # Deploy Landing Zone to {{this.name}}
  - template: templates/deploy-template.yml
    parameters:
      stage: 'LandingZone_{{this.name}}'
      dependsOn: 'Build'
      condition: "and(succeeded(), in(variables['Build.SourceBranch'], 'refs/heads/main', 'refs/heads/develop'))"
      adoEnvironment: 'landing-zone-{{this.name}}'
      location: '{{this.region}}'
      subscriptionId: '{{../subscriptionId}}'
      templateFileName: 'main.json'
      deploymentName: 'landing-zone-{{this.name}}-$(Build.BuildNumber)'
      parameterFilePath: 'main.bicepparam'
      svcConnection: $(serviceConnection)
      previewChanges: true
      azDeploymentType: 'subscription'

{{/if}}
{{/each}}`

    const compiled = Handlebars.compile(template)
    return compiled(formData)
  }

  /**
   * Generate Azure DevOps Workload Pipeline
   */
  private static generateAdoWorkloadPipeline(formData: FormData): string {
    const template = `name: Deploy Sample Workload Infrastructure

trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - 'bicep/workloads/web-app/**'
      - 'ado-pipelines/**'

pr:
  branches:
    include:
      - main
  paths:
    include:
      - 'bicep/workloads/web-app/**'

variables:
  - name: workloadName
    value: '{{workload}}'
  - name: serviceConnection
    value: '{{azureServiceConnection}}'

stages:
  # Build Workload Templates
  - template: templates/build-template.yml
    parameters:
      templateFilePath: 'bicep/workloads/web-app/main.bicep'
      parameterFilePath: 'bicep/workloads/web-app/main.bicepparam'
      continueOnFailedTests: false
      skipTests: "none"
      testCondition: eq(variables['Build.Reason'], 'PullRequest')
      svcConnection: $(serviceConnection)

{{#each environments}}
{{#if this.enabled}}
  # Deploy Workload to {{this.name}}
  - template: templates/deploy-template.yml
    parameters:
      stage: 'Workload_{{this.name}}'
      dependsOn: 'Build'
      condition: "and(succeeded(), in(variables['Build.SourceBranch'], 'refs/heads/main', 'refs/heads/develop'))"
      adoEnvironment: 'workload-{{this.name}}'
      location: '{{this.region}}'
      subscriptionId: '{{../subscriptionId}}'
      resourceGroupName: '{{../organization}}-{{../workload}}-{{this.name}}-{{this.regionShortCode}}-rg'
      templateFileName: 'main.json'
      deploymentName: 'workload-{{this.name}}-$(Build.BuildNumber)'
      parameterFilePath: 'main.bicepparam'
      svcConnection: $(serviceConnection)
      previewChanges: true
      azDeploymentType: 'resourceGroup'

{{/if}}
{{/each}}`

    const compiled = Handlebars.compile(template)
    return compiled(formData)
  }

  /**
   * Generate GitHub Actions Landing Zone Workflow
   */
  private static generateGitHubLandingZoneWorkflow(formData: FormData): string {
    const template = `name: Deploy Landing Zone Infrastructure

on:
  push:
    branches: [main, develop]
    paths: 
      - 'bicep/patterns/landing-zone/**'
      - '.github/workflows/**'
  pull_request:
    branches: [main]
    paths:
      - 'bicep/patterns/landing-zone/**'
  workflow_dispatch:

env:
  WORKLOAD_NAME: '{{workload}}'

jobs:
  # Build Landing Zone Templates
  build:
    name: 'Build Landing Zone Templates'
    uses: ./.github/workflows/templates/build.yml
    with:
      template_file_path: 'bicep/patterns/landing-zone/main.bicep'
      parameter_file_path: 'bicep/patterns/landing-zone/main.bicepparam'
      continue_on_failed_tests: false
      skip_tests: 'none'
      test_trigger: \${{ github.event_name }}
      oidc_app_reg_client_id: \${{ vars.AZURE_CLIENT_ID }}
      azure_tenant_id: \${{ vars.AZURE_TENANT_ID }}
      environment: 'build'

{{#each environments}}
{{#if this.enabled}}
  # Deploy Landing Zone to {{this.name}}
  deploy_landingzone_{{this.name}}:
    name: 'Deploy Landing Zone - {{this.name}}'
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    uses: ./.github/workflows/templates/deploy.yml
    with:
      stage: 'landing-zone-{{this.name}}'
      environment: 'landing-zone-{{this.name}}'
      location: '{{this.region}}'
      subscription_id: '{{../subscriptionId}}'
      template_file_name: 'main.json'
      parameter_file_name: 'main.bicepparam'
      deployment_name: 'landing-zone-{{this.name}}-\${{ github.run_number }}'
      preview_changes: true
      deployment_type: 'subscription'
      oidc_app_reg_client_id: \${{ vars.AZURE_CLIENT_ID }}
      azure_tenant_id: \${{ vars.AZURE_TENANT_ID }}
    secrets: inherit

{{/if}}
{{/each}}`

    const compiled = Handlebars.compile(template)
    return compiled(formData)
  }

  /**
   * Generate GitHub Actions Workload Workflow  
   */
  private static generateGitHubWorkloadWorkflow(formData: FormData): string {
    const template = `name: Deploy Sample Workload Infrastructure

on:
  push:
    branches: [main, develop]
    paths: 
      - 'bicep/workloads/web-app/**'
      - '.github/workflows/**'
  pull_request:
    branches: [main]
    paths:
      - 'bicep/workloads/web-app/**'
  workflow_dispatch:

env:
  WORKLOAD_NAME: '{{workload}}'

jobs:
  # Build Workload Templates
  build:
    name: 'Build Workload Templates'
    uses: ./.github/workflows/templates/build.yml
    with:
      template_file_path: 'bicep/workloads/web-app/main.bicep'
      parameter_file_path: 'bicep/workloads/web-app/main.bicepparam'
      continue_on_failed_tests: false
      skip_tests: 'none'
      test_trigger: \${{ github.event_name }}
      oidc_app_reg_client_id: \${{ vars.AZURE_CLIENT_ID }}
      azure_tenant_id: \${{ vars.AZURE_TENANT_ID }}
      environment: 'build'

{{#each environments}}
{{#if this.enabled}}
  # Deploy Workload to {{this.name}}
  deploy_workload_{{this.name}}:
    name: 'Deploy Workload - {{this.name}}'
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    uses: ./.github/workflows/templates/deploy.yml
    with:
      stage: 'workload-{{this.name}}'
      environment: 'workload-{{this.name}}'
      location: '{{this.region}}'
      subscription_id: '{{../subscriptionId}}'
      resource_group_name: '{{../organization}}-{{../workload}}-{{this.name}}-{{this.regionShortCode}}-rg'
      template_file_name: 'main.json'
      parameter_file_name: 'main.bicepparam'
      deployment_name: 'workload-{{this.name}}-\${{ github.run_number }}'
      preview_changes: true
      deployment_type: 'resourceGroup'
      oidc_app_reg_client_id: \${{ vars.AZURE_CLIENT_ID }}
      azure_tenant_id: \${{ vars.AZURE_TENANT_ID }}
    secrets: inherit

{{/if}}
{{/each}}`

    const compiled = Handlebars.compile(template)
    return compiled(formData)
  }
}
