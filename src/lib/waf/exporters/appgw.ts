// ==========================================================================================
// WAF Rule Simulator - Azure Application Gateway Exporter
// ==========================================================================================
// Converts internal PolicyModel to Azure Application Gateway WAF policy JSON format
// Based on Azure Application Gateway WAF policy v2 schema
// ==========================================================================================

import { PolicyModel, Rule, Condition, Exclusion, ManagedSet } from '../model'

// ==========================================================================================
// Azure Application Gateway Types
// ==========================================================================================

interface AppGWWAFPolicy {
  type: 'Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies'
  apiVersion: string
  name: string
  location: string
  properties: AppGWPolicyProperties
}

interface AppGWPolicyProperties {
  policySettings: AppGWPolicySettings
  customRules?: AppGWCustomRule[]
  managedRules: AppGWManagedRules
}

interface AppGWPolicySettings {
  state: 'Enabled' | 'Disabled'
  mode: 'Prevention' | 'Detection'
  requestBodyCheck?: boolean
  maxRequestBodySizeInKb?: number
  fileUploadLimitInMb?: number
  requestBodyInspectLimitInKB?: number
  requestBodyEnforcement?: boolean
  logScrubbing?: AppGWLogScrubbing
}

interface AppGWLogScrubbing {
  state: 'Enabled' | 'Disabled'
  scrubbingRules?: AppGWScrubbingRule[]
}

interface AppGWScrubbingRule {
  matchVariable: AppGWMatchVariable
  selectorMatchOperator: 'Equals' | 'EqualsAny'
  selector?: string
  state: 'Enabled' | 'Disabled'
}

interface AppGWCustomRule {
  name: string
  priority: number
  state?: 'Enabled' | 'Disabled'
  ruleType: 'MatchRule' | 'RateLimitRule'
  rateLimitDuration?: 'OneMin' | 'FiveMin'
  rateLimitThreshold?: number
  matchConditions: AppGWMatchCondition[]
  groupByUserSession?: AppGWGroupByUserSession[]
  action: 'Allow' | 'Block' | 'Log'
}

interface AppGWGroupByUserSession {
  groupByVariables: AppGWGroupByVariable[]
}

interface AppGWGroupByVariable {
  variableName: 'ClientAddr' | 'GeoLocation' | 'None'
}

interface AppGWMatchCondition {
  matchVariables: AppGWMatchVariable[]
  operator: AppGWOperator
  negationCondition?: boolean
  matchValues: string[]
  transforms?: AppGWTransform[]
}

interface AppGWMatchVariable {
  variableName: AppGWVariableName
  selector?: string
}

type AppGWVariableName = 
  | 'RemoteAddr' | 'RequestMethod' | 'QueryString' | 'PostArgs' 
  | 'RequestUri' | 'RequestHeaders' | 'RequestBody' | 'RequestCookies'

type AppGWOperator = 
  | 'Any' | 'IPMatch' | 'GeoMatch' | 'Equal' | 'Contains' 
  | 'LessThan' | 'GreaterThan' | 'LessThanOrEqual' | 'GreaterThanOrEqual' 
  | 'BeginsWith' | 'EndsWith' | 'Regex' | 'Size'

type AppGWTransform = 
  | 'Lowercase' | 'Uppercase' | 'Trim' | 'UrlDecode' | 'UrlEncode' 
  | 'RemoveNulls' | 'HtmlEntityDecode' | 'CompressWhiteSpace'

interface AppGWManagedRules {
  managedRuleSets: AppGWManagedRuleSet[]
  exclusions?: AppGWManagedRuleExclusion[]
}

interface AppGWManagedRuleSet {
  ruleSetType: string
  ruleSetVersion: string
  ruleGroupOverrides?: AppGWRuleGroupOverride[]
}

interface AppGWRuleGroupOverride {
  ruleGroupName: string
  rules?: AppGWManagedRuleOverride[]
}

interface AppGWManagedRuleOverride {
  ruleId: string
  state?: 'Enabled' | 'Disabled'
  action?: 'Allow' | 'Block' | 'Log' | 'AnomalyScoring'
}

