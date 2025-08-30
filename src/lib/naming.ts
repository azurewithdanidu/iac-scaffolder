import { FormData, ResourceLimits, ResourceType, AzureRegions } from '@/types/form'

export class NamingService {
  static generateResourceName(
    formData: FormData,
    environment: string,
    region: string,
    suffix: string,
    resourceType: ResourceType
  ): { name: string; isValid: boolean; actualLength: number; maxLength: number } {
    const regionData = AzureRegions.find(r => r.value === region)
    const shortRegion = regionData?.shortCode || region
    
    const maxLength = ResourceLimits[resourceType]
    
    // Build base name using pattern
    let baseName = formData.namingPattern
      .replace('{org}', formData.organization)
      .replace('{workload}', formData.workload)
      .replace('{env}', environment)
      .replace('{region}', shortRegion)
      .replace('{suffix}', suffix)
    
    // Special handling for storage accounts (no hyphens, alphanumeric only)
    if (resourceType === 'storageAccount') {
      baseName = baseName.replace(/-/g, '').toLowerCase()
    } else {
      baseName = baseName.toLowerCase()
    }
    
    // Trim if necessary
    const finalName = baseName.length > maxLength 
      ? baseName.substring(0, maxLength)
      : baseName
    
    return {
      name: finalName,
      isValid: finalName.length <= maxLength && finalName.length >= 3,
      actualLength: finalName.length,
      maxLength
    }
  }
  
  static generateAllResourceNames(formData: FormData) {
    const results: Record<string, Record<ResourceType, ReturnType<typeof this.generateResourceName>>> = {}
    
    formData.environments.forEach(env => {
      if (env.enabled) {
        results[env.name] = {} as Record<ResourceType, ReturnType<typeof this.generateResourceName>>
        
        Object.keys(ResourceLimits).forEach(resourceType => {
          const rt = resourceType as ResourceType
          let suffix = ''
          
          switch (rt) {
            case 'storageAccount':
              suffix = 'st'
              break
            case 'keyVault':
              suffix = 'kv'
              break
            case 'virtualNetwork':
              suffix = 'vnet'
              break
            case 'resourceGroup':
              suffix = 'rg'
              break
            case 'logAnalyticsWorkspace':
              suffix = 'law'
              break
            case 'subnet':
              suffix = 'snet'
              break
          }
          
          results[env.name][rt] = this.generateResourceName(
            formData,
            env.name,
            env.region,
            suffix,
            rt
          )
        })
      }
    })
    
    return results
  }
}
