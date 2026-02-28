# Landing Zone Vending Machine - Quick Start

## What Was Added

The Landing Zone Vending Machine from `azure-finops-agent/lz-vending-solution` has been successfully integrated into `iac-scaffolder` as a new feature.

## Access the Feature

### From the UI
1. Navigate to http://localhost:3000 (or your deployed URL)
2. Click on **"Landing Zone Vending"** card
3. Or go directly to http://localhost:3000/landing-zone

## New Files Created

### API Routes
- `src/app/api/landing-zone/templates/route.ts` - Returns available templates
- `src/app/api/landing-zone/generate/route.ts` - Generates Bicep parameter files

### UI Pages
- `src/app/landing-zone/page.tsx` - Main landing zone creation page

### Libraries
- `src/lib/landing-zone-templates.ts` - Template definitions and metadata
- `src/lib/bicep-generator.ts` - Bicep .bicepparam file generator
- `src/lib/landing-zone-validator.ts` - Form validation logic

### Templates
- `src/templates/landing-zones/alz-main.bicep` - Azure Landing Zone template
- `src/templates/landing-zones/subscription-vending-main.bicep` - Subscription vending template
- `src/templates/landing-zones/workload-main.bicep` - Workload landing zone template
- `src/templates/landing-zones/README.md` - Template documentation

### Documentation
- `LANDING_ZONE_INTEGRATION.md` - Comprehensive integration documentation

## How to Use

### 1. Start the Development Server
```bash
cd iac-scaffolder
npm run dev
```

### 2. Access the Landing Zone Page
Open http://localhost:3000/landing-zone

### 3. Create a Landing Zone
1. Select a template:
   - **Azure Landing Zones (ALZ)** - Enterprise-scale with management groups
   - **Subscription Vending** - Automated subscription provisioning  
   - **Workload Landing Zone** - Application-specific infrastructure

2. Fill out the configuration form:
   - Landing zone name (lowercase, numbers, hyphens)
   - Azure region and environment
   - Management group and subscription IDs
   - Cost center and owner email
   - Custom tags (optional)

3. Click "Generate Landing Zone Configuration"

4. Review the generated `.bicepparam` file

5. Download and deploy:
   ```bash
   az deployment sub create \
     --location <region> \
     --template-file main.bicep \
     --parameters <downloaded-file>.bicepparam
   ```

## Key Differences from Original

| Feature | Original (lz-vending-solution) | Integrated (iac-scaffolder) |
|---------|-------------------------------|----------------------------|
| Architecture | Azure Functions + React SPA | Next.js unified app |
| GitHub Integration | Creates PRs via GitHub App | Downloads file directly |
| Authentication | Azure AD via Static Web Apps | None (public) |
| Deployment | Azure Functions + Static Web Apps | Next.js (any platform) |
| Workflow | Request → PR → Approve → Deploy | Generate → Download → Deploy |

## Quick Test

```bash
# Get available templates
curl http://localhost:3000/api/landing-zone/templates

# Generate a landing zone configuration
curl -X POST http://localhost:3000/api/landing-zone/generate \
  -H "Content-Type: application/json" \
  -d '{
    "templateType": "workload",
    "landingZoneName": "myapp-dev",
    "azureRegion": "eastus",
    "environment": "dev",
    "managementGroupId": "mg-platform",
    "subscriptionId": "12345678-1234-1234-1234-123456789abc",
    "costCenter": "CC-001",
    "owner": "dev@company.com",
    "tags": {
      "project": "demo"
    }
  }'
```

## Validation Rules

- **Landing Zone Name**: 3-63 chars, lowercase, numbers, hyphens only
- **Subscription ID**: Valid GUID format
- **Email**: Valid email format
- **Region**: Must be valid Azure region
- **Required Fields**: Template type, environment, management group, cost center

## Next Steps

1. ✅ Integration complete
2. 📝 Test the feature locally
3. 🚀 Deploy to production
4. 📚 Update user documentation
5. 🎉 Announce the new feature

## Troubleshooting

### Port 3000 already in use
```bash
# Kill the process or use a different port
npm run dev -- -p 3001
```

### API returns errors
- Check browser console for detailed errors
- Verify all required fields are filled
- Ensure valid format for subscription ID (GUID)

### Template not rendering
- Clear browser cache
- Check React dev tools for component errors
- Verify all imports are correct

## Production Deployment

### Azure Static Web Apps
```bash
az staticwebapp create \
  --name cloudblueprint \
  --resource-group rg-cloudblueprint \
  --source . \
  --location eastus2 \
  --branch main \
  --app-location "/" \
  --output-location ".next"
```

### Vercel
```bash
npm install -g vercel
vercel deploy
```

### Azure App Service
```bash
az webapp up \
  --name cloudblueprint \
  --resource-group rg-cloudblueprint \
  --runtime "NODE:18-lts"
```

## Support

- **Documentation**: See `LANDING_ZONE_INTEGRATION.md` for detailed information
- **Templates**: See `src/templates/landing-zones/README.md` for template details
- **API Docs**: Check the API route files for endpoint documentation

---

**Status**: Ready to use ✅
**Last updated**: March 1, 2026
