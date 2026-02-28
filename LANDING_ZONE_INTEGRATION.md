# Landing Zone Vending Machine Integration

This document describes the integration of the Landing Zone Vending Machine into the iac-scaffolder (CloudBlueprint) project.

## Overview

The Landing Zone Vending Machine is a self-service portal for provisioning Azure Landing Zones using Azure Verified Modules (AVM). It has been integrated into CloudBlueprint as a new feature alongside the IaC Scaffolder and Workload Builder.

## Integration Architecture

### What Was Integrated

The integration consolidated the lz-vending-solution from the azure-finops-agent repository into the iac-scaffolder Next.js application as a new feature:

```
iac-scaffolder/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── landing-zone/
│   │   │       ├── templates/
│   │   │       │   └── route.ts          # GET /api/landing-zone/templates
│   │   │       └── generate/
│   │   │           └── route.ts          # POST /api/landing-zone/generate
│   │   └── landing-zone/
│   │       └── page.tsx                  # Landing Zone UI page
│   ├── lib/
│   │   ├── landing-zone-templates.ts     # Template definitions
│   │   ├── bicep-generator.ts            # Bicep .bicepparam generator
│   │   └── landing-zone-validator.ts     # Input validation
│   └── templates/
│       └── landing-zones/
│           ├── alz-main.bicep            # ALZ template
│           ├── subscription-vending-main.bicep
│           ├── workload-main.bicep
│           └── README.md
```

### Architecture Changes

**Before:** Separate Azure Functions backend + React frontend + GitHub integration
**After:** Unified Next.js application with client-side generation

| Component | Original | Integrated |
|-----------|----------|------------|
| Backend | Azure Functions (TypeScript) | Next.js API Routes |
| Frontend | React SPA | Next.js Page (React) |
| GitHub Integration | Octokit + GitHub App | Removed (client-side download) |
| Authentication | Azure Static Web Apps Auth | Not required (public) |
| Data Storage | GitHub as storage | Client-side (no storage) |

## Features

### 1. Template Selection
Users can choose from three landing zone templates:
- **Azure Landing Zones (ALZ)**: Enterprise-scale with management groups
- **Subscription Vending**: Automated subscription provisioning
- **Workload Landing Zone**: Application-specific infrastructure

### 2. Configuration Form
Comprehensive form with validation for:
- Landing zone name
- Azure region and environment
- Management group and subscription
- Cost center and owner information
- Custom tags for governance

### 3. Bicep Parameter Generation
Generates `.bicepparam` files with:
- Template references
- All required parameters
- Environment-specific defaults
- Custom tags and metadata
- Template-specific configurations

### 4. Download & Deploy
Users download the generated file and deploy using:
```bash
az deployment sub create \
  --location <region> \
  --template-file main.bicep \
  --parameters <generated-file>.bicepparam
```

## API Endpoints

