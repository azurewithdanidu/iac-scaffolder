'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, FileCode, Building2, Package, Wrench, CheckCircle2, AlertCircle } from 'lucide-react'

interface LandingZoneTemplate {
  id: string
  name: string
  description: string
  icon: string
  parameters: string[]
  estimatedDeploymentTime: string
}

interface FormData {
  templateType: string
  landingZoneName: string
  description: string
  azureRegion: string
  environment: string
  managementGroupId: string
  subscriptionId: string
  costCenter: string
  owner: string
  tags: Record<string, string>
}

const AZURE_REGIONS = [
  { value: 'eastus', label: 'East US' },
  { value: 'eastus2', label: 'East US 2' },
  { value: 'westus', label: 'West US' },
  { value: 'westus2', label: 'West US 2' },
  { value: 'westus3', label: 'West US 3' },
  { value: 'centralus', label: 'Central US' },
  { value: 'northcentralus', label: 'North Central US' },
  { value: 'southcentralus', label: 'South Central US' },
  { value: 'northeurope', label: 'North Europe' },
  { value: 'westeurope', label: 'West Europe' },
  { value: 'uksouth', label: 'UK South' },
  { value: 'ukwest', label: 'UK West' },
  { value: 'francecentral', label: 'France Central' },
  { value: 'germanywestcentral', label: 'Germany West Central' },
  { value: 'norwayeast', label: 'Norway East' },
  { value: 'swedencentral', label: 'Sweden Central' },
  { value: 'switzerlandnorth', label: 'Switzerland North' },
  { value: 'southeastasia', label: 'Southeast Asia' },
  { value: 'eastasia', label: 'East Asia' },
  { value: 'australiaeast', label: 'Australia East' },
  { value: 'australiasoutheast', label: 'Australia Southeast' },
  { value: 'japaneast', label: 'Japan East' },
  { value: 'japanwest', label: 'Japan West' },
  { value: 'koreacentral', label: 'Korea Central' },
  { value: 'canadacentral', label: 'Canada Central' },
  { value: 'canadaeast', label: 'Canada East' },
  { value: 'brazilsouth', label: 'Brazil South' },
  { value: 'southafricanorth', label: 'South Africa North' },
  { value: 'uaenorth', label: 'UAE North' },
]

