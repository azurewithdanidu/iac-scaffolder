# Changelog

All notable changes to CloudBlueprint will be documented in this file.

## [2.0.0] - 2026-01-06

### 🎉 Major New Features

#### Azure Front Door WAF Rule Designer
- **NEW**: Complete AFD WAF policy designer with visual interface
- SKU-aware managed rules (Standard vs Premium)
- Interactive rule simulator with 8 example test scenarios
- 10 comprehensive default security rules (SQL Injection, XSS, Path Traversal, etc.)
- Export to AVM-compatible Bicep parameter files (.bicepparam)
- Export to JSON format
- Real-time rule testing and validation

#### Automated AVM Module Metadata System
- **NEW**: Nightly automated extraction of AVM module parameters
- GitHub Actions workflow for automatic metadata updates
- Accurate required parameter detection from 15+ core AVM modules
- Pre-generated metadata eliminates runtime API calls
- Eliminates manual parameter maintenance

### ✨ Enhancements

#### Workload Builder
- **FIXED**: Modules now include all required parameters (not just name/location)
- **FIXED**: Only generates parameters without defaults (user input required)
- **IMPROVED**: Uses pre-generated AVM metadata for accurate parameter requirements
- **IMPROVED**: Cleaner Bicep templates with minimal parameter declarations
- **IMPROVED**: Better parameter handling for cross-service references

#### User Interface
- Updated main page layout from 4 to 3 cards
- Removed "Documentation" placeholder card
- Renamed WAF card to "AFD WAF Rule Designer"
- Consistent blue/indigo gradient theme across all pages
- Updated copyright year to 2026

### 🔧 Technical Improvements
- New metadata extraction script (`scripts/extract-avm-metadata.js`)
- Automated metadata updates via GitHub Actions (nightly at 2 AM UTC)
- JSON-based parameter metadata storage (`src/data/avm-parameters.json`)
- Improved TypeScript type safety across workload builder
- Better error handling and fallback mechanisms

### 📦 Supported AVM Modules (15)
- AI Foundry Pattern
- ACA Landing Zone Hosting Environment
- Virtual Machine
- App Service Plan
- Web App/Function App
- Storage Account
- SQL Server
- Cosmos DB
- Virtual Network
- Key Vault
- AKS Cluster
- Container App
- Container App Environment
- Log Analytics Workspace
- Application Insights

### 🐛 Bug Fixes
- Fixed WAF policy generator parameter compatibility with AVM modules
- Fixed Bicep parameter file generation for workload builder
- Fixed module parameter detection logic
- Fixed Next.js compilation caching issues

---

## [1.1.0] - 2024-XX-XX

### Features
- Initial IaC Scaffolder
- Workload Builder
- Basic WAF Policy Generator

### Initial Release
- Infrastructure as Code repository generation
- Azure Verified Module integration
- GitHub Actions CI/CD pipeline templates
