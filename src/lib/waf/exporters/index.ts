// ==========================================================================================
// WAF Rule Simulator - Exporters Index
// ==========================================================================================
// Centralized exports for all WAF policy exporters
// ==========================================================================================

// Azure Front Door exporter
export {
  toAFD,
  generateAFDARMTemplate,
  generateAFDBicepTemplate,
  validateAFDPolicy,
  type AFDExportOptions
} from './afd'

// Azure Application Gateway exporter
export {
  toAppGW,
  generateAppGWARMTemplate,
  generateAppGWBicepTemplate,
  validateAppGWPolicy,
  type AppGWExportOptions
} from './appgw'

// Re-export model types for convenience
export type {
  PolicyModel,
  Rule,
  Condition,
  Exclusion,
  ManagedSet,
  HttpRequest,
  EvaluationResult
} from '../model'

// ==========================================================================================
// Universal Export Functions
// ==========================================================================================

import { PolicyModel } from '../model'
import { toAFD, validateAFDPolicy, type AFDExportOptions } from './afd'
import { toAppGW, validateAppGWPolicy, type AppGWExportOptions } from './appgw'

/**
 * Export policy to appropriate Azure service format based on target
 * @param policy Internal policy model
 * @param options Export options
 * @returns Azure-specific policy JSON
 */
export function exportPolicy(
  policy: PolicyModel,
  options: AFDExportOptions | AppGWExportOptions = {}
): unknown {
  switch (policy.target) {
    case 'AFD':
      return toAFD(policy, options as AFDExportOptions)
    case 'AppGW':
      return toAppGW(policy, options as AppGWExportOptions)
    default:
      throw new Error(`Unsupported target: ${policy.target}`)
  }
}

/**
 * Validate policy for target Azure service
 * @param policy Internal policy model
 * @returns Validation result
 */
export function validatePolicy(policy: PolicyModel): { valid: boolean; errors: string[]; warnings: string[] } {
  switch (policy.target) {
    case 'AFD':
      return validateAFDPolicy(policy)
    case 'AppGW':
      return validateAppGWPolicy(policy)
    default:
      return {
        valid: false,
        errors: [`Unsupported target: ${policy.target}`],
        warnings: []
      }
  }
}

/**
 * Get supported export formats for a target
 * @param target Target service
 * @returns Available export formats
 */
export function getSupportedFormats(target: 'AFD' | 'AppGW'): string[] {
  const commonFormats = ['JSON', 'ARM Template', 'Bicep']
  
  switch (target) {
    case 'AFD':
      return [...commonFormats, 'Terraform']
    case 'AppGW':
      return [...commonFormats, 'Terraform', 'PowerShell']
    default:
      return []
  }
}

/**
 * Get export format description
 * @param format Export format
 * @returns Format description
 */
export function getFormatDescription(format: string): string {
  switch (format) {
    case 'JSON':
      return 'Raw Azure resource JSON for API calls'
    case 'ARM Template':
      return 'Azure Resource Manager template for deployment'
    case 'Bicep':
      return 'Bicep infrastructure as code template'
    case 'Terraform':
      return 'Terraform configuration for Azure provider'
    case 'PowerShell':
      return 'PowerShell script using Azure PowerShell modules'
    default:
      return 'Unknown format'
  }
}

// ==========================================================================================
// Export Type Guards
// ==========================================================================================

/**
 * Check if policy is compatible with Azure Front Door
 * @param policy Policy to check
 * @returns True if compatible
 */
export function isAFDCompatible(policy: PolicyModel): boolean {
  const validation = validateAFDPolicy(policy)
  return validation.valid
}

/**
 * Check if policy is compatible with Azure Application Gateway
 * @param policy Policy to check
 * @returns True if compatible
 */
export function isAppGWCompatible(policy: PolicyModel): boolean {
  const validation = validateAppGWPolicy(policy)
  return validation.valid
}

/**
 * Get all export compatibility issues for a policy
 * @param policy Policy to check
 * @returns Compatibility report
 */
export function getCompatibilityReport(policy: PolicyModel): {
  afd: { compatible: boolean; issues: string[] }
  appgw: { compatible: boolean; issues: string[] }
} {
  const afdValidation = validateAFDPolicy(policy)
  const appgwValidation = validateAppGWPolicy(policy)
  
  return {
    afd: {
      compatible: afdValidation.valid,
      issues: [...afdValidation.errors, ...afdValidation.warnings]
    },
    appgw: {
      compatible: appgwValidation.valid,
      issues: [...appgwValidation.errors, ...appgwValidation.warnings]
    }
  }
}
