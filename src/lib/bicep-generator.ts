// Bicep parameter file generator for landing zones

export interface LandingZoneRequest {
  templateType: string;
  landingZoneName: string;
  description?: string;
  azureRegion: string;
  environment: string;
  managementGroupId: string;
  subscriptionId: string;
  costCenter: string;
  owner: string;
  tags?: Record<string, string>;
  requestedBy?: string;
  requestedDate?: string;
}

export class BicepGenerator {
  /**
   * Generate a .bicepparam file based on the landing zone request
   */
  static generateBicepParam(request: LandingZoneRequest): string {
    const {
      templateType,
      landingZoneName,
      description,
      azureRegion,
      environment,
      managementGroupId,
      subscriptionId,
      costCenter,
      owner,
      tags,
      requestedBy,
      requestedDate,
    } = request;

    // Determine the template path based on type
    const templatePath = this.getTemplatePath(templateType);

    // Build the tags object
    const allTags = {
      Environment: environment,
      CostCenter: costCenter,
      Owner: owner,
      ManagedBy: 'LandingZoneVendingMachine',
      RequestedBy: requestedBy || 'unknown',
      RequestedDate: requestedDate || new Date().toISOString(),
      ...tags,
    };

    // Generate the bicepparam content
    return `// Landing Zone: ${landingZoneName}
// Template Type: ${templateType}
// Generated: ${new Date().toISOString()}
// Requested by: ${requestedBy}
${description ? `// Description: ${description}` : ''}

using '../${templatePath}/main.bicep'

// Basic Configuration
param landingZoneName = '${landingZoneName}'
param location = '${azureRegion}'
param environment = '${environment}'

// Organizational Structure
param managementGroupId = '${managementGroupId}'
param subscriptionId = '${subscriptionId}'

// Governance
param tags = ${JSON.stringify(allTags, null, 2)}

${this.getTemplateSpecificParams(templateType, request)}
`;
  }

  /**
   * Get the Bicep template path based on landing zone type
   */
  private static getTemplatePath(templateType: string): string {
    const templatePaths: Record<string, string> = {
      alz: 'templates/landing-zones',
      'subscription-vending': 'templates/landing-zones',
      workload: 'templates/landing-zones',
    };

    return templatePaths[templateType] || 'templates/landing-zones';
  }

  /**
   * Get template-specific parameters
   */
  private static getTemplateSpecificParams(
    templateType: string,
    request: LandingZoneRequest
  ): string {
    switch (templateType) {
      case 'alz':
        return this.getALZParams(request);
      case 'subscription-vending':
        return this.getSubscriptionVendingParams(request);
      case 'workload':
        return this.getWorkloadParams(request);
      default:
        return '';
    }
  }

  /**
   * Azure Landing Zones specific parameters
   */
  private static getALZParams(request: LandingZoneRequest): string {
    return `// Azure Landing Zone Configuration
param enableHub = true
param enableSpoke = true
param enableMonitoring = true
param enableSecurity = true

// Network Configuration
param hubVnetAddressPrefix = '10.0.0.0/16'
param spokeVnetAddressPrefix = '10.1.0.0/16'
param enableAzureFirewall = ${request.environment === 'prod'}
param enableVpnGateway = false
param enableExpressRoute = false

// Security and Compliance
param enableDefender = ${request.environment === 'prod'}
param enableSentinel = ${request.environment === 'prod'}
param enablePolicy = true

// Monitoring
param logRetentionDays = ${request.environment === 'prod' ? 90 : 30}
`;
  }

  /**
   * Subscription Vending specific parameters
   */
  private static getSubscriptionVendingParams(request: LandingZoneRequest): string {
    return `// Subscription Vending Configuration
param subscriptionAlias = '${request.landingZoneName}-sub'
param billingAccount = '\${BILLING_ACCOUNT_ID}'
param subscriptionWorkload = '${request.environment === 'prod' ? 'Production' : 'DevTest'}'

// Resource Group Configuration
param resourceGroups = [
  {
    name: 'rg-${request.landingZoneName}-${request.environment}-networking'
    location: '${request.azureRegion}'
  }
  {
    name: 'rg-${request.landingZoneName}-${request.environment}-compute'
    location: '${request.azureRegion}'
  }
  {
    name: 'rg-${request.landingZoneName}-${request.environment}-data'
    location: '${request.azureRegion}'
  }
]

// RBAC Configuration
param roleAssignments = []
`;
  }

  /**
   * Workload Landing Zone specific parameters
   */
  private static getWorkloadParams(request: LandingZoneRequest): string {
    return `// Workload Landing Zone Configuration
param workloadName = '${request.landingZoneName}'

// Network Configuration
param vnetAddressPrefix = '10.2.0.0/16'
param subnets = [
  {
    name: 'snet-app'
    addressPrefix: '10.2.1.0/24'
  }
  {
    name: 'snet-data'
    addressPrefix: '10.2.2.0/24'
  }
  {
    name: 'snet-services'
    addressPrefix: '10.2.3.0/24'
  }
]

// Connectivity
param enablePrivateEndpoints = ${request.environment !== 'dev'}
param enableServiceEndpoints = true

// Compute
param enableAppService = true
param enableFunctions = true
param enableContainerApps = false

// Data
param enableSqlDatabase = false
param enableCosmosDb = false
param enableStorage = true

// Monitoring
param enableApplicationInsights = true
param enableLogAnalytics = true
`;
  }

  /**
   * Generate a filename for the bicep param file
   */
  static generateFileName(request: LandingZoneRequest): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${request.landingZoneName}-${request.environment}-${timestamp}.bicepparam`;
  }

  /**
   * Validate the bicep param content (basic validation)
   */
  static validate(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!content.includes('using')) {
      errors.push('Missing "using" directive');
    }

    if (!content.includes('param landingZoneName')) {
      errors.push('Missing required parameter: landingZoneName');
    }

    if (!content.includes('param location')) {
      errors.push('Missing required parameter: location');
    }

    if (!content.includes('param environment')) {
      errors.push('Missing required parameter: environment');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