interface AppGWManagedRuleExclusion {
  matchVariable: AppGWVariableName
  selectorMatchOperator: 'Equals' | 'Contains' | 'StartsWith' | 'EndsWith' | 'EqualsAny'
  selector: string
  exclusionManagedRuleSets?: AppGWExclusionManagedRuleSet[]
}

interface AppGWExclusionManagedRuleSet {
  ruleSetType: string
  ruleSetVersion: string
  ruleGroups?: AppGWExclusionRuleGroup[]
}

interface AppGWExclusionRuleGroup {
  ruleGroupName: string
  rules?: AppGWExclusionRule[]
}

interface AppGWExclusionRule {
  ruleId: string
}

// ==========================================================================================
// Export Function
// ==========================================================================================

/**
 * Convert internal PolicyModel to Azure Application Gateway WAF policy JSON
 * @param policy Internal policy model
 * @param options Export options
 * @returns Azure Application Gateway WAF policy JSON
 */
export function toAppGW(
  policy: PolicyModel, 
  options: AppGWExportOptions = {}
): AppGWWAFPolicy {
  if (policy.target !== 'AppGW') {
    throw new Error('Policy target must be AppGW for Azure Application Gateway export')
  }

  const {
    apiVersion = '2023-02-01',
    location = 'East US',
    resourceName = policy.name
  } = options

  return {
    type: 'Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies',
    apiVersion,
    name: resourceName,
    location,
    properties: {
      policySettings: mapPolicySettings(policy),
      customRules: policy.rules && policy.rules.length > 0 ? mapCustomRules(policy.rules) : undefined,
      managedRules: mapManagedRules(policy.managedSets || [], policy.exclusions)
    }
  }
}

/**
 * Export options for Application Gateway
 */
export interface AppGWExportOptions {
  /** API version for the resource */
  apiVersion?: string
  /** Azure location */
  location?: string
  /** Resource name (defaults to policy name) */
  resourceName?: string
  /** Enable request body inspection */
  enableRequestBodyCheck?: boolean
  /** Max request body size in KB */
  maxRequestBodySizeInKb?: number
  /** Include log scrubbing configuration */
  includeLogScrubbing?: boolean
}

// ==========================================================================================
// Mapping Functions
// ==========================================================================================

/**
 * Map policy settings to Application Gateway format
 */
function mapPolicySettings(policy: PolicyModel): AppGWPolicySettings {
  return {
    state: 'Enabled',
    mode: policy.mode,
    requestBodyCheck: true,
    maxRequestBodySizeInKb: 128,
    fileUploadLimitInMb: 100,
    requestBodyInspectLimitInKB: 128,
    requestBodyEnforcement: true
  }
}

/**
 * Map custom rules to Application Gateway format
 */
function mapCustomRules(rules: Rule[]): AppGWCustomRule[] {
  return rules
    .filter(rule => !rule.disabled)
    .map(rule => mapCustomRule(rule))
}

/**
 * Map a single custom rule to Application Gateway format
 */
function mapCustomRule(rule: Rule): AppGWCustomRule {
  const matchConditions = rule.when.map(condition => mapMatchCondition(condition))
  
  const appGWRule: AppGWCustomRule = {
    name: rule.id,
    priority: rule.order,
    state: rule.disabled ? 'Disabled' : 'Enabled',
    ruleType: rule.type === 'rate' ? 'RateLimitRule' : 'MatchRule',
    matchConditions,
    action: mapAction(rule.action)
  }

  // Add rate limit specific fields
  if (rule.type === 'rate') {
    appGWRule.rateLimitDuration = 'OneMin' // Default to 1 minute
    appGWRule.rateLimitThreshold = 100 // Default threshold
    
    // Try to extract threshold from conditions
    const thresholdCondition = rule.when.find(c => c.field === 'rate' && c.op === 'gt')
    if (thresholdCondition && typeof thresholdCondition.value === 'number') {
      appGWRule.rateLimitThreshold = thresholdCondition.value
    }
  }

  return appGWRule
}

/**
 * Map condition to Application Gateway match condition
 */
