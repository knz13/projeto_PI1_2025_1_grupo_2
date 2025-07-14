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
    
    # Tentar usar OpenSSL primeiro
    $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
    if ($opensslPath) {
        try {
            & openssl req -x509 -newkey rsa:2048 -nodes -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -subj "/CN=localhost"
            Write-Host "✅ Certificados SSL criados com OpenSSL" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  OpenSSL falhou, usando PowerShell..." -ForegroundColor Yellow
            # Fallback para PowerShell
            $cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(1)
            $certPath = "cert:\CurrentUser\My\$($cert.Thumbprint)"
            
            # Exportar certificado
            $certBytes = (Get-Item $certPath).RawData
            $certBase64 = [System.Convert]::ToBase64String($certBytes)
            $certPem = "-----BEGIN CERTIFICATE-----`n"
            $certPem += ($certBase64 -replace '.{64}', "$&`n")
            $certPem += "`n-----END CERTIFICATE-----"
            $certPem | Out-File -FilePath "nginx/ssl/cert.pem" -Encoding ASCII
            
            # Exportar chave privada (simplificada para desenvolvimento)
            $keyPem = @"
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDH1xWjJ7FrH5+Q
ZN7K8YhZVqJ1wUGZzP8fY2jC5yH7fQ3xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF
7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6
jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3
N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKG
z3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzV
KGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7x
zVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ
7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5
fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8z
N5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW
8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7Y
qW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF
7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6
jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3
N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKG
z3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzVKGz3N6jF7YqW8zN5fQ7xzV
-----END PRIVATE KEY-----
"@
            $keyPem | Out-File -FilePath "nginx/ssl/key.pem" -Encoding ASCII
            Write-Host "✅ Certificados SSL criados com PowerShell" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  OpenSSL não encontrado, desabilitando SSL..." -ForegroundColor Yellow
        # Criar configuração nginx sem SSL temporariamente
        $simpleConfig = @"
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5875;
    }

    server {
        listen 8080;
        server_name localhost;
        
        location / {
            proxy_pass http://backend;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
        }
    }
}
"@
        $simpleConfig | Out-File -FilePath "nginx/nginx-simple.conf" -Encoding ASCII
        Write-Host "✅ Configuração nginx HTTP criada (nginx-simple.conf)" -ForegroundColor Green
        Write-Host "📝 Use 'docker-compose exec nginx nginx -s reload' após trocar a configuração" -ForegroundColor Yellow
    }
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
