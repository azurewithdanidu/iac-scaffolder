import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { bicepContent, extractParameters } = await request.json()

    if (!bicepContent) {
      return NextResponse.json({ error: 'Bicep content is required' }, { status: 400 })
    }

    // Create a temporary bicep file
    const tempDir = tmpdir()
    const tempFile = join(tempDir, `temp-${Date.now()}.bicep`)
    
    await writeFile(tempFile, bicepContent)

    try {
      if (extractParameters) {
        // Use bicep build to get parameter information
        const { stdout, stderr } = await execAsync(`az bicep build --file "${tempFile}" --stdout`)
        
        if (stderr && !stderr.includes('Warning')) {
          // Parse error to extract parameter information
          const parameterRegex = /The following parameters are available but not provided: (.+)/
          const match = stderr.match(parameterRegex)
          
          if (match) {
            const requiredParams = match[1].split(',').map(p => p.trim().replace(/['"]/g, ''))
            return NextResponse.json({
              parameters: {
                required: requiredParams,
                optional: []
              }
            })
          }
        }

        // If no error, try to parse the ARM template to get parameters
        try {
          const armTemplate = JSON.parse(stdout)
          const parameters = armTemplate.parameters || {}
          
          const required: string[] = []
          const optional: string[] = []
          
          Object.entries(parameters).forEach(([name, param]: [string, any]) => {
            if (param.defaultValue !== undefined) {
              optional.push(name)
            } else {
              required.push(name)
            }
          })
          
          return NextResponse.json({
            parameters: { required, optional }
          })
        } catch (parseError) {
          // Fallback: extract from bicep syntax
          const paramMatches = bicepContent.match(/param\s+(\w+)\s+/g) || []
          const extractedParams = paramMatches.map((match: string) => match.replace(/param\s+(\w+)\s+/, '$1'))
          
          return NextResponse.json({
            parameters: {
              required: extractedParams,
              optional: []
            }
          })
        }
      } else {
        // Just validate the bicep file
        const { stdout, stderr } = await execAsync(`az bicep build --file "${tempFile}" --stdout`)
        
        return NextResponse.json({
          valid: !stderr || stderr.includes('Warning'),
          errors: stderr ? [stderr] : [],
          armTemplate: stdout ? JSON.parse(stdout) : null
        })
      }
    } finally {
      // Clean up temp file
      try {
        await unlink(tempFile)
      } catch (cleanupError) {
        console.warn('Failed to clean up temp file:', cleanupError)
      }
    }
  } catch (error) {
    console.error('Bicep validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate bicep content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
