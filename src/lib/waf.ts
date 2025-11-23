// WAF Policy Types and Utilities

export type WAFTarget = 'AFD' | 'AppGW'
export type RuleAction = 'Allow' | 'Block' | 'Log' | 'Redirect'
export type RuleOperator = 'Contains' | 'Equals' | 'BeginsWith' | 'EndsWith' | 'GreaterThan' | 'LessThan' | 'GreaterThanOrEqual' | 'LessThanOrEqual' | 'RegEx' | 'GeoMatch' | 'IPMatch' | 'Any'
export type MatchVariable = 'RequestUri' | 'QueryString' | 'PostArgs' | 'RequestHeaders' | 'RequestBody' | 'RequestCookies' | 'RequestMethod' | 'RemoteAddr'

export interface WAFMatchCondition {
  matchVariable: MatchVariable
  operator: RuleOperator
  matchValue: string[]
  selector?: string
  negateCondition?: boolean
  transforms?: string[]
}

export interface WAFRule {
  name: string
  priority: number
  ruleType: 'MatchRule' | 'RateLimitRule'
  matchConditions: WAFMatchCondition[]
  action: RuleAction
  enabled: boolean
  groupBy?: string[]
  rateLimitThreshold?: number
  rateLimitDuration?: number
}

export interface WAFPolicy {
  name: string
  target: WAFTarget
  mode: 'Detection' | 'Prevention'
  customRules: WAFRule[]
  managedRules: {
    enabled: boolean
    ruleSetType?: string
    ruleSetVersion?: string
  }
  policySettings: {
    enabledState: string
    requestBodyCheck: boolean
    maxRequestBodySizeInKb: number
    fileUploadLimitInMb: number
  }
}

export interface SimulationRequest {
  method: string
  url: string
  headers: Record<string, string>
  queryParams: Record<string, string>
  cookies: Record<string, string>
  body?: string
}

export interface SimulationResult {
  allowed: boolean
  action: RuleAction
  matchedRule?: WAFRule
  matchedConditions?: WAFMatchCondition[]
  details: string
}

// Create a sample WAF policy
export function createSamplePolicy(): WAFPolicy {
  return {
    name: 'my-waf-policy',
    target: 'AFD',
    mode: 'Prevention',
    customRules: [
      {
        name: 'BlockSQLInjection',
        priority: 1,
        ruleType: 'MatchRule',
        enabled: true,
        action: 'Block',
        matchConditions: [
          {
            matchVariable: 'QueryString',
            operator: 'Contains',
            matchValue: ['union', 'select', 'drop', 'insert', 'delete', '--', 'xp_'],
            negateCondition: false,
            transforms: ['Lowercase']
          }
        ]
      },
      {
        name: 'BlockXSS',
        priority: 2,
        ruleType: 'MatchRule',
        enabled: true,
        action: 'Block',
        matchConditions: [
          {
            matchVariable: 'RequestBody',
            operator: 'Contains',
            matchValue: ['<script', 'javascript:', 'onerror=', 'onload='],
            negateCondition: false,
            transforms: ['Lowercase']
          }
        ]
      },
      {
        name: 'BlockSuspiciousUserAgents',
        priority: 3,
        ruleType: 'MatchRule',
        enabled: true,
        action: 'Block',
        matchConditions: [
          {
            matchVariable: 'RequestHeaders',
            selector: 'User-Agent',
            operator: 'Contains',
            matchValue: ['sqlmap', 'nikto', 'nmap', 'burp', 'metasploit'],
            negateCondition: false,
            transforms: ['Lowercase']
          }
        ]
      },
      {
        name: 'RateLimitPerIP',
        priority: 10,
        ruleType: 'RateLimitRule',
        enabled: true,
        action: 'Block',
        rateLimitThreshold: 100,
        rateLimitDuration: 60,
        groupBy: ['RemoteAddr'],
        matchConditions: [
          {
            matchVariable: 'RemoteAddr',
            operator: 'Any',
            matchValue: ['']
          }
        ]
      }
    ],
    managedRules: {
      enabled: true,
      ruleSetType: 'Microsoft_DefaultRuleSet',
      ruleSetVersion: '2.1'
    },
    policySettings: {
      enabledState: 'Enabled',
      requestBodyCheck: true,
      maxRequestBodySizeInKb: 128,
      fileUploadLimitInMb: 100
    }
  }
}

// Simulate a request against WAF policy
export function simulateRequest(policy: WAFPolicy, request: SimulationRequest): SimulationResult {
  // Check if policy is in Detection mode (logs only, doesn't block)
  const isDetectionMode = policy.mode === 'Detection'
  
  // Evaluate custom rules in priority order
  const sortedRules = [...policy.customRules]
    .filter(rule => rule.enabled)
    .sort((a, b) => a.priority - b.priority)
  
  for (const rule of sortedRules) {
    const matches = evaluateRule(rule, request)
    
    if (matches.matched) {
      const action = isDetectionMode ? 'Log' : rule.action
      return {
        allowed: action === 'Allow' || action === 'Log',
        action: action,
        matchedRule: rule,
        matchedConditions: matches.conditions,
        details: `Request matched rule "${rule.name}" (Priority: ${rule.priority}). Action: ${action}${isDetectionMode ? ' (Detection Mode - Logged only)' : ''}`
      }
    }
  }
  
  // No custom rules matched - allow by default
  return {
    allowed: true,
    action: 'Allow',
    details: 'No custom rules matched. Request allowed.'
  }
}

