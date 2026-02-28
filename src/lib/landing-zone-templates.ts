// Template service for managing landing zone templates

export interface LandingZoneTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  parameters: string[];
  estimatedDeploymentTime: string;
}

export class TemplateService {
  /**
   * Get all available landing zone templates
   */
  static getTemplates(): LandingZoneTemplate[] {
    return [
      {
        id: 'alz',
        name: 'Azure Landing Zones (ALZ)',
        description:
          'Complete enterprise-scale landing zone with hub-spoke network, security, monitoring, and governance. Best for large organizations.',
        icon: '🏢',
        parameters: [
          'landingZoneName',
          'location',
          'environment',
          'managementGroupId',
          'subscriptionId',
          'hubVnetAddressPrefix',
          'spokeVnetAddressPrefix',
          'enableAzureFirewall',
          'enableDefender',
          'enableSentinel',
        ],
        estimatedDeploymentTime: '30-45 minutes',
      },
      {
        id: 'subscription-vending',
        name: 'Subscription Vending',
        description:
          'Automated subscription provisioning with standard resource groups, RBAC, and policy assignments. Ideal for new subscription onboarding.',
        icon: '📦',
        parameters: [
          'landingZoneName',
          'subscriptionAlias',
          'billingAccount',
          'managementGroupId',
          'resourceGroups',
          'roleAssignments',
          'policyAssignments',
        ],
        estimatedDeploymentTime: '10-15 minutes',
      },
      {
        id: 'workload',
        name: 'Workload Landing Zone',
        description:
          'Application-specific landing zone with networking, compute, data, and monitoring. Perfect for individual workloads or projects.',
        icon: '⚙️',
        parameters: [
          'workloadName',
          'location',
          'environment',
          'vnetAddressPrefix',
          'subnets',
          'enablePrivateEndpoints',
          'enableAppService',
          'enableFunctions',
          'enableStorage',
        ],
        estimatedDeploymentTime: '15-20 minutes',
      },
    ];
  }

  /**
   * Get a specific template by ID
   */
  static getTemplateById(id: string): LandingZoneTemplate | undefined {
    return this.getTemplates().find((template) => template.id === id);
  }

  /**
   * Validate template type
   */
  static isValidTemplateType(type: string): boolean {
    return this.getTemplates().some((template) => template.id === type);
  }
}
