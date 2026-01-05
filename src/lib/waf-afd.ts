// Azure Front Door WAF Policy - Focused Implementation
// Compatible with Azure Verified Modules (AVM)

// ====================================
// TYPE DEFINITIONS - AFD WAF ONLY
// ====================================

export type AFDRuleAction = 'Allow' | 'Block' | 'Log' | 'Redirect' | 'AnomalyScoring'

export type AFDMatchVariable = 
  | 'Cookies'
  | 'PostArgs'
  | 'QueryString'
  | 'RemoteAddr'
  | 'RequestBody'
  | 'RequestHeader'
  | 'RequestMethod'
  | 'RequestUri'
  | 'SocketAddr'

export type AFDOperator = 
  | 'Any'
  | 'BeginsWith'
  | 'Contains'
  | 'EndsWith'
  | 'Equal'
  | 'GeoMatch'
  | 'GreaterThan'
  | 'GreaterThanOrEqual'
  | 'IPMatch'
  | 'LessThan'
  | 'LessThanOrEqual'
  | 'RegEx'

export type AFDTransform = 
  | 'Lowercase'
  | 'Uppercase'
  | 'Trim'
  | 'UrlDecode'
  | 'UrlEncode'
  | 'RemoveNulls'
  | 'HtmlEntityDecode'

export interface AFDMatchCondition {
  matchVariable: AFDMatchVariable
  operator: AFDOperator
  selector?: string
  matchValue: string[]
  negateCondition?: boolean
  transforms?: AFDTransform[]
}

export interface AFDCustomRule {
  name: string
  priority: number
  ruleType: 'MatchRule' | 'RateLimitRule'
  matchConditions: AFDMatchCondition[]
  action: AFDRuleAction
  enabledState: 'Enabled' | 'Disabled'
  rateLimitThreshold?: number
  rateLimitDurationInMinutes?: number
}

export interface AFDPolicySettings {
  enabledState: 'Enabled' | 'Disabled'
  mode: 'Detection' | 'Prevention'
  requestBodyCheck?: 'Enabled' | 'Disabled'
  requestBodyInspectLimitInKB?: number
  requestBodyEnforcement?: boolean
  javascriptChallengeExpirationInMinutes?: number
  logScrubbing?: {
    state: 'Enabled' | 'Disabled'
    scrubbingRules?: Array<{
      matchVariable: string
      selectorMatchOperator: string
      selector?: string
      state: 'Enabled' | 'Disabled'
    }>
  }
}

export interface AFDManagedRuleSet {
  ruleSetType: 'Microsoft_DefaultRuleSet' | 'Microsoft_BotManagerRuleSet'
  ruleSetVersion: string
  ruleSetAction?: 'Block' | 'Log' | 'Redirect'
  exclusions?: Array<{
    matchVariable: AFDMatchVariable
    selectorMatchOperator: AFDOperator
    selector: string
  }>
  ruleGroupOverrides?: Array<{
    ruleGroupName: string
    rules?: Array<{
      ruleId: string
      enabledState?: 'Enabled' | 'Disabled'
      action?: AFDRuleAction
      exclusions?: Array<{
        matchVariable: AFDMatchVariable
        selectorMatchOperator: AFDOperator
        selector: string
      }>
    }>
  }>
}

export interface AFDWAFPolicy {
  name: string
  sku: 'Standard_AzureFrontDoor' | 'Premium_AzureFrontDoor'
  policySettings: AFDPolicySettings
  customRules: AFDCustomRule[]
  managedRules: {
    managedRuleSets: AFDManagedRuleSet[]
  }
  tags?: Record<string, string>
}

// ====================================
// SIMULATION & TESTING
// ====================================

export interface TestRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH'
  url: string
  headers: Record<string, string>
  queryParams: Record<string, string>
  cookies: Record<string, string>
  body?: string
  sourceIp?: string
}

export interface TestResult {
  allowed: boolean
  action: AFDRuleAction
  matchedRule?: AFDCustomRule
  matchedConditions?: AFDMatchCondition[]
  details: string
  timestamp: string
}

