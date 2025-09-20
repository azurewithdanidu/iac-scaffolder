// ==========================================================================================
// WAF Rule Simulator - Core Evaluation Engine
// ==========================================================================================
// Implementation of the rules evaluation engine that processes HTTP requests
// against WAF policies with proper ordering and evaluation semantics
// ==========================================================================================

import {
  PolicyModel,
  HttpRequest,
  EvaluationResult,
  RuleMatch,
  ConditionMatch,
  EvaluationTrace,
  Rule,
  Condition,
  Exclusion,
  RuleAction,
  ConditionField,
  ConditionOperator,
  ExclusionLocation
} from './model'

// ==========================================================================================
// Core Evaluation Engine
// ==========================================================================================

/**
 * Evaluate an HTTP request against a WAF policy
 * @param policy The WAF policy to evaluate against
 * @param request The HTTP request to evaluate
 * @returns Detailed evaluation result with traces and matches
 */
export function evaluateRequest(policy: PolicyModel, request: HttpRequest): EvaluationResult {
  const startTime = performance.now()
  const trace: EvaluationTrace[] = []
  const matchedRules: RuleMatch[] = []
  
  let currentStep = 1
  let finalAction: RuleAction = 'Allow'
  let finalBlocked = false
  let finalRedirectUrl: string | undefined
  let terminated = false

  // Add initial trace
  addTrace(trace, currentStep++, 'INIT', 'evaluate', 'Starting request evaluation', startTime)

  try {
    // Step 1: Apply global exclusions
    const processedRequest = applyGlobalExclusions(request, policy.exclusions || [], trace, currentStep++)
    
    // Step 2: Evaluate managed rule sets (if any)
    if (policy.managedSets && policy.managedSets.length > 0) {
      addTrace(trace, currentStep++, 'MANAGED', 'evaluate', 'Evaluating managed rule sets', startTime)
      // Note: For MVP, managed sets are stubbed - in a real implementation,
      // this would contain the actual OWASP Core Rule Set logic
    }

    // Step 3: Evaluate custom rules in order
    const sortedRules = [...policy.rules].sort((a, b) => a.order - b.order)
    
    for (const rule of sortedRules) {
      if (rule.disabled) {
        addTrace(trace, currentStep++, rule.id, 'skip', `Rule disabled`, startTime)
        continue
      }

      addTrace(trace, currentStep++, rule.id, 'evaluate', `Evaluating rule: ${rule.description || rule.id}`, startTime)
      
      const ruleMatch = evaluateRule(rule, processedRequest, trace, currentStep++)
      
      if (ruleMatch.matchedConditions.length > 0) {
        matchedRules.push(ruleMatch)
        
        // Log actions are non-terminal
        if (rule.action === 'Log') {
          addTrace(trace, currentStep++, rule.id, 'match', `Rule matched - ${rule.action} (non-terminal)`, startTime)
          continue
        }
        
        // Terminal actions (Allow, Block, Redirect)
        finalAction = rule.action
        finalBlocked = rule.action === 'Block'
        finalRedirectUrl = rule.action === 'Redirect' ? rule.redirectUrl : undefined
        terminated = true
        
        addTrace(trace, currentStep++, rule.id, 'terminal', `Rule matched - ${rule.action} (terminal)`, startTime)
        break
      }
    }

    if (!terminated) {
      addTrace(trace, currentStep++, 'FINAL', 'terminal', 'No blocking rules matched - Allow', startTime)
    }

  } catch (error) {
    addTrace(trace, currentStep++, 'ERROR', 'evaluate', `Evaluation error: ${error}`, startTime)
    finalAction = 'Block' // Fail secure
    finalBlocked = true
  }

  const endTime = performance.now()
  const processingTime = endTime - startTime

  addTrace(trace, currentStep++, 'COMPLETE', 'evaluate', `Evaluation complete in ${processingTime.toFixed(2)}ms`, startTime)

  return {
    action: finalAction,
    blocked: finalBlocked,
    matchedRules,
    trace,
    redirectUrl: finalRedirectUrl,
    processingTime
  }
}

// ==========================================================================================
// Rule Evaluation
// ==========================================================================================

/**
 * Evaluate a single rule against a request
 */
