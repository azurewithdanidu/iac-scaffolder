// ==========================================================================================
// WAF Rule Simulator - Azure Front Door Exporter
// ==========================================================================================
// Converts internal PolicyModel to Azure Front Door WAF policy JSON format
// Based on Azure Front Door WAF policy schema
// ==========================================================================================

import { PolicyModel, Rule, Condition, Exclusion, ManagedSet } from '../model'

// ==========================================================================================
// Azure Front Door Types
// ==========================================================================================

interface AFDWAFPolicy {
  type: 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies'
  apiVersion: string
  name: string
  location: string
  properties: AFDPolicyProperties
}

interface AFDPolicyProperties {
  policySettings: AFDPolicySettings
  customRules?: AFDCustomRules
  managedRules?: AFDManagedRules
}

interface AFDPolicySettings {
  enabledState: 'Enabled' | 'Disabled'
  mode: 'Prevention' | 'Detection'
  redirectUrl?: string
  customBlockResponseStatusCode?: number
  customBlockResponseBody?: string
}

interface AFDCustomRules {
  rules: AFDCustomRule[]
}

interface AFDCustomRule {
  name: string
  priority: number
  enabledState: 'Enabled' | 'Disabled'
  ruleType: 'MatchRule' | 'RateLimitRule'
  rateLimitDurationInMinutes?: number
  rateLimitThreshold?: number
  matchConditions: AFDMatchCondition[]
  action: 'Allow' | 'Block' | 'Log' | 'Redirect'
}

interface AFDMatchCondition {
  matchVariable: AFDMatchVariable
  selector?: string
  operator: AFDOperator
  negateCondition?: boolean
  matchValue: string[]
  transforms?: AFDTransform[]
}

type AFDMatchVariable = 
  | 'RemoteAddr' | 'RequestMethod' | 'QueryString' | 'PostArgs' 
  | 'RequestUri' | 'RequestHeader' | 'RequestBody' | 'Cookies'
  | 'SocketAddr'

type AFDOperator = 
  | 'Any' | 'IPMatch' | 'GeoMatch' | 'Equal' | 'Contains' 
  | 'LessThan' | 'GreaterThan' | 'LessThanOrEqual' | 'GreaterThanOrEqual' 
  | 'BeginsWith' | 'EndsWith' | 'RegEx'

type AFDTransform = 
  | 'Lowercase' | 'Uppercase' | 'Trim' | 'UrlDecode' | 'UrlEncode' 
  | 'RemoveNulls' | 'HtmlEntityDecode'

interface AFDManagedRules {
  managedRuleSets: AFDManagedRuleSet[]
  exclusions?: AFDManagedRuleExclusion[]
}

interface AFDManagedRuleSet {
  ruleSetType: string
  ruleSetVersion: string
  ruleGroupOverrides?: AFDRuleGroupOverride[]
  exclusions?: AFDManagedRuleExclusion[]
}

interface AFDRuleGroupOverride {
  ruleGroupName: string
  exclusions?: AFDManagedRuleExclusion[]
  rules?: AFDManagedRuleOverride[]
}

interface AFDManagedRuleOverride {
  ruleId: string
  enabledState?: 'Enabled' | 'Disabled'
  action?: 'Allow' | 'Block' | 'Log' | 'Redirect'
  exclusions?: AFDManagedRuleExclusion[]
}

interface AFDManagedRuleExclusion {
  matchVariable: AFDMatchVariable
  selectorMatchOperator: 'Equals' | 'Contains' | 'StartsWith' | 'EndsWith' | 'EqualsAny'
  selector: string
}

// ==========================================================================================
// Export Function
// ==========================================================================================

/**
 * Convert internal PolicyModel to Azure Front Door WAF policy JSON
 * @param policy Internal policy model
 * @param options Export options
 * @returns Azure Front Door WAF policy JSON
 */
export function toAFD(
  policy: PolicyModel, 
  options: AFDExportOptions = {}
): AFDWAFPolicy {
  if (policy.target !== 'AFD') {
    throw new Error('Policy target must be AFD for Azure Front Door export')
  }

  const {
    apiVersion = '2022-05-01',
    location = 'Global',
    resourceName = policy.name
  } = options

  return {
    type: 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies',
    apiVersion,
    name: resourceName,
    location,
    properties: {
      policySettings: mapPolicySettings(policy),
      customRules: policy.rules && policy.rules.length > 0 ? mapCustomRules(policy.rules) : undefined,
      managedRules: policy.managedSets && policy.managedSets.length > 0 ? mapManagedRules(policy.managedSets, policy.exclusions) : undefined
    }
  }
}

/**
 * Export options for AFD
 */
