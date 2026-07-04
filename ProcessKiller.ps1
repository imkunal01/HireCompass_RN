# Kill processes on ports 8081 and 8082
$ports = @(8081, 8082)

foreach ($port in $ports) {
    $matches = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING"
    if ($matches) {
        $processId = ($matches -split '\s+')[-1]
        Write-Host "Killing process on port $port (PID: $processId)..." -ForegroundColor Yellow
        taskkill /PID $processId /F | Out-Null
        Write-Host "Port $port is now free." -ForegroundColor Green
    } else {
        Write-Host "No process found on port $port." -ForegroundColor Cyan
    }
}

Write-Host "`nDone!" -ForegroundColor White
