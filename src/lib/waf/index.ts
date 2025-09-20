// ==========================================================================================
// WAF Rule Simulator - Main Library Index
// ==========================================================================================
// Centralized exports for the complete WAF Rule Simulator library
// ==========================================================================================

// Core data models
export type {
  PolicyModel,
  Rule,
  Condition,
  Exclusion,
  ManagedSet,
  HttpRequest,
  EvaluationResult,
  TestPack,
  TestCase,
  ExportConfig
} from './model'

// Evaluation engine
export {
  evaluateRequest,
  validatePolicy,
  createSamplePolicy,
  createSampleRequest
} from './engine'

// Export functionality
export {
  exportPolicy,
  validatePolicy as validateExportPolicy,
  getSupportedFormats,
  getFormatDescription,
  isAFDCompatible,
  isAppGWCompatible,
  getCompatibilityReport,
  toAFD,
  toAppGW,
  generateAFDARMTemplate,
  generateAFDBicepTemplate,
  generateAppGWARMTemplate,
  generateAppGWBicepTemplate,
  validateAFDPolicy,
  validateAppGWPolicy,
  type AFDExportOptions,
  type AppGWExportOptions
} from './exporters'

// ==========================================================================================
// Library Metadata
// ==========================================================================================

export const WAF_SIMULATOR_VERSION = '1.0.0'
export const SUPPORTED_TARGETS = ['AFD', 'AppGW'] as const
export const SUPPORTED_FORMATS = ['JSON', 'ARM Template', 'Bicep', 'Terraform', 'PowerShell'] as const

// ==========================================================================================
// Quick Start Functions
// ==========================================================================================

import { PolicyModel, HttpRequest } from './model'
import { evaluateRequest, createSamplePolicy, createSampleRequest } from './engine'
import { 
  exportPolicy, 
  generateAFDARMTemplate, 
  generateAppGWARMTemplate, 
  generateAFDBicepTemplate, 
  generateAppGWBicepTemplate 
} from './exporters'

/**
 * Quick start: Create a new policy
 * @param name Policy name
 * @param target Target service (AFD or AppGW)
 * @param mode Policy mode (Prevention or Detection)
 * @returns New policy model
 */
export function createPolicy(
  name: string,
  target: 'AFD' | 'AppGW' = 'AFD',
  mode: 'Prevention' | 'Detection' = 'Prevention'
): PolicyModel {
  return {
    name,
    target,
    mode,
    rules: [],
    exclusions: [],
    managedSets: [],
    metadata: {
      author: 'WAF Rule Simulator',
      created: new Date().toISOString(),
      description: `WAF policy for ${name}`
    }
  }
}

/**
 * Quick start: Test a request against a policy
 * @param policy WAF policy to test
 * @param request HTTP request to test
 * @returns Evaluation result
 */
export function testRequest(policy: PolicyModel, request: HttpRequest) {
  return evaluateRequest(policy, request)
}

/**
 * Quick start: Export policy to Azure format
 * @param policy Policy to export
 * @param format Export format
 * @returns Exported policy
 */
export function quickExport(policy: PolicyModel, format: 'JSON' | 'ARM' | 'Bicep' = 'JSON') {
  switch (format) {
    case 'JSON':
      return exportPolicy(policy)
    case 'ARM':
      if (policy.target === 'AFD') {
        return generateAFDARMTemplate(policy)
      } else {
        return generateAppGWARMTemplate(policy)
      }
    case 'Bicep':
      if (policy.target === 'AFD') {
        return generateAFDBicepTemplate(policy)
      } else {
        return generateAppGWBicepTemplate(policy)
      }
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

/**
 * Quick start: Get sample data for testing
 * @param target Target service
 * @returns Sample policy and request
 */
export function getSamples(target: 'AFD' | 'AppGW' = 'AFD') {
  // Create a sample policy with the specified target
  const samplePolicy = createSamplePolicy()
  samplePolicy.target = target // Override the target
  
  return {
    policy: samplePolicy,
    request: createSampleRequest()
  }
}

// ==========================================================================================
// Utility Functions
// ==========================================================================================

/**
 * Get library information
 * @returns Library metadata
 */
export function getLibraryInfo() {
  return {
    name: 'WAF Rule Simulator',
    version: WAF_SIMULATOR_VERSION,
    description: 'Browser-based WAF policy testing and documentation tool',
    targets: SUPPORTED_TARGETS,
    formats: SUPPORTED_FORMATS,
    features: [
      'Visual policy designer',
      'Request simulator with cURL import',
      'Azure export (AFD & AppGW)',
      'Test pack management',
      'Policy validation',
      'ARM/Bicep template generation'
    ]
  }
}

/**
 * Get target service capabilities
 * @param target Target service
 * @returns Service capabilities
 */
export function getTargetCapabilities(target: 'AFD' | 'AppGW') {
  const common = {
    customRules: true,
    managedRules: true,
    exclusions: true,
    rateLimit: true,
    geoBlocking: true
  }

  switch (target) {
    case 'AFD':
      return {
        ...common,
        maxCustomRules: 100,
        priorityRange: [1, 100],
        actions: ['Allow', 'Block', 'Log', 'Redirect'],
        matchVariables: ['RemoteAddr', 'RequestMethod', 'QueryString', 'PostArgs', 'RequestUri', 'RequestHeader', 'RequestBody', 'Cookies'],
        operators: ['Any', 'IPMatch', 'GeoMatch', 'Equal', 'Contains', 'LessThan', 'GreaterThan', 'BeginsWith', 'EndsWith', 'RegEx'],
        transforms: ['Lowercase', 'Uppercase', 'Trim', 'UrlDecode', 'UrlEncode', 'RemoveNulls', 'HtmlEntityDecode']
      }
    case 'AppGW':
      return {
        ...common,
        maxCustomRules: 100,
        priorityRange: [1, 100],
        actions: ['Allow', 'Block', 'Log'], // No Redirect for custom rules
        matchVariables: ['RemoteAddr', 'RequestMethod', 'QueryString', 'PostArgs', 'RequestUri', 'RequestHeaders', 'RequestBody', 'RequestCookies'],
        operators: ['Any', 'IPMatch', 'GeoMatch', 'Equal', 'Contains', 'LessThan', 'GreaterThan', 'BeginsWith', 'EndsWith', 'Regex', 'Size'],
        transforms: ['Lowercase', 'Uppercase', 'Trim', 'UrlDecode', 'UrlEncode', 'RemoveNulls', 'HtmlEntityDecode', 'CompressWhiteSpace'],
        requestBodyInspection: true,
        logScrubbing: true
      }
    default:
      return common
  }
}