export interface AFDExportOptions {
  /** API version for the resource */
  apiVersion?: string
  /** Azure location */
  location?: string
  /** Resource name (defaults to policy name) */
  resourceName?: string
  /** Include metadata as tags */
  includeTags?: boolean
}

// ==========================================================================================
// Mapping Functions
// ==========================================================================================

/**
 * Map policy settings to AFD format
 */
function mapPolicySettings(policy: PolicyModel): AFDPolicySettings {
  return {
    enabledState: 'Enabled',
    mode: policy.mode,
    // AFD-specific defaults
    customBlockResponseStatusCode: 403,
    customBlockResponseBody: 'Request blocked by WAF policy'
  }
}

/**
 * Map custom rules to AFD format
 */
function mapCustomRules(rules: Rule[]): AFDCustomRules {
  const afdRules: AFDCustomRule[] = rules
    .filter(rule => !rule.disabled)
    .map(rule => mapCustomRule(rule))
  
  return {
    rules: afdRules
  }
}

/**
 * Map a single custom rule to AFD format
 */
function mapCustomRule(rule: Rule): AFDCustomRule {
  const matchConditions = rule.when.map(condition => mapMatchCondition(condition))
  
  const afdRule: AFDCustomRule = {
    name: rule.id,
    priority: rule.order,
    enabledState: rule.disabled ? 'Disabled' : 'Enabled',
    ruleType: rule.type === 'rate' ? 'RateLimitRule' : 'MatchRule',
    matchConditions,
    action: mapAction(rule.action)
  }

  // Add rate limit specific fields
  if (rule.type === 'rate') {
    afdRule.rateLimitDurationInMinutes = 1 // Default to 1 minute
    afdRule.rateLimitThreshold = 100 // Default threshold
    
    // Try to extract threshold from conditions
    const thresholdCondition = rule.when.find(c => c.field === 'rate' && c.op === 'gt')
    if (thresholdCondition && typeof thresholdCondition.value === 'number') {
      afdRule.rateLimitThreshold = thresholdCondition.value
    }
  }

  return afdRule
}

/**
 * Map condition to AFD match condition
 */
function mapMatchCondition(condition: Condition): AFDMatchCondition {
  const matchVariable = mapMatchVariable(condition.field)
  const operator = mapOperator(condition.op)
  const matchValue = Array.isArray(condition.value) 
    ? condition.value.map(v => v.toString())
    : condition.value !== undefined 
    ? [condition.value.toString()]
    : ['']

  const afdCondition: AFDMatchCondition = {
    matchVariable,
    operator,
    matchValue,
    negateCondition: condition.negate || false
  }

  // Add selector for fields that need it
  if (condition.key && needsSelector(condition.field)) {
    afdCondition.selector = condition.key
  }

  // Map transforms
  if (condition.transform && condition.transform.length > 0) {
    afdCondition.transforms = condition.transform
      .map(mapTransform)
      .filter((t): t is AFDTransform => t !== null)
  }

  return afdCondition
}

/**
 * Map internal field to AFD match variable
 */
function mapMatchVariable(field: string): AFDMatchVariable {
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
      return 'RequestHeader'
    case 'body':
      return 'RequestBody'
    case 'cookie':
      return 'Cookies'
    case 'ua':
      return 'RequestHeader' // User-Agent is a header
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
 * Map internal operator to AFD operator
 */
function mapOperator(operator: string): AFDOperator {
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
      return 'RegEx'
    case 'gt':
      return 'GreaterThan'
    case 'lt':
      return 'LessThan'
    case 'in':
      return 'Equal' // Use Equal for 'in' with array values
    case 'wildcard':
      return 'RegEx' // Convert wildcards to regex
    default:
      return 'Equal'
  }
}

/**
 * Map internal action to AFD action
 */
function mapAction(action: string): 'Allow' | 'Block' | 'Log' | 'Redirect' {
  switch (action) {
    case 'Allow':
      return 'Allow'
    case 'Block':
      return 'Block'
    case 'Log':
      return 'Log'
    case 'Redirect':
      return 'Redirect'
    default:
      return 'Block' // Safe default
  }
}

/**
 * Map internal transform to AFD transform
 */
function mapTransform(transform: string): AFDTransform | null {
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
    default:
      return null // Unsupported transform
  }
}

/**
 * Map managed rule sets to AFD format
 */
function mapManagedRules(managedSets: ManagedSet[], globalExclusions?: Exclusion[]): AFDManagedRules {
  const managedRuleSets = managedSets.map(mapManagedRuleSet)
  
  const afdManagedRules: AFDManagedRules = {
    managedRuleSets
  }

  // Add global exclusions if any
  if (globalExclusions && globalExclusions.length > 0) {
    afdManagedRules.exclusions = globalExclusions.map(mapExclusion)
  }

  return afdManagedRules
}

/**
 * Map managed rule set to AFD format
 */
