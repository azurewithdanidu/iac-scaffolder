'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Database, Globe, Code, Settings, Server, HardDrive, Eye, FileCode, Plus, Trash2, Edit3, Shield, Cloud, Layers, Network, Brain, Cpu, Monitor } from 'lucide-react'

interface AzureService {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: 'compute' | 'storage' | 'database' | 'hosting' | 'networking' | 'security' | 'ai-ml' | 'containers' | 'messaging' | 'monitoring' | 'patterns'
  avmModule: string
  required: string[]
  optional: string[]
}

interface SelectedServiceInstance {
  serviceId: string
  instanceId: string
  instanceName: string
  customConfig?: Record<string, any>
}

const AZURE_SERVICES: AzureService[] = [
  // Patterns
  {
    id: 'ai-foundry',
    name: 'AI Foundry',
    description: 'Azure AI Foundry pattern for machine learning and AI services',
    icon: Brain,
    category: 'patterns',
    avmModule: 'br/public:avm/ptn/ai-ml/ai-foundry:0.1.0',
    required: ['name', 'location'],
    optional: ['enableApplicationInsights', 'enableContainerRegistry']
  },
  {
    id: 'aca-hosting-env',
    name: 'ACA Landing Zone Hosting Environment',
    description: 'Container Apps hosting environment pattern for landing zones',
    icon: Layers,
    category: 'patterns',
    avmModule: 'br/public:avm/ptn/aca-lza/hosting-environment:0.1.0',
    required: ['name', 'location'],
    optional: ['enableDapr', 'enableWorkloadProfiles']
  },

  // Compute Services
  {
    id: 'virtual-machine',
    name: 'Virtual Machine',
    description: 'Azure Virtual Machine with enterprise configuration',
    icon: Server,
    category: 'compute',
    avmModule: 'br/public:avm/res/compute/virtual-machine:0.8.0',
    required: ['name', 'location', 'adminUsername', 'vmSize'],
    optional: ['osDiskType', 'imageReference', 'availabilitySetName']
  },
  {
    id: 'vmss',
    name: 'Virtual Machine Scale Set',
    description: 'Auto-scaling virtual machine scale sets',
    icon: Server,
    category: 'compute',
    avmModule: 'br/public:avm/res/compute/virtual-machine-scale-set:0.4.0',
    required: ['name', 'location', 'vmSize', 'instanceCount'],
    optional: ['upgradePolicy', 'overprovision', 'singlePlacementGroup']
  },
  {
    id: 'app-service-plan',
    name: 'App Service Plan',
    description: 'Defines compute resources for web apps and function apps',
    icon: Server,
    category: 'compute',
    avmModule: 'br/public:avm/res/web/serverfarm:0.3.0',
    required: ['name', 'location', 'sku'],
    optional: ['reserved', 'maximumElasticWorkerCount']
  },
  {
    id: 'aks-cluster',
    name: 'Azure Kubernetes Service',
    description: 'Managed Kubernetes cluster for container orchestration',
    icon: Layers,
    category: 'compute',
    avmModule: 'br/public:avm/res/container-service/managed-cluster:0.12.0',
    required: ['name', 'location', 'kubernetesVersion'],
    optional: ['nodeResourceGroup', 'dnsPrefix', 'enableRBAC']
  },
  {
    id: 'batch-account',
    name: 'Batch Account',
    description: 'Azure Batch for large-scale parallel workloads',
    icon: Cpu,
    category: 'compute',
    avmModule: 'br/public:avm/res/batch/batch-account:0.4.0',
    required: ['name', 'location'],
    optional: ['poolAllocationMode', 'publicNetworkAccess']
  },

  // Hosting Services
  {
    id: 'web-app',
    name: 'Web App',
    description: 'Host web applications and APIs with built-in scaling',
    icon: Globe,
    category: 'hosting',
    avmModule: 'br/public:avm/res/web/site:0.12.0',
    required: ['name', 'location', 'serverFarmResourceId'],
    optional: ['httpsOnly', 'clientAffinityEnabled', 'kind']
  },
  {
    id: 'function-app',
    name: 'Function App',
    description: 'Serverless compute platform for event-driven applications',
    icon: Code,
    category: 'hosting',
    avmModule: 'br/public:avm/res/web/site:0.12.0',
    required: ['name', 'location', 'serverFarmResourceId', 'storageAccountResourceId'],
    optional: ['httpsOnly', 'dailyMemoryTimeQuota', 'kind']
  },
  {
    id: 'static-web-app',
    name: 'Static Web App',
    description: 'Static websites with serverless APIs',
    icon: Globe,
    category: 'hosting',
    avmModule: 'br/public:avm/res/web/static-site:0.4.0',
    required: ['name', 'location'],
    optional: ['repositoryUrl', 'branch', 'customDomains']
  },
  {
    id: 'app-service-environment',
    name: 'App Service Environment',
    description: 'Isolated and dedicated environment for App Services',
    icon: Shield,
    category: 'hosting',
    avmModule: 'br/public:avm/res/web/hosting-environment:0.2.0',
    required: ['name', 'location', 'subnetResourceId'],
    optional: ['kind', 'internalLoadBalancingMode']
  },

  // Storage Services
  {
    id: 'storage-account',
    name: 'Storage Account',
    description: 'General-purpose v2 storage account for blobs, files, queues, and tables',
    icon: HardDrive,
    category: 'storage',
    avmModule: 'br/public:avm/res/storage/storage-account:0.14.3',
    required: ['name', 'location', 'sku'],
    optional: ['accessTier', 'minimumTlsVersion', 'allowBlobPublicAccess']
  },
  {
    id: 'netapp-account',
    name: 'Azure NetApp Files',
    description: 'Enterprise-grade file storage service',
    icon: HardDrive,
    category: 'storage',
    avmModule: 'br/public:avm/res/net-app/net-app-account:0.3.0',
    required: ['name', 'location'],
    optional: ['capacityPools', 'volumes']
  },
  {
    id: 'elastic-san',
    name: 'Elastic SAN',
    description: 'Azure Elastic Storage Area Network for iSCSI',
    icon: HardDrive,
    category: 'storage',
    avmModule: 'br/public:avm/res/elastic-san/elastic-san:0.2.0',
    required: ['name', 'location', 'baseSizeTiB'],
    optional: ['extendedCapacitySizeTiB', 'sku']
  },

  // Database Services
  {
    id: 'sql-server',
    name: 'SQL Server',
    description: 'Managed relational database server with enterprise features',
    icon: Database,
    category: 'database',
    avmModule: 'br/public:avm/res/sql/server:0.8.0',
    required: ['name', 'location', 'administratorLogin'],
    optional: ['version', 'minimalTlsVersion', 'publicNetworkAccess']
  },
  {
    id: 'sql-database',
    name: 'SQL Database',
    description: 'Managed SQL database with automatic scaling and backups',
    icon: Database,
    category: 'database',
    avmModule: 'br/public:avm/res/sql/server/database:0.4.0',
    required: ['name', 'serverName', 'collation'],
    optional: ['tier', 'skuName', 'maxSizeBytes', 'zoneRedundant']
  },
  {
    id: 'sql-managed-instance',
    name: 'SQL Managed Instance',
    description: 'Fully managed SQL Server instance in the cloud',
    icon: Database,
    category: 'database',
    avmModule: 'br/public:avm/res/sql/managed-instance:0.3.0',
    required: ['name', 'location', 'administratorLogin', 'subnetId'],
    optional: ['vCores', 'storageSizeInGB', 'licenseType']
  },
  {
    id: 'cosmos-db',
    name: 'Cosmos DB',
    description: 'Globally distributed NoSQL database service',
    icon: Database,
    category: 'database',
    avmModule: 'br/public:avm/res/document-db/database-account:0.9.0',
    required: ['name', 'location'],
    optional: ['defaultConsistencyLevel', 'enableMultipleWriteLocations', 'enableFreeTier']
  },
  {
    id: 'cosmos-mongo',
    name: 'Cosmos DB for MongoDB',
    description: 'MongoDB-compatible database with vCore architecture',
    icon: Database,
    category: 'database',
    avmModule: 'br/public:avm/res/document-db/mongo-cluster:0.2.0',
    required: ['name', 'location', 'administratorUsername'],
    optional: ['nodeGroupSpecs', 'mongoVersion']
  },
  {
    id: 'mysql-flexible',
    name: 'MySQL Flexible Server',
    description: 'Fully managed MySQL database service',
    icon: Database,
    category: 'database',
    avmModule: 'br/public:avm/res/db-for-my-sql/flexible-server:0.4.0',
    required: ['name', 'location', 'administratorLogin'],
    optional: ['skuName', 'tier', 'storageSize']
  },
  {
    id: 'postgresql-flexible',
    name: 'PostgreSQL Flexible Server',
    description: 'Fully managed PostgreSQL database service',
    icon: Database,
    category: 'database',
    avmModule: 'br/public:avm/res/db-for-postgre-sql/flexible-server:0.7.0',
    required: ['name', 'location', 'administratorLogin'],
    optional: ['skuName', 'tier', 'storageSize']
  },

  // Containers
  {
    id: 'container-registry',
    name: 'Container Registry',
    description: 'Private Docker container registry',
    icon: Layers,
    category: 'containers',
    avmModule: 'br/public:avm/res/container-registry/registry:0.6.0',
    required: ['name', 'location'],
    optional: ['sku', 'adminUserEnabled', 'publicNetworkAccess']
  },
  {
    id: 'container-app',
    name: 'Container App',
    description: 'Serverless containers with automatic scaling',
    icon: Layers,
    category: 'containers',
    avmModule: 'br/public:avm/res/app/container-app:0.8.0',
    required: ['name', 'location', 'managedEnvironmentResourceId'],
    optional: ['containerImage', 'targetPort', 'environmentVariables']
  },
  {
    id: 'container-app-environment',
    name: 'Container App Environment',
    description: 'Shared environment for Container Apps',
    icon: Layers,
    category: 'containers',
    avmModule: 'br/public:avm/res/app/managed-environment:0.6.0',
    required: ['name', 'location'],
    optional: ['logAnalyticsWorkspaceResourceId', 'daprAIInstrumentationKey']
  },
  {
    id: 'container-instance',
    name: 'Container Instance',
    description: 'Simple container hosting without orchestration',
    icon: Layers,
    category: 'containers',
    avmModule: 'br/public:avm/res/container-instance/container-group:0.4.0',
    required: ['name', 'location', 'containers'],
    optional: ['osType', 'restartPolicy', 'ipAddress']
  },

  // Networking
  {
    id: 'virtual-network',
    name: 'Virtual Network',
    description: 'Isolated network environment in Azure',
    icon: Network,
    category: 'networking',
    avmModule: 'br/public:avm/res/network/virtual-network:0.7.1',
    required: ['name', 'location', 'addressPrefixes'],
    optional: ['subnets', 'enableDdosProtection', 'dnsServers']
  },
  {
    id: 'application-gateway',
    name: 'Application Gateway',
    description: 'Layer 7 load balancer with WAF capabilities',
    icon: Network,
    category: 'networking',
    avmModule: 'br/public:avm/res/network/application-gateway:0.4.0',
    required: ['name', 'location', 'gatewayIPConfigurations'],
    optional: ['sku', 'enableHttp2', 'webApplicationFirewallConfiguration']
  },
  {
    id: 'load-balancer',
    name: 'Load Balancer',
    description: 'Layer 4 network load balancer',
    icon: Network,
    category: 'networking',
    avmModule: 'br/public:avm/res/network/load-balancer:0.3.0',
    required: ['name', 'location'],
    optional: ['sku', 'frontendIPConfigurations', 'backendAddressPools']
  },
  {
    id: 'front-door',
    name: 'Azure Front Door',
    description: 'Global load balancer and CDN service',
    icon: Network,
    category: 'networking',
    avmModule: 'br/public:avm/res/network/front-door:0.3.0',
    required: ['name', 'location'],
    optional: ['sku', 'originGroups', 'customDomains']
  },
  {
    id: 'vpn-gateway',
    name: 'VPN Gateway',
    description: 'Site-to-site and point-to-site VPN connectivity',
    icon: Network,
    category: 'networking',
    avmModule: 'br/public:avm/res/network/vpn-gateway:0.3.0',
    required: ['name', 'location', 'virtualHubResourceId'],
    optional: ['bgpSettings', 'vpnConnections']
  },
  {
    id: 'azure-firewall',
    name: 'Azure Firewall',
    description: 'Cloud-native network security service',
    icon: Shield,
    category: 'networking',
    avmModule: 'br/public:avm/res/network/azure-firewall:0.3.0',
    required: ['name', 'location'],
    optional: ['azureFirewallSubnetPublicIpId', 'firewallPolicyId']
  },

  // Security & Identity
  {
    id: 'key-vault',
    name: 'Key Vault',
    description: 'Secure storage for keys, secrets, and certificates',
    icon: Shield,
    category: 'security',
    avmModule: 'br/public:avm/res/key-vault/vault:0.9.0',
    required: ['name', 'location'],
    optional: ['sku', 'enableSoftDelete', 'enableRbacAuthorization']
  },
  {
    id: 'managed-identity',
    name: 'User Assigned Identity',
    description: 'Managed identity for Azure resources',
    icon: Shield,
    category: 'security',
    avmModule: 'br/public:avm/res/managed-identity/user-assigned-identity:0.4.0',
    required: ['name', 'location'],
    optional: ['tags']
  },

  // AI & Machine Learning
  {
    id: 'cognitive-services',
    name: 'AI Services (Cognitive Services)',
    description: 'Pre-built AI models and APIs',
    icon: Brain,
    category: 'ai-ml',
    avmModule: 'br/public:avm/res/cognitive-services/account:0.7.0',
    required: ['name', 'location', 'kind'],
    optional: ['sku', 'publicNetworkAccess', 'customSubDomainName']
  },
  {
    id: 'ml-workspace',
    name: 'Machine Learning Workspace',
    description: 'Azure Machine Learning workspace for ML development',
    icon: Brain,
    category: 'ai-ml',
    avmModule: 'br/public:avm/res/machine-learning-services/workspace:0.8.0',
    required: ['name', 'location', 'storageAccountResourceId', 'keyVaultResourceId'],
    optional: ['applicationInsightsResourceId', 'containerRegistryResourceId']
  },

  // Messaging & Integration
  {
    id: 'service-bus',
    name: 'Service Bus Namespace',
    description: 'Enterprise messaging service with queues and topics',
    icon: Code,
    category: 'messaging',
    avmModule: 'br/public:avm/res/service-bus/namespace:0.8.0',
    required: ['name', 'location'],
    optional: ['sku', 'zoneRedundant', 'premiumMessagingPartitions']
  },
  {
    id: 'event-hub',
    name: 'Event Hub Namespace',
    description: 'Big data streaming platform and event ingestion service',
    icon: Code,
    category: 'messaging',
    avmModule: 'br/public:avm/res/event-hub/namespace:0.6.0',
    required: ['name', 'location'],
    optional: ['sku', 'eventHubs', 'zoneRedundant']
  },
  {
    id: 'event-grid-topic',
    name: 'Event Grid Topic',
    description: 'Event routing service for reactive programming',
    icon: Code,
    category: 'messaging',
    avmModule: 'br/public:avm/res/event-grid/topic:0.4.0',
    required: ['name', 'location'],
    optional: ['inputSchema', 'publicNetworkAccess']
  },

  // Monitoring & Management
  {
    id: 'log-analytics',
    name: 'Log Analytics Workspace',
    description: 'Centralized logging and monitoring workspace',
    icon: Monitor,
    category: 'monitoring',
    avmModule: 'br/public:avm/res/operational-insights/workspace:0.7.0',
    required: ['name', 'location'],
    optional: ['dataRetention', 'sku', 'dailyQuotaGb']
  },
  {
    id: 'application-insights',
    name: 'Application Insights',
    description: 'Application performance monitoring service',
    icon: Monitor,
    category: 'monitoring',
    avmModule: 'br/public:avm/res/insights/component:0.4.0',
    required: ['name', 'location', 'workspaceResourceId'],
    optional: ['applicationType', 'kind', 'retentionInDays']
  }
]

