# Azure Landing Zone Templates

This directory contains Bicep templates for provisioning Azure Landing Zones using different approaches.

## 📁 Templates

### 1. ALZ (Azure Landing Zone) - Enterprise Scale
**File:** `alz-main.bicep`  
**Target Scope:** Management Group  
**Use Case:** Enterprise-wide landing zone with management groups, hub-spoke networking, and centralized governance

**Key Features:**
- Management Group hierarchy
- Hub-spoke VNet architecture
- Azure Firewall and DDoS Protection options
- Centralized monitoring and governance
- Policy assignments at MG level

### 2. Subscription Vending
**File:** `subscription-vending-main.bicep`  
**Target Scope:** Management Group  
**Use Case:** Automated subscription provisioning with governance from day one

**Key Features:**
- Creates new Azure subscriptions (requires EA/MCA)
- Places subscriptions in Management Groups
- Applies standardized tags automatically
- Deploys monitoring and policy
- Resource group structure

### 3. Workload Landing Zone
**File:** `workload-main.bicep`  
**Target Scope:** Subscription  
**Use Case:** Application/workload-specific infrastructure in an existing subscription

**Key Features:**
- VNet with subnet segmentation
- Key Vault for secrets
- Log Analytics for monitoring
- Workload-type specific resources (web/api/data/container/function)
- High availability options

## 🎯 Common Parameters

All templates accept these standard parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `landingZoneName` | string | Unique name for the landing zone (3-63 chars) |
| `primaryRegion` | string | Azure region for resources |
| `environment` | string | dev \| test \| staging \| prod |
| `costCenter` | string | Cost center or department code |
| `ownerEmail` | string | Owner email address |
| `tags` | object | Additional tags to apply |

## 🔧 Usage

### Deploying ALZ Template
```bash
az deployment mg create \
  --management-group-id "mg-platform" \
  --location "eastus" \
  --template-file alz-main.bicep \
  --parameters landingZoneName="corp-shared" \
               primaryRegion="eastus" \
               environment="prod" \
               costCenter="IT-001" \
               ownerEmail="platform@contoso.com" \
               subscriptionId="<sub-id>" \
               parentManagementGroupId="mg-platform" \
               securityContactEmail="security@contoso.com"
```

### Deploying Subscription Vending
```bash
az deployment mg create \
  --management-group-id "mg-landing-zones" \
  --location "eastus" \
  --template-file subscription-vending-main.bicep \
  --parameters landingZoneName="app-finance" \
               primaryRegion="eastus" \
               environment="prod" \
               costCenter="FIN-001" \
               ownerEmail="finance@contoso.com" \
               billingAccountId="<billing-id>" \
               enrollmentAccountId="<enrollment-id>" \
               targetManagementGroupId="mg-corp"
```

### Deploying Workload Landing Zone
```bash
az deployment sub create \
  --subscription "<subscription-id>" \
  --location "eastus" \
  --template-file workload-main.bicep \
  --parameters landingZoneName="app-ecommerce" \
               subscriptionId="<sub-id>" \
               primaryRegion="eastus" \
               environment="prod" \
               costCenter="SALES-001" \
               ownerEmail="ecommerce@contoso.com" \
               workloadType="web" \
               enableHighAvailability=true
```

## 📦 Module Dependencies

These templates reference supporting modules that should be created:

### Required Modules (to be implemented)

**ALZ Template:**
- `./modules/networking.bicep` - Hub-spoke network configuration
- `./modules/monitoring.bicep` - Log Analytics and Security Center
- `./modules/governance.bicep` - Policy assignments

**Subscription Vending:**
- `./modules/subscription-placement.bicep` - MG association
- `./modules/subscription-tags.bicep` - Subscription-level tags
- `./modules/resource-groups.bicep` - Standard RG structure
- `./modules/monitoring.bicep` - Monitoring setup
- `./modules/policy.bicep` - Policy assignments

**Workload Landing Zone:**
- `./modules/networking.bicep` - VNet and subnets
- `./modules/monitoring.bicep` - Log Analytics
- `./modules/keyvault.bicep` - Key Vault
- `./modules/workload-web.bicep` - App Service
- `./modules/workload-api.bicep` - API Management
- `./modules/workload-data.bicep` - Database services
- `./modules/workload-container.bicep` - Container Apps
- `./modules/workload-function.bicep` - Function Apps

## 🏗️ Template Selection Guide

| Scenario | Template | Scope |
|----------|----------|-------|
| Setting up enterprise Azure environment | ALZ | Management Group |
| Provisioning new subscriptions with governance | Subscription Vending | Management Group |
| Deploying application infrastructure | Workload | Subscription |
| Multi-region with hub-spoke | ALZ | Management Group |
| Sandbox/Dev subscriptions | Subscription Vending | Management Group |
| Production workload with HA | Workload | Subscription |

## 🎨 Customization

You can customize these templates by:
1. Modifying default values in parameters
2. Adding/removing tags in the `allTags` variable
3. Adjusting naming conventions
4. Implementing the referenced modules with your organization's standards
5. Adding additional Azure Policy assignments
6. Configuring network address spaces

## 📚 Related Documentation

- [Azure Landing Zones](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/)
- [Azure Verified Modules](https://aka.ms/avm)
- [Cloud Adoption Framework](https://learn.microsoft.com/azure/cloud-adoption-framework/)
- [Bicep Language](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)

## 🔐 Security Considerations

- All templates implement tagging for governance and cost tracking
- Network security groups should be configured per workload
- Key Vault uses RBAC and soft delete
- Monitoring enabled by default
- Follow principle of least privilege for RBAC assignments

---

**Note:** These templates are designed to work with the Landing Zone Vending Machine self-service portal, which generates `.bicepparam` files automatically.
