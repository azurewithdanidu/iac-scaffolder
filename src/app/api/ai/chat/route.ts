import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages, systemPrompt } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const endpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT
    const apiKey = process.env.AZURE_AI_FOUNDRY_API_KEY
    const deploymentName = process.env.AZURE_AI_FOUNDRY_DEPLOYMENT_NAME || 'gpt-4o'
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01'

    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: 'Azure AI Foundry is not configured. Please set AZURE_AI_FOUNDRY_ENDPOINT and AZURE_AI_FOUNDRY_API_KEY environment variables.' },
        { status: 503 }
      )
    }

    const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`

    const defaultSystemPrompt =
      'You are an Azure Infrastructure expert assistant integrated into CloudBlueprint. ' +
      'You help users design, scaffold, and understand Azure Infrastructure as Code (IaC) using Bicep, ' +
      'Azure Verified Modules (AVM), and CI/CD pipelines. ' +
      'Provide concise, accurate, and actionable guidance.'

    const body = {
      messages: [
        { role: 'system', content: systemPrompt || defaultSystemPrompt },
        ...messages,
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Azure AI Foundry error:', errorText)
      return NextResponse.json(
        { error: 'Failed to get response from Azure AI Foundry', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    const assistantMessage = data.choices?.[0]?.message?.content ?? ''

    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI chat request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
