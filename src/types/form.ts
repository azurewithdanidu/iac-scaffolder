import { z } from 'zod'

export const FormDataSchema = z.object({
  // Step 1: Organization
  organization: z.string().min(2, 'Organization must be at least 2 characters'),
  workload: z.string().min(2, 'Workload must be at least 2 characters'),
  
  // Step 2: Environments & Regions
  environments: z.array(z.object({
    name: z.enum(['dev', 'test', 'prod']),
    region: z.string().min(1, 'Region is required'),
    enabled: z.boolean()
  })).min(1, 'At least one environment must be enabled'),
  
  // Step 3: Naming Convention
  namingPattern: z.string().default('{org}-{workload}-{env}-{region}-{suffix}'),
  separator: z.string().default('-'),
  
  // Step 4: Tags
  tags: z.object({
    owner: z.string().min(1, 'Owner is required'),
    costCenter: z.string().min(1, 'Cost center is required'),
    managedBy: z.string().default('terraform')
  }),
  
  // Step 5: Templates
  includePatterns: z.object({
    landingZone: z.boolean().default(false)
  }),
  
  // Step 6: Modules
  modules: z.object({
    virtualNetwork: z.boolean().default(true),
    keyVault: z.boolean().default(true),
    logAnalytics: z.boolean().default(true),
    diagnostics: z.boolean().default(true),
    networkSecurityGroup: z.boolean().default(true),
    natGateway: z.boolean().default(false),
    subscriptionActivityLogs: z.boolean().default(true)
  }),
  
  // Step 7: Pipeline
  pipelineProvider: z.enum(['github-actions', 'azure-devops', 'both']).default('github-actions'),
  iacProvider: z.literal('bicep').default('bicep')
})

export type FormData = z.infer<typeof FormDataSchema>

export const ResourceLimits = {
  storageAccount: 24,
  keyVault: 24,
  virtualNetwork: 64,
  resourceGroup: 90,
  logAnalyticsWorkspace: 63,
  subnet: 80
} as const

export type ResourceType = keyof typeof ResourceLimits

export const AzureRegions = [
  { value: 'australiaeast', label: 'Australia East', shortCode: 'aue' },
  { value: 'australiasoutheast', label: 'Australia Southeast', shortCode: 'ause' },
  { value: 'eastus', label: 'East US', shortCode: 'eus' },
  { value: 'eastus2', label: 'East US 2', shortCode: 'eus2' },
  { value: 'westus', label: 'West US', shortCode: 'wus' },
  { value: 'westus2', label: 'West US 2', shortCode: 'wus2' },
  { value: 'centralus', label: 'Central US', shortCode: 'cus' },
  { value: 'northeurope', label: 'North Europe', shortCode: 'neu' },
  { value: 'westeurope', label: 'West Europe', shortCode: 'weu' },
  { value: 'uksouth', label: 'UK South', shortCode: 'uks' },
  { value: 'ukwest', label: 'UK West', shortCode: 'ukw' },
  { value: 'southeastasia', label: 'Southeast Asia', shortCode: 'sea' },
  { value: 'eastasia', label: 'East Asia', shortCode: 'ea' }
] as const