function mapMatchCondition(condition: Condition): AppGWMatchCondition {
  const matchVariables = [mapMatchVariable(condition.field, condition.key)]
  const operator = mapOperator(condition.op)
  const matchValues = Array.isArray(condition.value) 
    ? condition.value.map(v => v.toString())
    : condition.value !== undefined 
    ? [condition.value.toString()]
    : ['']

  const appGWCondition: AppGWMatchCondition = {
    matchVariables,
    operator,
    matchValues,
    negationCondition: condition.negate || false
  }

  // Map transforms
  if (condition.transform && condition.transform.length > 0) {
    appGWCondition.transforms = condition.transform
      .map(mapTransform)
      .filter((t): t is AppGWTransform => t !== null)
  }

  return appGWCondition
}

/**
 * Map internal field to Application Gateway match variable
 */
function mapMatchVariable(field: string, key?: string): AppGWMatchVariable {
  const matchVariable: AppGWMatchVariable = {
    variableName: getVariableName(field)
  }

  // Add selector for fields that need it
  if (key && needsSelector(field)) {
    matchVariable.selector = key
  }

  return matchVariable
}

/**
 * Get variable name for Application Gateway
 */
function getVariableName(field: string): AppGWVariableName {
  switch (field) {
    case 'ip':
      return 'RemoteAddr'
    case 'method':
      return 'RequestMethod'
    case 'query':
      return 'QueryString'
    case 'path':
      return 'RequestUri'
    case 'header':
      return 'RequestHeaders'
    case 'body':
      return 'RequestBody'
    case 'cookie':
      return 'RequestCookies'
    case 'ua':
      return 'RequestHeaders' // User-Agent is a header
    default:
      return 'RequestUri' // Default fallback
  }
}

/**
 * Check if field needs a selector
 */
function needsSelector(field: string): boolean {
  return ['query', 'header', 'cookie'].includes(field)
}

/**
 * Map internal operator to Application Gateway operator
 */
function mapOperator(operator: string): AppGWOperator {
  switch (operator) {
    case 'equals':
      return 'Equal'
    case 'contains':
      return 'Contains'
    case 'startsWith':
      return 'BeginsWith'
    case 'endsWith':
      return 'EndsWith'
    case 'regex':
      return 'Regex'
    case 'gt':
      return 'GreaterThan'
    case 'lt':
      return 'LessThan'
    case 'in':
      return 'Equal' // Use Equal for 'in' with array values
    case 'wildcard':
      return 'Regex' // Convert wildcards to regex
    default:
      return 'Equal'
  }
}

/**
 * Map internal action to Application Gateway action
 */
function mapAction(action: string): 'Allow' | 'Block' | 'Log' {
  switch (action) {
    case 'Allow':
      return 'Allow'
    case 'Block':
      return 'Block'
    case 'Log':
      return 'Log'
    default:
      return 'Block' // Safe default (AppGW doesn't support Redirect in custom rules)
  }
}

/**
 * Map internal transform to Application Gateway transform
 */
function mapTransform(transform: string): AppGWTransform | null {
  switch (transform) {
    case 'lowercase':
      return 'Lowercase'
    case 'uppercase':
      return 'Uppercase'
    case 'trim':
      return 'Trim'
    case 'urldecode':
      return 'UrlDecode'
    case 'htmldecode':
      return 'HtmlEntityDecode'
    case 'removenulls':
      return 'RemoveNulls'
    case 'compresswhitespace':
      return 'CompressWhiteSpace'
    default:
      return null // Unsupported transform
  }
}

/**
 * Map managed rule sets to Application Gateway format
 */
function mapManagedRules(managedSets: ManagedSet[], globalExclusions?: Exclusion[]): AppGWManagedRules {
  // If no managed sets provided, use default OWASP Core Rule Set
  const ruleSets = managedSets.length > 0 
    ? managedSets.map(mapManagedRuleSet)
    : [getDefaultOWASPRuleSet()]
  
  const appGWManagedRules: AppGWManagedRules = {
    managedRuleSets: ruleSets
  }

  // Add global exclusions if any
  if (globalExclusions && globalExclusions.length > 0) {
    appGWManagedRules.exclusions = globalExclusions.map(mapExclusion)
  }

  return appGWManagedRules
}

/**
 * Get default OWASP rule set for Application Gateway
 */
