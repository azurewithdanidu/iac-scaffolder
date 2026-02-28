// Input validation utility for landing zone requests

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class LandingZoneValidator {
  /**
   * Validate landing zone name
   */
  static validateLandingZoneName(name: string): ValidationResult {
    const errors: string[] = [];

    if (!name || name.trim() === '') {
      errors.push('Landing zone name is required');
    } else {
      if (name.length < 3) {
        errors.push('Landing zone name must be at least 3 characters');
      }
      if (name.length > 63) {
        errors.push('Landing zone name must be less than 63 characters');
      }
      if (!/^[a-z0-9-]+$/.test(name)) {
        errors.push(
          'Landing zone name must contain only lowercase letters, numbers, and hyphens'
        );
      }
      if (name.startsWith('-') || name.endsWith('-')) {
        errors.push('Landing zone name cannot start or end with a hyphen');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate subscription ID (GUID format)
   */
  static validateSubscriptionId(subscriptionId: string): ValidationResult {
    const errors: string[] = [];
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!subscriptionId || subscriptionId.trim() === '') {
      errors.push('Subscription ID is required');
    } else if (!guidRegex.test(subscriptionId)) {
      errors.push('Invalid subscription ID format (expected GUID)');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

    if (!email || email.trim() === '') {
      errors.push('Email is required');
    } else if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate Azure region
   */
  static validateAzureRegion(region: string): ValidationResult {
    const errors: string[] = [];
    const validRegions = [
      'eastus',
      'eastus2',
      'westus',
      'westus2',
      'westus3',
      'centralus',
      'northcentralus',
      'southcentralus',
      'northeurope',
      'westeurope',
      'uksouth',
      'ukwest',
      'francecentral',
      'germanywestcentral',
      'swedencentral',
      'southeastasia',
      'eastasia',
      'australiaeast',
      'australiasoutheast',
      'japaneast',
      'japanwest',
      'koreacentral',
      'canadacentral',
      'canadaeast',
      'brazilsouth',
      'southafricanorth',
      'uaenorth',
      'switzerlandnorth',
      'norwayeast',
    ];

    if (!region || region.trim() === '') {
      errors.push('Azure region is required');
    } else if (!validRegions.includes(region.toLowerCase())) {
      errors.push(`Invalid Azure region. Please select from the dropdown.`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate complete landing zone request
   */
  static validateRequest(request: any): ValidationResult {
    const allErrors: string[] = [];

    // Validate landing zone name
    const nameValidation = this.validateLandingZoneName(request.landingZoneName);
    allErrors.push(...nameValidation.errors);

    // Validate subscription ID
    const subValidation = this.validateSubscriptionId(request.subscriptionId);
    allErrors.push(...subValidation.errors);

    // Validate owner email
    const emailValidation = this.validateEmail(request.owner);
    allErrors.push(...emailValidation.errors);

    // Validate region
    const regionValidation = this.validateAzureRegion(request.azureRegion);
    allErrors.push(...regionValidation.errors);

    // Required fields
    const requiredFields = [
      'templateType',
      'environment',
      'managementGroupId',
      'costCenter',
    ];

    requiredFields.forEach((field) => {
      if (!request[field] || request[field].toString().trim() === '') {
        allErrors.push(`${field} is required`);
      }
    });

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}
