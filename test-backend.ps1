#!/usr/bin/env pwsh

Write-Host "🧪 Testando o backend..." -ForegroundColor Yellow

# Verificar containers
Write-Host "`n📦 Status dos containers:" -ForegroundColor Blue
docker-compose ps

# Teste 1: Backend direto
Write-Host "`n🎯 Teste 1: Backend direto (porta 5875)" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5875" -Method GET -TimeoutSec 10
    Write-Host "✅ Backend responde: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend não responde: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Nginx HTTP na porta 8080 (corrigido para evitar conflito com porta 80)
Write-Host "`n🌐 Teste 2: Nginx HTTP (porta 8080)" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method GET -TimeoutSec 10 -MaximumRedirection 0
    Write-Host "✅ Nginx HTTP responde: $($response.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 301 -or $_.Exception.Response.StatusCode -eq 302) {
        Write-Host "✅ Nginx redirecionando para HTTPS (correto!)" -ForegroundColor Green
    } else {
        Write-Host "❌ Nginx HTTP erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 3: Nginx HTTPS
Write-Host "`n🔒 Teste 3: Nginx HTTPS (porta 4665)" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "https://localhost:4665" -Method GET -SkipCertificateCheck -TimeoutSec 10
    Write-Host "✅ Nginx HTTPS responde: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Nginx HTTPS erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 4: Logs recentes
Write-Host "`n📋 Logs recentes do backend:" -ForegroundColor Blue
docker-compose logs --tail=10 backend

Write-Host "`n📋 Logs recentes do nginx:" -ForegroundColor Blue
docker-compose logs --tail=10 nginx

Write-Host "`n✅ Testes concluídos!" -ForegroundColor Green