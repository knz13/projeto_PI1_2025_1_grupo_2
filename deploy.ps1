# Script para facilitar o deployment
# Execute este script para subir a aplicação

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando deployment do backend com Docker..." -ForegroundColor Green

# Verificar se o Docker está rodando
try {
    docker version | Out-Null
    Write-Host "✅ Docker está rodando" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está rodando. Por favor, inicie o Docker Desktop." -ForegroundColor Red
    exit 1
}

# Verificar se os arquivos .env existem
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Arquivo .env não encontrado. Copiando do template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "📝 Por favor, edite o arquivo .env com suas configurações antes de continuar." -ForegroundColor Yellow
    Read-Host "Pressione Enter para continuar após editar o .env"
}

if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  Arquivo backend\.env não encontrado. Copiando do template..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "📝 Por favor, edite o arquivo backend\.env com suas configurações antes de continuar." -ForegroundColor Yellow
    Read-Host "Pressione Enter para continuar após editar o backend\.env"
}

# Parar containers existentes
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose down

# Construir e subir os containers
Write-Host "🔨 Construindo e iniciando containers..." -ForegroundColor Blue
docker-compose up --build -d

# Verificar status dos containers
Write-Host "📊 Status dos containers:" -ForegroundColor Blue
docker-compose ps

Write-Host ""
Write-Host "✅ Deployment concluído!" -ForegroundColor Green
Write-Host "🌐 Sua aplicação estará disponível em:" -ForegroundColor Cyan
Write-Host "   - HTTPS na porta 4665: https://seu-dominio.com:4665" -ForegroundColor Cyan
Write-Host "   - HTTP será redirecionado automaticamente para HTTPS" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Para verificar os logs:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 Para parar a aplicação:" -ForegroundColor Yellow
Write-Host "   docker-compose down" -ForegroundColor Gray
