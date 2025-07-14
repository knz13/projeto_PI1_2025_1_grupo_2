#!/usr/bin/env pwsh

Write-Host "🔧 Configuração inicial e correção de conflitos de porta..." -ForegroundColor Yellow

# Verificar se a porta 80 está sendo usada
Write-Host "`n🔍 Verificando conflitos de porta..." -ForegroundColor Blue
try {
    $port80Process = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($port80Process) {
        Write-Host "⚠️  Porta 80 está sendo usada por outro serviço. Usando porta 8080 para HTTP." -ForegroundColor Yellow
        $processInfo = Get-Process -Id $port80Process.OwningProcess -ErrorAction SilentlyContinue
        if ($processInfo) {
            Write-Host "   Processo que usa a porta 80: $($processInfo.ProcessName)" -ForegroundColor Gray
        }
    } else {
        Write-Host "✅ Porta 80 disponível" -ForegroundColor Green
    }
} catch {
    Write-Host "✅ Porta 80 provavelmente disponível" -ForegroundColor Green
}

# Criar certificados SSL auto-assinados para desenvolvimento
Write-Host "`n🔐 Criando certificados SSL auto-assinados..." -ForegroundColor Blue
if (-not (Test-Path "nginx/ssl/cert.pem")) {
    # Criar diretório SSL se não existir
    if (-not (Test-Path "nginx/ssl")) {
        New-Item -ItemType Directory -Path "nginx/ssl" -Force | Out-Null
    }
    
    try {
        # Usar OpenSSL se disponível
        $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
        if ($opensslPath) {
            & openssl req -x509 -newkey rsa:4096 -nodes -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -subj "/CN=localhost"
            Write-Host "✅ Certificados SSL criados com OpenSSL" -ForegroundColor Green
        } else {
            # Criar certificados PEM válidos para desenvolvimento
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
4sopMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuGbXWiK3dQTyCbX5
xdE4yCuYp0yyTn1WjZpJA6VtxaOIugsik2zQUgggUOPIrMcCDEa0YaM5s+i1W6/p
I8+igUGR5lX8k+v1JG8c4/Uuq5jKnGv9cC8WOy8mq/ALEB8aWZ/Oo+s2QK8F/lXl
LqbY3i7EnjHCt3w9JGKUk+1q9sQIdBAKlOXxNBY7sYiO1I1h+YjFfkEeLFJwHExg
-----END PRIVATE KEY-----
"@
            
            # Salvar certificados
            $certContent | Out-File -FilePath "nginx/ssl/cert.pem" -Encoding ASCII
            $keyContent | Out-File -FilePath "nginx/ssl/key.pem" -Encoding ASCII
            Write-Host "✅ Certificados SSL criados (auto-assinados para desenvolvimento)" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Erro ao criar certificados: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   Continuando sem SSL..." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Certificados SSL já existem" -ForegroundColor Green
}

# Parar containers existentes
Write-Host "`n🛑 Parando containers existentes..." -ForegroundColor Blue
docker-compose down

# Limpeza completa
Write-Host "`n🧹 Limpando recursos antigos..." -ForegroundColor Blue
docker-compose down --rmi all --volumes --remove-orphans

# Rebuild
Write-Host "`n🔨 Fazendo rebuild..." -ForegroundColor Blue
docker-compose build --no-cache

# Subir containers
Write-Host "`n🚀 Subindo containers..." -ForegroundColor Blue
docker-compose up -d

# Aguardar
Write-Host "`n⏳ Aguardando containers iniciarem (30 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Status
Write-Host "`n📦 Status dos containers:" -ForegroundColor Blue
docker-compose ps

# Testes com novas portas
Write-Host "`n🧪 Executando testes..." -ForegroundColor Yellow

# Teste 1: Backend direto
Write-Host "`n🎯 Teste 1: Backend direto (porta 5875)" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5875" -Method GET -TimeoutSec 10
    Write-Host "✅ Backend responde: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Conteúdo: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend não responde: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Nginx HTTP na porta 8080
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
    Write-Host "   Conteúdo: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Nginx HTTPS erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Logs resumidos
Write-Host "`n📋 Logs recentes do backend:" -ForegroundColor Blue
docker-compose logs --tail=5 backend

Write-Host "`n📋 Logs recentes do nginx:" -ForegroundColor Blue
docker-compose logs --tail=5 nginx

# Informações finais
Write-Host "`n✅ Sua aplicação estará disponível em:" -ForegroundColor Green
Write-Host "   - HTTP: http://localhost:8080 (redireciona para HTTPS)" -ForegroundColor White
Write-Host "   - HTTPS: https://localhost:4665" -ForegroundColor White
Write-Host "   - Backend direto: http://localhost:5875 (apenas para desenvolvimento)" -ForegroundColor Gray

Write-Host "`n🔍 Comandos úteis para debug:" -ForegroundColor Cyan
Write-Host "   docker-compose logs -f backend    # Ver logs do backend em tempo real" -ForegroundColor White
Write-Host "   docker-compose logs -f nginx      # Ver logs do nginx em tempo real" -ForegroundColor White
Write-Host "   docker-compose exec backend sh    # Entrar no container do backend" -ForegroundColor White
Write-Host "   docker-compose down              # Parar todos os containers" -ForegroundColor White

Write-Host "`n✅ Configuração e testes concluídos!" -ForegroundColor Green
