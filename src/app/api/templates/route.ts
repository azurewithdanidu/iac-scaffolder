import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { FormData } from '@/types/form'
import Handlebars from 'handlebars'

/**
 * Server-side template file reader
 */
class TemplateFileReader {
  private static templateRoot = join(process.cwd(), 'src', 'templates')
  private static samplePipelineRoot = join(process.cwd(), 'sample-pipeline')

  /**
   * Read a template file from the templates directory
   */
  private static readTemplateFile(relativePath: string): string {
    const fullPath = join(this.templateRoot, relativePath)
    if (!existsSync(fullPath)) {
      throw new Error(`Template file not found: ${relativePath}`)
    }
    return readFileSync(fullPath, 'utf-8')
  }

  /**
   * Read a file from the sample-pipeline directory
   */
  private static readSampleFile(relativePath: string): string {
    const fullPath = join(this.samplePipelineRoot, relativePath)
    if (!existsSync(fullPath)) {
      throw new Error(`Sample file not found: ${relativePath}`)
    }
    return readFileSync(fullPath, 'utf-8')
  }

  /**
   * Process a template file with Handlebars
   */
  private static processTemplate(relativePath: string, formData: FormData): string {
    const templateContent = this.readTemplateFile(relativePath)
    const template = Handlebars.compile(templateContent)
    return template(formData)
  }

  /**
   * Generate all templates by reading actual files
   */
  static async generateAllTemplates(formData: FormData): Promise<Record<string, string>> {
    const templates: Record<string, string> = {}
    
    try {
      // Generate documentation
      templates['README.md'] = this.generateReadme(formData)
      templates['docs/DEPLOYMENT.md'] = this.generateDeploymentGuide(formData)
      
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
      throw error
    }
  }

  /**
   * Generate README.md content
   */
  private static generateReadme(formData: FormData): string {
    const primaryEnvironment = formData.environments.find(env => env.enabled) || formData.environments[0]
    
    return `# ${formData.organization}-${formData.workload}

## Overview

Infrastructure as Code scaffolding for ${formData.workload} workload.

**Project Configuration:**
- **Organization:** ${formData.organization}
- **Workload:** ${formData.workload}
- **Environments:** ${formData.environments.filter(env => env.enabled).map(env => env.name).join(', ')}
- **Primary Region:** ${primaryEnvironment.region}
- **Pipeline Provider:** ${formData.pipelineProvider}

## Architecture

${formData.includePatterns.landingZone ? '### Landing Zone\n\nThis project includes a landing zone pattern that provides:\n- Shared resource groups\n- Centralized logging\n- Security and governance\n- Network infrastructure\n\n' : ''}### Web Application Workload

The web application workload includes:
- App Service hosting
- Application Insights monitoring
${formData.modules.keyVault ? '- Key Vault for secrets management\n' : ''}${formData.modules.logAnalytics ? '- Log Analytics for monitoring\n' : ''}

## Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## Security

${formData.modules.keyVault ? '- Secrets are managed through Azure Key Vault\n' : ''}${formData.modules.logAnalytics ? '- Application monitoring via Log Analytics\n' : ''}${formData.modules.diagnostics ? '- Diagnostic settings configured\n' : ''}

## Generated on

${new Date().toISOString()}
`
  }