interface RuleEvaluation {
  matched: boolean
  conditions: WAFMatchCondition[]
}

function evaluateRule(rule: WAFRule, request: SimulationRequest): RuleEvaluation {
  const matchedConditions: WAFMatchCondition[] = []
  
  // All match conditions must be satisfied (AND logic)
  for (const condition of rule.matchConditions) {
    if (evaluateCondition(condition, request)) {
      matchedConditions.push(condition)
    } else {
      // One condition failed, rule doesn't match
      return { matched: false, conditions: [] }
    }
  }
  
  // All conditions matched
  return {
    matched: matchedConditions.length === rule.matchConditions.length && matchedConditions.length > 0,
    conditions: matchedConditions
  }
}

function evaluateCondition(condition: WAFMatchCondition, request: SimulationRequest): boolean {
  let value = extractMatchValue(condition, request)
  
  // Apply transforms
  if (condition.transforms) {
    for (const transform of condition.transforms) {
      value = applyTransform(value, transform)
    }
  }
  
  // Evaluate operator
  let result = false
  
  switch (condition.operator) {
    case 'Contains':
      result = condition.matchValue.some(pattern => value.includes(pattern.toLowerCase()))
      break
    case 'Equals':
      result = condition.matchValue.some(pattern => value === pattern.toLowerCase())
      break
    case 'BeginsWith':
      result = condition.matchValue.some(pattern => value.startsWith(pattern.toLowerCase()))
      break
    case 'EndsWith':
      result = condition.matchValue.some(pattern => value.endsWith(pattern.toLowerCase()))
      break
    case 'RegEx':
      result = condition.matchValue.some(pattern => new RegExp(pattern).test(value))
      break
    case 'Any':
      result = true
      break
    case 'IPMatch':
      // Simplified IP matching
      result = condition.matchValue.some(ip => request.headers['x-forwarded-for']?.includes(ip))
      break
    default:
      result = false
  }
  
  // Apply negation if specified
  return condition.negateCondition ? !result : result
}

function extractMatchValue(condition: WAFMatchCondition, request: SimulationRequest): string {
  switch (condition.matchVariable) {
    case 'RequestUri':
      return request.url.toLowerCase()
    case 'QueryString':
      return Object.entries(request.queryParams)
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
        .toLowerCase()
    case 'RequestHeaders':
      if (condition.selector) {
        return (request.headers[condition.selector.toLowerCase()] || '').toLowerCase()
      }
      return Object.values(request.headers).join(' ').toLowerCase()
    case 'RequestBody':
      return (request.body || '').toLowerCase()
    case 'RequestCookies':
      if (condition.selector) {
        return (request.cookies[condition.selector.toLowerCase()] || '').toLowerCase()
      }
      return Object.values(request.cookies).join(' ').toLowerCase()
    case 'RequestMethod':
      return request.method.toLowerCase()
    case 'RemoteAddr':
      return request.headers['x-forwarded-for'] || request.headers['remote-addr'] || ''
    default:
      return ''
  }
}

function applyTransform(value: string, transform: string): string {
  switch (transform) {
    case 'Lowercase':
      return value.toLowerCase()
    case 'Uppercase':
      return value.toUpperCase()
    case 'Trim':
      return value.trim()
    case 'UrlDecode':
      return decodeURIComponent(value)
    case 'UrlEncode':
      return encodeURIComponent(value)
    case 'RemoveNulls':
      return value.replace(/\0/g, '')
    default:
      return value
  }
}

// Export policy to JSON
export function exportPolicy(policy: WAFPolicy): any {
  return {
    name: policy.name,
    location: 'Global',
    properties: {
      policySettings: policy.policySettings,
      customRules: {
        rules: policy.customRules.map(rule => ({
          name: rule.name,
          priority: rule.priority,
          ruleType: rule.ruleType,
          action: rule.action,
          enabledState: rule.enabled ? 'Enabled' : 'Disabled',
          matchConditions: rule.matchConditions,
          ...(rule.ruleType === 'RateLimitRule' && {
            rateLimitThreshold: rule.rateLimitThreshold,
            rateLimitDurationInMinutes: rule.rateLimitDuration,
            groupByUserSession: rule.groupBy
          })
        }))
      },
      managedRules: policy.managedRules
    }
  }
}

