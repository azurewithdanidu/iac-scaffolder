import JSZip from 'jszip'
import { FormData } from '@/types/form'

export interface FileStructure {
  [path: string]: string | FileStructure
}

export class ZipGenerator {
  static async generateZip(formData: FormData): Promise<Blob> {
    const zip = new JSZip()
    
    // Get all templates from the server-side API
    const allTemplates = await this.fetchTemplatesFromAPI(formData)
    
    // Create folder structure
    const structure = this.createFileStructure(formData, allTemplates)
    
    // Add files to zip
    this.addFilesToZip(zip, structure)
    
    return await zip.generateAsync({ type: 'blob' })
  }

  /**
   * Fetch templates from the server-side API
   */
  static async fetchTemplatesFromAPI(formData: FormData): Promise<Record<string, string>> {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to generate templates: ${errorData.error}`)
      }

      const result = await response.json()
      return result.templates
    } catch (error) {
      console.error('Error fetching templates:', error)
      throw error
    }
  }
  
  static createFileStructure(formData: FormData, templates: Record<string, string>): FileStructure {
    const structure: FileStructure = {}
    
    // Add each template file to the structure based on its path
    Object.entries(templates).forEach(([path, content]) => {
      this.setNestedProperty(structure, path, content)
    })
    
    return structure
  }
  
  static setNestedProperty(obj: FileStructure, path: string, value: string): void {
    const parts = path.split('/')
    let current = obj
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!(part in current)) {
        current[part] = {}
      }
      current = current[part] as FileStructure
    }
    
    current[parts[parts.length - 1]] = value
  }
  
  static addFilesToZip(zip: JSZip, structure: FileStructure, currentPath: string = ''): void {
    Object.entries(structure).forEach(([name, content]) => {
      const fullPath = currentPath ? `${currentPath}/${name}` : name
      
      if (typeof content === 'string') {
        zip.file(fullPath, content)
      } else {
        this.addFilesToZip(zip, content, fullPath)
      }
    })
  }
  
  static generateFileTree(structure: FileStructure, depth = 0): Array<{
    name: string
    type: 'file' | 'folder'
    depth: number
    content?: string
  }> {
    const result: Array<{
      name: string
      type: 'file' | 'folder'
      depth: number
      content?: string
    }> = []
    
    Object.entries(structure).forEach(([name, content]) => {
      if (typeof content === 'string') {
        result.push({
          name,
          type: 'file',
          depth,
          content
        })
      } else {
        result.push({
          name,
          type: 'folder',
          depth
        })
        result.push(...this.generateFileTree(content, depth + 1))
      }
    })
    
    return result
  }
}