function evaluateRule(rule: Rule, request: HttpRequest, trace: EvaluationTrace[], stepCounter: number): RuleMatch {
  const matchedConditions: ConditionMatch[] = []
  
  // All conditions must match (AND logic by default)
  for (const condition of rule.when) {
    const conditionMatch = evaluateCondition(condition, request)
    if (conditionMatch) {
      matchedConditions.push(conditionMatch)
    }
  }
  
  // Rule matches if ALL conditions match
  const ruleMatches = matchedConditions.length === rule.when.length
  const terminal = ruleMatches && rule.action !== 'Log'
  
  return {
    rule,
    matchedConditions,
    action: rule.action,
    terminal
  }
}

/**
 * Evaluate a single condition against a request
 */
function evaluateCondition(condition: Condition, request: HttpRequest): ConditionMatch | null {
  const fieldValue = extractFieldValue(condition.field, condition.key, request)
  
  if (fieldValue === null || fieldValue === undefined) {
    return null
  }

  // Apply transforms if specified
  const transformedValue = applyTransforms(fieldValue, condition.transform)
  
  // Evaluate the condition
  const matches = evaluateOperator(condition.op, transformedValue, condition.value)
  
  // Apply negation if specified
  const finalMatch = condition.negate ? !matches : matches
  
  if (finalMatch) {
    return {
      condition,
      matchedValue: transformedValue,
      evidence: `${condition.field}${condition.key ? `[${condition.key}]` : ''} ${condition.op} ${condition.value} (matched: "${transformedValue}")`
    }
  }
  
  return null
}

// ==========================================================================================
// Field Value Extraction
// ==========================================================================================

/**
 * Extract field value from HTTP request based on condition field
 */
function extractFieldValue(field: ConditionField, key: string | undefined, request: HttpRequest): string | null {
  switch (field) {
    case 'path':
      return request.path
    
    case 'method':
      return request.method
    
    case 'query':
      if (!key) return null
      const queryValue = request.query[key]
      return Array.isArray(queryValue) ? queryValue[0] : queryValue || null
    
    case 'header':
      if (!key) return null
      return request.headers[key.toLowerCase()] || null
    
    case 'cookie':
      if (!key) return null
      return request.cookies[key] || null
    
    case 'body':
      return request.body || null
    
    case 'ip':
      return request.clientIp || null
    
    case 'country':
      return request.country || null
    
    case 'ua':
      return request.userAgent || request.headers['user-agent'] || null
    
    case 'size_body':
      return request.body ? request.body.length.toString() : '0'
    
    case 'size_header':
      const headerSize = Object.entries(request.headers)
        .reduce((total, [name, value]) => total + name.length + value.length + 4, 0) // +4 for ": " and "\r\n"
      return headerSize.toString()
    
    case 'rate':
      // For simulation purposes, return a static value
      // In a real implementation, this would check request rate
      return '1'
    
    default:
      return null
  }
}

// ==========================================================================================
// Operator Evaluation
// ==========================================================================================

/**
 * Evaluate an operator against field and condition values
 */
function evaluateOperator(operator: ConditionOperator, fieldValue: string, conditionValue: string | string[] | number | undefined): boolean {
  if (conditionValue === undefined) return false
  
  const fieldStr = fieldValue.toString()
  
  switch (operator) {
    case 'equals':
      if (Array.isArray(conditionValue)) {
        return conditionValue.some(val => fieldStr === val.toString())
      }
      return fieldStr === conditionValue.toString()
    
    case 'contains':
      if (Array.isArray(conditionValue)) {
        return conditionValue.some(val => fieldStr.includes(val.toString()))
      }
      return fieldStr.includes(conditionValue.toString())
    
    case 'startsWith':
      if (Array.isArray(conditionValue)) {
        return conditionValue.some(val => fieldStr.startsWith(val.toString()))
      }
      return fieldStr.startsWith(conditionValue.toString())
    
    case 'endsWith':
      if (Array.isArray(conditionValue)) {
        return conditionValue.some(val => fieldStr.endsWith(val.toString()))
      }
      return fieldStr.endsWith(conditionValue.toString())
    
    case 'regex':
      try {
        const pattern = Array.isArray(conditionValue) ? conditionValue[0].toString() : conditionValue.toString()
        const regex = new RegExp(pattern, 'i') // Case insensitive by default
        return regex.test(fieldStr)
      } catch {
        return false // Invalid regex
      }
    
    case 'wildcard':
      try {
        const pattern = Array.isArray(conditionValue) ? conditionValue[0].toString() : conditionValue.toString()
        // Convert wildcard to regex: * becomes .*, ? becomes .
        const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
        const regex = new RegExp(`^${regexPattern}$`, 'i')
        return regex.test(fieldStr)
      } catch {
        return false
      }
    
    case 'in':
      if (!Array.isArray(conditionValue)) {
        return fieldStr === conditionValue.toString()
      }
      return conditionValue.some(val => fieldStr === val.toString())
    
    case 'gt':
      const fieldNum = parseFloat(fieldStr)
      const conditionNum = typeof conditionValue === 'number' ? conditionValue : parseFloat(conditionValue.toString())
      return !isNaN(fieldNum) && !isNaN(conditionNum) && fieldNum > conditionNum
    
    case 'lt':
      const fieldNumLt = parseFloat(fieldStr)
      const conditionNumLt = typeof conditionValue === 'number' ? conditionValue : parseFloat(conditionValue.toString())
      return !isNaN(fieldNumLt) && !isNaN(conditionNumLt) && fieldNumLt < conditionNumLt
    
    default:
      return false
  }
}

