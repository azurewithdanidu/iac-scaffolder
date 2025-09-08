"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FormData, AzureRegions } from "@/types/form";
import { NamingService } from "@/lib/naming";
import { ZipGenerator } from "@/lib/zip-generator";
import { generateTemplates } from "@/lib/simple-templates";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Check,
  AlertCircle,
  Clock,
  Save,
} from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Organization",
    description: "Basic information about your organization and workload",
  },
  {
    id: 2,
    title: "Environments",
    description: "Configure environments and regions",
  },
  { id: 3, title: "Naming", description: "Set up naming conventions" },
  { id: 4, title: "Tags", description: "Configure resource tags" },
  { id: 5, title: "Templates", description: "Select templates to include" },
  { id: 6, title: "Modules", description: "Select Azure modules to include" },
  {
    id: 7,
    title: "Pipeline",
    description: "Choose your CI/CD pipeline provider",
  },
  { id: 8, title: "Review", description: "Review configuration and download" },
];

export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    organization: "",
    workload: "",
    environments: [
      { name: "dev", region: "australiaeast", enabled: true },
      { name: "test", region: "australiaeast", enabled: true },
      { name: "prod", region: "australiasoutheast", enabled: true },
    ],
    namingPattern: "{org}-{workload}-{env}-{region}-{suffix}",
    separator: "-",
    tags: {
      owner: "",
      costCenter: "",
      managedBy: "bicep",
    },
    includePatterns: {
      landingZone: false,
    },
    modules: {
      virtualNetwork: true,
      keyVault: true,
      logAnalytics: true,
      diagnostics: true,
      networkSecurityGroup: true,
      natGateway: false,
      subscriptionActivityLogs: true,
    },
    pipelineProvider: "github-actions",
    iacProvider: "bicep",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [stepCompletionStatus, setStepCompletionStatus] = useState<
    Record<number, "complete" | "incomplete" | "error">
  >({});
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const validateStep = useCallback(
    (stepNumber: number) => {
      const stepErrors: Record<string, string> = {};

      switch (stepNumber) {
        case 1:
          if (!formData.organization.trim())
            stepErrors.organization = "Organization is required";
          if (!formData.workload.trim())
            stepErrors.workload = "Workload is required";
          break;
        case 4:
          if (!formData.tags.owner.trim())
            stepErrors.owner = "Owner is required";
          if (!formData.tags.costCenter.trim())
            stepErrors.costCenter = "Cost center is required";
          break;
      }

      return {
        isValid: Object.keys(stepErrors).length === 0,
        errors: stepErrors,
      };
    },
    [formData]
  );

  const handleNext = useCallback(() => {
    const validation = validateStep(currentStep);
    setErrors(validation.errors);

    if (validation.isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleStepClick = useCallback(
    (stepId: number) => {
      if (stepId <= currentStep) {
        setCurrentStep(stepId);
      }
    },
    [currentStep]
  );

  const clearSavedData = () => {
    localStorage.removeItem("wizard-form-data");
    localStorage.removeItem("wizard-current-step");
    setLastSaved(null);
  };

  // Auto-save functionality
  useEffect(() => {
    const saveData = async () => {
      setIsAutoSaving(true);
      try {
        localStorage.setItem("wizard-form-data", JSON.stringify(formData));
        localStorage.setItem("wizard-current-step", currentStep.toString());
        setLastSaved(new Date());
      } catch (error) {
        console.error("Failed to save data:", error);
      } finally {
        setTimeout(() => setIsAutoSaving(false), 500); // Show saving indicator briefly
      }
    };

    const timeoutId = setTimeout(saveData, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [formData, currentStep]);

  // Load saved data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("wizard-form-data");
      const savedStep = localStorage.getItem("wizard-current-step");

      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
      if (savedStep) {
        setCurrentStep(parseInt(savedStep));
      }
    } catch (error) {
      console.error("Failed to load saved data:", error);
    }
  }, []);

  // Update step completion status
  useEffect(() => {
    const newStatus: Record<number, "complete" | "incomplete" | "error"> = {};

    steps.forEach((step) => {
      const validation = validateStep(step.id);
      if (step.id < currentStep) {
        newStatus[step.id] = validation.isValid ? "complete" : "error";
      } else if (step.id === currentStep) {
        newStatus[step.id] = validation.isValid ? "complete" : "incomplete";
      } else {
        newStatus[step.id] = "incomplete";
      }
    });

    setStepCompletionStatus(newStatus);
  }, [formData, currentStep, validateStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        const activeElement = document.activeElement;
        if (
          activeElement?.tagName !== "INPUT" &&
          activeElement?.tagName !== "TEXTAREA" &&
          activeElement?.tagName !== "SELECT"
        ) {
          e.preventDefault();
          handleNext();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        handlePrevious();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrevious]);

  const handleDownload = async () => {
    try {
      const blob = await ZipGenerator.generateZip(formData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formData.workload}-infrastructure.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating zip:", error);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              CloudBlueprint
            </Link>
            <span className="text-gray-500">/</span>
            <span className="text-gray-700 dark:text-gray-300">
              IaC Scaffolder
            </span>
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
            <div className="flex items-center space-x-4">
              {isAutoSaving && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Save className="w-4 h-4 mr-1 animate-pulse" />
                  Saving...
                </div>
              )}
              {lastSaved && !isAutoSaving && (
                <div className="text-xs text-gray-400">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Step {currentStep} of {steps.length}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSavedData}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear Progress
              </Button>
            </div>
          </div>
          <Progress
            value={progress}
            className="w-full transition-all duration-500 ease-out"
          />
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 Use Enter to proceed, Escape to go back, or click on completed
            steps to navigate
          </div>
        </div>

        {/* Vertical Timeline/List View with Cards */}
        <div className="space-y-4">
          {steps.map((step) => {
            const status = stepCompletionStatus[step.id] || "incomplete";
            const isExpanded = step.id === currentStep;
            const isClickable = step.id <= currentStep;

            return (
              <Card
                key={step.id}
                className={`transition-all duration-300 ease-in-out border-l-4 ${
                  isExpanded
                    ? "border-l-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900/20 scale-[1.02]"
                    : status === "complete"
                    ? "border-l-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                    : status === "error"
                    ? "border-l-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                    : "border-l-gray-300 dark:border-l-gray-600 hover:border-l-gray-400"
                } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
              >
                <CardHeader
                  className={isClickable ? "cursor-pointer" : "cursor-default"}
                  onClick={() => isClickable && handleStepClick(step.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                          isExpanded
                            ? "bg-blue-500 text-white shadow-lg scale-110"
                            : status === "complete"
                            ? "bg-green-500 text-white"
                            : status === "error"
                            ? "bg-red-500 text-white"
                            : "bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {status === "complete" ? (
                          <Check className="w-5 h-5" />
                        ) : status === "error" ? (
                          <AlertCircle className="w-5 h-5" />
                        ) : isExpanded ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <div>
                        <CardTitle
                          className={`text-xl transition-colors ${
                            isExpanded
                              ? "text-blue-700 dark:text-blue-300"
                              : status === "complete"
                              ? "text-green-700 dark:text-green-300"
                              : status === "error"
                              ? "text-red-700 dark:text-red-300"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {step.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {step.description}
                        </CardDescription>
                        {status === "error" && step.id < currentStep && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                            ⚠️ This step has validation errors
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {status === "complete" && !isExpanded && (
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Complete
                        </div>
                      )}
                      {status === "error" && !isExpanded && (
                        <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                          Needs attention
                        </div>
                      )}
                      <div
                        className={`transition-transform duration-200 ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Expandable Content */}
                {isExpanded && (
                  <CardContent className="pt-0 space-y-6 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <div className="pl-14">
                      <div className="transition-all duration-300 ease-in-out">
                        {renderStepContent(
                          currentStep,
                          formData,
                          setFormData,
                          errors
                        )}
                      </div>

                      {/* Navigation Buttons */}
                      <div className="flex justify-between items-center mt-8 pt-6 border-t">
                        <Button
                          variant="outline"
                          onClick={handlePrevious}
                          disabled={currentStep === 1}
                          className="flex items-center space-x-2 transition-all duration-200 hover:scale-105"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Previous</span>
                        </Button>

                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>
                            Step {currentStep} of {steps.length}
                          </span>
                          {status === "complete" && (
                            <span className="text-green-600">✓ Complete</span>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          {currentStep === steps.length && (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => setShowPreview(!showPreview)}
                                className="flex items-center space-x-2 transition-all duration-200 hover:scale-105"
                              >
                                <Eye className="w-4 h-4" />
                                <span>{showPreview ? "Hide" : "Preview"}</span>
                              </Button>
                              <Button
                                onClick={handleDownload}
                                className="flex items-center space-x-2 transition-all duration-200 hover:scale-105 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              >
                                <Download className="w-4 h-4" />
                                <span>Download ZIP</span>
                              </Button>
                            </>
                          )}

                          {currentStep < steps.length && (
                            <Button
                              onClick={handleNext}
                              disabled={status === "error"}
                              className="flex items-center space-x-2 transition-all duration-200 hover:scale-105"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}

                {/* Collapsed Summary for Completed Steps */}
                {!isExpanded &&
                  status === "complete" &&
                  step.id < currentStep && (
                    <CardContent className="pt-0 pb-4">
                      <div className="pl-14">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {getStepSummary(step.id, formData)}
                        </div>
                      </div>
                    </CardContent>
                  )}
              </Card>
            );
          })}
        </div>

        {showPreview && (
          <div className="animate-in fade-in-0 duration-300">
            {renderPreview(formData)}
          </div>
        )}
      </main>
    </div>
  );
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
            <label className="block text-sm font-medium mb-2">
              Organization Name
            </label>
            <Input
              placeholder="e.g., contoso, acme, mycompany"
              value={formData.organization}
              onChange={(e) =>
                setFormData({ ...formData, organization: e.target.value })
              }
              className={errors.organization ? "border-red-500" : ""}
            />
            {errors.organization && (
              <p className="text-red-500 text-sm mt-1">{errors.organization}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Workload Name
            </label>
            <Input
              placeholder="e.g., webapp, api, dataplatform"
              value={formData.workload}
              onChange={(e) =>
                setFormData({ ...formData, workload: e.target.value })
              }
              className={errors.workload ? "border-red-500" : ""}
            />
            {errors.workload && (
              <p className="text-red-500 text-sm mt-1">{errors.workload}</p>
            )}
          </div>
        </div>
      );

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
                      const newEnvs = [...formData.environments];
                      newEnvs[index].enabled = e.target.checked;
                      setFormData({ ...formData, environments: newEnvs });
                    }}
                  />
                  <span className="font-medium capitalize">{env.name}</span>
                </label>
              </div>

              {env.enabled && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Azure Region
                  </label>
                  <select
                    value={env.region}
                    onChange={(e) => {
                      const newEnvs = [...formData.environments];
                      newEnvs[index].region = e.target.value;
                      setFormData({ ...formData, environments: newEnvs });
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
      );

    case 3:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Naming Pattern
            </label>
            <Input
              value={formData.namingPattern}
              onChange={(e) =>
                setFormData({ ...formData, namingPattern: e.target.value })
              }
            />
            <p className="text-sm text-gray-500 mt-1">
              Available placeholders: {"{org}"}, {"{workload}"}, {"{env}"},{" "}
              {"{region}"}, {"{suffix}"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Separator</label>
            <Input
              value={formData.separator}
              onChange={(e) =>
                setFormData({ ...formData, separator: e.target.value })
              }
              placeholder="-"
            />
          </div>

          {formData.organization && formData.workload && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Naming Preview</h4>
              <div className="space-y-2">{renderNamingPreview(formData)}</div>
            </div>
          )}
        </div>
      );

    case 4:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Owner</label>
            <Input
              placeholder="e.g., john.doe@company.com"
              value={formData.tags.owner}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: { ...formData.tags, owner: e.target.value },
                })
              }
              className={errors.owner ? "border-red-500" : ""}
            />
            {errors.owner && (
              <p className="text-red-500 text-sm mt-1">{errors.owner}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Cost Center
            </label>
            <Input
              placeholder="e.g., IT-001, DEPT-123"
              value={formData.tags.costCenter}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: { ...formData.tags, costCenter: e.target.value },
                })
              }
              className={errors.costCenter ? "border-red-500" : ""}
            />
            {errors.costCenter && (
              <p className="text-red-500 text-sm mt-1">{errors.costCenter}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Managed By</label>
            <Input
              value={formData.tags.managedBy}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: { ...formData.tags, managedBy: e.target.value },
                })
              }
            />
          </div>
        </div>
      );

    case 5:
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose whether to include the landing zone template in your
            generated repository.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">Landing Zone Template</div>
                <div className="text-sm text-gray-500">
                  Network security infrastructure (NSGs, NAT Gateway, Activity
                  Logs, Log Analytics)
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includePatterns.landingZone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      includePatterns: {
                        ...formData.includePatterns,
                        landingZone: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> If landing zone is not selected, only the
              naming module and basic folder structure will be created. The
              landing zone includes network security components using direct AVM
              module calls.
            </p>
          </div>
        </div>
      );

    case 6:
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select which Azure modules to include in your infrastructure.
          </p>

          {Object.entries(formData.modules).map(([key, enabled]) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <div className="font-medium capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </div>
                <div className="text-sm text-gray-500">
                  {getModuleDescription(key)}
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      modules: { ...formData.modules, [key]: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      );

    case 7:
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose your preferred CI/CD pipeline provider. This will generate
            the appropriate workflow/pipeline files.
          </p>

          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">GitHub Actions</div>
                  <div className="text-sm text-gray-500">
                    GitHub-native CI/CD with workflow files in
                    .github/workflows/
                  </div>
                </div>
                <input
                  type="radio"
                  name="pipelineProvider"
                  value="github-actions"
                  checked={formData.pipelineProvider === "github-actions"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pipelineProvider: e.target.value as
                        | "github-actions"
                        | "azure-devops"
                        | "both",
                    })
                  }
                  className="w-4 h-4 text-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Azure DevOps</div>
                  <div className="text-sm text-gray-500">
                    Azure DevOps Pipelines with YAML files in azure-pipelines/
                  </div>
                </div>
                <input
                  type="radio"
                  name="pipelineProvider"
                  value="azure-devops"
                  checked={formData.pipelineProvider === "azure-devops"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pipelineProvider: e.target.value as
                        | "github-actions"
                        | "azure-devops"
                        | "both",
                    })
                  }
                  className="w-4 h-4 text-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Both Providers</div>
                  <div className="text-sm text-gray-500">
                    Generate templates for both GitHub Actions and Azure DevOps
                  </div>
                </div>
                <input
                  type="radio"
                  name="pipelineProvider"
                  value="both"
                  checked={formData.pipelineProvider === "both"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pipelineProvider: e.target.value as
                        | "github-actions"
                        | "azure-devops"
                        | "both",
                    })
                  }
                  className="w-4 h-4 text-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Selected:</strong>{" "}
              {formData.pipelineProvider === "github-actions"
                ? "GitHub Actions"
                : formData.pipelineProvider === "azure-devops"
                ? "Azure DevOps"
                : "Both GitHub Actions and Azure DevOps"}
            </p>
          </div>
        </div>
      );

    case 8:
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
                <p>
                  {formData.environments
                    .filter((e) => e.enabled)
                    .map((e) => e.name)
                    .join(", ")}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Templates:</span>
                <p>
                  {formData.includePatterns.landingZone
                    ? "Landing Zone"
                    : "Basic (Naming + Folder Structure)"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Pipeline:</span>
                <p>{formData.pipelineProvider}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Modules:</span>
                <p>
                  {Object.entries(formData.modules)
                    .filter(([, enabled]) => enabled)
                    .map(([key]) => key)
                    .join(", ")}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">What You&apos;ll Get</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Complete Bicep infrastructure templates using AVM modules</li>
              <li>GitHub Actions and/or Azure DevOps CI/CD pipelines</li>
              <li>Environment-specific parameter files</li>
              <li>Comprehensive documentation</li>
              <li>Azure naming convention modules</li>
              {formData.includePatterns.landingZone && (
                <li>
                  Landing zone pattern with NSGs, NAT Gateway, and activity logs
                </li>
              )}
              <li>Sample web application workload template</li>
            </ul>
          </div>
        </div>
      );

    default:
      return <div>Step not implemented</div>;
  }
}

function getStepSummary(stepId: number, formData: FormData): string {
  switch (stepId) {
    case 1:
      return `Organization: ${formData.organization} | Workload: ${formData.workload}`;
    case 2:
      const enabledEnvs = formData.environments.filter((e) => e.enabled);
      return `${enabledEnvs.length} environments: ${enabledEnvs
        .map((e) => e.name)
        .join(", ")}`;
    case 3:
      return `Pattern: ${formData.namingPattern}`;
    case 4:
      return `Owner: ${formData.tags.owner} | Cost Center: ${formData.tags.costCenter}`;
    case 5:
      return formData.includePatterns.landingZone
        ? "Landing Zone included"
        : "Basic templates only";
    case 6:
      const enabledModules = Object.entries(formData.modules).filter(
        ([, enabled]) => enabled
      );
      return `${enabledModules.length} modules selected`;
    case 7:
      return `Pipeline: ${formData.pipelineProvider}`;
    default:
      return "Configured";
  }
}

function getModuleDescription(moduleKey: string): string {
  const descriptions: Record<string, string> = {
    virtualNetwork: "Azure Virtual Network with subnets and NSGs",
    keyVault: "Azure Key Vault for secrets and certificate management",
    logAnalytics: "Log Analytics workspace for centralized logging",
    diagnostics: "Diagnostic settings for resource monitoring",
    networkSecurityGroup: "Network Security Groups for traffic filtering",
    natGateway: "NAT Gateway for outbound internet connectivity",
    subscriptionActivityLogs:
      "Subscription-level activity log collection and storage",
  };
  return descriptions[moduleKey] || "";
}

function renderNamingPreview(formData: FormData) {
  const preview = NamingService.generateAllResourceNames(formData);

  return Object.entries(preview).map(([env, resources]) => (
    <div key={env} className="mb-4">
      <h5 className="font-medium capitalize mb-2">{env} Environment</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        {Object.entries(resources).map(([resourceType, result]) => (
          <div
            key={resourceType}
            className="flex justify-between p-2 border rounded"
          >
            <span className="capitalize">
              {resourceType.replace(/([A-Z])/g, " $1").trim()}:
            </span>
            <span
              className={result.isValid ? "text-green-600" : "text-red-600"}
            >
              {result.name} ({result.actualLength}/{result.maxLength})
            </span>
          </div>
        ))}
      </div>
    </div>
  ));
}

function renderPreview(formData: FormData) {
  const templates = generateTemplates(formData);
  const structure = ZipGenerator.createFileStructure(formData, templates);
  const fileTree = ZipGenerator.generateFileTree(structure);

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
                {item.type === "folder" ? "📁" : "📄"} {item.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