export default function WorkloadBuilderPage() {
  const [selectedServices, setSelectedServices] = useState<SelectedServiceInstance[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [editingInstance, setEditingInstance] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // State for generated bicep content
  const [generatedBicep, setGeneratedBicep] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const categories = [
    { id: 'all', name: 'All Services', icon: Layers },
    { id: 'patterns', name: 'Patterns', icon: Layers },
    { id: 'compute', name: 'Compute', icon: Server },
    { id: 'hosting', name: 'Hosting', icon: Globe },
    { id: 'storage', name: 'Storage', icon: HardDrive },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'containers', name: 'Containers', icon: Layers },
    { id: 'networking', name: 'Networking', icon: Network },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'ai-ml', name: 'AI & ML', icon: Brain },
    { id: 'messaging', name: 'Messaging', icon: Code },
    { id: 'monitoring', name: 'Monitoring', icon: Monitor }
  ]

  const filteredServices = selectedCategory === 'all' 
    ? AZURE_SERVICES 
    : AZURE_SERVICES.filter(service => service.category === selectedCategory)

  const addServiceInstance = (serviceId: string) => {
    const service = AZURE_SERVICES.find(s => s.id === serviceId)
    if (!service) return

    const existingCount = selectedServices.filter(s => s.serviceId === serviceId).length
    const instanceId = `${serviceId}-${existingCount + 1}`
    const instanceName = `${service.name} ${existingCount + 1}`

    const newInstance: SelectedServiceInstance = {
      serviceId,
      instanceId,
      instanceName,
      customConfig: {}
    }

    setSelectedServices(prev => [...prev, newInstance])
  }

  const removeServiceInstance = (instanceId: string) => {
    setSelectedServices(prev => prev.filter(instance => instance.instanceId !== instanceId))
  }

  const updateInstanceName = (instanceId: string, newName: string) => {
    setSelectedServices(prev => 
      prev.map(instance => 
        instance.instanceId === instanceId 
          ? { ...instance, instanceName: newName }
          : instance
      )
    )
  }

  const getServiceInstanceCount = (serviceId: string) => {
    return selectedServices.filter(instance => instance.serviceId === serviceId).length
  }

  const getSelectedServicesData = () => {
    return selectedServices.map(instance => {
      const service = AZURE_SERVICES.find(s => s.id === instance.serviceId)
      return { ...instance, service }
    }).filter(item => item.service)
  }

  // Cache for AVM module parameters to avoid repeated API calls
  const [avmParametersCache, setAvmParametersCache] = useState<Record<string, any>>({})

  // Function to generate and cache bicep template
  const updateBicepTemplate = async () => {
    setIsGenerating(true)
    try {
      const content = await generateBicepTemplate()
      setGeneratedBicep(content)
    } catch (error) {
      console.error('Error generating Bicep template:', error)
      setGeneratedBicep('// Error generating template: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsGenerating(false)
    }
  }

  // Update template when services change
  useEffect(() => {
    if (selectedServices.length > 0) {
      updateBicepTemplate().catch((error) => {
        console.error('Failed to update Bicep template:', error)
        setGeneratedBicep('// Error generating template: ' + (error instanceof Error ? error.message : 'Unknown error'))
        setIsGenerating(false)
      })
    } else {
      setGeneratedBicep('// No services selected\n// Add services from the catalog above to generate a Bicep template')
      setIsGenerating(false)
    }
  }, [selectedServices])

  // Function to fetch AVM module parameters dynamically
  const fetchAvmModuleParameters = async (avmModuleRef: string) => {
    if (avmParametersCache[avmModuleRef]) {
      return avmParametersCache[avmModuleRef]
    }

    try {
      // For now, return fallback parameters to avoid API issues
      const parameters = getFallbackParameters(avmModuleRef)
      
      // Cache the result
      setAvmParametersCache(prev => ({
        ...prev,
        [avmModuleRef]: parameters
      }))
      
      return parameters
    } catch (error) {
      console.warn('Failed to fetch AVM parameters, using fallback:', error)
      return getFallbackParameters(avmModuleRef)
    }
  }

  // Fallback parameter definitions for when API is not available
  const getFallbackParameters = (avmModuleRef: string) => {
    // Extract service type from AVM module reference
    const serviceType = avmModuleRef.split('/').pop()?.split(':')[0] || ''
    
    switch (serviceType) {
      case 'resource-group':
        return { required: ['name'], optional: ['location', 'tags', 'lock', 'roleAssignments'] }
      case 'storage-account':
        return { required: ['name'], optional: ['location', 'tags', 'skuName', 'kind', 'allowBlobPublicAccess', 'supportsHttpsTrafficOnly'] }
      case 'app':
        return { required: ['name', 'serverFarmResourceId'], optional: ['location', 'tags', 'kind', 'managedIdentities', 'siteConfig'] }
      case 'serverfarm':
        return { required: ['name'], optional: ['location', 'tags', 'sku', 'kind', 'reserved'] }
      case 'vault':
        return { required: ['name'], optional: ['location', 'tags', 'sku', 'enableSoftDelete', 'enablePurgeProtection'] }
      case 'container-app':
        return { required: ['name', 'environmentResourceId'], optional: ['location', 'tags', 'containers', 'scale'] }
      case 'registry':
        return { required: ['name'], optional: ['location', 'tags', 'acrSku', 'adminUserEnabled'] }
      case 'virtual-network':
        return { required: ['name', 'addressPrefixes'], optional: ['location', 'tags', 'subnets'] }
      default:
        return { required: ['name'], optional: ['location', 'tags'] }
    }
  }

  const generateBicepTemplate = async () => {
    const serviceInstances = getSelectedServicesData()
    
    if (serviceInstances.length === 0) return ''

    // Get parameter definitions for services dynamically
    const getServiceParameters = async (service: any) => {
      if (service.avmModule) {
        return await fetchAvmModuleParameters(service.avmModule)
      }
      return { required: ['name'], optional: ['location', 'tags'] }
    }

    // Generate comprehensive parameter section
    const uniqueServices = Array.from(new Set(serviceInstances.map((i: any) => i.service!.id)))
    const needsAppServicePlan = serviceInstances.some((i: any) => i.service!.id === 'app-service')
    const needsContainerEnvironment = serviceInstances.some((i: any) => i.service!.id === 'container-app')
    const needsLogAnalytics = serviceInstances.some((i: any) => i.service!.id === 'application-insights')
    const needsSqlAuth = serviceInstances.some((i: any) => i.service!.id === 'sql-server')
    const hasVirtualNetwork = serviceInstances.some((i: any) => i.service!.id === 'virtual-network')

    let bicepContent = `// Generated Workload Bicep Template
// Services: ${serviceInstances.map(item => item.service?.name).filter(Boolean).join(', ')}

targetScope = 'resourceGroup'

// ========== PARAMETERS ==========
@description('The Azure region where resources will be deployed')
param location string = resourceGroup().location

@description('Environment name for resource naming')
param environmentName string

@description('Application name for resource naming')
param applicationName string

@description('Tags to apply to all resources')
param tags object = {
  Environment: environmentName
  Application: applicationName
  ManagedBy: 'WorkloadBuilder'
  DeployedOn: utcNow()
}

// Resource-specific parameters
${serviceInstances.some(i => i.service!.id === 'storage-account') ? `@description('Storage Account SKU')
@allowed(['Standard_LRS', 'Standard_GRS', 'Standard_RAGRS', 'Standard_ZRS', 'Premium_LRS'])
param storageSkuName string = 'Standard_LRS'

@description('Allow blob public access')
param allowBlobPublicAccess bool = false` : ''}

${needsAppServicePlan ? `@description('App Service Plan SKU')
param appServicePlanSku object = {
  name: 'B1'
  tier: 'Basic'
  size: 'B1'
  family: 'B'
  capacity: 1
}` : ''}

${hasVirtualNetwork ? `@description('Virtual network address prefixes')
param vnetAddressPrefixes array = ['10.0.0.0/16']

@description('Virtual network subnets')
param vnetSubnets array = [
  {
    name: 'default'
    addressPrefix: '10.0.1.0/24'
  }
]` : ''}

${needsSqlAuth ? `@description('SQL Server administrator login')
param sqlAdministratorLogin string = 'sqladmin'

@description('SQL Server administrator password')
@secure()
param sqlAdministratorPassword string` : ''}

// ========== VARIABLES ==========
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var nameToken = '\${environmentName}-\${applicationName}'

// ========== MODULES ==========
`

    serviceInstances.forEach((item, index) => {
      const service = item.service!
      const instanceSafeName = item.instanceId.replace(/[^a-zA-Z0-9]/g, '_')
      
      bicepContent += `
// ${item.instanceName}
module ${instanceSafeName}_module '${service.avmModule}' = {
  name: '${item.instanceId}-\${resourceToken}'
  params: {
    name: '\${nameToken}-${item.instanceId}-\${resourceToken}'
    location: location
    tags: tags
`

      // Add service-specific parameters with comprehensive configurations
      if (service.id === 'storage-account') {
        bicepContent += `    kind: 'StorageV2'
    skuName: storageSkuName
    allowBlobPublicAccess: allowBlobPublicAccess
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
`
      } else if (service.id === 'web-app') {
        const appServicePlan = serviceInstances.find(inst => inst.service?.id === 'app-service-plan')
        if (appServicePlan) {
          const planSafeName = appServicePlan.instanceId.replace(/[^a-zA-Z0-9]/g, '_')
          bicepContent += `    serverFarmResourceId: ${planSafeName}_module.outputs.resourceId
    httpsOnly: true
    siteConfig: {
      alwaysOn: true
      ftpsState: 'FtpsOnly'
      minTlsVersion: '1.2'
      use32BitWorkerProcess: false
      webSocketsEnabled: false
    }
`
        }
      } else if (service.id === 'function-app') {
        const appServicePlan = serviceInstances.find(inst => inst.service?.id === 'app-service-plan')
        const storageAccount = serviceInstances.find(inst => inst.service?.id === 'storage-account')
        if (appServicePlan && storageAccount) {
          const planSafeName = appServicePlan.instanceId.replace(/[^a-zA-Z0-9]/g, '_')
          const storageSafeName = storageAccount.instanceId.replace(/[^a-zA-Z0-9]/g, '_')
          bicepContent += `    serverFarmResourceId: ${planSafeName}_module.outputs.resourceId
    storageAccountResourceId: ${storageSafeName}_module.outputs.resourceId
    kind: 'functionapp'
    httpsOnly: true
    siteConfig: {
      alwaysOn: false
      ftpsState: 'FtpsOnly'
      minTlsVersion: '1.2'
    }
`
        }
      } else if (service.id === 'app-service-plan') {
        bicepContent += `    sku: appServicePlanSku
`
      } else if (service.id === 'key-vault') {
        bicepContent += `    sku: 'standard'
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    enableRbacAuthorization: true
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
`
      } else if (service.id === 'container-app') {
        // Check if there's a container app environment
        const containerEnv = serviceInstances.find(inst => inst.service?.id === 'container-app-environment')
        if (containerEnv) {
          const envSafeName = containerEnv.instanceId.replace(/[^a-zA-Z0-9]/g, '_')
          bicepContent += `    environmentResourceId: ${envSafeName}_module.outputs.resourceId
`
        }
        bicepContent += `    containers: [
      {
        name: 'main'
        image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
        resources: {
          cpu: '0.25'
          memory: '0.5Gi'
        }
      }
    ]
    scale: {
      minReplicas: 0
      maxReplicas: 10
    }
`
      } else if (service.id === 'container-registry') {
        bicepContent += `    acrSku: 'Basic'
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
`
      } else if (service.id === 'virtual-network') {
        bicepContent += `    addressPrefixes: vnetAddressPrefixes
    subnets: vnetSubnets
`
      } else if (service.id === 'sql-server') {
        bicepContent += `    administratorLogin: sqlAdministratorLogin
    administratorLoginPassword: sqlAdministratorPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
`
      } else if (service.id === 'sql-database') {
        const sqlServer = serviceInstances.find(inst => inst.service?.id === 'sql-server')
        if (sqlServer) {
          const serverSafeName = sqlServer.instanceId.replace(/[^a-zA-Z0-9]/g, '_')
          bicepContent += `    serverName: ${serverSafeName}_module.outputs.name
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    tier: 'Basic'
    skuName: 'Basic'
    maxSizeBytes: 2147483648
`
        }
      } else if (service.id === 'cosmos-db') {
        bicepContent += `    locations: [
      {
        locationName: location
        isZoneRedundant: false
      }
    ]
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
`
      } else if (service.id === 'log-analytics') {
        bicepContent += `    dataRetention: 90
    skuName: 'PerGB2018'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
`
      } else if (service.id === 'application-insights') {
        const logAnalytics = serviceInstances.find(inst => inst.service?.id === 'log-analytics')
        if (logAnalytics) {
          const logSafeName = logAnalytics.instanceId.replace(/[^a-zA-Z0-9]/g, '_')
          bicepContent += `    workspaceResourceId: ${logSafeName}_module.outputs.resourceId
    applicationType: 'web'
    kind: 'web'
    retentionInDays: 90
`
        }
      } else if (service.id === 'batch-account') {
        const storageAccount = serviceInstances.find(inst => inst.service?.id === 'storage-account')
        if (storageAccount) {
          const storageSafeName = storageAccount.instanceId.replace(/[^a-zA-Z0-9]/g, '_')
          bicepContent += `    storageAccountResourceId: ${storageSafeName}_module.outputs.resourceId
`
        }
      }

      bicepContent += `  }
}
`
    })

    // Add outputs
    bicepContent += `
// ========== OUTPUTS ==========
`
    serviceInstances.forEach(item => {
      const service = item.service!
      const instanceSafeName = item.instanceId.replace(/[^a-zA-Z0-9]/g, '_')
      bicepContent += `@description('Name of ${item.instanceName}')
output ${instanceSafeName}_name string = ${instanceSafeName}_module.outputs.name

@description('Resource ID of ${item.instanceName}')
output ${instanceSafeName}_resourceId string = ${instanceSafeName}_module.outputs.resourceId

`
    })

    return bicepContent
  }

  const generateParameterFile = () => {
    const serviceInstances = getSelectedServicesData()
    const needsSqlAuth = serviceInstances.some(i => i.service!.id === 'sql-server')
    
    let parameters: any = {
      location: {
        value: "East US"
      },
      environmentName: {
        value: "dev"
      },
      applicationName: {
        value: "myapp"
      }
    }

    // Add service-specific parameters
    if (serviceInstances.some(i => i.service!.id === 'storage-account')) {
      parameters.storageSkuName = {
        value: "Standard_LRS"
      }
      parameters.allowBlobPublicAccess = {
        value: false
      }
    }

    if (serviceInstances.some(i => i.service!.id === 'app-service-plan')) {
      parameters.appServicePlanSku = {
        value: {
          name: "B1",
          tier: "Basic",
          size: "B1",
          family: "B",
          capacity: 1
        }
      }
    }

    if (serviceInstances.some(i => i.service!.id === 'virtual-network')) {
      parameters.vnetAddressPrefixes = {
        value: ["10.0.0.0/16"]
      }
      parameters.vnetSubnets = {
        value: [
          {
            name: "default",
            addressPrefix: "10.0.1.0/24"
          }
        ]
      }
    }

    if (needsSqlAuth) {
      parameters.sqlAdministratorLogin = {
        value: "sqladmin"
      }
      parameters.sqlAdministratorPassword = {
        value: "YourSecurePassword123!"
      }
    }

    return JSON.stringify({
      "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
      "contentVersion": "1.0.0.0",
      "parameters": parameters
    }, null, 2)
  }

  const handleExport = (fileType: 'bicep' | 'parameters') => {
    let content: string
    let filename: string
    let mimeType: string

    if (fileType === 'bicep') {
      content = generatedBicep || '// Generating template...'
      filename = 'main.bicep'
      mimeType = 'text/plain'
    } else {
      content = generateParameterFile()
      filename = 'main.bicepparam'
      mimeType = 'application/json'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAll = () => {
    handleExport('bicep')
    setTimeout(() => handleExport('parameters'), 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
              <div className="flex items-center space-x-2">
                <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Workload Builder</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">              
              <button 
                onClick={exportAll}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={selectedServices.length === 0}
              >
                <Download className="h-4 w-4" />
                <span>Export Templates</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select Azure Services</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Choose from {AZURE_SERVICES.length}+ Azure services. Templates will use Azure Verified Modules (AVM).
          </p>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.name}</span>
                  {category.id === 'all' && (
                    <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs">
                      {AZURE_SERVICES.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-4 h-[calc(100vh-280px)]">
          {/* Service Selection - Compact Left Panel */}
          <div className="flex-shrink-0 w-80 max-w-sm">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Service Catalog
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {filteredServices.map((service) => {
                  const Icon = service.icon
                  const instanceCount = getServiceInstanceCount(service.id)
                  
                  return (
                    <div
                      key={service.id}
                      className="p-3 rounded-lg border bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                    >
                      <div className="flex items-start space-x-2">
                        <div className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                          <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                              {service.name}
                            </h4>
                            <button
                              onClick={() => addServiceInstance(service.id)}
                              className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Add</span>
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                            {service.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              {service.category}
                            </span>
                            {instanceCount > 0 && (
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                {instanceCount} added
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {filteredServices.length === 0 && (
                  <div className="text-center py-8">
                    <Settings className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No services found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Services Summary - Dynamic Middle Panel */}
          <div className="flex-1 min-w-0 max-w-md">
            <div className="h-full flex flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Selected Instances ({selectedServices.length})
              </h3>
              
              {selectedServices.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No services selected yet
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      Choose services from the catalog
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                    {selectedServices.map((instance) => {
                      const service = AZURE_SERVICES.find(s => s.id === instance.serviceId)
                      if (!service) return null
                      const Icon = service.icon
                      return (
                        <div key={instance.instanceId} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            {editingInstance === instance.instanceId ? (
                              <input
                                type="text"
                                value={instance.instanceName}
                                onChange={(e) => updateInstanceName(instance.instanceId, e.target.value)}
                                onBlur={() => setEditingInstance(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingInstance(null)}
                                className="text-sm font-medium bg-transparent border-b border-blue-400 focus:outline-none text-gray-900 dark:text-white flex-1"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => setEditingInstance(instance.instanceId)}
                                className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 truncate flex-1"
                                title={instance.instanceName}
                              >
                                {instance.instanceName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                            <button
                              onClick={() => setEditingInstance(instance.instanceId)}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              title="Rename"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => removeServiceInstance(instance.instanceId)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              title="Remove"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Template Features:</h4>
                    <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <li>✓ AVM module references</li>
                      <li>✓ Dynamic parameters</li>
                      <li>✓ Enterprise configuration</li>
                      <li>✓ Resource naming standards</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Live Bicep Viewer - Flexible Right Panel */}
          <div className="flex-1 min-w-0">
            <div className="h-full flex flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Bicep Preview</h3>
                  {selectedServices.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleExport('bicep')}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 p-4 overflow-hidden">
                {selectedServices.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Add services to see the generated Bicep template
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                        Live preview with AVM modules
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-full">
                    <pre className="bg-gray-900 dark:bg-gray-800 text-green-400 dark:text-green-300 p-4 rounded-lg text-xs overflow-auto h-full border border-gray-700 dark:border-gray-600">
                      <code>{isGenerating ? '// Generating template...' : generatedBicep}</code>
                    </pre>
                    
                    {/* Copy to Clipboard Button */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedBicep || '// No template generated')
                        // You could add a toast notification here
                      }}
                      className="absolute top-2 right-2 p-2 bg-gray-800 dark:bg-gray-700 text-gray-300 hover:text-white rounded text-xs hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
