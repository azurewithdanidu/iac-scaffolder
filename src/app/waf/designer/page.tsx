'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, Play, FileText, Save, Upload, Download, Wand2, MessageSquare, X } from 'lucide-react'
import { createSamplePolicy, exportPolicy, generateAFDARMTemplate, generateAppGWARMTemplate, generateAFDBicepTemplate, generateAppGWBicepTemplate, generateAFDBicepParamFile, generateAppGWBicepParamFile } from '@/lib/waf'

export default function WAFDesignerPage() {
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showAddRuleModal, setShowAddRuleModal] = useState(false)
  const [showAddExclusionModal, setShowAddExclusionModal] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [targetPlatform, setTargetPlatform] = useState<'AFD' | 'AppGW'>('AFD')
  const [policyMode, setPolicyMode] = useState<'Prevention' | 'Detection'>('Prevention')
  const [policyName, setPolicyName] = useState('my-waf-policy')
  const [customRules, setCustomRules] = useState<any[]>([])
  const [exclusions, setExclusions] = useState<any[]>([])
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    { role: 'assistant', content: '👋 Hi! I can help you build WAF policies. What would you like to protect against?' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [newRule, setNewRule] = useState({
    name: '',
    priority: 100,
    action: 'Block' as 'Allow' | 'Block' | 'Log',
    matchVariable: 'RequestUri' as const,
    operator: 'Contains' as const,
    matchValue: ''
  })
  const [newExclusion, setNewExclusion] = useState({
    location: 'QueryString' as const,
    key: '',
    operator: 'Equal' as const,
    value: '',
    description: ''
  })

  const handleExport = (format: string, target: 'AFD' | 'AppGW' = targetPlatform) => {
    const policy = createSamplePolicy()
    policy.target = target
    policy.mode = policyMode
    policy.name = policyName
    
    let content: string
    let filename: string
    let mimeType: string
    
    switch (format) {
      case 'json':
        content = JSON.stringify(exportPolicy(policy), null, 2)
        filename = `waf-policy-${target.toLowerCase()}.json`
        mimeType = 'application/json'
        break
      case 'arm':
        content = JSON.stringify(
          target === 'AFD' ? generateAFDARMTemplate(policy) : generateAppGWARMTemplate(policy), 
          null, 2
        )
        filename = `waf-policy-${target.toLowerCase()}-arm.json`
        mimeType = 'application/json'
        break
      case 'bicep':
        content = target === 'AFD' ? generateAFDBicepTemplate(policy) : generateAppGWBicepTemplate(policy)
        filename = `waf-policy-${target.toLowerCase()}.bicep`
        mimeType = 'text/plain'
        break
      case 'bicepparam':
        content = target === 'AFD' ? generateAFDBicepParamFile(policy) : generateAppGWBicepParamFile(policy)
        filename = `waf-policy-${target.toLowerCase()}.bicepparam`
        mimeType = 'text/plain'
        break
      default:
        return
    }
    
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800" onClick={() => setShowExportMenu(false)}>
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/waf" 
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to WAF Simulator</span>
              </Link>
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Policy Designer</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
              
              {/* Export Dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 px-2 py-1 border-b border-gray-200 dark:border-gray-600">Azure Front Door</div>
                      <button 
                        onClick={() => handleExport('json', 'AFD')}
                        className="w-full text-left px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-gray-100"
                      >
                        AFD JSON Policy
                      </button>
                      <button 
                        onClick={() => handleExport('arm', 'AFD')}
                        className="w-full text-left px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-gray-100"
                      >
                        AFD ARM Template
                      </button>
                      <button 
                        onClick={() => handleExport('bicep', 'AFD')}
                        className="w-full text-left px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-gray-100"
                      >
                        AFD Bicep Template
                      </button>
                      <button 
                        onClick={() => handleExport('bicepparam', 'AFD')}
                        className="w-full text-left px-2 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded text-gray-900 dark:text-gray-100 border-l-2 border-blue-500"
                      >
                        🎯 AFD Bicep Params (AVM)
                      </button>
                      
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 px-2 py-1 border-b border-t border-gray-200 dark:border-gray-600 mt-1">Application Gateway</div>
                      <button 
                        onClick={() => handleExport('json', 'AppGW')}
                        className="w-full text-left px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-gray-100"
                      >
                        AppGW JSON Policy
                      </button>
                      <button 
                        onClick={() => handleExport('arm', 'AppGW')}
                        className="w-full text-left px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-gray-100"
                      >
                        AppGW ARM Template
                      </button>
                      <button 
                        onClick={() => handleExport('bicep', 'AppGW')}
                        className="w-full text-left px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-gray-100"
                      >
                        AppGW Bicep Template
                      </button>
                      <button 
                        onClick={() => handleExport('bicepparam', 'AppGW')}
                        className="w-full text-left px-2 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded text-gray-900 dark:text-gray-100 border-l-2 border-blue-500"
                      >
                        🎯 AppGW Bicep Params (AVM)
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <Link 
                href="/waf/simulator"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play className="h-4 w-4" />
                <span>Test Policy</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Policy Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Policy Settings */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Policy Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Policy Name
                  </label>
                  <input 
                    type="text"
                    value={policyName}
                    onChange={(e) => setPolicyName(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="my-waf-policy"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Platform
                  </label>
                  <select 
                    value={targetPlatform}
                    onChange={(e) => setTargetPlatform(e.target.value as 'AFD' | 'AppGW')}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="AFD">Azure Front Door</option>
                    <option value="AppGW">Application Gateway</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {targetPlatform === 'AFD' ? '🚀 Supports advanced features like CAPTCHA, JS Challenge' : '⚡ Application Gateway WAF v2'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Policy Mode
                  </label>
                  <select 
                    value={policyMode}
                    onChange={(e) => setPolicyMode(e.target.value as 'Prevention' | 'Detection')}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Prevention">Prevention (Block Traffic)</option>
                    <option value="Detection">Detection (Log Only)</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowWizard(true)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm"
                  >
                    <Wand2 className="h-4 w-4" />
                    <span>Wizard</span>
                  </button>
                  <button
                    onClick={() => setShowAIChat(true)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all text-sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>AI Help</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Managed Rule Sets */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Managed Rule Sets</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">OWASP 3.2</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Core web application protection</div>
                  </div>
                  <input type="checkbox" className="rounded h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600" defaultChecked />
                </div>
                
                <div className="ml-6 space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600" defaultChecked />
                    <span className="text-sm text-gray-700 dark:text-gray-300">SQL Injection</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600" defaultChecked />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Cross-Site Scripting</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Remote File Inclusion</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Global Exclusions */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Global Exclusions</h3>
                <button 
                  onClick={() => setShowAddExclusionModal(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Exclusion
                </button>
              </div>
              
              <div className="space-y-3">
                {exclusions.length === 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Query: returnUrl</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Regex: ^/safe/.*$</div>
                      </div>
                      <button className="text-red-600 hover:text-red-700 text-sm">Remove</button>
                    </div>
                  </div>
                )}
                {exclusions.map((exclusion, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{exclusion.location}: {exclusion.key}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{exclusion.operator}: {exclusion.value}</div>
                      </div>
                      <button 
                        onClick={() => setExclusions(exclusions.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Rules Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow border border-gray-200 dark:border-gray-700">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 dark:border-gray-600">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('visual')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'visual'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    Visual Editor
                  </button>
                  <button
                    onClick={() => setActiveTab('json')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'json'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    JSON Preview
                  </button>
                </nav>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeTab === 'visual' ? (
                  <div>
                    {/* Rules List Header */}
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Rules</h3>
                      <button 
                        onClick={() => setShowAddRuleModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        + Add Rule
                      </button>
                    </div>

                    {/* Sample Rules */}
                    <div className="space-y-4">
                      {/* Rule 1 */}
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white/50 dark:bg-gray-700/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-sm font-medium">
                              10
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Block Admin Paths</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Prevent access to administrative endpoints</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs font-medium rounded">BLOCK</span>
                            <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">⋮</button>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>When:</strong> Path starts with "/admin"
                          </div>
                        </div>
                      </div>

                      {/* Rule 2 */}
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white/50 dark:bg-gray-700/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-sm font-medium">
                              20
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Block Malicious Bots</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Block known security scanning tools</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs font-medium rounded">BLOCK</span>
                            <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">⋮</button>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>When:</strong> User-Agent matches regex "(sqlmap|nikto|curl/\\d+)"
                          </div>
                        </div>
                      </div>

                      {/* Rule 3 */}
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white/50 dark:bg-gray-700/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center text-sm font-medium">
                              30
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Log Large Requests</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Monitor requests with large body size</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-medium rounded">LOG</span>
                            <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">⋮</button>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>When:</strong> Body size greater than 1 MB
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Policy JSON</h3>
                      <button className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <FileText className="h-4 w-4" />
                        <span>Copy JSON</span>
                      </button>
                    </div>
                    
                    <pre className="bg-gray-900 dark:bg-gray-800 text-green-400 dark:text-green-300 p-4 rounded-lg text-sm overflow-x-auto border border-gray-700 dark:border-gray-600">
{`{
  "target": "AFD",
  "name": "my-waf-policy",
  "mode": "Prevention",
  "rules": [
    {
      "id": "r1",
      "order": 10,
      "action": "Block",
      "type": "match",
      "description": "Block Admin Paths",
      "when": [
        {
          "field": "path",
          "op": "startsWith",
          "value": "/admin"
        }
      ]
    },
    {
      "id": "r2",
      "order": 20,
      "action": "Block",
      "type": "bot",
      "description": "Block Malicious Bots",
      "when": [
        {
          "field": "ua",
          "op": "regex",
          "value": "(sqlmap|nikto|curl/\\\\d+)"
        }
      ]
    },
    {
      "id": "r3",
      "order": 30,
      "action": "Log",
      "type": "size",
      "description": "Log Large Requests",
      "when": [
        {
          "field": "size_body",
          "op": "gt",
          "value": 1048576
        }
      ]
    }
  ],
  "exclusions": [
    {
      "location": "query",
      "key": "returnUrl",
      "op": "regex",
      "value": "^/safe/.*$",
      "description": "Allow safe return URLs"
    }
  ],
  "managedSets": [
    {
      "name": "OWASP-3.2",
      "categories": ["SQLI", "XSS"],
      "paranoia": 1
    }
  ]
}`}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowAddRuleModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Custom Rule</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new {targetPlatform} WAF rule</p>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Rule Name"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                placeholder="Priority"
                value={newRule.priority}
                onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 100 })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select
                value={newRule.action}
                onChange={(e) => setNewRule({ ...newRule, action: e.target.value as any })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="Block">Block</option>
                <option value="Allow">Allow</option>
                <option value="Log">Log</option>
                {targetPlatform === 'AFD' && <option value="Redirect">Redirect (AFD Only)</option>}
                {targetPlatform === 'AFD' && <option value="CAPTCHA">CAPTCHA (AFD Only)</option>}
                {targetPlatform === 'AFD' && <option value="JSChallenge">JS Challenge (AFD Only)</option>}
              </select>
              <select
                value={newRule.matchVariable}
                onChange={(e) => setNewRule({ ...newRule, matchVariable: e.target.value as any })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="RequestUri">Request URI</option>
                <option value="QueryString">Query String</option>
                <option value="RequestBody">Request Body</option>
                <option value="RequestHeader">Request Header</option>
                <option value="RemoteAddr">Remote Address</option>
                {targetPlatform === 'AFD' && <option value="Cookies">Cookies (AFD Only)</option>}
                {targetPlatform === 'AFD' && <option value="SocketAddr">Socket Address (AFD Only)</option>}
              </select>
              <select
                value={newRule.operator}
                onChange={(e) => setNewRule({ ...newRule, operator: e.target.value as any })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="Contains">Contains</option>
                <option value="Equal">Equals</option>
                <option value="BeginsWith">Begins With</option>
                <option value="EndsWith">Ends With</option>
                <option value="RegEx">Regex Match</option>
                {targetPlatform === 'AFD' && <option value="GeoMatch">Geo Match (AFD Only)</option>}
                {targetPlatform === 'AFD' && <option value="IPMatch">IP Match (AFD Only)</option>}
              </select>
              <input
                type="text"
                placeholder="Match Value"
                value={newRule.matchValue}
                onChange={(e) => setNewRule({ ...newRule, matchValue: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddRuleModal(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newRule.name && newRule.matchValue) {
                    setCustomRules([...customRules, {
                      name: newRule.name,
                      priority: newRule.priority,
                      action: newRule.action,
                      ruleType: 'MatchRule',
                      enabled: true,
                      matchConditions: [{
                        matchVariable: newRule.matchVariable,
                        operator: newRule.operator,
                        matchValue: [newRule.matchValue],
                        negateCondition: false
                      }]
                    }])
                    setNewRule({ name: '', priority: 100, action: 'Block', matchVariable: 'RequestUri', operator: 'Contains', matchValue: '' })
                    setShowAddRuleModal(false)
                  }
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700"
              >
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Exclusion Modal */}
      {showAddExclusionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowAddExclusionModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Global Exclusion</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Exclude request elements from WAF inspection</p>
            </div>
            <div className="p-6 space-y-4">
              <select
                value={newExclusion.location}
                onChange={(e) => setNewExclusion({ ...newExclusion, location: e.target.value as any })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="QueryString">Query String</option>
                <option value="RequestHeader">Request Header</option>
                <option value="RequestBody">Request Body</option>
                <option value="Cookies">Cookies</option>
              </select>
              <input
                type="text"
                placeholder="Selector Key (e.g., returnUrl)"
                value={newExclusion.key}
                onChange={(e) => setNewExclusion({ ...newExclusion, key: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select
                value={newExclusion.operator}
                onChange={(e) => setNewExclusion({ ...newExclusion, operator: e.target.value as any })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="Equal">Equals</option>
                <option value="StartsWith">Starts With</option>
                <option value="EndsWith">Ends With</option>
                <option value="Contains">Contains</option>
              </select>
              <input
                type="text"
                placeholder="Value/Pattern"
                value={newExclusion.value}
                onChange={(e) => setNewExclusion({ ...newExclusion, value: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ Exclusions reduce WAF protection. Only exclude trusted parameters.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddExclusionModal(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newExclusion.key && newExclusion.value) {
                    setExclusions([...exclusions, newExclusion])
                    setNewExclusion({ location: 'QueryString', key: '', operator: 'Equal', value: '', description: '' })
                    setShowAddExclusionModal(false)
                  }
                }}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Add Exclusion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowWizard(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-pink-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Wand2 className="h-6 w-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">WAF Policy Wizard</h2>
                </div>
                <button onClick={() => setShowWizard(false)} className="text-white hover:bg-white/20 rounded-lg p-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-white/90 mt-1">Step-by-step guide to build your WAF policy</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">🎯 Step 1: Choose Your Protection Level</h3>
                  <div className="space-y-2">
                    <button className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700">
                      <div className="font-semibold">🛡️ Basic Protection</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">OWASP Top 10, SQL Injection, XSS</div>
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700">
                      <div className="font-semibold">🔒 Standard Protection</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Basic + Bot Protection + Rate Limiting</div>
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700">
                      <div className="font-semibold">🚀 Advanced Protection</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Standard + Geo Blocking + CAPTCHA + Custom Rules</div>
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border-2 border-green-200 dark:border-green-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">🌐 Step 2: Application Type</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 border border-gray-200 dark:border-gray-700 text-center">
                      <div className="font-semibold">💼 Corporate Website</div>
                    </button>
                    <button className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 border border-gray-200 dark:border-gray-700 text-center">
                      <div className="font-semibold">🛒 E-Commerce</div>
                    </button>
                    <button className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 border border-gray-200 dark:border-gray-700 text-center">
                      <div className="font-semibold">📱 Mobile API</div>
                    </button>
                    <button className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 border border-gray-200 dark:border-gray-700 text-center">
                      <div className="font-semibold">🔧 Custom</div>
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">⚙️ Step 3: Review & Generate</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Wizard will auto-configure rules based on your selections</p>
                  <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold">
                    ✨ Generate Policy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Assistant */}
      {showAIChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowAIChat(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full h-[600px] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-cyan-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-6 w-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">AI Policy Assistant</h2>
                </div>
                <button onClick={() => setShowAIChat(false)} className="text-white hover:bg-white/20 rounded-lg p-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-white/90 mt-1">Chat with AI to build custom WAF rules</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && chatInput.trim()) {
                      setChatMessages([...chatMessages, 
                        { role: 'user', content: chatInput },
                        { role: 'assistant', content: '🤖 I understand you want to add protection for: ' + chatInput + '. Let me help you create a custom rule for that. Would you like to block, log, or redirect this traffic?' }
                      ])
                      setChatInput('')
                    }
                  }}
                  placeholder="e.g., I want to block SQL injection attempts"
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => {
                    if (chatInput.trim()) {
                      setChatMessages([...chatMessages, 
                        { role: 'user', content: chatInput },
                        { role: 'assistant', content: '🤖 I understand you want to add protection for: ' + chatInput + '. Let me help you create a custom rule for that. Would you like to block, log, or redirect this traffic?' }
                      ])
                      setChatInput('')
                    }
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
