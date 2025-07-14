#!/usr/bin/env pwsh

Write-Host "🔧 Instalando OpenSSL e corrigindo certificados SSL..." -ForegroundColor Yellow

# Verificar se OpenSSL já está instalado
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
if ($opensslPath) {
    Write-Host "✅ OpenSSL já está instalado!" -ForegroundColor Green
    Write-Host "   Caminho: $($opensslPath.Source)" -ForegroundColor Gray
} else {
    Write-Host "📦 OpenSSL não encontrado. Escolha uma opção para instalação:" -ForegroundColor Yellow
    Write-Host "   1. Chocolatey (choco install openssl)" -ForegroundColor White
    Write-Host "   2. Winget (winget install ShiningLight.OpenSSL)" -ForegroundColor White
    Write-Host "   3. Pular instalação (usar apenas HTTP)" -ForegroundColor White
    
    do {
        $choice = Read-Host "`nDigite sua escolha (1, 2 ou 3)"
    } while ($choice -notin @("1", "2", "3"))
    
    switch ($choice) {
        "1" {
            Write-Host "`n📦 Instalando OpenSSL via Chocolatey..." -ForegroundColor Blue
            
            # Verificar se Chocolatey está instalado
            $chocoPath = Get-Command choco -ErrorAction SilentlyContinue
            if (-not $chocoPath) {
                Write-Host "📦 Chocolatey não encontrado. Instalando..." -ForegroundColor Blue
                Set-ExecutionPolicy Bypass -Scope Process -Force
                [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
                Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
            }
            
            # Instalar OpenSSL via Chocolatey
            try {
                choco install openssl -y
                Write-Host "✅ OpenSSL instalado com sucesso via Chocolatey!" -ForegroundColor Green
                
                # Atualizar PATH para esta sessão
                $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
                
            } catch {
                Write-Host "⚠️  Erro ao instalar OpenSSL via Chocolatey: $($_.Exception.Message)" -ForegroundColor Yellow
                Write-Host "   Continuando com configuração HTTP apenas..." -ForegroundColor Yellow
            }
        }
        "2" {
            Write-Host "`n📦 Instalando OpenSSL via Winget..." -ForegroundColor Blue
            
            # Verificar se Winget está disponível
            $wingetPath = Get-Command winget -ErrorAction SilentlyContinue
            if (-not $wingetPath) {
                Write-Host "❌ Winget não está disponível neste sistema." -ForegroundColor Red
                Write-Host "   Continuando com configuração HTTP apenas..." -ForegroundColor Yellow
            } else {
                try {
                    winget install ShiningLight.OpenSSL --accept-source-agreements --accept-package-agreements
                    Write-Host "✅ OpenSSL instalado com sucesso via Winget!" -ForegroundColor Green
                    
                    # Atualizar PATH para esta sessão
                    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
                    
                } catch {
                    Write-Host "⚠️  Erro ao instalar OpenSSL via Winget: $($_.Exception.Message)" -ForegroundColor Yellow
                    Write-Host "   Continuando com configuração HTTP apenas..." -ForegroundColor Yellow
                }
            }
        }
        "3" {
            Write-Host "`n⏭️  Pulando instalação do OpenSSL..." -ForegroundColor Yellow
            Write-Host "   Usando configuração HTTP apenas..." -ForegroundColor Yellow
        }
    }
}

# Criar certificados SSL válidos
Write-Host "`n🔐 Criando certificados SSL válidos..." -ForegroundColor Blue

# Criar diretório SSL
if (-not (Test-Path "nginx/ssl")) {
    New-Item -ItemType Directory -Path "nginx/ssl" -Force | Out-Null
}

# Tentar OpenSSL
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
if ($opensslPath) {
    try {
        Write-Host "📝 Criando certificados com OpenSSL..." -ForegroundColor Yellow
        
        # Remover certificados antigos
        Remove-Item -Path "nginx/ssl/*.pem" -Force -ErrorAction SilentlyContinue
        
        # Criar certificado auto-assinado
        & openssl req -x509 -newkey rsa:2048 -nodes -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -subj "/C=BR/ST=State/L=City/O=Organization/CN=localhost"
        
        if (Test-Path "nginx/ssl/cert.pem" -and Test-Path "nginx/ssl/key.pem") {
            Write-Host "✅ Certificados SSL criados com OpenSSL!" -ForegroundColor Green
            
            # Verificar se os certificados são válidos
            & openssl x509 -in nginx/ssl/cert.pem -text -noout 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Certificados validados!" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Certificados podem ter problemas" -ForegroundColor Yellow
            }
        } else {
            throw "Certificados não foram criados"
        }
        
    } catch {
        Write-Host "❌ Erro ao criar certificados: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Usando configuração HTTP apenas..." -ForegroundColor Yellow
        
        # Usar configuração nginx simples (HTTP apenas)
        Copy-Item "nginx/nginx-simple.conf" "nginx/nginx.conf" -Force
    }
} else {
    Write-Host "⚠️  OpenSSL não disponível, usando configuração HTTP..." -ForegroundColor Yellow
    # Usar configuração nginx simples (HTTP apenas)
    Copy-Item "nginx/nginx-simple.conf" "nginx/nginx.conf" -Force
}

Write-Host "`n🚀 Reiniciando containers..." -ForegroundColor Blue
docker-compose down
docker-compose up -d

Write-Host "`n⏳ Aguardando 30 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`n📦 Status dos containers:" -ForegroundColor Blue
docker-compose ps

Write-Host "`n📋 Logs do nginx:" -ForegroundColor Blue
docker-compose logs --tail=10 nginx

Write-Host "`n🧪 Testando conexões..." -ForegroundColor Yellow

# Teste backend direto
Write-Host "`n🎯 Backend direto (5875):" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5875" -Method GET -TimeoutSec 10
    Write-Host "✅ Backend OK - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend falhou: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste nginx HTTP
Write-Host "`n🌐 Nginx HTTP (8080):" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method GET -TimeoutSec 10
    Write-Host "✅ Nginx HTTP OK - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Nginx HTTP falhou: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste nginx HTTPS (se certificados existem)
if (Test-Path "nginx/ssl/cert.pem") {
    Write-Host "`n🔒 Nginx HTTPS (4665):" -ForegroundColor Green
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:4665" -Method GET -SkipCertificateCheck -TimeoutSec 10
        Write-Host "✅ Nginx HTTPS OK - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Nginx HTTPS falhou: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎯 URLs funcionais:" -ForegroundColor Cyan
Write-Host "   - Backend direto: http://localhost:5875" -ForegroundColor White
Write-Host "   - Nginx HTTP: http://localhost:8080" -ForegroundColor White
if (Test-Path "nginx/ssl/cert.pem") {
    Write-Host "   - Nginx HTTPS: https://localhost:4665" -ForegroundColor White
}

Write-Host "`n✅ Configuração concluída!" -ForegroundColor Green
