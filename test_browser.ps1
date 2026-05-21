param([string]$Tool, [string]$Args)
$jsonArgs = $Args | ConvertFrom-Json
$cmd = "mavis browser tool $Tool `'$(($jsonArgs | ConvertTo-Json -Compress))`'"
Invoke-Expression $cmd