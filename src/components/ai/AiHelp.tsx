'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, HelpCircle, X, Loader2 } from 'lucide-react'

interface AiHelpProps {
  topic: string
  context?: string
  buttonLabel?: string
}

export function AiHelp({ topic, context, buttonLabel = 'AI Help' }: AiHelpProps) {
  const [open, setOpen] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchHelp() {
    if (answer) {
      setOpen(true)
      return
    }
    setOpen(true)
    setLoading(true)
    setError(null)

    const userMessage = context
      ? `Explain "${topic}" in the context of: ${context}`
      : `Explain "${topic}" for Azure Infrastructure as Code using Bicep and AVM.`

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          systemPrompt:
            'You are an Azure IaC expert. Provide a concise, clear explanation (2-4 sentences) suitable for an inline help tooltip. Focus on practical guidance.',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to get help content.')
      } else {
        setAnswer(data.message)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        size="sm"
        onClick={fetchHelp}
        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        {buttonLabel}
      </Button>

      {open && (
        <Card className="absolute z-50 top-full mt-2 left-0 w-72 shadow-xl border border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between py-2 px-3 bg-blue-50 dark:bg-blue-950 rounded-t-lg">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-1.5">
              <Bot className="w-4 h-4" />
              AI Help: {topic}
            </CardTitle>
            <button
              onClick={() => setOpen(false)}
              className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 transition-colors"
              aria-label="Close help"
            >
              <X className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
            {loading && (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading explanation…
              </div>
            )}
            {error && <p className="text-red-500 dark:text-red-400">{error}</p>}
            {answer && <p className="whitespace-pre-wrap">{answer}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
