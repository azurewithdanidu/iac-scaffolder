# Azure Pipeline Build Template

This pipeline template can be used to build and test your Azure infrastructure code. It includes stages for building and testing your code, as well as publishing the build artifacts.

## Usage

To use this pipeline template, you will need to create a new pipeline in Azure DevOps and reference the `build-template.yml` pipeline template in your YAML pipeline.

```yaml
stages:
  - template: /azure-pipelines/templates/build-template.yml@self
    parameters:
      testCondition: eq(variables['Build.Reason'], 'PullRequest')
      templateFilePath: "$(templateFolderPath)/$(templateFileBaseName)"
      parameterFilePath: $(parameterFilePath)
      skipTests: "none"
      continueOnFailedTests: false
      svcConnection: $(svcConnection)
```

The pipeline template includes several parameters that can be customised to fit your specific deployment needs. These parameters include:

- `templateFilePath`: The path to the Bicep template file.
- `parameterFilePath`: The path to the parameter file.
- `continueOnFailedTests`: A boolean value that determines whether to silence errors from testing and continue the pipeline.
- `skipTests`: A string value that specifies the ARM TTK tests to skip, e.g. "Template Should Not Contain Blank".
- `testCondition`: A string value that specifies the condition to run tests.
- `mode`: A string value that specifies the contextual mode of the build, e.g. whether it is part of the initial build or ongoing operations.
- `svcConnection`: The name of the service connection to use for authentication.

Once you have customised the parameters to fit your build and test needs, you can save and run the pipeline.

## Build and Test Tasks

This pipeline template consists of two main tasks: `Build` and `Test`.

### Build

The `Build` task builds the Bicep templates into ARM templates using the `az bicep build` command. The built ARM templates are then published as build artifacts. The Bicep templates are built into ARM templates to ensure that the ARM TTK tests are run against the final ARM templates that will be deployed to Azure. ARM TTK currently does not support Bicep templates.

### Test

The `Test` tasks runs ARM TTK (Azure Resource Manager Template Testing Toolkit) against the built ARM templates. The ARM TTK is a set of PowerShell modules that can be used to validate ARM templates against a set of best practices and coding standards.

The results of the ARM TTK tests are then published and viewable on your pipeline run, which can be used to track the quality of your Azure infrastructure code over time.

## Conclusion

This pipeline template provides a flexible and customisable way to build and test infrastructure as code for Azure using Bicep templates. By customising the parameters to fit your specific build and test needs, you can use this pipeline template to build and test a wide range of Azure resources.

# Azure Pipeline Deploy Template

This pipeline template can be used to deploy your Azure infrastructure code. It includes stages for deploying your code, as well as previewing changes before deployment.

## Usage

To use this pipeline template, you will need to create a new pipeline in Azure DevOps and reference the `deploy-template.yml` pipeline template in your YAML pipeline.

```yaml
- template: /azure-pipelines/templates/deploy-template.yml@self
  parameters:
    stage: Deploy
    dependsOn: "Build"
    condition: and(succeeded(), or(eq(variables['Build.SourceBranch'], 'refs/heads/main'), eq(variables['Build.Reason'], 'Manual')))
    svcConnection: $(svcConnection)
    subscriptionId: $(subscriptionId)
    location: $(location)
    adoEnvironment: $(adoEnvironment)
    templateFileName: "$(templateFileName)"
    parameterFilePath: $(parameterFilePath)
    deploymentName: $(deploymentName)
    previewChanges: true
    azDeploymentType: "managementGroup"
    managementGroupId: $(managementGroupId)
```

Each pipeline template includes several parameters that can be customised to fit your specific deployment needs. These parameters include:

- `stage`: The name of the stage in the pipeline.
- `dependsOn`: The stages that this stage depends on.
- `condition`: The condition that must be met for this stage to run.
- `adoEnvironment`: The Azure DevOps environment for deployment jobs.
- `location`: The location where the deployment metadata will be saved.
- `subscriptionId`: The subscription ID to deploy to.
- `templateFileName`: The name of the file (assuming it's a built Bicep file into JSON).
- `deploymentName`: The name for the ARM deployment.
- `parameterFilePath`: The path to the parameter file.
- `inlineParams`: The string representation of additional parameters.
- `svcConnection`: The service connection.
- `previewChanges`: Whether to enable the what-if preview.
- `azDeploymentType`: The type of Azure deployment.
- `mode`: The contextual mode of the deployment.
- `managementGroupId`: The ID of the management group to deploy to.
- `resourceGroupName`: The name of the resource group to deploy to.

Once you have customised the parameters to fit your deployment needs, you can save and run the pipeline.

### Multi-Subscription Deployments

Deployments to multiple subscriptions is supported and resources will be deployed to each subscription specified in the Bicep parameter file. The `subscriptionId` and `location` parameter must be specified in the Bicep parameter file for deployment to succeed.

> Note: When conducting a multi-subscription deployment the pipeline parameters `subscriptionId` and `location` are not used.

## Preview and Deploy Stages

This pipeline template consists of two stages: `Preview` and `Deploy`.

## Preview Stage

The `Preview` stage includes a job that previews the changes that will be made by the deployment. This can be useful for verifying that the deployment will make the expected changes before actually deploying the code.

## Deploy Stage

The `Deploy` stage includes a job that deploys the Azure infrastructure code using the Azure CLI. The deployment can be customised using the parameters passed to the pipeline template.

## Operations

Each stage will contain an operations task that can be conditionally run by specifying the `mode` parameter. The operations tasks are used to designed to be used for ongoing operations of the infrastructure, such as updating the deployment or deleting the resources. These tasks will read each parameter file in the deployment directory and run a deployment for each parameter file. This allows you to easily update or delete multiple deployments at once.

The `subscriptionId` and `location` parameter must be specified in the Bicep parameter file for deployment to succeed.

## Conclusion

This pipeline template provides a flexible and customisable way to deploy infrastructure as code for Azure using Bicep templates. By customising the parameters to fit your specific deployment needs, you can use this pipeline template to deploy a wide range of Azure resources.