export default function LandingZonePage() {
  const [step, setStep] = useState<'select' | 'configure' | 'complete'>('select')
  const [templates, setTemplates] = useState<LandingZoneTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedFile, setGeneratedFile] = useState<{ fileName: string; content: string } | null>(null)
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState<FormData>({
    templateType: '',
    landingZoneName: '',
    description: '',
    azureRegion: 'eastus',
    environment: 'dev',
    managementGroupId: '',
    subscriptionId: '',
    costCenter: '',
    owner: '',
    tags: {}
  })
  const [customTags, setCustomTags] = useState<Array<{ key: string; value: string }>>([{ key: '', value: '' }])

  // Fetch templates on mount
  useState(() => {
    fetchTemplates()
  })

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/landing-zone/templates')
      const data = await response.json()
      if (data.success) {
        setTemplates(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    setFormData(prev => ({ ...prev, templateType: templateId }))
    setStep('configure')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleTagChange = (index: number, field: 'key' | 'value', value: string) => {
    const newTags = [...customTags]
    newTags[index][field] = value
    setCustomTags(newTags)

    // Auto-add new row when last row is filled
    if (index === customTags.length - 1 && newTags[index].key && newTags[index].value) {
      setCustomTags([...newTags, { key: '', value: '' }])
    }
  }

  const removeTag = (index: number) => {
    if (customTags.length > 1) {
      setCustomTags(customTags.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // Convert custom tags to object
      const tags: Record<string, string> = {}
      customTags.forEach(tag => {
        if (tag.key && tag.value) {
          tags[tag.key] = tag.value
        }
      })

      const requestData = {
        ...formData,
        tags
      }

      const response = await fetch('/api/landing-zone/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedFile({
          fileName: result.data.fileName,
          content: result.data.content
        })
        setStep('complete')
      } else {
        setError(result.message || 'Failed to generate landing zone configuration')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadFile = () => {
    if (!generatedFile) return

    const blob = new Blob([generatedFile.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = generatedFile.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetForm = () => {
    setStep('select')
    setSelectedTemplate('')
    setGeneratedFile(null)
    setError('')
    setFormData({
      templateType: '',
      landingZoneName: '',
      description: '',
      azureRegion: 'eastus',
      environment: 'dev',
      managementGroupId: '',
      subscriptionId: '',
      costCenter: '',
      owner: '',
      tags: {}
    })
    setCustomTags([{ key: '', value: '' }])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Landing Zone Vending Machine
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Self-service portal for provisioning Azure Landing Zones with Azure Verified Modules
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">Error</h3>
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Step: Select Template */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Choose Landing Zone Template
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select the type of landing zone that best fits your needs
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className="text-left p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all group"
                  >
                    <div className="text-4xl mb-4">{template.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {template.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                      <FileCode className="w-4 h-4" />
                      <span>{template.estimatedDeploymentTime}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Configure */}
        {step === 'configure' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <button
                onClick={() => setStep('select')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Change template
              </button>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Configure Landing Zone
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Landing Zone Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="landingZoneName"
                      value={formData.landingZoneName}
                      onChange={handleInputChange}
                      placeholder="my-app-landing-zone"
                      required
                      pattern="[a-z0-9-]+"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Lowercase letters, numbers, and hyphens only
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Brief description of this landing zone's purpose"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </section>

              {/* Azure Configuration */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Azure Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Azure Region <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="azureRegion"
                      value={formData.azureRegion}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {AZURE_REGIONS.map(region => (
                        <option key={region.value} value={region.value}>
                          {region.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Environment <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="environment"
                      value={formData.environment}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="dev">Development</option>
                      <option value="test">Testing</option>
                      <option value="staging">Staging</option>
                      <option value="prod">Production</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Organizational Structure */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Organizational Structure
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Management Group ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="managementGroupId"
                      value={formData.managementGroupId}
                      onChange={handleInputChange}
                      placeholder="my-management-group"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subscription ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subscriptionId"
                      value={formData.subscriptionId}
                      onChange={handleInputChange}
                      placeholder="00000000-0000-0000-0000-000000000000"
                      required
                      pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Azure subscription GUID
                    </p>
                  </div>
                </div>
              </section>

              {/* Governance and Tagging */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Governance and Tagging
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cost Center <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="costCenter"
                      value={formData.costCenter}
                      onChange={handleInputChange}
                      placeholder="CC-12345"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Owner Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="owner"
                      value={formData.owner}
                      onChange={handleInputChange}
                      placeholder="owner@company.com"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Tags
                  </label>
                  <div className="space-y-2">
                    {customTags.map((tag, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Tag key"
                          value={tag.key}
                          onChange={(e) => handleTagChange(index, 'key', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Tag value"
                          value={tag.value}
                          onChange={(e) => handleTagChange(index, 'value', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        {customTags.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Additional tags for cost tracking and resource organization
                  </p>
                </div>
              </section>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Generating...' : 'Generate Landing Zone Configuration'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && generatedFile && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Configuration Generated Successfully!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your landing zone Bicep parameter file is ready
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Generated File
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {generatedFile.fileName}
                  </span>
                </div>
                <pre className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto max-h-96">
                  {generatedFile.content}
                </pre>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={downloadFile}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download .bicepparam File
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  Create Another Landing Zone
                </button>
              </div>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Next Steps
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>Download the generated .bicepparam file</li>
                  <li>Review the configuration for your landing zone</li>
                  <li>Deploy using: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">az deployment sub create --template-file main.bicep --parameters {generatedFile.fileName}</code></li>
                  <li>Monitor the deployment in Azure Portal</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
