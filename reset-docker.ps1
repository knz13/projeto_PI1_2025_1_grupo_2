#!/usr/bin/env pwsh

Write-Host "🔄 Resetando ambiente Docker..." -ForegroundColor Yellow

# Parar e remover tudo
Write-Host "📦 Parando containers..." -ForegroundColor Blue
docker-compose down --volumes --remove-orphans --rmi all

# Limpar cache
Write-Host "🧹 Limpando cache do Docker..." -ForegroundColor Blue
docker builder prune -f
docker image prune -f

# Rebuild
Write-Host "🔨 Reconstruindo containers..." -ForegroundColor Green
docker-compose build --no-cache

# OU rebuild completo com up
# docker-compose up --build --force-recreate

# Subir novamente
Write-Host "🚀 Iniciando aplicação..." -ForegroundColor Green
docker-compose up -d

Write-Host "✅ Reset concluído!" -ForegroundColor Green
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker-compose ps