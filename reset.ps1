#!/usr/bin/env pwsh

# Dar permissão (se necessário)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Executar o reset
.\reset-docker.ps1

# OU manualmente
# docker-compose down --volumes --remove-orphans --rmi all
# docker builder prune -f
# docker-compose up --build --force-recreate