function mapManagedRuleSet(managedSet: ManagedSet): AFDManagedRuleSet {
  // Map common rule set names
  let ruleSetType = managedSet.name
  let ruleSetVersion = managedSet.version || '1.0'

  if (managedSet.name.startsWith('OWASP')) {
    ruleSetType = 'Microsoft_DefaultRuleSet'
    ruleSetVersion = '2.1' // Current version
  }

  const afdManagedRuleSet: AFDManagedRuleSet = {
    ruleSetType,
    ruleSetVersion
  }

  // Add rule group overrides based on categories
  if (managedSet.categories && managedSet.categories.length > 0) {
    afdManagedRuleSet.ruleGroupOverrides = managedSet.categories.map(category => ({
      ruleGroupName: mapCategoryToRuleGroup(category)
    }))
  }

  return afdManagedRuleSet
}

/**
 * Map category to AFD rule group name
 */
function mapCategoryToRuleGroup(category: string): string {
  switch (category.toUpperCase()) {
    case 'SQLI':
      return 'SQLI'
    case 'XSS':
      return 'XSS'
    case 'LFI':
      return 'LFI'
    case 'RFI':
      return 'RFI'
    case 'RCE':
      return 'RCE'
    case 'PROTOCOL':
      return 'PROTOCOL'
    case 'JAVA':
      return 'Java'
    case 'NODEJS':
      return 'NodeJS'
    case 'PHP':
      return 'PHP'
    default:
      return category
  }
}

/**
 * Map exclusion to AFD format
 */
function mapExclusion(exclusion: Exclusion): AFDManagedRuleExclusion {
  return {
    matchVariable: mapMatchVariable(exclusion.location),
    selectorMatchOperator: mapExclusionOperator(exclusion.op),
    selector: exclusion.key
  }
}

/**
 * Map exclusion operator to AFD format
 */
function mapExclusionOperator(operator: string): 'Equals' | 'Contains' | 'StartsWith' | 'EndsWith' | 'EqualsAny' {
  switch (operator) {
    case 'equals':
      return 'Equals'
    case 'contains':
      return 'Contains'
    case 'regex':
      return 'Contains' // AFD doesn't support regex in exclusions, use contains as fallback
    default:
      return 'Equals'
  }
}

// ==========================================================================================
// Utility Functions
// ==========================================================================================

/**
 * Generate ARM template for AFD WAF policy
 * @param policy Internal policy model
 * @param options Export options
 * @returns Complete ARM template
 */
export function generateAFDARMTemplate(
  policy: PolicyModel, 
  options: AFDExportOptions & { includeParameters?: boolean } = {}
): { [key: string]: unknown } {
  const afdPolicy = toAFD(policy, options)
  
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
        defaultValue: options.location || 'Global',
        metadata: {
          description: 'Location for the WAF policy'
        }
      }
    }
    
    // Update resource to use parameters
    afdPolicy.name = '[parameters(\'policyName\')]'
    afdPolicy.location = '[parameters(\'location\')]'
  }

  template.resources = [afdPolicy]
  
  template.outputs = {
    policyId: {
      type: 'string',
      value: `[resourceId('Microsoft.Network/FrontDoorWebApplicationFirewallPolicies', '${policy.name}')]`
    },
    policyName: {
      type: 'string',
      value: `[reference(resourceId('Microsoft.Network/FrontDoorWebApplicationFirewallPolicies', '${policy.name}')).name]`
    }
  }

  return template
}

/**
 * Generate Bicep template for AFD WAF policy
 * @param policy Internal policy model
 * @param options Export options
 * @returns Bicep template content
 */
export function generateAFDBicepTemplate(
  policy: PolicyModel, 
  options: AFDExportOptions = {}
): string {
  const afdPolicy = toAFD(policy, options)
  
  const bicepContent = `// Azure Front Door WAF Policy
// Generated by WAF Rule Simulator

param policyName string = '${policy.name}'
param location string = '${options.location || 'Global'}'

resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@${options.apiVersion || '2022-05-01'}' = {
  name: policyName
  location: location
  properties: ${JSON.stringify(afdPolicy.properties, null, 2).replace(/"/g, "'")}
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
 * Validate AFD policy for Azure-specific constraints
 * @param policy Internal policy model
 * @returns Validation result
 */
export function validateAFDPolicy(policy: PolicyModel): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // AFD-specific validations
  if (policy.target !== 'AFD') {
    errors.push('Policy target must be AFD for Azure Front Door')
  }

  // Check rule limits (AFD allows up to 100 custom rules)
  if (policy.rules && policy.rules.length > 100) {
    errors.push('Azure Front Door supports maximum 100 custom rules')
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
      warnings.push(`Managed rule set '${managedSet.name}' may not be supported by Azure Front Door`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
