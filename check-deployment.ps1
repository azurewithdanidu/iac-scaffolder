# Quick deployment checker
Write-Host "`n=== CloudBlueprint Deployment Checker ===" -ForegroundColor Cyan

Write-Host "`n📊 Checking GitHub Actions status..." -ForegroundColor Yellow
Start-Process "https://github.com/azurewithdanidu/iac-scaffolder/actions"

Write-Host "`n🌐 Testing website..." -ForegroundColor Yellow
$url = "https://iac-scaffolder.azurewebsites.net"

try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Website is LIVE and responding!" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor White
        Start-Process $url
    }
} catch {
    Write-Host "⏳ Website not ready yet. Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   This is normal if deployment just started." -ForegroundColor Gray
    Write-Host "   Wait a few minutes and run this script again." -ForegroundColor Gray
}

Write-Host "`n📝 To check Azure logs:" -ForegroundColor Cyan
Write-Host "   az webapp log tail --name iac-scaffolder --resource-group iac-scaffolder-rg" -ForegroundColor White

Write-Host "`n🔄 To restart the app:" -ForegroundColor Cyan  
Write-Host "   az webapp restart --name iac-scaffolder --resource-group iac-scaffolder-rg" -ForegroundColor White

Write-Host ""
