// WAF Policy Types and Utilities

export type WAFTarget = 'AFD' | 'AppGW'

// Azure Front Door specific actions (supports advanced features)
export type AFDRuleAction = 'Allow' | 'Block' | 'Log' | 'Redirect' | 'AnomalyScoring' | 'CAPTCHA' | 'JSChallenge'

// Application Gateway actions (subset)
export type AppGWRuleAction = 'Allow' | 'Block' | 'Log'

export type RuleAction = AFDRuleAction | AppGWRuleAction

// Azure Front Door match variables
export type AFDMatchVariable = 'Cookies' | 'PostArgs' | 'QueryString' | 'RemoteAddr' | 'RequestBody' | 'RequestHeader' | 'RequestMethod' | 'RequestUri' | 'SocketAddr'

// Application Gateway match variables
export type AppGWMatchVariable = 'RemoteAddr' | 'RequestMethod' | 'QueryString' | 'PostArgs' | 'RequestUri' | 'RequestHeaders' | 'RequestBody' | 'RequestCookies'

export type MatchVariable = AFDMatchVariable | AppGWMatchVariable

// Operators (shared but AFD has more)
export type AFDOperator = 'Any' | 'BeginsWith' | 'Contains' | 'EndsWith' | 'Equal' | 'GeoMatch' | 'GreaterThan' | 'GreaterThanOrEqual' | 'IPMatch' | 'LessThan' | 'LessThanOrEqual' | 'RegEx' | 'ServiceTagMatch'
export type AppGWOperator = 'IPMatch' | 'Equal' | 'Contains' | 'LessThan' | 'GreaterThan' | 'LessThanOrEqual' | 'GreaterThanOrEqual' | 'BeginsWith' | 'EndsWith' | 'Regex' | 'Geomatch' | 'Any'

export type RuleOperator = AFDOperator | AppGWOperator

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
  const op = condition.operator as string
  
  switch (op) {
    case 'Contains':
      result = condition.matchValue.some(pattern => value.includes(pattern.toLowerCase()))
      break
    case 'Equals':
    case 'Equal':
      result = condition.matchValue.some(pattern => value === pattern.toLowerCase())
      break
    case 'BeginsWith':
      result = condition.matchValue.some(pattern => value.startsWith(pattern.toLowerCase()))
      break
    case 'EndsWith':
      result = condition.matchValue.some(pattern => value.endsWith(pattern.toLowerCase()))
      break
    case 'RegEx':
    case 'Regex':
      result = condition.matchValue.some(pattern => new RegExp(pattern).test(value))
      break
    case 'Any':
      result = true
      break
    case 'IPMatch':
      // Simplified IP matching
      result = condition.matchValue.some(ip => request.headers['x-forwarded-for']?.includes(ip))
      break
    case 'GeoMatch':
    case 'Geomatch':
      // Simplified geo matching - would need proper implementation
      result = condition.matchValue.includes(request.headers['x-forwarded-for'] || '')
      break
    case 'GreaterThan':
      result = condition.matchValue.some(v => parseFloat(value) > parseFloat(v))
      break
    case 'LessThan':
      result = condition.matchValue.some(v => parseFloat(value) < parseFloat(v))
      break
    case 'GreaterThanOrEqual':
      result = condition.matchValue.some(v => parseFloat(value) >= parseFloat(v))
      break
    case 'LessThanOrEqual':
      result = condition.matchValue.some(v => parseFloat(value) <= parseFloat(v))
      break
    case 'ServiceTagMatch':
      // Would need Azure service tag implementation
      result = false
      break
    default:
      result = false
  }
  
  // Apply negation if specified
  return condition.negateCondition ? !result : result
}

