// ==========================================================================================
// WAF Rule Simulator - Core Data Model
// ==========================================================================================
// TypeScript interfaces for the internal normalized policy model
// Based on the specification in .github/copilot-instruction2.md
// ==========================================================================================

export type PolicyTarget = 'AFD' | 'AppGW';
export type PolicyMode = 'Prevention' | 'Detection';
export type RuleAction = 'Allow' | 'Block' | 'Log' | 'Redirect';
export type RuleType = 'match' | 'ip' | 'geo' | 'method' | 'size' | 'rate' | 'bot';

export type ConditionField = 
  | 'path' | 'query' | 'header' | 'cookie' | 'body' 
  | 'ip' | 'country' | 'method' | 'ua' 
  | 'size_body' | 'size_header' | 'rate';

export type ConditionOperator = 
  | 'equals' | 'contains' | 'startsWith' | 'endsWith' 
  | 'wildcard' | 'regex' | 'in' | 'gt' | 'lt';

export type ExclusionLocation = 'header' | 'cookie' | 'query' | 'body';
export type ExclusionOperator = 'equals' | 'contains' | 'regex';

// ==========================================================================================
// Core Interfaces
// ==========================================================================================

/**
 * Internal normalized policy model
 */
export interface PolicyModel {
  /** Target platform: Azure Front Door or Application Gateway */
  target: PolicyTarget;
  /** Policy name */
  name: string;
  /** Policy mode: Prevention blocks traffic, Detection only logs */
  mode: PolicyMode;
  /** Ordered list of rules to evaluate */
  rules: Rule[];
  /** Global exclusions applied before rule evaluation */
  exclusions: Exclusion[];
  /** Managed rule sets (OWASP categories, etc.) */
  managedSets?: ManagedSet[];
  /** Policy metadata */
  metadata?: PolicyMetadata;
}

/**
 * Individual WAF rule
 */
export interface Rule {
  /** Unique rule identifier */
  id: string;
  /** Action to take when rule matches */
  action: RuleAction;
  /** Type of rule for categorization */
  type: RuleType;
  /** Whether rule is disabled */
  disabled?: boolean;
  /** Evaluation order (ascending) */
  order: number;
  /** Conditions that must match (AND logic by default) */
  when: Condition[];
  /** Redirect URL for Redirect actions */
  redirectUrl?: string;
  /** Human-readable rule description */
  description?: string;
  /** Rule group for organization */
  group?: string;
}

/**
 * Rule condition for matching requests
 */
export interface Condition {
  /** Field to evaluate */
  field: ConditionField;
  /** Field key (e.g., header name, query parameter) */
  key?: string;
  /** Comparison operator */
  op: ConditionOperator;
  /** Value(s) to compare against */
  value?: string | string[] | number;
  /** Whether to negate the condition */
  negate?: boolean;
  /** Transform to apply before matching */
  transform?: Transform[];
}

/**
 * Global exclusion rule
 */
export interface Exclusion {
  /** Location of the field to exclude */
  location: ExclusionLocation;
  /** Field key to exclude */
  key: string;
  /** Operator for matching exclusion */
  op: ExclusionOperator;
  /** Value pattern for exclusion */
  value: string;
  /** Description of why this exclusion exists */
  description?: string;
}

/**
 * Managed rule set configuration
 */
export interface ManagedSet {
  /** Name of the managed rule set */
  name: string;
  /** Version of the rule set */
  version?: string;
  /** Enabled categories within the set */
  categories: string[];
  /** Paranoia level or sensitivity */
  paranoia?: number;
  /** Rule set specific exclusions */
  exclusions?: ManagedSetExclusion[];
}

/**
 * Exclusion specific to managed rule sets
 */
export interface ManagedSetExclusion {
  /** Managed rule ID to exclude */
  ruleId: string;
  /** Location to exclude */
  location: ExclusionLocation;
  /** Field key */
  key: string;
  /** Operator */
  op: ExclusionOperator;
  /** Value pattern */
  value: string;
}

/**
 * Transform operations
 */
export type Transform = 
  | 'lowercase' | 'uppercase' | 'trim' 
  | 'urldecode' | 'htmldecode' | 'removecomments'
  | 'removenulls' | 'removewhitespace';

/**
 * Policy metadata
 */
export interface PolicyMetadata {
  /** Policy version */
  version?: string;
  /** Author information */
  author?: string;
  /** Creation timestamp */
  created?: string;
  /** Last modified timestamp */
  modified?: string;
  /** Policy description */
  description?: string;
  /** Tags for categorization */
  tags?: string[];
}

// ==========================================================================================
// Request and Response Models
// ==========================================================================================

/**
 * HTTP request for testing
 */
