using 'main.bicep'

// ==========================================================================================
// Landing Zone Parameters
// ==========================================================================================

param organization = '{{organization}}'
param location = '{{location}}'
param environment = '{{environment}}'
param regionShortCode = '{{regionShortCode}}'
param namingTemplate = '{{namingTemplate}}'
param resourceAbbreviations = {}
param enableHubSpoke = false
param enableFirewall = false
param enableDdosProtection = false
param enableMonitoring = true
