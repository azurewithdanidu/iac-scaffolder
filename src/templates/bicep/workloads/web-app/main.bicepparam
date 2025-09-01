using 'main.bicep'

// ==========================================================================================
// Web App Workload Parameters
// ==========================================================================================

param organization = '{{organization}}'
param workload = '{{workload}}'
param location = '{{location}}'
param environment = '{{environment}}'
param regionShortCode = '{{regionShortCode}}'
param namingTemplate = '{{namingTemplate}}'
param resourceAbbreviations = {}
param appServicePlanSku = 'B1'
param enableApplicationInsights = true
param enableKeyVault = true
param enableStorage = true
param runtimeStack = 'DOTNETCORE|8.0'
