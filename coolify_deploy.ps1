# Coolify Deployment Script
$ErrorActionPreference = "Continue"

# 1. Go to GitHub new repository page
Write-Host "=== Step 1: Opening GitHub new repository page ==="
$githubUrl = "https://github.com/new"
$navJson = @"
{"url":"$githubUrl"}
"@
cmd /c "echo $navJson | mavis browser tool navigate"
Start-Sleep -Seconds 3

# 2. Take screenshot to see GitHub new repo page
Write-Host "=== Step 2: Screenshot of GitHub ==="
$screenshot = cmd /c "echo {} | mavis browser tool screenshot"
$json = $screenshot | ConvertFrom-Json
$base64 = $json.content -replace '^data:image/png;base64,', ''
[System.IO.File]::WriteAllBytes("$env:TEMP\github_new.png", [System.Convert]::FromBase64String($base64))
Write-Host "Screenshot saved to $env:TEMP\github_new.png"

# 3. Navigate back to Coolify
Write-Host "=== Step 3: Going to Coolify ==="
$coolifyUrl = "http://72.61.119.147:8000/"
$navJson2 = @"
{"url":"$coolifyUrl"}
"@
cmd /c "echo $navJson2 | mavis browser tool navigate"
Start-Sleep -Seconds 3

# 4. Screenshot of Coolify
Write-Host "=== Step 4: Screenshot of Coolify ==="
$screenshot2 = cmd /c "echo {} | mavis browser tool screenshot"
$json2 = $screenshot2 | ConvertFrom-Json
$base642 = $json2.content -replace '^data:image/png;base64,', ''
[System.IO.File]::WriteAllBytes("$env:TEMP\coolify.png", [System.Convert]::FromBase64String($base642))
Write-Host "Coolify screenshot saved to $env:TEMP\coolify.png"

Write-Host "Done! Check the screenshots."