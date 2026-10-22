param([switch]$AfterRestart)
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    $query = @'
SELECT COALESCE(json_agg(row_to_json(q)), '[]') FROM (
  SELECT r.id, r."isCompleted" AS completed, r.variables,
    (SELECT json_agg(json_build_object('blockId',h."blockId",'value',h.value) ORDER BY h.index) FROM "SetVariableHistoryItem" h WHERE h."resultId"=r.id) AS history,
    (SELECT json_agg(v."edgeId" ORDER BY v.index) FROM "VisitedEdge" v WHERE v."resultId"=r.id) AS edges,
    (SELECT json_agg(json_build_object('status',l.status,'description',l.description)) FROM "Log" l WHERE l."resultId"=r.id) AS logs
  FROM "Result" r WHERE r."typebotId"='llfioldlul2uxwsjbpvh0pnb' ORDER BY r."createdAt"
) q;
'@
    $json = $query | docker compose exec -T db psql -U postgres -d typebot -At
    if ($LASTEXITCODE -ne 0) { throw 'Не удалось прочитать результаты Typebot.' }
    $results = @($json | ConvertFrom-Json)
    $checks = [ordered]@{
        allDialogsCompleted = $results.Count -ge 3 -and @($results | Where-Object { -not $_.completed }).Count -eq 0
        sameGroupBranch = @($results | Where-Object { $_.edges -contains 'edgebelyevamatch' }).Count -gt 0
        otherGroupBranch = @($results.history | Where-Object { $_.blockId -eq 'blockbelyevaotherroute' -and $_.value -eq 'Другая группа' }).Count -gt 0
        httpSuccessBranch = @($results | Where-Object { $_.edges -contains 'edgebelyevatimeok' }).Count -gt 0
        httpFailureBranch = @($results | Where-Object { $_.completed -and $_.logs.status -contains 'error' -and $_.edges -notcontains 'edgebelyevatimeok' }).Count -gt 0
        correctEmailSaved = @($results.variables | Where-Object { $_.value -eq 'belyeva@example.com' }).Count -gt 0
        invalidEmailNotSaved = @($results.variables | Where-Object { $_.value -in @('непочта','belyeva@localhost') }).Count -eq 0
    }
    $export = Get-Content exports/flow-04-belyeva-export.json -Raw | ConvertFrom-Json
    $checks['workingApiRestored'] = ($export.groups.blocks | Where-Object { $_.id -eq 'blockbelyevahttp' }).options.webhook.url -eq 'https://timeapi.io/api/time/current/zone?timeZone=Europe/Minsk'
    $report = [ordered]@{
        checkedAt = [DateTimeOffset]::Now.ToString('o')
        afterRestart = [bool]$AfterRestart
        checks = $checks
        allPassed = @($checks.Values | Where-Object { -not $_ }).Count -eq 0
        results = $results
    }
    if ($AfterRestart) {
        $before = Get-Content docs/verification.json -Raw | ConvertFrom-Json
        $checks['sameResultIdsAfterRestart'] = (@($before.results.id) -join ',') -eq (@($results.id) -join ',')
        $report.allPassed = @($checks.Values | Where-Object { -not $_ }).Count -eq 0
    }
    $target = if ($AfterRestart) { 'docs/persistence-check.json' } else { 'docs/verification.json' }
    $report | ConvertTo-Json -Depth 35 | Set-Content $target -Encoding utf8
    $checks.GetEnumerator() | Format-Table Key,Value -AutoSize
    if (-not $report.allPassed) { throw 'Не все проверки пройдены.' }
} finally { Pop-Location }
