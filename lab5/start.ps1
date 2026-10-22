$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    foreach ($directory in @('runtime/postgres', 'runtime/redis')) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    if (-not (Test-Path '.env')) {
        $random = [Security.Cryptography.RandomNumberGenerator]::Create()
        $dbBytes = New-Object byte[] 24
        $secretBytes = New-Object byte[] 24
        $random.GetBytes($dbBytes)
        $random.GetBytes($secretBytes)
        $random.Dispose()
        $dbPassword = [BitConverter]::ToString($dbBytes).Replace('-', '')
        $encryptionSecret = [Convert]::ToBase64String($secretBytes)
        @"
POSTGRES_PASSWORD=$dbPassword
DATABASE_URL=postgresql://postgres:${dbPassword}@db:5432/typebot
ENCRYPTION_SECRET=$encryptionSecret
REDIS_URL=redis://redis:6379
NEXTAUTH_URL=http://localhost:8080
NEXT_PUBLIC_VIEWER_URL=http://127.0.0.1:8081
ADMIN_EMAIL=belyeva_ev_24@mf.grsu.by
SMTP_HOST=mail
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_IGNORE_TLS=true
NEXT_PUBLIC_SMTP_FROM=Typebot <typebot@lab5.local>
DISABLE_TELEMETRY=true
NODE_OPTIONS=--no-node-snapshot
"@ | Set-Content '.env' -Encoding utf8
    }
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { throw 'Не удалось запустить Typebot.' }
    Write-Host 'Редактор: http://localhost:8080; бот: http://127.0.0.1:8081'
    Write-Host 'Письмо для локального входа: http://localhost:8025'
} finally { Pop-Location }
