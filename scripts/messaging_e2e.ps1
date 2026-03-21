$ErrorActionPreference = 'Stop'
Write-Output "=== E2E messaging test script starting ==="
# Recruiter login or register
try {
  Write-Output "Attempting recruiter login..."
  $rec = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/auth/login' -ContentType 'application/json' -Body (ConvertTo-Json @{email='siddhib011@gmail.com'; password='siddhi'})
  Write-Output "Recruiter login successful"
} catch {
  Write-Output "Recruiter not found; registering..."
  Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/auth/register' -ContentType 'application/json' -Body (ConvertTo-Json @{name='Recruiter'; email='siddhib011@gmail.com'; password='siddhi'; role='recruiter'})
  Start-Sleep -Seconds 1
  $otp = (docker exec placement_portal_redis redis-cli --raw GET "otp:siddhib011@gmail.com").Trim()
  Write-Output "OTP: $otp"
  Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/auth/verify-otp' -ContentType 'application/json' -Body (ConvertTo-Json @{email='siddhib011@gmail.com'; otp=$otp})
  Start-Sleep -Seconds 1
  $rec = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/auth/login' -ContentType 'application/json' -Body (ConvertTo-Json @{email='siddhib011@gmail.com'; password='siddhi'})
  Write-Output "Recruiter registered and logged in"
}

Write-Output "Recruiter object:";
$rec | ConvertTo-Json -Depth 4

# Student login
$stu = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/auth/login' -ContentType 'application/json' -Body (ConvertTo-Json @{email='bhardwajsiddhi54@gmail.com'; password='siddhi'})
Write-Output "Student object:"
$stu | ConvertTo-Json -Depth 4

# Start conversation as student
$headersStu = @{ Authorization = "Bearer $($stu.token)" }
$body = @{ recipientId = $rec.user.id }
$conv = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/messaging/conversations/start' -Headers $headersStu -ContentType 'application/json' -Body (ConvertTo-Json $body)
Write-Output "Conversation created:"
$conv | ConvertTo-Json -Depth 6

# Send a message as student
$msgBody = @{ conversationId = $conv._id; content = 'Hi, I saw I was shortlisted. Can we schedule an interview?'; recipientId = $rec.user.id }
$msgResp = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/messaging/messages' -Headers $headersStu -ContentType 'application/json' -Body (ConvertTo-Json $msgBody)
Write-Output "Message send response:"
$msgResp | ConvertTo-Json -Depth 6

Start-Sleep -Seconds 1

# Fetch conversations & messages as recruiter
$headersRec = @{ Authorization = "Bearer $($rec.token)" }
$convsRec = Invoke-RestMethod -Method Get -Uri 'http://localhost:5000/api/messaging/conversations/me' -Headers $headersRec
Write-Output "Recruiter conversations:"
$convsRec | ConvertTo-Json -Depth 6

$msgsRec = Invoke-RestMethod -Method Get -Uri ("http://localhost:5000/api/messaging/messages/" + $conv._id) -Headers $headersRec
Write-Output "Messages for conversation:"
$msgsRec | ConvertTo-Json -Depth 6

# Mark as read
Invoke-RestMethod -Method Put -Uri ("http://localhost:5000/api/messaging/messages/" + $conv._id + "/read") -Headers $headersRec
Start-Sleep -Seconds 1
$convsAfter = Invoke-RestMethod -Method Get -Uri 'http://localhost:5000/api/messaging/conversations/me' -Headers $headersRec
Write-Output "Conversations after marking read:"
$convsAfter | ConvertTo-Json -Depth 6

Write-Output "=== E2E messaging test completed ===" 