### GET /api/landing-zone/templates
Returns available landing zone templates.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "alz",
      "name": "Azure Landing Zones (ALZ)",
      "description": "...",
      "icon": "🏢",
      "parameters": ["landingZoneName", "location", ...],
      "estimatedDeploymentTime": "30-45 minutes"
    }
  ],
  "count": 3
}
```

### POST /api/landing-zone/generate
Generates a Bicep parameter file.

**Request:**
```json
{
  "templateType": "workload",
  "landingZoneName": "my-app-lz",
  "azureRegion": "eastus",
  "environment": "prod",
  "managementGroupId": "mg-platform",
  "subscriptionId": "00000000-0000-0000-0000-000000000000",
  "costCenter": "CC-12345",
  "owner": "team@company.com",
  "tags": {
    "project": "webapp",
    "department": "engineering"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bicep parameter file generated successfully",
  "data": {
    "fileName": "my-app-lz-prod-2026-03-01T00-00-00.bicepparam",
    "content": "using '../templates/landing-zones/main.bicep'...",
    "landingZoneName": "my-app-lz",
    "environment": "prod",
    "templateType": "workload"
  }
}
```

## Validation

The integration includes comprehensive validation:

### Landing Zone Name
- Required
- 3-63 characters
- Lowercase letters, numbers, hyphens only
- Cannot start or end with hyphen

### Subscription ID
- Required
- Must be valid GUID format

### Email
- Required
- Valid email format

### Azure Region
- Required
- Must be from predefined list of valid regions

### Other Fields
- Template type, environment, management group ID, cost center - all required

## Removed Components

The following were **not** integrated:
- GitHub App authentication and integration
- Pull request creation workflow
- Azure Key Vault secret retrieval
- Azure Functions hosting configuration
- Static Web Apps authentication

**Rationale:** The client-side generation approach eliminates the need for backend infrastructure, GitHub integration, and authentication while providing a simpler user experience.

## User Flow

1. **Navigate** to Landing Zone page from home
2. **Select** landing zone template (ALZ, Subscription Vending, or Workload)
3. **Fill out** configuration form with required details
4. **Generate** Bicep parameter file (client-side validation)
5. **Review** generated content in preview
6. **Download** `.bicepparam` file
7. **Deploy** using Azure CLI

## Benefits of Integration

### For Users
✅ Unified experience - one application for all IaC generation needs
✅ No GitHub account required
✅ Instant generation - no waiting for PR creation
✅ Review before download - see generated content
✅ Simpler workflow - no approval process needed

### For Developers
✅ Single codebase to maintain
✅ No backend infrastructure required
✅ No secrets management
✅ Consistent UI/UX with other features
✅ Easier testing and development

### For Organizations
✅ Lower hosting costs (static site only)
✅ No Azure Functions or Key Vault required
✅ Faster time to value
✅ Easier customization
✅ Self-service model

## Future Enhancements

Potential additions:
- [ ] Save configurations to local storage
- [ ] Export multiple landing zones as batch
- [ ] Cost estimation preview
- [ ] Azure CLI deployment script generation
- [ ] GitHub Actions workflow generator
- [ ] Terraform equivalent generation
- [ ] Re-integrate GitHub PR creation as optional feature
- [ ] Azure DevOps integration option

## Deployment

The integrated solution deploys as a static Next.js site:

```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Deploy to Azure Static Web Apps
az staticwebapp create \
  --name cloudblueprint \
  --resource-group rg-cloudblueprint \
  --source . \
  --location eastus2
```

## Testing

### Manual Testing
1. Navigate to `/landing-zone`
2. Test each template type
3. Fill form with valid/invalid data
4. Verify validation messages
5. Generate and download file
6. Verify file content

### API Testing
```bash
# Get templates
curl http://localhost:3000/api/landing-zone/templates

# Generate configuration
curl -X POST http://localhost:3000/api/landing-zone/generate \
  -H "Content-Type: application/json" \
  -d '{
    "templateType": "workload",
    "landingZoneName": "test-app",
    "azureRegion": "eastus",
    "environment": "dev",
    "managementGroupId": "mg-test",
    "subscriptionId": "00000000-0000-0000-0000-000000000000",
    "costCenter": "CC-001",
    "owner": "test@example.com"
  }'
```

## Migration Notes

If you had the original lz-vending-solution deployed:
- GitHub App is no longer needed (can be deleted)
- Azure Functions resources can be decommissioned
- Key Vault secrets no longer required
- Users should bookmark the new URL

## Support

For issues or questions:
1. Check the landing zone templates documentation in `src/templates/landing-zones/README.md`
2. Review validation errors in the UI
3. Check browser console for detailed error messages
4. Verify Bicep syntax with `az bicep build --file <file>`

## References

- [Azure Landing Zones](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/)
- [Azure Verified Modules](https://aka.ms/avm)
- [Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
- [Cloud Adoption Framework](https://learn.microsoft.com/azure/cloud-adoption-framework/)

---

**Integration completed**: March 1, 2026
**Version**: 2.0.0
**Status**: Production Ready ✅
