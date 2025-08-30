"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { FormData, AzureRegions } from '@/types/form'
import { NamingService } from '@/lib/naming'
import { ZipGenerator } from '@/lib/zip-generator'
import { generateTemplates } from '@/lib/simple-templates'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react'

const steps = [
  { id: 1, title: 'Organization', description: 'Basic information about your organization and workload' },
  { id: 2, title: 'Environments', description: 'Configure environments and regions' },
  { id: 3, title: 'Naming', description: 'Set up naming conventions' },
  { id: 4, title: 'Tags', description: 'Configure resource tags' },
  { id: 5, title: 'Templates', description: 'Select templates to include' },
  { id: 6, title: 'Modules', description: 'Select Azure modules to include' },
  { id: 7, title: 'Review', description: 'Review configuration and download' }
]

export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    organization: '',
    workload: '',
    environments: [
      { name: 'dev', region: 'australiaeast', enabled: true },
      { name: 'test', region: 'australiaeast', enabled: true },
      { name: 'prod', region: 'australiasoutheast', enabled: true }
    ],
    namingPattern: '{org}-{workload}-{env}-{region}-{suffix}',
    separator: '-',
    tags: {
      owner: '',
      costCenter: '',
      managedBy: 'bicep'
    },
    includePatterns: {
      landingZone: false
    },
    modules: {
      virtualNetwork: true,
      keyVault: true,
      logAnalytics: true,
      diagnostics: true,
      networkSecurityGroup: true,
      natGateway: false,
      subscriptionActivityLogs: true
    },
    pipelineProvider: 'github-actions',
    iacProvider: 'bicep'
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)
  
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }
  
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }
  
  const validateCurrentStep = (): boolean => {
    const currentErrors: Record<string, string> = {}
    
    switch (currentStep) {
      case 1:
        if (!formData.organization.trim()) currentErrors.organization = 'Organization is required'
        if (!formData.workload.trim()) currentErrors.workload = 'Workload is required'
        break
      case 4:
        if (!formData.tags.owner.trim()) currentErrors.owner = 'Owner is required'
        if (!formData.tags.costCenter.trim()) currentErrors.costCenter = 'Cost center is required'
        break
    }
    
    setErrors(currentErrors)
    return Object.keys(currentErrors).length === 0
  }
  
  const handleDownload = async () => {
    try {
      const blob = await ZipGenerator.generateZip(formData)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${formData.workload}-infrastructure.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating zip:', error)
    }
  }
  
  const progress = (currentStep / steps.length) * 100
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
              CloudBlueprint
            </Link>
            <span className="text-gray-500">/</span>
            <span className="text-gray-700 dark:text-gray-300">IaC Scaffolder</span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Azure IaC Generator
            </h1>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep} of {steps.length}
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
        
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors $\{
                      step.id === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : step.id < currentStep
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                    onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                  >
                    <div className="font-medium">{step.title}</div>
                    <div className="text-xs opacity-75">{step.description}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            <Card className="min-h-[500px]">
              <CardHeader>
                <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                <CardDescription>{steps[currentStep - 1].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step content will be rendered here */}
                {renderStepContent(currentStep, formData, setFormData, errors)}
              </CardContent>
            </Card>
            
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>
              
              <div className="flex space-x-2">
                {currentStep === steps.length && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{showPreview ? 'Hide' : 'Preview'}</span>
                    </Button>
                    <Button
                      onClick={handleDownload}
                      className="flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download ZIP</span>
                    </Button>
                  </>
                )}
                
                {currentStep < steps.length && (
                  <Button
                    onClick={handleNext}
                    className="flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {showPreview && renderPreview(formData)}
      </main>
    </div>
  )
}