  /**
   * Generate DEPLOYMENT.md content
   */
  private static generateDeploymentGuide(formData: FormData): string {
    const primaryEnvironment = formData.environments.find(env => env.enabled) || formData.environments[0]
    
    return `# Deployment Guide

## Prerequisites

- Azure CLI installed and configured
- Azure subscription with appropriate permissions
- ${formData.pipelineProvider === 'azure-devops' || formData.pipelineProvider === 'both' ? 'Azure DevOps organization access\n' : ''}${formData.pipelineProvider === 'github-actions' || formData.pipelineProvider === 'both' ? 'GitHub repository with Actions enabled\n' : ''}

## Manual Deployment

### 1. Login to Azure

\`\`\`bash
az login
az account set --subscription <subscription-id>
\`\`\`

${formData.includePatterns.landingZone ? `### 2. Deploy Landing Zone

\`\`\`bash
az deployment sub create \\
  --location ${primaryEnvironment.region} \\
  --template-file bicep/patterns/landing-zone/main.bicep \\
  --parameters bicep/patterns/landing-zone/main.bicepparam
\`\`\`

### 3. Deploy Workload
` : '### 2. Deploy Workload\n'}

\`\`\`bash
az deployment sub create \\
  --location ${primaryEnvironment.region} \\
  --template-file bicep/workloads/web-app/main.bicep \\
  --parameters bicep/workloads/web-app/main.bicepparam
\`\`\`

## Pipeline Deployment

${formData.pipelineProvider === 'azure-devops' || formData.pipelineProvider === 'both' ? `### Azure DevOps

1. Create service connection to Azure subscription
2. Import the YAML pipelines:
   ${formData.includePatterns.landingZone ? '- \`ado-pipelines/landing-zone.yml\`\n   ' : ''}- \`ado-pipelines/workload.yml\`
3. Configure pipeline variables as needed
4. Run the pipelines

` : ''}${formData.pipelineProvider === 'github-actions' || formData.pipelineProvider === 'both' ? `### GitHub Actions

1. Configure AZURE_CREDENTIALS secret in repository
2. Update workflow files with your subscription details
3. Push to trigger deployments:
   ${formData.includePatterns.landingZone ? '- Landing zone: \`.github/workflows/landing-zone.yml\`\n   ' : ''}- Workload: \`.github/workflows/workload.yml\`

` : ''}## Configuration