// ==========================================================================================
// Transform Functions
// ==========================================================================================

/**
 * Apply transforms to field value before evaluation
 */
function applyTransforms(value: string, transforms?: string[]): string {
  if (!transforms || transforms.length === 0) {
    return value
  }
  
  let result = value
  
  for (const transform of transforms) {
    switch (transform) {
      case 'lowercase':
        result = result.toLowerCase()
        break
      case 'uppercase':
        result = result.toUpperCase()
        break
      case 'trim':
        result = result.trim()
        break
      case 'urldecode':
        try {
          result = decodeURIComponent(result)
        } catch {
          // Invalid URL encoding, keep original
        }
        break
      case 'htmldecode':
        result = result
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, '/')
        break
      case 'removecomments':
        // Remove HTML/XML comments
        result = result.replace(/<!--[\s\S]*?-->/g, '')
        break
      case 'removenulls':
        result = result.replace(/\0/g, '')
        break
      case 'removewhitespace':
        result = result.replace(/\s+/g, '')
        break
    }
  }
  
  return result
}

// ==========================================================================================
// Exclusion Logic
// ==========================================================================================

/**
 * Apply global exclusions to the request
 */
function applyGlobalExclusions(request: HttpRequest, exclusions: Exclusion[], trace: EvaluationTrace[], step: number): HttpRequest {
  if (exclusions.length === 0) {
    addTrace(trace, step, 'EXCLUSIONS', 'evaluate', 'No global exclusions to apply', performance.now())
    return request
  }
  
  addTrace(trace, step, 'EXCLUSIONS', 'evaluate', `Applying ${exclusions.length} global exclusions`, performance.now())
  
  // Create a copy of the request to modify
  const processedRequest: HttpRequest = {
    ...request,
    query: { ...request.query },
    headers: { ...request.headers },
    cookies: { ...request.cookies }
  }
  
  for (const exclusion of exclusions) {
    applyExclusion(processedRequest, exclusion)
  }
  
  return processedRequest
}

/**
 * Apply a single exclusion to the request
 */
function applyExclusion(request: HttpRequest, exclusion: Exclusion): void {
  const shouldExclude = evaluateExclusionMatch(exclusion, request)
  
  if (shouldExclude) {
    switch (exclusion.location) {
      case 'query':
        if (request.query[exclusion.key]) {
          delete request.query[exclusion.key]
        }
        break
      case 'header':
        if (request.headers[exclusion.key.toLowerCase()]) {
          delete request.headers[exclusion.key.toLowerCase()]
        }
        break
      case 'cookie':
        if (request.cookies[exclusion.key]) {
          delete request.cookies[exclusion.key]
        }
        break
      case 'body':
        // For body exclusions, we would need more sophisticated logic
        // For now, just mark as excluded (implementation would depend on content type)
        break
    }
  }
}

/**
 * Evaluate if an exclusion should be applied
 */
function evaluateExclusionMatch(exclusion: Exclusion, request: HttpRequest): boolean {
  let fieldValue: string | null = null
  
  switch (exclusion.location) {
    case 'query':
      const queryValue = request.query[exclusion.key]
      fieldValue = Array.isArray(queryValue) ? queryValue[0] : queryValue || null
      break
    case 'header':
      fieldValue = request.headers[exclusion.key.toLowerCase()] || null
      break
    case 'cookie':
      fieldValue = request.cookies[exclusion.key] || null
      break
    case 'body':
      fieldValue = request.body || null
      break
  }
  
  if (!fieldValue) return false
  
  switch (exclusion.op) {
    case 'equals':
      return fieldValue === exclusion.value
    case 'contains':
      return fieldValue.includes(exclusion.value)
    case 'regex':
      try {
        const regex = new RegExp(exclusion.value, 'i')
        return regex.test(fieldValue)
      } catch {
        return false
      }
    default:
      return false
  }
}

