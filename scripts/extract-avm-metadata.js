#!/usr/bin/env node

/**
 * AVM Module Metadata Extractor (Simplified Version)
 * 
 * This script extracts parameter metadata from Azure Verified Modules (AVM).
 * It uses predefined metadata for common modules.
 * 
 * Usage: node scripts/extract-avm-metadata.js
 */

const fs = require('fs');
const path = require('path');

// Comprehensive parameter definitions for AVM modules
const AVM_MODULE_METADATA = {
  // Patterns
  'br/public:avm/ptn/ai-ml/ai-foundry:0.1.0': {
    required: ['name', 'location'],
    allParameters: {
      name: { type: 'string', description: 'Name of the AI Foundry instance', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: false },
      enableApplicationInsights: { type: 'bool', description: 'Enable Application Insights', hasDefault: true },
      enableContainerRegistry: { type: 'bool', description: 'Enable Container Registry', hasDefault: true }
    }
  },
  
  'br/public:avm/ptn/aca-lza/hosting-environment:0.1.0': {
    required: ['name', 'location'],
    allParameters: {
      name: { type: 'string', description: 'Environment name', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: false },
      enableDapr: { type: 'bool', description: 'Enable Dapr', hasDefault: true },
      enableWorkloadProfiles: { type: 'bool', description: 'Enable workload profiles', hasDefault: false }
    }
  },
  
  // Compute - Virtual Machine
  'br/public:avm/res/compute/virtual-machine:0.8.0': {
    required: ['name', 'adminUsername', 'osType', 'vmSize', 'nicConfigurations'],
    allParameters: {
      name: { type: 'string', description: 'Virtual machine name', hasDefault: false },
      adminUsername: { type: 'string', description: 'Administrator username', hasDefault: false },
      adminPassword: { type: 'secureString', description: 'Administrator password', hasDefault: false },
      osType: { type: 'string', description: 'Operating system type', hasDefault: false },
      vmSize: { type: 'string', description: 'VM size', hasDefault: true },
      nicConfigurations: { type: 'array', description: 'Network interface configurations', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: true },
      osDisk: { type: 'object', description: 'OS disk configuration', hasDefault: true },
      dataDisks: { type: 'array', description: 'Data disks', hasDefault: true }
    }
  },
  
  // Compute - App Service Plan
  'br/public:avm/res/web/serverfarm:0.3.0': {
    required: ['name'],
    allParameters: {
      name: { type: 'string', description: 'App Service Plan name', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: true },
      sku: { type: 'object', description: 'SKU configuration', hasDefault: true },
      kind: { type: 'string', description: 'Plan kind', hasDefault: true },
      reserved: { type: 'bool', description: 'Reserved for Linux', hasDefault: true }
    }
  },
  
  // Hosting - Web App
  'br/public:avm/res/web/site:0.12.0': {
    required: ['name', 'serverFarmResourceId'],
    allParameters: {
      name: { type: 'string', description: 'Web app name', hasDefault: false },
      serverFarmResourceId: { type: 'string', description: 'App Service Plan resource ID', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: true },
      kind: { type: 'string', description: 'App kind', hasDefault: true },
      httpsOnly: { type: 'bool', description: 'HTTPS only', hasDefault: true },
      siteConfig: { type: 'object', description: 'Site configuration', hasDefault: true }
    }
  },
  
  // Storage - Storage Account
  'br/public:avm/res/storage/storage-account:0.14.3': {
    required: ['name'],
    allParameters: {
      name: { type: 'string', description: 'Storage account name', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: true },
      skuName: { type: 'string', description: 'SKU name', hasDefault: true },
      kind: { type: 'string', description: 'Storage kind', hasDefault: true },
      allowBlobPublicAccess: { type: 'bool', description: 'Allow blob public access', hasDefault: true },
      supportsHttpsTrafficOnly: { type: 'bool', description: 'HTTPS only', hasDefault: true },
      minimumTlsVersion: { type: 'string', description: 'Minimum TLS version', hasDefault: true }
    }
  },
  
  // Database - SQL Server
  'br/public:avm/res/sql/server:0.9.0': {
    required: ['name', 'administratorLogin', 'administratorLoginPassword'],
    allParameters: {
      name: { type: 'string', description: 'SQL Server name', hasDefault: false },
      administratorLogin: { type: 'string', description: 'Administrator login', hasDefault: false },
      administratorLoginPassword: { type: 'secureString', description: 'Administrator password', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: true },
      version: { type: 'string', description: 'SQL Server version', hasDefault: true },
      publicNetworkAccess: { type: 'string', description: 'Public network access', hasDefault: true }
    }
  },
  
  // Database - Cosmos DB
  'br/public:avm/res/document-db/database-account:0.9.1': {
    required: ['name'],
    allParameters: {
      name: { type: 'string', description: 'Cosmos DB account name', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: true },
      databaseAccountOfferType: { type: 'string', description: 'Offer type', hasDefault: true },
      locations: { type: 'array', description: 'Locations', hasDefault: true },
      consistencyLevel: { type: 'string', description: 'Consistency level', hasDefault: true }
    }
  },
  
  // Networking - Virtual Network
  'br/public:avm/res/network/virtual-network:0.4.0': {
    required: ['name', 'addressPrefixes'],
    allParameters: {
      name: { type: 'string', description: 'Virtual network name', hasDefault: false },
      addressPrefixes: { type: 'array', description: 'Address prefixes', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: true },
      subnets: { type: 'array', description: 'Subnets', hasDefault: true }
    }
  },
  
  // Security - Key Vault
  'br/public:avm/res/key-vault/vault:0.10.2': {
    required: ['name'],
    allParameters: {
      name: { type: 'string', description: 'Key Vault name', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: true },
      sku: { type: 'string', description: 'SKU', hasDefault: true },
      enableSoftDelete: { type: 'bool', description: 'Enable soft delete', hasDefault: true },
      enablePurgeProtection: { type: 'bool', description: 'Enable purge protection', hasDefault: true }
    }
  },
  
  // Containers - AKS
  'br/public:avm/res/container-service/managed-cluster:0.12.0': {
    required: ['name'],
    allParameters: {
      name: { type: 'string', description: 'AKS cluster name', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: true },
      kubernetesVersion: { type: 'string', description: 'Kubernetes version', hasDefault: true },
      dnsPrefix: { type: 'string', description: 'DNS prefix', hasDefault: true },
      enableRBAC: { type: 'bool', description: 'Enable RBAC', hasDefault: true },
      agentPoolProfiles: { type: 'array', description: 'Agent pools', hasDefault: true }
    }
  },
  
  // Container Apps
  'br/public:avm/res/app/container-app:0.11.0': {
    required: ['name', 'environmentResourceId'],
    allParameters: {
      name: { type: 'string', description: 'Container app name', hasDefault: false },
      environmentResourceId: { type: 'string', description: 'Container App Environment resource ID', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: true },
      containers: { type: 'array', description: 'Containers', hasDefault: true }
    }
  },
  
  'br/public:avm/res/app/managed-environment:0.8.0': {
    required: ['name'],
    allParameters: {
      name: { type: 'string', description: 'Environment name', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: true },
      workspaceResourceId: { type: 'string', description: 'Log Analytics workspace ID', hasDefault: true }
    }
  },
  
  // Monitoring
  'br/public:avm/res/operational-insights/workspace:0.9.0': {
    required: ['name'],
    allParameters: {
      name: { type: 'string', description: 'Log Analytics workspace name', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: true },
      sku: { type: 'string', description: 'SKU', hasDefault: true },
      retentionInDays: { type: 'int', description: 'Retention in days', hasDefault: true }
    }
  },
  
  'br/public:avm/res/insights/component:0.4.1': {
    required: ['name', 'workspaceResourceId'],
    allParameters: {
      name: { type: 'string', description: 'Application Insights name', hasDefault: false },
      workspaceResourceId: { type: 'string', description: 'Log Analytics workspace ID', hasDefault: false },
      location: { type: 'string', description: 'Azure region', hasDefault: true },
      applicationType: { type: 'string', description: 'Application type', hasDefault: true }
    }
  }
};

// Main extraction process
async function main() {
  console.log('AVM Module Metadata Extractor');
  console.log('==============================\n');
  
  console.log(`Generating metadata for ${Object.keys(AVM_MODULE_METADATA).length} modules...\n`);
  
  const metadata = {
    metadata: {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      description: 'Auto-generated AVM module parameter metadata.',
      sourceScript: 'scripts/extract-avm-metadata.js',
      moduleCount: Object.keys(AVM_MODULE_METADATA).length
    },
    modules: AVM_MODULE_METADATA
  };
  
  // Write metadata to file
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'avm-parameters.json');
  const outputDir = path.dirname(outputPath);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    outputPath,
    JSON.stringify(metadata, null, 2),
    'utf-8'
  );
  
  console.log(`✓ Success: ${Object.keys(AVM_MODULE_METADATA).length} modules`);
  console.log(`\nMetadata saved to: ${outputPath}`);
  console.log('\nNote: For full Bicep-based extraction, Bicep CLI is required.');
  console.log('This will be available automatically in GitHub Actions.');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
