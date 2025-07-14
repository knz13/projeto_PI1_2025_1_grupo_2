#!/usr/bin/env pwsh

Write-Host "🔧 Correção rápida - Aplicando apenas as mudanças essenciais..." -ForegroundColor Yellow

# Parar containers existentes
Write-Host "`n🛑 Parando containers existentes..." -ForegroundColor Blue
docker-compose down

# Criar certificados SSL se não existirem
Write-Host "`n🔐 Verificando certificados SSL..." -ForegroundColor Blue
if (-not (Test-Path "nginx/ssl")) {
    New-Item -ItemType Directory -Path "nginx/ssl" -Force | Out-Null
}

if (-not (Test-Path "nginx/ssl/cert.pem")) {
    Write-Host "📝 Criando certificados SSL..." -ForegroundColor Yellow
    
    $certContent = @"
-----BEGIN CERTIFICATE-----
MIIDSzCCAjOgAwIBAgIUQZ7+8xZ7GKjKqw+Jj+7XGqXH9dQwDQYJKoZIhvcNAQEL
BQAwNTELMAkGA1UEBhMCVVMxFDASBgNVBAoMC0V4YW1wbGUgT3JnMRAwDgYDVQQD
DAdleGFtcGxlMB4XDTIzMDEwMTAwMDAwMFoXDTI0MDEwMTAwMDAwMFowNTELMAkG
A1UEBhMCVVMxFDASBgNVBAoMC0V4YW1wbGUgT3JnMRAwDgYDVQQDDAdleGFtcGxl
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuGbXWiK3dQTyCbX5xdE4
yCuYp0yyTn1WjZpJA6VtxaOIugsik2zQUgggUOPIrMcCDEa0YaM5s+i1W6/pI8+i
gUGR5lX8k+v1JG8c4/Uuq5jKnGv9cC8WOy8mq/ALEB8aWZ/Oo+s2QK8F/lXlLqbY
3i7EnjHCt3w9JGKUk+1q9sQIdBAKlOXxNBY7sYiO1I1h+YjFfkEeLFJwHExg4sop
0tIKqGjfZyNGgGF0JoWUKFdmz8LZCFNaW3VJGx7vfCUq8fqVOAKg3XlY6HNiGQoD
Y1d2R3W7G8VJk0J1F2f0e3qY0X2Z8LjGg0mY1B7pZ6qV3fT8JpY6K7rY9yXfP0rV
wIDAQABo1MwUTAdBgNVHQ4EFgQUO2Z7G8VJk0J1F2f0e3qY0X2Z8LjGg0wwHwYD
VR0jBBgwFoAUO2Z7G8VJk0J1F2f0e3qY0X2Z8LjGg0wwDwYDVR0TAQH/BAUwAwEB
/zANBgkqhkiG9w0BAQsFAAOCAQEAuGbXWiK3dQTyCbX5xdE4yCuYp0yyTn1WjZpJ
A6VtxaOIugsik2zQUgggUOPIrMcCDEa0YaM5s+i1W6/pI8+igUGR5lX8k+v1JG8c
4/Uuq5jKnGv9cC8WOy8mq/ALEB8aWZ/Oo+s2QK8F/lXlLqbY3i7EnjHCt3w9JGKU
k+1q9sQIdBAKlOXxNBY7sYiO1I1h+YjFfkEeLFJwHExg4sop0tIKqGjfZyNGgGF0
JoWUKFdmz8LZCFNaW3VJGx7vfCUq8fqVOAKg3XlY6HNiGQoDY1d2R3W7G8VJk0J1
F2f0e3qY0X2Z8LjGg0mY1B7pZ6qV3fT8JpY6K7rY9yXfP0rVww==
-----END CERTIFICATE-----
"@

    $keyContent = @"
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC4ZtdaIrd1BPIJ
tfnF0TjIK5inTLJOfVaNmkkDpW3Fo4i6CyKTbNBSCCBQ48isxwIMRrRhozez6LVb
r+kjz6KBQZHmVfyT6/UkbxzgqjKnGv9cC8WOy8mq/ALEB8aWZ/Oo+s2QK8F/lXl
LqbY3i7EnjHCt3w9JGKUk+1q9sQIdBAKlOXxNBY7sYiO1I1h+YjFfkEeLFJwHExg
4sopMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuGbXWiK3dQTyCbX5
xdE4yCuYp0yyTn1WjZpJA6VtxaOIugsik2zQUgggUOPIrMcCDEa0YaM5s+i1W6/p
I8+igUGR5lX8k+v1JG8c4/Uuq5jKnGv9cC8WOy8mq/ALEB8aWZ/Oo+s2QK8F/lXl
LqbY3i7EnjHCt3w9JGKUk+1q9sQIdBAKlOXxNBY7sYiO1I1h+YjFfkEeLFJwHExg
4sopMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuGbXWiK3dQTyCbX5
xdE4yCuYp0yyTn1WjZpJA6VtxaOIugsik2zQUgggUOPIrMcCDEa0YaM5s+i1W6/p
I8+igUGR5lX8k+v1JG8c4/Uuq5jKnGv9cC8WOy8mq/ALEB8aWZ/Oo+s2QK8F/lXl
LqbY3i7EnjHCt3w9JGKUk+1q9sQIdBAKlOXxNBY7sYiO1I1h+YjFfkEeLFJwHExg
4sopMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuGbXWiK3dQTyCbX5
xdE4yCuYp0yyTn1WjZpJA6VtxaOIugsik2zQUgggUOPIrMcCDEa0YaM5s+i1W6/p
I8+igUGR5lX8k+v1JG8c4/Uuq5jKnGv9cC8WOy8mq/ALEB8aWZ/Oo+s2QK8F/lXl
LqbY3i7EnjHCt3w9JGKUk+1q9sQIdBAKlOXxNBY7sYiO1I1h+YjFfkEeLFJwHExg
-----END PRIVATE KEY-----
"@

    $certContent | Out-File -FilePath "nginx/ssl/cert.pem" -Encoding ASCII
    $keyContent | Out-File -FilePath "nginx/ssl/key.pem" -Encoding ASCII
    Write-Host "✅ Certificados SSL criados" -ForegroundColor Green
} else {
    Write-Host "✅ Certificados SSL já existem" -ForegroundColor Green
}

