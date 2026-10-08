$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Test-Path 'runtime/node-red/flows.json')) {
    New-Item -ItemType Directory -Force 'runtime/node-red','runtime/mosquitto' | Out-Null
    $flows = @()
    foreach ($file in Get-ChildItem 'flows/flow-*.json' | Sort-Object Name) {
        $flows += @(Get-Content $file.FullName -Raw -Encoding utf8 | ConvertFrom-Json)
    }
    ConvertTo-Json -InputObject $flows -Depth 100 | Set-Content 'runtime/node-red/flows.json' -Encoding utf8
}
Copy-Item 'settings.js' 'runtime/node-red/settings.js' -Force
docker compose run --rm --no-deps node-red npm install --prefix /data node-red-dashboard@3.6.6 node-red-contrib-telegrambot@19.0.3
if ($LASTEXITCODE -ne 0) { throw 'Не удалось установить дополнительные ноды' }
docker compose up -d
if ($LASTEXITCODE -ne 0) { throw 'Не удалось запустить контейнеры' }
Write-Host 'Редактор: http://localhost:1880   Dashboard: http://localhost:1880/ui'
