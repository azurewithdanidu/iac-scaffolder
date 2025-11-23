# CloudBlueprint - Azure IaC Generator

CloudBlueprint is a Next.js web application that generates complete Azure Infrastructure as Code (IaC) repositories with enterprise best practices, naming conventions, and CI/CD pipelines.

## 🚀 Features

### IaC Scaffolder
- **100% Client-Side**: No backend required, all generation happens in your browser
- **Enterprise Ready**: Built with Azure best practices and governance patterns
- **Complete Repository**: Generates full folder structure with Bicep templates, GitHub Actions, and documentation
- **Naming Conventions**: Implements Azure Cloud Adoption Framework naming standards
- **Module System**: Uses Azure Verified Modules (AVM) wrappers for consistency
- **Multi-Environment**: Supports dev/test/prod environments with region-specific configurations

### Workload Builder (NEW! ⚡)
- **Pick & Choose Services**: Select from 30+ Azure services by category (Compute, Storage, Database, etc.)
- **Visual Service Selection**: Browse and add exactly what your workload needs
- **AVM Module Integration**: Uses Azure Verified Modules with proper versioning
- **Complete Parameter Generation**: ALL required and optional parameters included
- **Cross-Service Dependencies**: Auto-wires service references (Web App → App Service Plan, etc.)
- **Production-Ready Templates**: Download deployment-ready Bicep with parameter files
- **Real-Time Preview**: Watch your template build as you add services

### WAF Policy Simulator (Coming Soon 🔜)
- **Policy Designer**: Create and test Web Application Firewall policies
- **Request Simulator**: Test HTTP requests against WAF rules
- **Export Capabilities**: Generate deployable WAF policy templates

## 🏗️ Architecture

The generated repository follows this structure:

```
cloudblueprint/
├── infra/
│   └── bicep/
│       ├── platform.bicep                # Platform main
│       ├── modules/
│       │   ├── naming/
│       │   │   └── naming.bicep          # Naming convention module
│       │   ├── avm/
│       │   │   ├── network/
│       │   │   ├── security/
│       │   │   └── observability/
│       │   └── shared/
│       └── parameters/
│           ├── dev.json
│           ├── test.json
│           └── prod.json
├── .github/
│   └── workflows/
│       ├── main-bicep-deploy.yml         # Main pipeline
│       └── templates/
│           ├── build.yml                 # Build template
│           └── deploy.yml                # Deploy template
└── docs/
    └── README.md
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Validation**: Zod
- **File Generation**: JSZip for client-side ZIP creation
- **Themes**: Dark/Light mode support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/azurewithdanidu/iac-scaffolder.git
   cd iac-scaffolder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 Usage

### IaC Scaffolder

1. **Home Page**: Choose "IaC Scaffolder" to start the wizard
2. **Wizard Steps**:
   - **Organization**: Enter your org and workload names
   - **Environments**: Configure dev/test/prod and their regions  
   - **Naming**: Customize naming patterns and preview resource names
   - **Tags**: Set required tags (owner, cost center, etc.)
   - **Modules**: Select which Azure services to include
   - **Review**: Preview file structure and download ZIP

3. **Generated Output**: 
   - Complete Bicep infrastructure templates
   - GitHub Actions CI/CD workflows  
   - Environment-specific parameter files
   - Comprehensive documentation
   - Ready-to-use naming convention modules

### Workload Builder

1. **Select Services**: Browse 30+ Azure services organized by category
   - Compute: Virtual Machines, AKS, App Service Plans, Batch
   - Hosting: Web Apps, Function Apps, Static Web Apps
   - Storage: Storage Accounts, Disks, File Shares
   - Database: SQL, Cosmos DB, PostgreSQL, MySQL
   - Networking: Virtual Networks, Load Balancers, App Gateway
   - Security: Key Vault, Managed Identity, Private Endpoints
   - And more...

2. **Customize Instances**: Add multiple instances of the same service with unique names

3. **Auto-Dependency Wiring**: The builder automatically:
   - Links Web Apps to App Service Plans
   - Connects Function Apps to Storage Accounts
   - Wires Container Apps to Container Environments
   - Associates Application Insights with Log Analytics

4. **Download Template**: Get a complete Bicep template with:
   - ALL required AVM module parameters
   - Proper parameter declarations with types and defaults
   - Cross-service resource ID references
   - Outputs for all deployed resources
   - Ready-to-customize parameter values

## 📋 Generated Components

### Infrastructure Templates
- **Platform Components**: Shared services (Key Vault, Log Analytics, Virtual Network)
- **AVM Wrappers**: Thin wrappers around Azure Verified Modules
- **Naming Module**: CAF-compliant naming with length validation
- **Diagnostics**: Automated diagnostic settings for observability

### CI/CD Pipelines
- **Build Pipeline**: Bicep validation and compilation
- **Deploy Pipeline**: Environment-specific deployments with OIDC authentication
- **Reusable Templates**: Modular workflow components

### Documentation
- **README**: Deployment instructions and quickstart guide
- **Architecture**: High-level design and component descriptions
- **Best Practices**: Security, naming, and governance guidelines

## ⚙️ Configuration Options

### Supported Environments
- Development (dev)
- Test (test) 
- Production (prod)

### Azure Modules
- Virtual Network with subnets and NSGs
- Key Vault with RBAC and diagnostic settings
- Log Analytics workspace for centralized logging
- Diagnostic settings for automated monitoring

### Regions
- Australia East/Southeast
- US East/West/Central
- Europe North/West
- UK South/West  
- Asia Southeast/East

## 🔒 Security & Best Practices

- **RBAC**: Azure Role-Based Access Control by default
- **Secrets Management**: Azure Key Vault integration
- **Network Security**: Virtual network isolation and NSGs
- **Monitoring**: Comprehensive diagnostic settings
- **Compliance**: Follows Azure Well-Architected Framework
- **OIDC Authentication**: Passwordless GitHub Actions authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Azure Verified Modules (AVM)](https://aka.ms/avm) for infrastructure patterns
- [Azure Cloud Adoption Framework](https://docs.microsoft.com/azure/cloud-adoption-framework/) for naming conventions
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Next.js](https://nextjs.org/) for the application framework

## 📞 Support

For questions, issues, or contributions:
- Create an [issue](https://github.com/azurewithdanidu/iac-scaffolder/issues)
- Discussions in [GitHub Discussions](https://github.com/azurewithdanidu/iac-scaffolder/discussions)

---

Built with ❤️ for the Azure community
