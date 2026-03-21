# scripts/check_endpoints.ps1
# Logs in and calls several protected endpoints to validate JWT-based access.

$base = 'http://localhost:5000'
$creds = @{ email = 'bhardwajsiddhi54@gmail.com'; password = 'siddhi' } | ConvertTo-Json

Write-Host "Logging in..."
try {
    $loginResp = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body $creds -ErrorAction Stop
} catch {
    Write-Error "Login failed: $($_.Exception.Message)"
    exit 1
}

$token = $loginResp.token
if (-not $token) {
    Write-Error "No token returned from login. Response:`n$($loginResp | ConvertTo-Json -Depth 5)"
    exit 1
}
Write-Host "Login successful. Token length:" ($token.Length)

$headers = @{ Authorization = "Bearer $token"; Origin = 'http://localhost:3000' }

$endpoints = @(
    '/api/profile/student/me',
    '/api/jobs',
    '/api/interview/student/me',
    '/api/notifications',
    '/api/applications'
)

foreach ($ep in $endpoints) {
    $url = "$base$ep"
    Write-Host "\n-> GET $url"
    try {
        $resp = Invoke-WebRequest -Uri $url -Method Get -Headers $headers -UseBasicParsing -ErrorAction Stop
        Write-Host "Status: $($resp.StatusCode) $($resp.StatusDescription)"
        $body = $resp.Content
        if ($body.Length -gt 0) {
            Write-Host "Body (first 1000 chars):"
            Write-Host ($body.Substring(0, [math]::Min(1000, $body.Length)))
        } else {
            Write-Host "(empty body)"
        }
    } catch {
        if ($_.Exception.Response) {
            $status = $_.Exception.Response.StatusCode.value__
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $content = $reader.ReadToEnd()
            Write-Host "Error status: $status"
            Write-Host "Response body: $content"
        } else {
            Write-Host "Request failed: $($_.Exception.Message)"
        }
    }
}

Write-Host "\nAll checks complete."