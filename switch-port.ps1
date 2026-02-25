# Port Configuration Script for Windows PowerShell
# Usage: .\switch-port.ps1 [8000|8001]

param(
    [int]$Port = 8000
)

Write-Host "Switching to port $Port..." -ForegroundColor Green

# Create .env file in frontend directory
$envContent = @"
VITE_API_BASE_URL=http://127.0.0.1:$Port
VITE_WS_URL=ws://localhost:$Port/ws/sensors
"@

$envContent | Out-File -FilePath "frontend\vite-project\.env" -Encoding UTF8

Write-Host "✅ Frontend configured to use port $Port" -ForegroundColor Green
Write-Host "📝 Created frontend\vite-project\.env with:" -ForegroundColor Cyan
Write-Host "   VITE_API_BASE_URL=http://127.0.0.1:$Port" -ForegroundColor White
Write-Host "   VITE_WS_URL=ws://localhost:$Port/ws/sensors" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Now start your backend on port $Port and frontend will connect to it!" -ForegroundColor Yellow