export function simulateRequest(policy: AFDWAFPolicy, request: TestRequest): TestResult {
  const timestamp = new Date().toISOString()

  // Check if policy is enabled
  if (policy.policySettings.enabledState === 'Disabled') {
    return {
      allowed: true,
      action: 'Allow',
      details: 'WAF policy is disabled',
      timestamp
    }
  }

  // Check custom rules in priority order
  const sortedRules = [...policy.customRules].sort((a, b) => a.priority - b.priority)

  for (const rule of sortedRules) {
    if (rule.enabledState === 'Disabled') continue

    const allConditionsMatch = rule.matchConditions.every(condition => 
      matchesCondition(request, condition)
    )

    if (allConditionsMatch) {
      const action = policy.policySettings.mode === 'Detection' ? 'Log' : rule.action
      
      return {
        allowed: action === 'Allow' || action === 'Log',
        action,
        matchedRule: rule,
        matchedConditions: rule.matchConditions,
        details: `Matched custom rule: ${rule.name} (Priority: ${rule.priority})`,
        timestamp
      }
    }
  }

  // No custom rules matched - allow by default
  return {
    allowed: true,
    action: 'Allow',
    details: 'No custom rules matched - allowed by default',
    timestamp
  }
}

function matchesCondition(request: TestRequest, condition: AFDMatchCondition): boolean {
  let value = extractValue(request, condition.matchVariable, condition.selector)
  
  // Apply transforms
  if (condition.transforms && condition.transforms.length > 0) {
    for (const transform of condition.transforms) {
      value = applyTransform(value, transform)
    }
  }

  const matches = condition.matchValue.some(matchVal => {
    switch (condition.operator) {
      case 'Any':
        return true
      case 'Equal':
        return value === matchVal
      case 'Contains':
        return value.includes(matchVal)
      case 'BeginsWith':
        return value.startsWith(matchVal)
      case 'EndsWith':
        return value.endsWith(matchVal)
      case 'RegEx':
        return new RegExp(matchVal).test(value)
      case 'IPMatch':
        return matchIPAddress(request.sourceIp || request.headers['x-forwarded-for'] || '', matchVal)
      case 'GeoMatch':
        return matchGeo(request.headers['x-geo-country'] || '', matchVal)
      case 'GreaterThan':
        return parseInt(value) > parseInt(matchVal)
      case 'GreaterThanOrEqual':
        return parseInt(value) >= parseInt(matchVal)
      case 'LessThan':
        return parseInt(value) < parseInt(matchVal)
      case 'LessThanOrEqual':
        return parseInt(value) <= parseInt(matchVal)
      default:
        return false
    }
  })

  return condition.negateCondition ? !matches : matches
}

function extractValue(request: TestRequest, matchVar: AFDMatchVariable, selector?: string): string {
  switch (matchVar) {
    case 'RequestUri':
      return request.url.toLowerCase()
    case 'QueryString':
      return Object.entries(request.queryParams)
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
        .toLowerCase()
    case 'RequestHeader':
      if (selector) {
        return (request.headers[selector.toLowerCase()] || '').toLowerCase()
      }
      return Object.values(request.headers).join(' ').toLowerCase()
    case 'RequestBody':
      return (request.body || '').toLowerCase()
    case 'Cookies':
      if (selector) {
        return (request.cookies[selector.toLowerCase()] || '').toLowerCase()
      }
      return Object.values(request.cookies).join(' ').toLowerCase()
    case 'RequestMethod':
      return request.method.toLowerCase()
    case 'RemoteAddr':
    case 'SocketAddr':
      return request.sourceIp || request.headers['x-forwarded-for'] || ''
    case 'PostArgs':
      if (request.body && request.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        return request.body.toLowerCase()
      }
      return ''
    default:
      return ''
  }
}

function applyTransform(value: string, transform: AFDTransform): string {
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
    case 'HtmlEntityDecode':
      return value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    default:
      return value
  }
}

function matchIPAddress(ip: string, cidr: string): boolean {
  // Simplified IP matching - in production use proper CIDR library
  if (!cidr.includes('/')) {
    return ip === cidr
  }
  // Basic IP range check
  const [range] = cidr.split('/')
  return ip.startsWith(range.split('.').slice(0, 2).join('.'))
}

