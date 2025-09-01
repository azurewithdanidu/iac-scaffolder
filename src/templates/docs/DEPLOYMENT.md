# Deployment Guide

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

```bash
# Deploy to subscription scope
az deployment sub create \
  --name "landing-zone-deployment" \
  --location "{{location}}" \
  --template-file "bicep/patterns/landing-zone/main.bicep" \
  --parameters "bicep/patterns/landing-zone/main.bicepparam"
```

{{/if}}
### {{#if includePatterns.landingZone}}2{{else}}1{{/if}}. Deploy Workload Infrastructure

The workload infrastructure includes:
- App Service Plan and App Service
- Application Insights for monitoring
- Key Vault for application secrets
- Storage Account for application data

```bash
# Deploy to resource group scope
az deployment group create \
  --resource-group "{{organization}}-{{workload}}-<environment>-<region>-rg" \
  --template-file "bicep/workloads/web-app/main.bicep" \
  --parameters "bicep/workloads/web-app/main.bicepparam"
```

## Pipeline Deployment

{{#if (eq pipelineProvider "azure-devops")}}
### Azure DevOps

1. **Import the repository** into your Azure DevOps project
2. **Configure service connections** for each target environment
3. **Create environments** in Azure DevOps for deployment approvals
4. **Run the pipeline** to deploy infrastructure

Key pipelines:
- `ado-pipelines/landing-zone.yml` - Landing zone deployment
- `ado-pipelines/workload.yml` - Application workload deployment

{{/if}}
{{#if (eq pipelineProvider "github-actions")}}
### GitHub Actions

1. **Configure repository secrets**:
   - `AZURE_CLIENT_ID` - Azure App Registration Client ID
   - `AZURE_TENANT_ID` - Azure AD Tenant ID
   - `AZURE_SUBSCRIPTION_ID` - Target Azure Subscription

2. **Set up environments** in GitHub for deployment protection rules

3. **Trigger workflows**:
   - `.github/workflows/landing-zone.yml` - Landing zone deployment
   - `.github/workflows/workload.yml` - Application workload deployment

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

```bash
# Check deployment status
az deployment group show --resource-group <rg-name> --name <deployment-name>

# View deployment logs
az deployment group list --resource-group <rg-name> --query "[0].properties"

# Test Bicep template
az deployment group validate --resource-group <rg-name> --template-file <template>
```

---

*For additional support, contact the {{organization}} DevOps team.*