function renderStepContent(
  step: number,
  formData: FormData,
  setFormData: (data: FormData) => void,
  errors: Record<string, string>
) {
  switch (step) {
    case 1:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Organization Name</label>
            <Input
              placeholder="e.g., contoso, acme, mycompany"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className={errors.organization ? 'border-red-500' : ''}
            />
            {errors.organization && <p className="text-red-500 text-sm mt-1">{errors.organization}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Workload Name</label>
            <Input
              placeholder="e.g., webapp, api, dataplatform"
              value={formData.workload}
              onChange={(e) => setFormData({ ...formData, workload: e.target.value })}
              className={errors.workload ? 'border-red-500' : ''}
            />
            {errors.workload && <p className="text-red-500 text-sm mt-1">{errors.workload}</p>}
          </div>
        </div>
      )
    
    case 2:
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure which environments to include and their Azure regions.
          </p>
          {formData.environments.map((env, index) => (
            <div key={env.name} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={env.enabled}
                    onChange={(e) => {
                      const newEnvs = [...formData.environments]
                      newEnvs[index].enabled = e.target.checked
                      setFormData({ ...formData, environments: newEnvs })
                    }}
                  />
                  <span className="font-medium capitalize">{env.name}</span>
                </label>
              </div>
              
              {env.enabled && (
                <div>
                  <label className="block text-sm font-medium mb-2">Azure Region</label>
                  <select
                    value={env.region}
                    onChange={(e) => {
                      const newEnvs = [...formData.environments]
                      newEnvs[index].region = e.target.value
                      setFormData({ ...formData, environments: newEnvs })
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
                  >
                    {AzureRegions.map((region) => (
                      <option key={region.value} value={region.value}>
                        {region.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )
      
    case 3:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Naming Pattern</label>
            <Input
              value={formData.namingPattern}
              onChange={(e) => setFormData({ ...formData, namingPattern: e.target.value })}
            />
            <p className="text-sm text-gray-500 mt-1">
              Available placeholders: {'{org}'}, {'{workload}'}, {'{env}'}, {'{region}'}, {'{suffix}'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Separator</label>
            <Input
              value={formData.separator}
              onChange={(e) => setFormData({ ...formData, separator: e.target.value })}
              placeholder="-"
            />
          </div>
          
          {formData.organization && formData.workload && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Naming Preview</h4>
              <div className="space-y-2">
                {renderNamingPreview(formData)}
              </div>
            </div>
          )}
        </div>
      )
      
    case 4:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Owner</label>
            <Input
              placeholder="e.g., john.doe@company.com"
              value={formData.tags.owner}
              onChange={(e) => setFormData({ 
                ...formData, 
                tags: { ...formData.tags, owner: e.target.value }
              })}
              className={errors.owner ? 'border-red-500' : ''}
            />
            {errors.owner && <p className="text-red-500 text-sm mt-1">{errors.owner}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Cost Center</label>
            <Input
              placeholder="e.g., IT-001, DEPT-123"
              value={formData.tags.costCenter}
              onChange={(e) => setFormData({ 
                ...formData, 
                tags: { ...formData.tags, costCenter: e.target.value }
              })}
              className={errors.costCenter ? 'border-red-500' : ''}
            />
            {errors.costCenter && <p className="text-red-500 text-sm mt-1">{errors.costCenter}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Managed By</label>
            <Input
              value={formData.tags.managedBy}
              onChange={(e) => setFormData({ 
                ...formData, 
                tags: { ...formData.tags, managedBy: e.target.value }
              })}
            />
          </div>
        </div>
      )
      
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose whether to include the landing zone template in your generated repository.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Landing Zone Template</div>
                  <div className="text-sm text-gray-500">
                    Network security infrastructure (NSGs, NAT Gateway, Activity Logs, Log Analytics)
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.includePatterns.landingZone}
                    onChange={(e) => setFormData({
                      ...formData,
                      includePatterns: { ...formData.includePatterns, landingZone: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> If landing zone is not selected, only the naming module and basic folder structure will be created. 
                The landing zone includes network security components using direct AVM module calls.
              </p>
            </div>
          </div>
        )
      
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select which Azure modules to include in your infrastructure.
            </p>
            
            {Object.entries(formData.modules).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getModuleDescription(key)}
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      modules: { ...formData.modules, [key]: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        )
        
      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Configuration Summary</h4>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <span className="text-sm font-medium">Organization:</span>
                  <p>{formData.organization}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Workload:</span>
                  <p>{formData.workload}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Environments:</span>
                  <p>{formData.environments.filter(e => e.enabled).map(e => e.name).join(', ')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Templates:</span>
                  <p>{formData.includePatterns.landingZone ? 'Landing Zone' : 'Basic (Naming + Folder Structure)'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Pipeline:</span>
                  <p>{formData.pipelineProvider}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Modules:</span>
                  <p>{Object.entries(formData.modules)
                    .filter(([_, enabled]) => enabled)
                    .map(([key, _]) => key)
                    .join(', ')}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">What You'll Get</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Complete Bicep infrastructure templates using AVM modules</li>
                <li>GitHub Actions and/or Azure DevOps CI/CD pipelines</li>
                <li>Environment-specific parameter files</li>
                <li>Comprehensive documentation</li>
                <li>Azure naming convention modules</li>
                {formData.includePatterns.landingZone && <li>Landing zone pattern with NSGs, NAT Gateway, and activity logs</li>}
                <li>Sample web application workload template</li>
              </ul>
            </div>
          </div>
        )
        
      default:
        return <div>Step not implemented</div>
  }
}

function getModuleDescription(moduleKey: string): string {
  const descriptions: Record<string, string> = {
    virtualNetwork: 'Azure Virtual Network with subnets and NSGs',
    keyVault: 'Azure Key Vault for secrets and certificate management',
    logAnalytics: 'Log Analytics workspace for centralized logging',
    diagnostics: 'Diagnostic settings for resource monitoring',
    networkSecurityGroup: 'Network Security Groups for traffic filtering',
    natGateway: 'NAT Gateway for outbound internet connectivity',
    subscriptionActivityLogs: 'Subscription-level activity log collection and storage'
  }
  return descriptions[moduleKey] || ''
}

function renderNamingPreview(formData: FormData) {
  const preview = NamingService.generateAllResourceNames(formData)
  
  return Object.entries(preview).map(([env, resources]) => (
    <div key={env} className="mb-4">
      <h5 className="font-medium capitalize mb-2">{env} Environment</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        {Object.entries(resources).map(([resourceType, result]) => (
          <div key={resourceType} className="flex justify-between p-2 border rounded">
            <span className="capitalize">{resourceType.replace(/([A-Z])/g, ' $1').trim()}:</span>
            <span className={result.isValid ? 'text-green-600' : 'text-red-600'}>
              {result.name} ({result.actualLength}/{result.maxLength})
            </span>
          </div>
        ))}
      </div>
    </div>
  ))
}

function renderPreview(formData: FormData) {
  const templates = generateTemplates(formData)
  const structure = ZipGenerator.createFileStructure(formData, templates)
  const fileTree = ZipGenerator.generateFileTree(structure)
  
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>File Structure Preview</CardTitle>
        <CardDescription>
          Preview of the files that will be generated in your ZIP download
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-sm space-y-1">
          {fileTree.map((item, index) => (
            <div key={index} className="flex items-center">
              <span style={{ marginLeft: `${item.depth * 20}px` }}>
                {item.type === 'folder' ? '📁' : '📄'} {item.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