function matchGeo(country: string, matchCountry: string): boolean {
  return country.toUpperCase() === matchCountry.toUpperCase()
}

// ====================================
// BICEP PARAMETER FILE GENERATION (AVM)
// ====================================

export function generateAFDBicepParamFile(policy: AFDWAFPolicy): string {
  const customRulesSection = policy.customRules.map(rule => {
    const matchConditions = rule.matchConditions.map(cond => {
      const parts = []
      parts.push(`      {`)
      parts.push(`        matchVariable: '${cond.matchVariable}'`)
      parts.push(`        operator: '${cond.operator}'`)
      if (cond.selector) {
        parts.push(`        selector: '${cond.selector}'`)
      }
      parts.push(`        matchValue: [`)
      cond.matchValue.forEach(val => {
        parts.push(`          '${val}'`)
      })
      parts.push(`        ]`)
      if (cond.negateCondition) {
        parts.push(`        negateCondition: true`)
      }
      if (cond.transforms && cond.transforms.length > 0) {
        parts.push(`        transforms: [`)
        cond.transforms.forEach(t => {
          parts.push(`          '${t}'`)
        })
        parts.push(`        ]`)
      } else {
        parts.push(`        transforms: []`)
      }
      parts.push(`      }`)
      return parts.join('\n')
    }).join('\n')

    const ruleParts = []
    ruleParts.push(`    {`)
    ruleParts.push(`      name: '${rule.name}'`)
    ruleParts.push(`      priority: ${rule.priority}`)
    ruleParts.push(`      ruleType: '${rule.ruleType}'`)
    ruleParts.push(`      action: '${rule.action}'`)
    ruleParts.push(`      enabledState: '${rule.enabledState}'`)
    ruleParts.push(`      matchConditions: [`)
    ruleParts.push(matchConditions)
    ruleParts.push(`      ]`)
    
    if (rule.ruleType === 'RateLimitRule') {
      if (rule.rateLimitThreshold) {
        ruleParts.push(`      rateLimitThreshold: ${rule.rateLimitThreshold}`)
      }
      if (rule.rateLimitDurationInMinutes) {
        ruleParts.push(`      rateLimitDurationInMinutes: ${rule.rateLimitDurationInMinutes}`)
      }
    }
    
    ruleParts.push(`    }`)
    return ruleParts.join('\n')
  }).join('\n')

  const managedRuleSets = policy.managedRules.managedRuleSets.map(ruleSet => {
    const parts = []
    parts.push(`    {`)
    parts.push(`      ruleSetType: '${ruleSet.ruleSetType}'`)
    parts.push(`      ruleSetVersion: '${ruleSet.ruleSetVersion}'`)
    if (ruleSet.ruleSetAction) {
      parts.push(`      ruleSetAction: '${ruleSet.ruleSetAction}'`)
    } else {
      parts.push(`      ruleSetAction: 'Block'`)
    }
    parts.push(`      exclusions: []`)
    parts.push(`      ruleGroupOverrides: []`)
    parts.push(`    }`)
    return parts.join('\n')
  }).join('\n')

  return `using 'br/public:avm/res/network/front-door-web-application-firewall-policy:0.3.3'

// =====================================
// Required Parameters
// =====================================

param name = '${policy.name}'
param sku = '${policy.sku}'

// =====================================
// Optional Parameters
// =====================================

param location = 'global'

// Custom Rules Configuration
param customRules = {
  rules: [
${customRulesSection}
  ]
}

${policy.sku === 'Premium_AzureFrontDoor' ? `// Managed Rules Configuration (Premium SKU only)
param managedRules = {
  managedRuleSets: [
${managedRuleSets}
  ]
}` : '// Managed Rules are only available with Premium SKU'}

// Policy Settings
param policySettings = {
  enabledState: '${policy.policySettings.enabledState}'
  mode: '${policy.policySettings.mode}'
  ${policy.policySettings.requestBodyCheck ? `requestBodyCheck: '${policy.policySettings.requestBodyCheck}'` : ''}
  ${policy.policySettings.requestBodyInspectLimitInKB ? `requestBodyInspectLimitInKB: ${policy.policySettings.requestBodyInspectLimitInKB}` : ''}
}

// Tags
param tags = {
  Environment: 'Production'
  ManagedBy: 'WAF-Policy-Designer'
  ${policy.tags ? Object.entries(policy.tags).map(([k, v]) => `${k}: '${v}'`).join('\n  ') : ''}
}
`
}

