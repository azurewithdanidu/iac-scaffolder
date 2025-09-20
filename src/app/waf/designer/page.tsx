'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, Play, FileText, Save, Upload, Download } from 'lucide-react'
import { createSamplePolicy, exportPolicy, generateAFDARMTemplate, generateAppGWARMTemplate, generateAFDBicepTemplate, generateAppGWBicepTemplate } from '@/lib/waf'

export default function WAFDesignerPage() {
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual')
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleExport = (format: string, target: 'AFD' | 'AppGW' = 'AFD') => {
    const policy = createSamplePolicy()
    policy.target = target
    
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
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="my-waf-policy"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Platform
                  </label>
                  <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="AFD">Azure Front Door</option>
                    <option value="AppGW">Application Gateway</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Policy Mode
                  </label>
                  <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="Prevention">Prevention (Block Traffic)</option>
                    <option value="Detection">Detection (Log Only)</option>
                  </select>
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
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  + Add Exclusion
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Query: returnUrl</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Regex: ^/safe/.*$</div>
                    </div>
                    <button className="text-red-600 hover:text-red-700 text-sm">Remove</button>
                  </div>
                </div>
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
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
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
    </div>
  )
}
