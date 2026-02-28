# Azure App Service Configuration Script
# Run this to configure the correct settings for Next.js deployment

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$WebAppName
)

Write-Host "Configuring Azure App Service settings for Next.js..." -ForegroundColor Green

# Set the required application settings
az webapp config appsettings set `
    --resource-group $ResourceGroupName `
    --name $WebAppName `
    --settings `
        SCM_DO_BUILD_DURING_DEPLOYMENT=true `
        NODE_ENV=production `
        WEBSITE_NODE_DEFAULT_VERSION="18-lts" `
        ENABLE_ORYX_BUILD=true `
        POST_BUILD_COMMAND="chmod +x oryx-post-build.sh && ./oryx-post-build.sh"

Write-Host "✅ App settings configured successfully!" -ForegroundColor Green

# Remove any conflicting settings
Write-Host "`nRemoving conflicting settings..." -ForegroundColor Yellow
az webapp config appsettings delete `
    --resource-group $ResourceGroupName `
    --name $WebAppName `
    --setting-names WEBSITE_RUN_FROM_PACKAGE

Write-Host "✅ Configuration complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Trigger a new deployment from Git" -ForegroundColor White
Write-Host "2. Monitor the deployment logs" -ForegroundColor White
Write-Host "3. Verify the build runs successfully" -ForegroundColor White
