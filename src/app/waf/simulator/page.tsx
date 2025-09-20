'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, ArrowLeft, Play, FileText, Upload, Download } from 'lucide-react'
import { createSamplePolicy } from '@/lib/waf'
import { exportPolicy, generateAFDARMTemplate } from '@/lib/waf'

export default function WAFSimulatorPage() {
  const [activeTab, setActiveTab] = useState<'builder' | 'curl'>('builder')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
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
                <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Request Simulator</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link 
                href="/waf/designer"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Edit Policy</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Request Lab */}
          <div>
            <div className="bg-white rounded-lg shadow">
              {/* Tab Navigation */}
              <div className="border-b">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('builder')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'builder'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Request Builder
                  </button>
                  <button
                    onClick={() => setActiveTab('curl')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'curl'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Import cURL
                  </button>
                </nav>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeTab === 'builder' ? (
                  <div className="space-y-4">
                    {/* HTTP Method & URL */}
                    <div className="grid grid-cols-4 gap-2">
                      <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                      </select>
                      <input 
                        type="text" 
                        className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="https://example.com/api/users"
                        defaultValue="https://example.com/admin/dashboard"
                      />
                    </div>

                    {/* Headers */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Headers
                      </label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Header name"
                            defaultValue="User-Agent"
                          />
                          <input 
                            type="text" 
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Header value"
                            defaultValue="sqlmap/1.5.12"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Header name"
                            defaultValue="Authorization"
                          />
                          <input 
                            type="text" 
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Header value"
                            defaultValue="Bearer token123"
                          />
                        </div>
                        <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                          + Add Header
                        </button>
                      </div>
                    </div>

                    {/* Query Parameters */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Query Parameters
                      </label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Parameter name"
                            defaultValue="returnUrl"
                          />
                          <input 
                            type="text" 
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Parameter value"
                            defaultValue="/admin/settings"
                          />
                        </div>
                        <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                          + Add Parameter
                        </button>
                      </div>
                    </div>

                    {/* Cookies */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cookies
                      </label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Cookie name"
                            defaultValue="sessionId"
                          />
                          <input 
                            type="text" 
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Cookie value"
                            defaultValue="abc123def456"
                          />
                        </div>
                        <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                          + Add Cookie
                        </button>
                      </div>
                    </div>

                    {/* Request Body */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Request Body
                      </label>
                      <textarea 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows={4}
                        placeholder="Request body content..."
                      />
                    </div>

                    {/* Client Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Client IP
                        </label>
                        <input 
                          type="text" 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="192.168.1.100"
                          defaultValue="203.0.113.123"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input 
                          type="text" 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="US"
                          defaultValue="CN"
                        />
                      </div>
                    </div>

                    {/* Run Button */}
                    <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                      <Play className="h-5 w-5" />
                      <span>Run Simulation</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paste cURL Command
                      </label>
                      <textarea 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows={8}
                        placeholder="curl -X POST 'https://example.com/api' -H 'Content-Type: application/json' -d '{&quot;data&quot;: &quot;value&quot;}'"
                        defaultValue={`curl -X GET 'https://example.com/admin/dashboard?returnUrl=/admin/settings' \\
  -H 'User-Agent: sqlmap/1.5.12' \\
  -H 'Authorization: Bearer token123' \\
  -H 'Cookie: sessionId=abc123def456'`}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Parse & Import
                      </button>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <Upload className="h-4 w-4" />
                        <span>Upload HAR</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation Results</h3>
              
              {/* Result Summary */}
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-red-800">REQUEST BLOCKED</span>
                </div>
                <p className="text-sm text-red-700">
                  Request was blocked by rule "Block Admin Paths" (Priority: 10)
                </p>
              </div>

              {/* Matched Rules */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Rule Matches</h4>
                <div className="space-y-3">
                  <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-red-800">Rule: Block Admin Paths</span>
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">BLOCK</span>
                    </div>
                    <div className="text-sm text-red-700">
                      <div><strong>Field:</strong> path</div>
                      <div><strong>Operator:</strong> startsWith</div>
                      <div><strong>Value:</strong> "/admin"</div>
                      <div><strong>Matched:</strong> "/admin/dashboard"</div>
                    </div>
                  </div>

                  <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-red-800">Rule: Block Malicious Bots</span>
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">BLOCK</span>
                    </div>
                    <div className="text-sm text-red-700">
                      <div><strong>Field:</strong> ua (User-Agent)</div>
                      <div><strong>Operator:</strong> regex</div>
                      <div><strong>Value:</strong> "(sqlmap|nikto|curl/\\d+)"</div>
                      <div><strong>Matched:</strong> "sqlmap/1.5.12"</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evaluation Trace */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Evaluation Trace</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">1. Start evaluation (0.1ms)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-600">2. Apply global exclusions (0.2ms)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">3. Evaluate managed rule sets (0.5ms)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">4. Rule "Block Admin Paths" matched - BLOCK (0.7ms)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-600">5. Evaluation terminated (0.8ms)</span>
                  </div>
                </div>
              </div>

              {/* Suggested Exclusions */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Suggested Exclusions</h4>
                <p className="text-sm text-blue-700 mb-3">
                  If this request should be allowed, consider adding these exclusions:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="bg-white p-2 rounded border">
                    <strong>Path exclusion:</strong> Exclude "/admin/dashboard" from "Block Admin Paths" rule
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <strong>User-Agent exclusion:</strong> Allow specific automation tools in testing environment
                  </div>
                </div>
              </div>

              {/* Export Results */}
              <div className="mt-6 border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Export Results</h4>
                  <div className="flex space-x-2">
                    <button 
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      onClick={() => {
                        const policy = createSamplePolicy()
                        const json = exportPolicy(policy)
                        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'waf-policy.json'
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                    >
                      <Download className="h-4 w-4" />
                      <span>Download JSON</span>
                    </button>
                    <button 
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      onClick={() => {
                        const policy = createSamplePolicy()
                        const armTemplate = generateAFDARMTemplate(policy)
                        const blob = new Blob([JSON.stringify(armTemplate, null, 2)], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'waf-policy-arm.json'
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                    >
                      <Download className="h-4 w-4" />
                      <span>ARM Template</span>
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• <strong>JSON:</strong> Raw Azure policy format for API deployment</p>
                  <p>• <strong>ARM Template:</strong> Complete deployment template with parameters</p>
                  <p>• <strong>Bicep:</strong> Modern infrastructure as code format</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