Update the \`.bicepparam\` files to customize:
- Resource naming conventions
- SKUs and sizing
- Feature flags
- Environment-specific settings

## Monitoring

${formData.modules.logAnalytics ? 'Log Analytics will be configured for monitoring and telemetry.\n\n' : ''}Access logs and metrics through the Azure portal.
`
  }

  /**
   * Generate Azure DevOps landing zone pipeline
   */
  private static generateAdoLandingZonePipeline(formData: FormData): string {
    const primaryEnvironment = formData.environments.find(env => env.enabled) || formData.environments[0]
    
    return `# Landing Zone Pipeline for ${formData.organization}-${formData.workload}

trigger:
  branches:
    include:
    - main
  paths:
    include:
    - bicep/patterns/landing-zone/*

variables:
  azureServiceConnection: 'Azure-ServiceConnection'
  subscriptionId: '$(AZURE_SUBSCRIPTION_ID)'
  location: '${primaryEnvironment.region}'
  environment: '${primaryEnvironment.name}'

stages:
- stage: Validate
  displayName: 'Validate Landing Zone'
  jobs:
  - template: templates/build-template.yml
    parameters:
      templatePath: 'bicep/patterns/landing-zone/main.bicep'
      parametersPath: 'bicep/patterns/landing-zone/main.bicepparam'

- stage: Deploy
  displayName: 'Deploy Landing Zone'
  dependsOn: Validate
  condition: succeeded()
  jobs:
  - template: templates/deploy-template.yml
    parameters:
      templatePath: 'bicep/patterns/landing-zone/main.bicep'
      parametersPath: 'bicep/patterns/landing-zone/main.bicepparam'
      serviceConnection: $(azureServiceConnection)
      subscriptionId: $(subscriptionId)
      location: $(location)
      deploymentScope: 'subscription'
`
  }

  /**
   * Generate Azure DevOps workload pipeline
   */
  private static generateAdoWorkloadPipeline(formData: FormData): string {
    const primaryEnvironment = formData.environments.find(env => env.enabled) || formData.environments[0]
    
    return `# Workload Pipeline for ${formData.organization}-${formData.workload}

trigger:
  branches:
    include:
    - main
  paths:
    include:
    - bicep/workloads/web-app/*

variables:
  azureServiceConnection: 'Azure-ServiceConnection'
  subscriptionId: '$(AZURE_SUBSCRIPTION_ID)'
  location: '${primaryEnvironment.region}'
  environment: '${primaryEnvironment.name}'

stages:
- stage: Validate
  displayName: 'Validate Workload'
  jobs:
  - template: templates/build-template.yml
    parameters:
      templatePath: 'bicep/workloads/web-app/main.bicep'
      parametersPath: 'bicep/workloads/web-app/main.bicepparam'

- stage: Deploy
  displayName: 'Deploy Workload'
  dependsOn: Validate
  condition: succeeded()
  jobs:
  - template: templates/deploy-template.yml
    parameters:
      templatePath: 'bicep/workloads/web-app/main.bicep'
      parametersPath: 'bicep/workloads/web-app/main.bicepparam'
      serviceConnection: $(azureServiceConnection)
      subscriptionId: $(subscriptionId)
      location: $(location)
      deploymentScope: 'subscription'
`
  }

  /**
   * Generate GitHub Actions landing zone workflow
   */
  private static generateGitHubLandingZoneWorkflow(formData: FormData): string {
    const primaryEnvironment = formData.environments.find(env => env.enabled) || formData.environments[0]
    
    return `name: Deploy Landing Zone

on:
  push:
    branches: [main]
    paths:
      - 'bicep/patterns/landing-zone/**'
  workflow_dispatch:

env:
  AZURE_LOCATION: ${primaryEnvironment.region}
  ENVIRONMENT: ${primaryEnvironment.name}

jobs:
  validate:
    name: Validate Landing Zone
    uses: ./.github/workflows/templates/build.yml
    with:
      template-path: 'bicep/patterns/landing-zone/main.bicep'
      parameters-path: 'bicep/patterns/landing-zone/main.bicepparam'

  deploy:
    name: Deploy Landing Zone
    needs: validate
    uses: ./.github/workflows/templates/deploy.yml
    with:
      template-path: 'bicep/patterns/landing-zone/main.bicep'
      parameters-path: 'bicep/patterns/landing-zone/main.bicepparam'
      deployment-scope: 'subscription'
      location: \${{ env.AZURE_LOCATION }}
    secrets:
      azure-credentials: \${{ secrets.AZURE_CREDENTIALS }}
`
  }

  /**
   * Generate GitHub Actions workload workflow
   */
  private static generateGitHubWorkloadWorkflow(formData: FormData): string {
    const primaryEnvironment = formData.environments.find(env => env.enabled) || formData.environments[0]
    
    return `name: Deploy Workload

on:
  push:
    branches: [main]
    paths:
      - 'bicep/workloads/web-app/**'
  workflow_dispatch:

env:
  AZURE_LOCATION: ${primaryEnvironment.region}
  ENVIRONMENT: ${primaryEnvironment.name}

jobs:
  validate:
    name: Validate Workload
    uses: ./.github/workflows/templates/build.yml
    with:
      template-path: 'bicep/workloads/web-app/main.bicep'
      parameters-path: 'bicep/workloads/web-app/main.bicepparam'

  deploy:
    name: Deploy Workload
    needs: validate
    uses: ./.github/workflows/templates/deploy.yml
    with:
      template-path: 'bicep/workloads/web-app/main.bicep'
      parameters-path: 'bicep/workloads/web-app/main.bicepparam'
      deployment-scope: 'subscription'
      location: \${{ env.AZURE_LOCATION }}
    secrets:
      azure-credentials: \${{ secrets.AZURE_CREDENTIALS }}
`
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData: FormData = await request.json()
    const templates = await TemplateFileReader.generateAllTemplates(formData)
    
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error generating templates:', error)
    return NextResponse.json(
      { error: 'Failed to generate templates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
