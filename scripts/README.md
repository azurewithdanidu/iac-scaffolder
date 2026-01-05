# AVM Module Metadata Automation

This folder contains the automated system for extracting and maintaining Azure Verified Module (AVM) parameter metadata.

## Overview

The workload builder needs accurate parameter information for each AVM module to generate correct Bicep templates. This system ensures we always have up-to-date metadata about which parameters are required and which have defaults.

## Components

### 1. Metadata Extraction Script
**File**: `extract-avm-metadata.js`

Extracts parameter metadata for AVM modules and generates a JSON file with:
- Required parameters (without defaults)
- All parameters with type information
- Default value indicators

**Usage**:
```bash
node scripts/extract-avm-metadata.js
```

### 2. Generated Metadata File
**File**: `src/data/avm-parameters.json`

JSON file containing metadata for all AVM modules used in the workload builder:
```json
{
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2026-01-05T00:00:00.000Z",
    "moduleCount": 15
  },
  "modules": {
    "br/public:avm/res/web/serverfarm:0.3.0": {
      "required": ["name"],
      "allParameters": {
        "name": { "type": "string", "hasDefault": false },
        "sku": { "type": "object", "hasDefault": true }
      }
    }
  }
}
```

### 3. GitHub Action
**File**: `.github/workflows/update-avm-metadata.yml`

Automated workflow that:
- Runs nightly at 2 AM UTC
- Can be triggered manually via workflow_dispatch
- Extracts latest AVM metadata
- Commits updates if changes detected
- Provides summary of results

## How It Works

1. **Nightly Update**: GitHub Action runs automatically
2. **Metadata Extraction**: Script analyzes AVM modules
3. **Generate JSON**: Creates/updates `avm-parameters.json`
4. **Auto-commit**: Changes are committed to the repository
5. **Next Deploy**: Next.js automatically uses updated metadata

## Workload Builder Integration

The workload builder (`src/app/workload-builder/page.tsx`) loads the metadata at build time:

```typescript
import avmMetadata from '@/data/avm-parameters.json'

// Use metadata to determine which parameters to include
const fetchAvmModuleParameters = async (avmModuleRef: string) => {
  const moduleData = avmMetadata.modules[avmModuleRef]
  // Only include required params without defaults
  if (isRequired && !hasDefault) {
    // Add to Bicep template
  }
}
```

## Benefits

✅ **Accurate**: Uses actual AVM module requirements  
✅ **Always Up-to-date**: Automatic nightly updates  
✅ **No Runtime Overhead**: Pre-generated metadata  
✅ **No API Calls**: Everything bundled at build time  
✅ **Offline Support**: Works without internet connection  

## Maintenance

### Adding New Modules

Add the module reference to the `AVM_MODULE_METADATA` object in `extract-avm-metadata.js`:

```javascript
const AVM_MODULE_METADATA = {
  'br/public:avm/res/new/module:1.0.0': {
    required: ['name', 'requiredParam'],
    allParameters: {
      name: { type: 'string', hasDefault: false },
      requiredParam: { type: 'string', hasDefault: false },
      optionalParam: { type: 'bool', hasDefault: true }
    }
  }
}
```

Then run:
```bash
node scripts/extract-avm-metadata.js
```

### Manual Trigger

To manually update metadata:
1. Go to GitHub Actions
2. Select "Update AVM Module Metadata" workflow
3. Click "Run workflow"
4. Wait for completion

### Future Enhancement

When Bicep CLI integration is ready, the script can be enhanced to:
- Automatically discover new AVM modules
- Extract parameter info directly from Bicep compilation
- Detect breaking changes in module versions

## Troubleshooting

**Metadata not loading?**
- Check `src/data/avm-parameters.json` exists
- Verify JSON is valid
- Check browser console for import errors

**Parameters still incorrect?**
- Run extraction script manually
- Check module reference matches exactly
- Verify service definition uses correct required array

**GitHub Action failing?**
- Check workflow logs
- Ensure Bicep CLI installed (in GitHub Actions)
- Verify write permissions granted