// ====================================
// SAMPLE POLICY FOR TESTING
// ====================================

export function createSampleAFDPolicy(): AFDWAFPolicy {
  return {
    name: 'afd-waf-policy',
    sku: 'Premium_AzureFrontDoor',
    policySettings: {
      enabledState: 'Enabled',
      mode: 'Prevention',
      requestBodyCheck: 'Enabled',
      requestBodyInspectLimitInKB: 128
    },
    customRules: [
      {
        name: 'BlockSQLInjection',
        priority: 10,
        ruleType: 'MatchRule',
        enabledState: 'Enabled',
        action: 'Block',
        matchConditions: [
          {
            matchVariable: 'QueryString',
            operator: 'Contains',
            matchValue: ['union', 'select', 'drop', 'insert', 'delete', 'exec', 'execute', '--', 'xp_', 'sp_', 'waitfor', 'benchmark'],
            transforms: ['Lowercase', 'Trim']
          },
          {
            matchVariable: 'RequestBody',
            operator: 'Contains',
            matchValue: ['union', 'select', 'drop', 'insert', 'delete', 'exec', 'execute'],
            transforms: ['Lowercase', 'Trim']
          }
        ]
      },
      {
        name: 'BlockXSS',
        priority: 20,
        ruleType: 'MatchRule',
        enabledState: 'Enabled',
        action: 'Block',
        matchConditions: [
          {
            matchVariable: 'QueryString',
            operator: 'Contains',
            matchValue: ['<script', 'javascript:', 'onerror=', 'onload=', 'onclick=', 'onmouseover=', '<iframe', '<object', '<embed'],
            transforms: ['Lowercase', 'UrlDecode']
          },
          {
            matchVariable: 'RequestBody',
            operator: 'Contains',
            matchValue: ['<script', 'javascript:', 'onerror=', 'onload='],
            transforms: ['Lowercase', 'UrlDecode']
          }
        ]
      },
      {
        name: 'BlockPathTraversal',
        priority: 30,
        ruleType: 'MatchRule',
        enabledState: 'Enabled',
        action: 'Block',
        matchConditions: [
          {
            matchVariable: 'RequestUri',
            operator: 'Contains',
            matchValue: ['../', '..\\', '/etc/passwd', '/windows/win.ini'],
            transforms: ['Lowercase', 'UrlDecode']
          }
        ]
      },
      {
        name: 'BlockRemoteFileInclusion',
        priority: 40,
        ruleType: 'MatchRule',
        enabledState: 'Enabled',
        action: 'Block',
        matchConditions: [
          {
            matchVariable: 'QueryString',
            operator: 'Contains',
            matchValue: ['http://', 'https://', 'ftp://', 'file://'],
            transforms: ['Lowercase']
          }
        ]
      },
      {
        name: 'BlockSuspiciousUserAgents',
        priority: 50,
        ruleType: 'MatchRule',
        enabledState: 'Enabled',
        action: 'Block',
        matchConditions: [
          {
            matchVariable: 'RequestHeader',
            selector: 'User-Agent',
            operator: 'Contains',
            matchValue: ['sqlmap', 'nikto', 'nmap', 'masscan', 'acunetix', 'burpsuite', 'zaproxy'],
            transforms: ['Lowercase']
          }
        ]
      },
      {
        name: 'BlockEmptyUserAgent',
        priority: 60,
        ruleType: 'MatchRule',
        enabledState: 'Disabled',
        action: 'Block',
        matchConditions: [
          {
            matchVariable: 'RequestHeader',
            selector: 'User-Agent',
            operator: 'Equal',
            matchValue: [''],
            negateCondition: false
          }
        ]
      },
      {
        name: 'RateLimitPerIP',
        priority: 70,
        ruleType: 'RateLimitRule',
        enabledState: 'Enabled',
        action: 'Block',
        rateLimitThreshold: 100,
        rateLimitDurationInMinutes: 1,
        matchConditions: [
          {
            matchVariable: 'SocketAddr',
            operator: 'Any',
            matchValue: ['0.0.0.0/0']
          }
        ]
      },
      {
        name: 'RateLimitLoginEndpoint',
        priority: 80,
        ruleType: 'RateLimitRule',
        enabledState: 'Enabled',
        action: 'Block',
        rateLimitThreshold: 10,
        rateLimitDurationInMinutes: 1,
        matchConditions: [
          {
            matchVariable: 'RequestUri',
            operator: 'Contains',
            matchValue: ['/login', '/signin', '/auth'],
            transforms: ['Lowercase']
          }
        ]
      },
      {
        name: 'BlockSpecificGeo',
        priority: 90,
        ruleType: 'MatchRule',
        enabledState: 'Disabled',
        action: 'Block',
        matchConditions: [
          {
            matchVariable: 'RemoteAddr',
            operator: 'GeoMatch',
            matchValue: ['CN', 'RU', 'KP']
          }
        ]
      },
      {
        name: 'AllowHealthCheckProbes',
        priority: 5,
        ruleType: 'MatchRule',
        enabledState: 'Enabled',
        action: 'Allow',
        matchConditions: [
          {
            matchVariable: 'RequestUri',
            operator: 'Equal',
            matchValue: ['/health', '/healthz', '/ping'],
            transforms: ['Lowercase']
          }
        ]
      }
    ],
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet',
          ruleSetVersion: '2.1',
          ruleSetAction: 'Block'
        },
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet',
          ruleSetVersion: '1.0',
          ruleSetAction: 'Block'
        }
      ]
    },
    tags: {
      CostCenter: 'Security',
      Owner: 'SecOps'
    }
  }
}

