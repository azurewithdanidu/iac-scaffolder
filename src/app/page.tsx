"use client"

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot, Code, FileCode, Layers } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CloudBlueprint</h1>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Azure Infrastructure Made Simple
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Generate production-ready Azure Infrastructure as Code repositories with enterprise best practices, 
            naming conventions, and CI/CD pipelines in minutes.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="h-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>IaC Scaffolder</CardTitle>
              <CardDescription>
                Generate complete Azure Infrastructure as Code repositories with Bicep modules and CI/CD pipelines
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/wizard">
                <Button className="w-full">Get Started</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="h-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Workload Builder</CardTitle>
              <CardDescription>
                Select Azure services and generate Bicep templates with Azure Verified Module (AVM) references
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/workload-builder">
                <Button className="w-full">Build Workload</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="h-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <FileCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>AFD WAF Rule Designer</CardTitle>
              <CardDescription>
                Design, test, and export Azure Front Door WAF policies with AVM-compatible Bicep parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/waf/afd-designer">
                <Button className="w-full">Launch Designer</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>AI Foundry</CardTitle>
              <CardDescription>
                AI-powered chat and contextual help for Azure IaC, Bicep, and AVM modules via Azure AI Foundry
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/ai-foundry">
                <Button className="w-full">Open AI Assistant</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-16">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Why CloudBlueprint?
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h4 className="font-semibold text-lg mb-2">Enterprise Ready</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Built with enterprise best practices, security standards, and governance patterns.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Zero Backend</h4>
              <p className="text-gray-600 dark:text-gray-300">
                100% client-side generation. No data leaves your browser. No servers to maintain.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Production Tested</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Templates tested in real-world scenarios with proper naming conventions and module structure.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2026 CloudBlueprint. Open source project for the Azure community.</p>
      </footer>
    </div>
  )
}