function getDefaultOWASPRuleSet(): AppGWManagedRuleSet {
  return {
    ruleSetType: 'OWASP',
    ruleSetVersion: '3.2'
  }
}

/**
 * Map managed rule set to Application Gateway format
 */
function mapManagedRuleSet(managedSet: ManagedSet): AppGWManagedRuleSet {
  // Map common rule set names
  let ruleSetType = managedSet.name
  let ruleSetVersion = managedSet.version || '3.2'

  if (managedSet.name.startsWith('OWASP') || managedSet.name.includes('Core')) {
    ruleSetType = 'OWASP'
    ruleSetVersion = '3.2' // Current version
  } else if (managedSet.name.includes('Microsoft') || managedSet.name.includes('Bot')) {
    ruleSetType = 'Microsoft_BotManagerRuleSet'
    ruleSetVersion = '1.0'
  }

  const appGWManagedRuleSet: AppGWManagedRuleSet = {
    ruleSetType,
    ruleSetVersion
  }

  // Add rule group overrides based on categories
  if (managedSet.categories && managedSet.categories.length > 0) {
    appGWManagedRuleSet.ruleGroupOverrides = managedSet.categories.map(category => ({
      ruleGroupName: mapCategoryToRuleGroup(category)
    }))
  }

  return appGWManagedRuleSet
}

/**
 * Map category to Application Gateway rule group name
 */
function mapCategoryToRuleGroup(category: string): string {
  switch (category.toUpperCase()) {
    case 'SQLI':
      return 'REQUEST-942-APPLICATION-ATTACK-SQLI'
    case 'XSS':
      return 'REQUEST-941-APPLICATION-ATTACK-XSS'
    case 'LFI':
      return 'REQUEST-930-APPLICATION-ATTACK-LFI'
    case 'RFI':
      return 'REQUEST-931-APPLICATION-ATTACK-RFI'
    case 'RCE':
      return 'REQUEST-932-APPLICATION-ATTACK-RCE'
    case 'PROTOCOL':
      return 'REQUEST-920-PROTOCOL-ENFORCEMENT'
    case 'JAVA':
      return 'REQUEST-944-APPLICATION-ATTACK-JAVA'
    case 'NODEJS':
      return 'REQUEST-934-APPLICATION-ATTACK-NODEJS'
    case 'PHP':
      return 'REQUEST-933-APPLICATION-ATTACK-PHP'
    case 'SCANNER':
      return 'REQUEST-913-SCANNER-DETECTION'
    case 'SESSION':
      return 'REQUEST-943-APPLICATION-ATTACK-SESSION-FIXATION'
    default:
      return category
  }
}

/**
 * Map exclusion to Application Gateway format
 */
function mapExclusion(exclusion: Exclusion): AppGWManagedRuleExclusion {
  return {
    matchVariable: getVariableName(exclusion.location),
    selectorMatchOperator: mapExclusionOperator(exclusion.op),
    selector: exclusion.key
  }
}

/**
 * Map exclusion operator to Application Gateway format
 */
function mapExclusionOperator(operator: string): 'Equals' | 'Contains' | 'StartsWith' | 'EndsWith' | 'EqualsAny' {
  switch (operator) {
    case 'equals':
      return 'Equals'
    case 'contains':
      return 'Contains'
    case 'startsWith':
      return 'StartsWith'
    case 'endsWith':
      return 'EndsWith'
    case 'regex':
      return 'Contains' // AppGW doesn't support regex in exclusions, use contains as fallback
    default:
      return 'Equals'
  }
}

// ==========================================================================================
// Utility Functions
// ==========================================================================================

/**
 * Generate ARM template for Application Gateway WAF policy
 * @param policy Internal policy model
 * @param options Export options
 * @returns Complete ARM template
 */
