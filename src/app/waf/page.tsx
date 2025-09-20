'use client'

import Link from 'next/link'
import { Shield, FileText, TestTube, Download, Zap } from 'lucide-react'

export default function WAFSimulatorLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WAF Rule Simulator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Back to CloudBlueprint
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Design, Test & Document
            <span className="block text-blue-600 dark:text-blue-400">WAF Policies</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            A browser-based simulator for Azure Front Door and Application Gateway Web Application Firewall policies. 
            Rapidly iterate, test with confidence, and export compliant policies.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/waf/designer"
              className="bg-blue-600 dark:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Shield className="h-5 w-5" />
              <span>Start Designing</span>
            </Link>
            <Link 
              href="/waf/simulator"
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
            >
              <Zap className="h-5 w-5" />
              <span>Test Requests</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Everything you need for WAF policy management
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Policy Designer */}
            <Link href="/waf/designer" className="group">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Policy Designer</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Visual editor with JSON preview. Design custom rules, manage exclusions, and configure managed rule sets.
                </p>
              </div>
            </Link>

            {/* Request Simulator */}
            <Link href="/waf/simulator" className="group">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <Zap className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Request Simulator</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Test policies against crafted requests. Import cURL commands and see detailed match traces.
                </p>
              </div>
            </Link>

            {/* Test Packs */}
            <Link href="/waf/packs" className="group">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <TestTube className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Test Packs</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Create test suites with expected outcomes. Export for CI/CD and track regression testing.
                </p>
              </div>
            </Link>

            {/* Export & Documentation */}
            <Link href="/waf/export" className="group">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <Download className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Export & Docs</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Generate Azure-shaped policy JSON and comprehensive Markdown documentation.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Production Risk</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Test policies safely before deployment. Prevent false positives and emergency rollbacks.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Clear Documentation</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Auto-generate comprehensive policy documentation with rule explanations and examples.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TestTube className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">CI/CD Integration</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Export test packs for automated regression testing in your deployment pipelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 dark:bg-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to secure your applications?</h3>
          <p className="text-xl mb-8 text-blue-100 dark:text-blue-200">
            Start designing and testing WAF policies that protect without breaking functionality.
          </p>
          <Link 
            href="/waf/designer"
            className="bg-white dark:bg-gray-100 text-blue-600 dark:text-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-200 transition-colors inline-flex items-center space-x-2"
          >
            <Shield className="h-5 w-5" />
            <span>Get Started Now</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 dark:text-gray-500">
            WAF Rule Simulator - Part of the CloudBlueprint Azure Infrastructure Toolkit
          </p>
        </div>
      </footer>
    </div>
  )
}
