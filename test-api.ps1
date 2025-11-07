# Test script to verify backend API endpoints are working
Write-Host "=== BACKEND API TESTING ===" -ForegroundColor Green

$baseUrl = "http://localhost:8000/api/birthcare/2"
$endpoints = @(
    "patients",
    "patient-admissions", 
    "patient-charges/admitted-patients",
    "payments/patients"
)

foreach ($endpoint in $endpoints) {
    $url = "$baseUrl/$endpoint"
    Write-Host "`nTesting: $url" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✅ SUCCESS: Status $($response.StatusCode)" -ForegroundColor Green
        
        # Try to parse JSON response
        try {
            $json = $response.Content | ConvertFrom-Json
            if ($json.data -and $json.data.Count) {
                Write-Host "   📊 Data count: $($json.data.Count)" -ForegroundColor Cyan
            } elseif ($json.Count) {
                Write-Host "   📊 Data count: $($json.Count)" -ForegroundColor Cyan
            } else {
                Write-Host "   📊 Response has data but no count available" -ForegroundColor Cyan
            }
        } catch {
            Write-Host "   📄 Response received but not JSON format" -ForegroundColor Blue
        }
    }
    catch {
        Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== TESTING COMPLETE ===" -ForegroundColor Green
Write-Host "If APIs are failing, check:" -ForegroundColor Yellow
Write-Host "1. Laravel backend server is running (php artisan serve)" -ForegroundColor Yellow  
Write-Host "2. Database is connected and has patient data" -ForegroundColor Yellow
Write-Host "3. Authentication/middleware is not blocking requests" -ForegroundColor Yellow