// ==========================================================================================
// Utility Functions
// ==========================================================================================

/**
 * Add a trace entry to the evaluation log
 */
function addTrace(
  trace: EvaluationTrace[], 
  step: number, 
  ruleId: string, 
  action: EvaluationTrace['action'], 
  details: string, 
  startTime: number
): void {
  trace.push({
    step,
    ruleId,
    action,
    details,
    timestamp: performance.now() - startTime
  })
}

/**
 * Validate a policy for common issues
 */
export function validatePolicy(policy: PolicyModel): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check for required fields
  if (!policy.name || policy.name.trim().length === 0) {
    errors.push('Policy name is required')
  }
  
  if (!policy.target) {
    errors.push('Target platform (AFD/AppGW) is required')
  }
  
  if (!policy.mode) {
    errors.push('Policy mode (Prevention/Detection) is required')
  }
  
  // Check rules
  if (!policy.rules || policy.rules.length === 0) {
    warnings.push('Policy has no custom rules defined')
  } else {
    // Check for duplicate rule orders
    const orders = policy.rules.map(r => r.order)
    const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index)
    if (duplicateOrders.length > 0) {
      errors.push(`Duplicate rule orders found: ${duplicateOrders.join(', ')}`)
    }
    
    // Check for rules without conditions
    const rulesWithoutConditions = policy.rules.filter(r => !r.when || r.when.length === 0)
    if (rulesWithoutConditions.length > 0) {
      errors.push(`Rules without conditions: ${rulesWithoutConditions.map(r => r.id).join(', ')}`)
    }
    
    // Check for redirect rules without URL
    const redirectRulesWithoutUrl = policy.rules.filter(r => r.action === 'Redirect' && !r.redirectUrl)
    if (redirectRulesWithoutUrl.length > 0) {
      errors.push(`Redirect rules without URL: ${redirectRulesWithoutUrl.map(r => r.id).join(', ')}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Create a sample policy for testing
 */
export function createSamplePolicy(): PolicyModel {
  return {
    target: 'AFD',
    name: 'sample-policy',
    mode: 'Prevention',
    rules: [
      {
        id: 'r1',
        order: 10,
        action: 'Block',
        type: 'match',
        description: 'Block Admin Paths',
        when: [
          {
            field: 'path',
            op: 'startsWith',
            value: '/admin'
          }
        ]
      },
      {
        id: 'r2',
        order: 20,
        action: 'Block',
        type: 'bot',
        description: 'Block Malicious Bots',
        when: [
          {
            field: 'ua',
            op: 'regex',
            value: '(sqlmap|nikto|curl/\\d+)'
          }
        ]
      },
      {
        id: 'r3',
        order: 30,
        action: 'Log',
        type: 'size',
        description: 'Log Large Requests',
        when: [
          {
            field: 'size_body',
            op: 'gt',
            value: 1048576
          }
        ]
      }
    ],
    exclusions: [
      {
        location: 'query',
        key: 'returnUrl',
        op: 'regex',
        value: '^/safe/.*$',
        description: 'Allow safe return URLs'
      }
    ],
    managedSets: [
      {
        name: 'OWASP-3.2',
        categories: ['SQLI', 'XSS'],
        paranoia: 1
      }
    ]
  }
}

/**
 * Create a sample HTTP request for testing
 */
export function createSampleRequest(): HttpRequest {
  return {
    method: 'GET',
    url: 'https://example.com/admin/dashboard?returnUrl=/admin/settings',
    path: '/admin/dashboard',
    query: {
      returnUrl: '/admin/settings'
    },
    headers: {
      'user-agent': 'sqlmap/1.5.12',
      'authorization': 'Bearer token123',
      'content-type': 'application/json'
    },
    cookies: {
      sessionId: 'abc123def456'
    },
    body: undefined,
    clientIp: '203.0.113.123',
    userAgent: 'sqlmap/1.5.12',
    country: 'CN'
  }
}