// Generate Azure Front Door ARM template
export function generateAFDARMTemplate(policy: WAFPolicy): object {
  return {
    "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
    "contentVersion": "1.0.0.0",
    "parameters": {
      "policyName": {
        "type": "string",
        "defaultValue": policy.name,
        "metadata": {
          "description": "Name of the WAF policy"
        }
      }
    },
    "resources": [
      {
        "type": "Microsoft.Network/FrontDoorWebApplicationFirewallPolicies",
        "apiVersion": "2022-05-01",
        "name": "[parameters('policyName')]",
        "location": "Global",
        "sku": {
          "name": "Premium_AzureFrontDoor"
        },
        "properties": exportPolicy(policy).properties
      }
    ],
    "outputs": {
      "policyId": {
        "type": "string",
        "value": "[resourceId('Microsoft.Network/FrontDoorWebApplicationFirewallPolicies', parameters('policyName'))]"
      }
    }
  }
}

// Generate Application Gateway ARM template
export function generateAppGWARMTemplate(policy: WAFPolicy): object {
  return {
    "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
    "contentVersion": "1.0.0.0",
    "parameters": {
      "policyName": {
        "type": "string",
        "defaultValue": policy.name
      },
      "location": {
        "type": "string",
        "defaultValue": "[resourceGroup().location]"
      }
    },
    "resources": [
      {
        "type": "Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies",
        "apiVersion": "2023-04-01",
        "name": "[parameters('policyName')]",
        "location": "[parameters('location')]",
        "properties": exportPolicy(policy).properties
      }
    ]
  }
}

// Generate Azure Front Door Bicep template
export function generateAFDBicepTemplate(policy: WAFPolicy): string {
  return `// Azure Front Door WAF Policy
param policyName string = '${policy.name}'
param location string = 'Global'

resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2022-05-01' = {
  name: policyName
  location: location
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
  properties: {
    policySettings: {
      enabledState: '${policy.policySettings.enabledState}'
      mode: '${policy.mode}'
      requestBodyCheck: ${policy.policySettings.requestBodyCheck}
      maxRequestBodySizeInKb: ${policy.policySettings.maxRequestBodySizeInKb}
      fileUploadLimitInMb: ${policy.policySettings.fileUploadLimitInMb}
    }
    customRules: {
      rules: [
${policy.customRules.map(rule => `        {
          name: '${rule.name}'
          priority: ${rule.priority}
          ruleType: '${rule.ruleType}'
          action: '${rule.action}'
          enabledState: '${rule.enabled ? 'Enabled' : 'Disabled'}'
          matchConditions: [
${rule.matchConditions.map(cond => `            {
              matchVariable: '${cond.matchVariable}'
              operator: '${cond.operator}'
              ${cond.selector ? `selector: '${cond.selector}'\n              ` : ''}matchValue: [
                ${cond.matchValue.map(v => `'${v}'`).join('\n                ')}
              ]
              ${cond.negateCondition ? `negateCondition: true\n              ` : ''}${cond.transforms ? `transforms: [${cond.transforms.map(t => `'${t}'`).join(', ')}]\n              ` : ''}
            }`).join('\n')}
          ]
${rule.ruleType === 'RateLimitRule' ? `          rateLimitThreshold: ${rule.rateLimitThreshold}
          rateLimitDurationInMinutes: ${rule.rateLimitDuration}
` : ''}        }`).join('\n')}
      ]
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: '${policy.managedRules.ruleSetType}'
          ruleSetVersion: '${policy.managedRules.ruleSetVersion}'
        }
      ]
    }
  }
}

output policyId string = wafPolicy.id
output policyName string = wafPolicy.name
`
}

// Generate Application Gateway Bicep template
export function generateAppGWBicepTemplate(policy: WAFPolicy): string {
  return `// Application Gateway WAF Policy
param policyName string = '${policy.name}'
param location string = resourceGroup().location

resource wafPolicy 'Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies@2023-04-01' = {
  name: policyName
  location: location
  properties: {
    policySettings: {
      state: '${policy.policySettings.enabledState}'
      mode: '${policy.mode}'
      requestBodyCheck: ${policy.policySettings.requestBodyCheck}
      maxRequestBodySizeInKb: ${policy.policySettings.maxRequestBodySizeInKb}
      fileUploadLimitInMb: ${policy.policySettings.fileUploadLimitInMb}
    }
    customRules: [
${policy.customRules.map(rule => `      {
        name: '${rule.name}'
        priority: ${rule.priority}
        ruleType: '${rule.ruleType}'
        action: '${rule.action}'
        state: '${rule.enabled ? 'Enabled' : 'Disabled'}'
        matchConditions: [
${rule.matchConditions.map(cond => `          {
            matchVariables: [
              {
                variableName: '${cond.matchVariable}'
                ${cond.selector ? `selector: '${cond.selector}'` : ''}
              }
            ]
            operator: '${cond.operator}'
            matchValues: [
              ${cond.matchValue.map(v => `'${v}'`).join('\n              ')}
            ]
            ${cond.negateCondition ? `negateCondition: true\n            ` : ''}${cond.transforms ? `transforms: [${cond.transforms.map(t => `'${t}'`).join(', ')}]\n            ` : ''}
          }`).join('\n')}
        ]
      }`).join('\n')}
    ]
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: '${policy.managedRules.ruleSetType}'
          ruleSetVersion: '${policy.managedRules.ruleSetVersion}'
        }
      ]
    }
  }
}

output policyId string = wafPolicy.id
output policyName string = wafPolicy.name
`
}