export interface HttpRequest {
  /** HTTP method */
  method: string;
  /** Request URL */
  url: string;
  /** Request path */
  path: string;
  /** Query parameters */
  query: Record<string, string | string[]>;
  /** Request headers */
  headers: Record<string, string>;
  /** Cookies */
  cookies: Record<string, string>;
  /** Request body */
  body?: string;
  /** Client IP address */
  clientIp?: string;
  /** User agent */
  userAgent?: string;
  /** Geographic country code */
  country?: string;
}

/**
 * Evaluation result for a request
 */
export interface EvaluationResult {
  /** Final action taken */
  action: RuleAction;
  /** Whether request was blocked */
  blocked: boolean;
  /** Rules that matched during evaluation */
  matchedRules: RuleMatch[];
  /** Evaluation trace for debugging */
  trace: EvaluationTrace[];
  /** Redirect URL if action is Redirect */
  redirectUrl?: string;
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Individual rule match result
 */
export interface RuleMatch {
  /** Rule that matched */
  rule: Rule;
  /** Conditions that matched */
  matchedConditions: ConditionMatch[];
  /** Action taken by this rule */
  action: RuleAction;
  /** Whether this was the terminal rule */
  terminal: boolean;
}

/**
 * Condition match details
 */
export interface ConditionMatch {
  /** Condition that matched */
  condition: Condition;
  /** Actual field value that was matched */
  matchedValue: string;
  /** Evidence of the match */
  evidence: string;
}

/**
 * Evaluation trace entry
 */
export interface EvaluationTrace {
  /** Step number in evaluation */
  step: number;
  /** Rule being evaluated */
  ruleId: string;
  /** Action taken */
  action: 'evaluate' | 'match' | 'skip' | 'exclude' | 'terminal';
  /** Details about this step */
  details: string;
  /** Timestamp of evaluation step */
  timestamp: number;
}

// ==========================================================================================
// Test Pack Models
// ==========================================================================================

/**
 * Test pack configuration
 */
export interface TestPack {
  /** Test pack name */
  name: string;
  /** Description */
  description?: string;
  /** Version */
  version?: string;
  /** Test cases */
  tests: TestCase[];
  /** Pack metadata */
  metadata?: TestPackMetadata;
}

/**
 * Individual test case
 */
export interface TestCase {
  /** Test case name */
  name: string;
  /** Description */
  description?: string;
  /** Request to test */
  request: HttpRequest;
  /** Expected evaluation result */
  expected: ExpectedResult;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Expected test result
 */
export interface ExpectedResult {
  /** Expected final action */
  action: RuleAction;
  /** Expected blocked status */
  blocked: boolean;
  /** Expected matched rule IDs */
  matchedRuleIds?: string[];
  /** Expected redirect URL */
  redirectUrl?: string;
}

/**
 * Test pack metadata
 */
export interface TestPackMetadata {
  /** Author */
  author?: string;
  /** Creation date */
  created?: string;
  /** Target application */
  application?: string;
  /** Environment */
  environment?: string;
}

/**
 * Test execution result
 */
export interface TestExecutionResult {
  /** Test pack that was executed */
  testPack: TestPack;
  /** Individual test results */
  results: TestCaseResult[];
  /** Summary statistics */
  summary: TestSummary;
  /** Execution timestamp */
  timestamp: string;
}

/**
 * Result for individual test case
 */
export interface TestCaseResult {
  /** Test case that was executed */
  testCase: TestCase;
  /** Actual evaluation result */
  actual: EvaluationResult;
  /** Whether test passed */
  passed: boolean;
  /** Failure reason if test failed */
  failureReason?: string;
}

/**
 * Test execution summary
 */
export interface TestSummary {
  /** Total number of tests */
  total: number;
  /** Number of passed tests */
  passed: number;
  /** Number of failed tests */
  failed: number;
  /** Pass percentage */
  passRate: number;
  /** Total execution time */
  executionTime: number;
}

// ==========================================================================================
// Export Models
// ==========================================================================================

/**
 * Export configuration
 */
export interface ExportConfig {
  /** Target platform for export */
  target: PolicyTarget;
  /** Include documentation */
  includeDocumentation: boolean;
  /** Include test packs */
  includeTestPacks: boolean;
  /** Documentation format */
  documentationFormat: 'markdown' | 'html' | 'pdf';
  /** Export metadata */
  metadata?: ExportMetadata;
}

/**
 * Export metadata
 */
export interface ExportMetadata {
  /** Export timestamp */
  timestamp: string;
  /** Exported by */
  exportedBy?: string;
  /** Export version */
  version?: string;
  /** Export description */
  description?: string;
}

/**
 * Validation result for policies
 */
export interface ValidationResult {
  /** Whether policy is valid */
  valid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Location of error */
  location?: string;
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Location of warning */
  location?: string;
  /** Suggested fix */
  suggestion?: string;
}