export function generateAppGWARMTemplate(
  policy: PolicyModel, 
  options: AppGWExportOptions & { includeParameters?: boolean } = {}
): { [key: string]: unknown } {
  const appGWPolicy = toAppGW(policy, options)
  
  const template: { [key: string]: unknown } = {
    '$schema': 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
    contentVersion: '1.0.0.0',
    metadata: {
      description: `WAF policy for ${policy.name}`,
      author: 'WAF Rule Simulator'
    }
  }

  if (options.includeParameters) {
    template.parameters = {
      policyName: {
        type: 'string',
        defaultValue: policy.name,
        metadata: {
          description: 'Name of the WAF policy'
        }
      },
      location: {
        type: 'string',
        defaultValue: options.location || 'East US',
        metadata: {
          description: 'Location for the WAF policy'
        }
      },
      maxRequestBodySizeInKb: {
        type: 'int',
        defaultValue: 128,
        minValue: 8,
        maxValue: 2000,
        metadata: {
          description: 'Maximum request body size in KB'
        }
      }
    }
    
    // Update resource to use parameters
    appGWPolicy.name = '[parameters(\'policyName\')]'
    appGWPolicy.location = '[parameters(\'location\')]'
    if (appGWPolicy.properties.policySettings) {
      // Use explicit type assertion for ARM template parameter references  
      (appGWPolicy.properties.policySettings as unknown as Record<string, unknown>).maxRequestBodySizeInKb = '[parameters(\'maxRequestBodySizeInKb\')]'
    }
  }

  template.resources = [appGWPolicy]
  
  template.outputs = {
    policyId: {
      type: 'string',
      value: `[resourceId('Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies', '${policy.name}')]`
    },
    policyName: {
      type: 'string',
      value: `[reference(resourceId('Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies', '${policy.name}')).name]`
    }
  }

  return template
}

/**
 * Generate Bicep template for Application Gateway WAF policy
 * @param policy Internal policy model
 * @param options Export options
 * @returns Bicep template content
 */
export function generateAppGWBicepTemplate(
  policy: PolicyModel, 
  options: AppGWExportOptions = {}
): string {
  const appGWPolicy = toAppGW(policy, options)
  
  const bicepContent = `// Azure Application Gateway WAF Policy
// Generated by WAF Rule Simulator

param policyName string = '${policy.name}'
param location string = '${options.location || 'East US'}'
param maxRequestBodySizeInKb int = ${options.maxRequestBodySizeInKb || 128}

resource wafPolicy 'Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies@${options.apiVersion || '2023-02-01'}' = {
  name: policyName
  location: location
  properties: ${JSON.stringify(appGWPolicy.properties, null, 2).replace(/"/g, "'")}
}

output policyId string = wafPolicy.id
output policyName string = wafPolicy.name
`

  return bicepContent
}

// ==========================================================================================
// Validation Functions
// ==========================================================================================

/**
 * Validate Application Gateway policy for Azure-specific constraints
 * @param policy Internal policy model
 * @returns Validation result
 */
export function validateAppGWPolicy(policy: PolicyModel): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // Application Gateway-specific validations
  if (policy.target !== 'AppGW') {
    errors.push('Policy target must be AppGW for Azure Application Gateway')
  }

  // Check rule limits (Application Gateway allows up to 100 custom rules)
  if (policy.rules && policy.rules.length > 100) {
    errors.push('Azure Application Gateway supports maximum 100 custom rules')
  }

  // Check priority ranges (1-100 for custom rules)
  const invalidPriorities = policy.rules?.filter(r => r.order < 1 || r.order > 100) || []
  if (invalidPriorities.length > 0) {
    errors.push(`Rule priorities must be between 1-100. Invalid: ${invalidPriorities.map(r => r.id).join(', ')}`)
  }

  // Check for unsupported operators
  policy.rules?.forEach(rule => {
    rule.when.forEach(condition => {
      if (condition.op === 'wildcard') {
        warnings.push(`Rule ${rule.id}: Wildcard operator will be converted to regex`)
      }
    })
  })

  // Check managed rule set names
  policy.managedSets?.forEach(managedSet => {
    if (!managedSet.name.includes('OWASP') && !managedSet.name.includes('Microsoft')) {
      warnings.push(`Managed rule set '${managedSet.name}' may not be supported by Azure Application Gateway`)
    }
  })

  // Check for redirect actions (not supported in custom rules)
  const redirectRules = policy.rules?.filter(r => r.action === 'Redirect') || []
  if (redirectRules.length > 0) {
    warnings.push(`Redirect action not supported in Application Gateway custom rules. Rules: ${redirectRules.map(r => r.id).join(', ')}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