// ====================================
// JSON EXPORT (for API deployment)
// ====================================

export function exportAFDPolicyToJSON(policy: AFDWAFPolicy): object {
  return {
    name: policy.name,
    location: 'Global',
    sku: {
      name: policy.sku
    },
    properties: {
      policySettings: {
        enabledState: policy.policySettings.enabledState,
        mode: policy.policySettings.mode,
        ...(policy.policySettings.requestBodyCheck && {
          requestBodyCheck: policy.policySettings.requestBodyCheck
        }),
        ...(policy.policySettings.requestBodyInspectLimitInKB && {
          requestBodyInspectLimitInKB: policy.policySettings.requestBodyInspectLimitInKB
        })
      },
      customRules: {
        rules: policy.customRules.map(rule => ({
          name: rule.name,
          priority: rule.priority,
          ruleType: rule.ruleType,
          action: rule.action,
          enabledState: rule.enabledState,
          matchConditions: rule.matchConditions.map(mc => ({
            matchVariable: mc.matchVariable,
            operator: mc.operator,
            ...(mc.selector && { selector: mc.selector }),
            matchValue: mc.matchValue,
            ...(mc.negateCondition && { negateCondition: mc.negateCondition }),
            ...(mc.transforms && mc.transforms.length > 0 && { transforms: mc.transforms })
          })),
          ...(rule.ruleType === 'RateLimitRule' && {
            rateLimitThreshold: rule.rateLimitThreshold,
            rateLimitDurationInMinutes: rule.rateLimitDurationInMinutes
          })
        }))
      },
      ...(policy.sku === 'Premium_AzureFrontDoor' && {
        managedRules: {
          managedRuleSets: policy.managedRules.managedRuleSets.map(mrs => ({
            ruleSetType: mrs.ruleSetType,
            ruleSetVersion: mrs.ruleSetVersion,
            ...(mrs.ruleSetAction && { ruleSetAction: mrs.ruleSetAction }),
            ...(mrs.exclusions && { exclusions: mrs.exclusions }),
            ...(mrs.ruleGroupOverrides && { ruleGroupOverrides: mrs.ruleGroupOverrides })
          }))
        }
      })
    },
    tags: policy.tags
  }
}
