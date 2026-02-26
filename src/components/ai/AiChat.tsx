'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Send, User, X, Minimize2, Maximize2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AiChatProps {
  systemPrompt?: string
  placeholder?: string
  title?: string
}

export function AiChat({
  systemPrompt,
  placeholder = 'Ask about Azure IaC, Bicep, AVM modules...',
  title = 'AI Assistant',
}: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, minimized])

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMessage: Message = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, systemPrompt }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to get a response.')
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: data.message }])
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearMessages() {
    setMessages([])
    setError(null)
  }

  return (
    <Card className="flex flex-col shadow-lg border border-blue-200 dark:border-blue-800 w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-blue-600 dark:bg-blue-800 rounded-t-lg">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Bot className="w-5 h-5" />
          {title}
        </CardTitle>
        <div className="flex gap-1">
          <button
            onClick={() => setMinimized((m) => !m)}
            className="text-white/80 hover:text-white transition-colors p-1"
            aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
          >
            {minimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="text-white/80 hover:text-white transition-colors p-1"
              aria-label="Clear chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </CardHeader>

      {!minimized && (
        <CardContent className="flex flex-col p-0">
          {/* Messages */}
          <div className="flex flex-col gap-3 p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm gap-2 pt-8">
                <Bot className="w-10 h-10 opacity-40" />
                <p>Ask me anything about Azure IaC, Bicep, or AVM modules.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 animate-pulse">
                  Thinking…
                </div>
              </div>
            )}
            {error && (
              <div className="text-sm text-red-500 dark:text-red-400 px-1">{error}</div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              size="sm"
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
