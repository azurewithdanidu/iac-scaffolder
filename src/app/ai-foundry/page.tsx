'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { AiChat } from '@/components/ai/AiChat'
import { AiHelp } from '@/components/ai/AiHelp'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Lightbulb, Zap } from 'lucide-react'

const helpTopics = [
  { topic: 'Azure Verified Modules (AVM)', context: 'IaC scaffolding with Bicep' },
  { topic: 'Bicep parameter files', context: 'Azure deployment best practices' },
  { topic: 'Landing Zone patterns', context: 'Enterprise Azure architecture' },
  { topic: 'CI/CD pipeline for IaC', context: 'GitHub Actions or Azure DevOps' },
  { topic: 'Azure naming conventions', context: 'Resource naming and tagging standards' },
  { topic: 'WAF policies for Azure Front Door', context: 'Web Application Firewall configuration' },
]

export default function AiFoundryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
              ← Back
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CloudBlueprint</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-10">
          <div className="mx-auto w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-4">
            <Bot className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Azure AI Foundry Integration
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Supercharge your IaC workflow with AI-powered chat and contextual help, powered by Azure AI Foundry.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-10">
          {/* AI Chat */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI Chat</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ask questions about Azure IaC, Bicep, AVM modules, naming conventions, and more.
              The assistant is powered by Azure AI Foundry and specialised for cloud infrastructure.
            </p>
            <AiChat
              title="Azure IaC Assistant"
              placeholder="e.g. How do I create a Bicep module for Key Vault?"
            />
          </div>

          {/* AI Help Topics */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI Help Topics</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click any topic below to get an instant AI-powered explanation tailored to Azure IaC.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {helpTopics.map(({ topic, context }) => (
                <Card key={topic} className="p-0 overflow-visible">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium">{topic}</CardTitle>
                    <CardDescription className="text-xs">{context}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 px-4 pt-0">
                    <AiHelp topic={topic} context={context} buttonLabel="Explain" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration note */}
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Configuration Required
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-sm text-amber-700 dark:text-amber-300">
            <p className="mb-2">
              To enable AI features, set the following environment variables in your{' '}
              <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env.local</code> file:
            </p>
            <ul className="list-disc ml-5 space-y-1 font-mono text-xs">
              <li>AZURE_AI_FOUNDRY_ENDPOINT</li>
              <li>AZURE_AI_FOUNDRY_API_KEY</li>
              <li>AZURE_AI_FOUNDRY_DEPLOYMENT_NAME <span className="font-sans">(default: gpt-4o)</span></li>
              <li>AZURE_OPENAI_API_VERSION <span className="font-sans">(default: 2024-02-01)</span></li>
            </ul>
          </CardContent>
        </Card>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2026 CloudBlueprint. Open source project for the Azure community.</p>
      </footer>
    </div>
  )
}