function extractMatchValue(condition: WAFMatchCondition, request: SimulationRequest): string {
  const matchVar = condition.matchVariable as string
  
  switch (matchVar) {
    case 'RequestUri':
      return request.url.toLowerCase()
    case 'QueryString':
      return Object.entries(request.queryParams)
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
        .toLowerCase()
    case 'RequestHeaders':
    case 'RequestHeader':
      if (condition.selector) {
        return (request.headers[condition.selector.toLowerCase()] || '').toLowerCase()
      }
      return Object.values(request.headers).join(' ').toLowerCase()
    case 'RequestBody':
      return (request.body || '').toLowerCase()
    case 'RequestCookies':
    case 'Cookies':
      if (condition.selector) {
        return (request.cookies[condition.selector.toLowerCase()] || '').toLowerCase()
      }
      return Object.values(request.cookies).join(' ').toLowerCase()
    case 'RequestMethod':
      return request.method.toLowerCase()
    case 'RemoteAddr':
    case 'SocketAddr':
      return request.headers['x-forwarded-for'] || request.headers['remote-addr'] || ''
    case 'PostArgs':
      // Parse POST body as form data
      if (request.body && request.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        return request.body.toLowerCase()
      }
      return ''
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

// Export policy to JSON - Platform specific
export function exportPolicy(policy: WAFPolicy): any {
  if (policy.target === 'AFD') {
    return {
      name: policy.name,
      location: 'Global',
      properties: {
        policySettings: {
          enabledState: policy.policySettings.enabledState,
          mode: policy.mode,
          requestBodyCheck: policy.policySettings.requestBodyCheck ? 'Enabled' : 'Disabled'
        },
        customRules: {
          rules: policy.customRules.map(rule => ({
            name: rule.name,
            priority: rule.priority,
            ruleType: rule.ruleType,
            action: rule.action,
            enabledState: rule.enabled ? 'Enabled' : 'Disabled',
            matchConditions: rule.matchConditions.map(mc => ({
              matchVariable: mc.matchVariable,
              operator: mc.operator,
              matchValue: mc.matchValue,
              ...(mc.selector && { selector: mc.selector }),
              ...(mc.negateCondition && { negateCondition: mc.negateCondition }),
              ...(mc.transforms && mc.transforms.length > 0 && { transforms: mc.transforms })
            })),
            ...(rule.ruleType === 'RateLimitRule' && {
              rateLimitThreshold: rule.rateLimitThreshold,
              rateLimitDurationInMinutes: rule.rateLimitDuration
            })
          }))
        },
        managedRules: {
          managedRuleSets: policy.managedRules.enabled ? [{
            ruleSetType: policy.managedRules.ruleSetType || 'Microsoft_DefaultRuleSet',
            ruleSetVersion: policy.managedRules.ruleSetVersion || '2.1'
          }] : []
        }
      }
    }
  } else {
    // Application Gateway format
    return {
      name: policy.name,
      location: 'global',
      properties: {
        policySettings: {
          state: policy.policySettings.enabledState,
          mode: policy.mode,
          requestBodyCheck: policy.policySettings.requestBodyCheck,
          maxRequestBodySizeInKb: policy.policySettings.maxRequestBodySizeInKb,
          fileUploadLimitInMb: policy.policySettings.fileUploadLimitInMb
        },
        customRules: policy.customRules.map(rule => ({
          name: rule.name,
          priority: rule.priority,
          ruleType: rule.ruleType,
          action: rule.action,
          state: rule.enabled ? 'Enabled' : 'Disabled',
          matchConditions: rule.matchConditions.map(mc => ({
            matchVariables: [{
              variableName: mc.matchVariable,
              ...(mc.selector && { selector: mc.selector })
            }],
            operator: mc.operator,
            matchValues: mc.matchValue,
            ...(mc.negateCondition && { negationCondition: mc.negateCondition }),
            ...(mc.transforms && mc.transforms.length > 0 && { transforms: mc.transforms })
          }))
        })),
        managedRules: {
          managedRuleSets: policy.managedRules.enabled ? [{
            ruleSetType: policy.managedRules.ruleSetType || 'OWASP',
            ruleSetVersion: policy.managedRules.ruleSetVersion || '3.2'
          }] : []
        }
      }
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

// Generate Azure Front Door Bicep parameters file for AVM module
export function generateAFDBicepParamFile(policy: WAFPolicy): string {
  const customRulesSection = policy.customRules.map(rule => {
    const matchConditions = rule.matchConditions.map(cond => {
      const selectorLine = cond.selector ? `          selector: '${cond.selector}'\n` : ''
      const negateConditionLine = cond.negateCondition ? `          negateCondition: true\n` : ''
      const transformsLine = cond.transforms && cond.transforms.length > 0 
        ? `          transforms: [${cond.transforms.map(t => `'${t}'`).join(', ')}]\n`
        : '          transforms: []\n'
      
      return `        {
          matchVariable: '${cond.matchVariable}'
          operator: '${cond.operator}'
${selectorLine}          matchValue: [
            ${cond.matchValue.map(v => `'${v}'`).join('\n            ')}
          ]
${negateConditionLine}${transformsLine}        }`
    }).join('\n')

    return `    {
      name: '${rule.name}'
      priority: ${rule.priority}
      ruleType: '${rule.ruleType}'
      action: '${rule.action}'
      enabledState: '${rule.enabled ? 'Enabled' : 'Disabled'}'
      matchConditions: [
${matchConditions}
      ]
    }`
  }).join('\n')

  return `using 'br/public:avm/res/network/front-door-web-application-firewall-policy:0.3.2'

// Required parameters
param name = '${policy.name}'
param sku = 'Premium_AzureFrontDoor'

// Optional parameters
param location = 'global'

param customRules = {
  rules: [
${customRulesSection}
  ]
}

param managedRules = {
  managedRuleSets: [
    {
      ruleSetType: '${policy.managedRules.ruleSetType}'
      ruleSetVersion: '${policy.managedRules.ruleSetVersion}'
      ruleSetAction: 'Block'
      exclusions: []
      ruleGroupOverrides: []
    }
  ]
}

param policySettings = {
  enabledState: '${policy.policySettings.enabledState}'
  mode: '${policy.mode}'
  requestBodyCheck: 'Enabled'
}

param tags = {
  Environment: 'Production'
  ManagedBy: 'WAF-Policy-Designer'
}
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

// Generate Application Gateway Bicep parameters file for AVM module
export function generateAppGWBicepParamFile(policy: WAFPolicy): string {
  const customRulesSection = policy.customRules.map(rule => {
    const matchConditions = rule.matchConditions.map(cond => {
      const selectorLine = cond.selector ? `selector: '${cond.selector}'\n            ` : ''
      const negateConditionLine = cond.negateCondition ? `negateCondition: true\n        ` : ''
      const transformsLine = cond.transforms && cond.transforms.length > 0 
        ? `transforms: [${cond.transforms.map(t => `'${t}'`).join(', ')}]\n        `
        : ''
      
      return `      {
        matchVariables: [
          {
            variableName: '${cond.matchVariable}'
            ${selectorLine}}
        ]
        operator: '${cond.operator}'
        matchValues: [
          ${cond.matchValue.map(v => `'${v}'`).join('\n          ')}
        ]
        ${negateConditionLine}${transformsLine}}`
    }).join('\n')

    return `  {
    name: '${rule.name}'
    priority: ${rule.priority}
    ruleType: '${rule.ruleType}'
    action: '${rule.action}'
    state: '${rule.enabled ? 'Enabled' : 'Disabled'}'
    matchConditions: [
${matchConditions}
    ]
  }`
  }).join('\n')

  return `using 'br/public:avm/res/network/application-gateway-web-application-firewall-policy:0.2.0'

// Required parameters
param name = '${policy.name}'

param managedRules = {
  managedRuleSets: [
    {
      ruleSetType: '${policy.managedRules.ruleSetType}'
      ruleSetVersion: '${policy.managedRules.ruleSetVersion}'
      ruleGroupOverrides: []
    }
  ]
}

// Optional parameters
param location = resourceGroup().location

param customRules = [
${customRulesSection}
]

param policySettings = {
  state: '${policy.policySettings.enabledState}'
  mode: '${policy.mode}'
  requestBodyCheck: ${policy.policySettings.requestBodyCheck}
  maxRequestBodySizeInKb: ${policy.policySettings.maxRequestBodySizeInKb}
  fileUploadLimitInMb: ${policy.policySettings.fileUploadLimitInMb}
}

param tags = {
  Environment: 'Production'
  ManagedBy: 'WAF-Policy-Designer'
}
`
}