# Subir containers sem rebuild (mais rápido)
Write-Host "`n🚀 Subindo containers..." -ForegroundColor Blue
docker-compose up -d

# Aguardar containers iniciarem
Write-Host "`n⏳ Aguardando containers iniciarem (45 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 45

# Status
Write-Host "`n📦 Status dos containers:" -ForegroundColor Blue
docker-compose ps

# Verificar logs se há problemas
Write-Host "`n📋 Logs recentes do nginx:" -ForegroundColor Blue
docker-compose logs --tail=10 nginx

Write-Host "`n📋 Logs recentes do backend:" -ForegroundColor Blue  
docker-compose logs --tail=10 backend

# Testes rápidos
Write-Host "`n🧪 Testes rápidos..." -ForegroundColor Yellow

# Teste backend direto
Write-Host "`n🎯 Testando backend direto (porta 5875):" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5875" -Method GET -TimeoutSec 15
    Write-Host "✅ Backend OK - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend falhou: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste nginx HTTPS
Write-Host "`n🔒 Testando nginx HTTPS (porta 4665):" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "https://localhost:4665" -Method GET -SkipCertificateCheck -TimeoutSec 15
    Write-Host "✅ Nginx HTTPS OK - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Nginx HTTPS falhou: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste nginx HTTP
Write-Host "`n🌐 Testando nginx HTTP (porta 8080):" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method GET -TimeoutSec 15 -MaximumRedirection 0
    Write-Host "✅ Nginx HTTP OK - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 301 -or $_.Exception.Response.StatusCode -eq 302) {
        Write-Host "✅ Nginx HTTP redireciona para HTTPS (correto!)" -ForegroundColor Green
    } else {
        Write-Host "❌ Nginx HTTP falhou: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎯 URLs de acesso:" -ForegroundColor Cyan
Write-Host "   - Backend direto: http://localhost:5875" -ForegroundColor White
Write-Host "   - Nginx HTTP: http://localhost:8080 (redireciona)" -ForegroundColor White
Write-Host "   - Nginx HTTPS: https://localhost:4665" -ForegroundColor White

Write-Host "`n✅ Correção concluída!" -ForegroundColor Green
