import { readFileSync } from 'fs'
import { join } from 'path'
import { FormData } from '@/types/form'
import Handlebars from 'handlebars'

/**
 * Read and process sample pipeline templates from the sample-pipeline folder
 */
export class SampleTemplateReader {
  private static samplePipelineRoot = join(process.cwd(), 'sample-pipeline')

  /**
   * Read all sample templates and return processed content
   */
  static async getProcessedTemplates(formData: FormData): Promise<Record<string, string>> {
    const templates: Record<string, string> = {}
    
    try {
      // Read Azure DevOps templates
      const adoBuildTemplate = this.readSampleFile('azure-pipelines/build-template.yml')
      const adoDeployTemplate = this.readSampleFile('azure-pipelines/deploy-template.yml')
      
      // Read GitHub Actions templates  
      const githubBuildTemplate = this.readSampleFile('github-pipelines/build.yml')
      const githubDeployTemplate = this.readSampleFile('github-pipelines/deploy.yml')
      
      // Add Azure DevOps templates to the right locations
      if (formData.pipelineProvider === 'azure-devops' || formData.pipelineProvider === 'both') {
        templates['ado-pipelines/templates/build-template.yml'] = adoBuildTemplate
        templates['ado-pipelines/templates/deploy-template.yml'] = adoDeployTemplate
        
        // Generate main landing zone and workload pipelines
        templates['ado-pipelines/landing-zone.yml'] = this.generateAdoLandingZonePipeline(formData)
        templates['ado-pipelines/workload.yml'] = this.generateAdoWorkloadPipeline(formData)
      }
      
      // Add GitHub Actions templates to the right locations
      if (formData.pipelineProvider === 'github-actions' || formData.pipelineProvider === 'both') {
        templates['.github/workflows/templates/build.yml'] = githubBuildTemplate
        templates['.github/workflows/templates/deploy.yml'] = githubDeployTemplate
        
        // Generate main landing zone and workload workflows
        templates['.github/workflows/landing-zone.yml'] = this.generateGitHubLandingZoneWorkflow(formData)
        templates['.github/workflows/workload.yml'] = this.generateGitHubWorkloadWorkflow(formData)
      }
      
      return templates
    } catch (error) {
      console.error('Error reading sample templates:', error)
      return {}
    }
  }
  
  /**
   * Read a sample file from the sample-pipeline folder
   */
  private static readSampleFile(relativePath: string): string {
    const fullPath = join(this.samplePipelineRoot, relativePath)
    return readFileSync(fullPath, 'utf-8')
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
      - 'infra/bicep/landing-zone/**'
      - 'ado-pipelines/**'

pr:
  branches:
    include:
      - main
  paths:
    include:
      - 'infra/bicep/landing-zone/**'

variables:
  - name: workloadName
    value: '{{workload}}'
  - name: serviceConnection
    value: '{{azureServiceConnection}}'

stages:
  # Build Landing Zone Templates
  - template: templates/build-template.yml
    parameters:
      templateFilePath: 'infra/bicep/landing-zone/main.bicep'
      parameterFilePath: 'infra/bicep/landing-zone/main.bicepparam'
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
      - 'infra/bicep/workload/**'
      - 'ado-pipelines/**'

pr:
  branches:
    include:
      - main
  paths:
    include:
      - 'infra/bicep/workload/**'

variables:
  - name: workloadName
    value: '{{workload}}'
  - name: serviceConnection
    value: '{{azureServiceConnection}}'

stages:
  # Build Workload Templates
  - template: templates/build-template.yml
    parameters:
      templateFilePath: 'infra/bicep/workload/main.bicep'
      parameterFilePath: 'infra/bicep/workload/main.bicepparam'
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
      - 'infra/bicep/landing-zone/**'
      - '.github/workflows/**'
  pull_request:
    branches: [main]
    paths:
      - 'infra/bicep/landing-zone/**'
  workflow_dispatch:

env:
  WORKLOAD_NAME: '{{workload}}'

jobs:
  # Build Landing Zone Templates
  build:
    name: 'Build Landing Zone Templates'
    uses: ./.github/workflows/templates/build.yml
    with:
      template_file_path: 'infra/bicep/landing-zone/main.bicep'
      parameter_file_path: 'infra/bicep/landing-zone/main.bicepparam'
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
      - 'infra/bicep/workload/**'
      - '.github/workflows/**'
  pull_request:
    branches: [main]
    paths:
      - 'infra/bicep/workload/**'
  workflow_dispatch:

env:
  WORKLOAD_NAME: '{{workload}}'

jobs:
  # Build Workload Templates
  build:
    name: 'Build Workload Templates'
    uses: ./.github/workflows/templates/build.yml
    with:
      template_file_path: 'infra/bicep/workload/main.bicep'
      parameter_file_path: 'infra/bicep/workload/main.bicepparam'
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
