$src = "C:\Users\MY PC\.gemini\antigravity\scratch\sholo-guti-cognitive"
$dest = "C:\Users\MY PC\.gemini\antigravity\scratch\gooti-game-source.zip"
$temp = "C:\Users\MY PC\.gemini\antigravity\scratch\gooti-temp-zip"

if (Test-Path $temp) { Remove-Item -Path $temp -Recurse -Force }
New-Item -ItemType Directory -Force -Path $temp

Get-ChildItem -Path $src -Exclude "node_modules", "dist", ".git" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $temp -Recurse -Force
}

if (Test-Path $dest) { Remove-Item -Path $dest -Force }
Compress-Archive -Path "$temp\*" -DestinationPath $dest -Force
Remove-Item -Path $temp -Recurse -Force
Write-Output "SUCCESS"
