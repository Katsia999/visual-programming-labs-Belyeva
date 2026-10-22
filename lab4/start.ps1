$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    foreach ($directory in @('runtime/n8n', 'runtime/data', 'runtime/redis')) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    docker info --format '{{.ServerVersion}}'
    if ($LASTEXITCODE -ne 0) { throw 'Сначала запустите Docker Desktop и дождитесь запуска Engine.' }
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { throw 'Не удалось запустить контейнеры.' }
    Write-Host 'Редактор n8n: http://localhost:5678'
    Write-Host 'При первом запуске создайте локального владельца, затем импортируйте JSON из flows.'
} finally {
    Pop-Location
}
