# Documentação do Projeto

Esta pasta contém toda a documentação técnica do projeto.

## Estrutura da Documentação

### 📁 Backend (`docs/backend/`)

- [**Documentação de Endpoints**](backend/documentacao_endpoints.md) - API REST e WebSocket
- [**Configuração de Variáveis de Ambiente**](backend/configuracao_variaveis_ambiente.md) - Setup do .env

### 📁 Scripts (`docs/scripts.md`)

- [**Scripts de Utilitários**](scripts.md) - Scripts Docker e automação

## Visão Geral do Projeto

### Backend
- **Tecnologia**: Node.js + TypeScript + Express
- **Banco de Dados**: Supabase (PostgreSQL)
- **WebSocket**: express-ws para comunicação em tempo real
- **Porta**: 4852 (configurável)
- **Docker**: Suporte completo com auto-updates

### Funcionalidades Principais
- API REST para dados de lançamento
- WebSocket para recebimento de dados em tempo real
- Integração com Supabase
- Sistema de monitoramento e logs
- Auto-deployment via Docker

## Como Começar

### 1. Configuração do Backend
```bash
# 1. Copie as variáveis de ambiente
cd backend
cp .env.example .env

# 2. Configure suas credenciais do Supabase no arquivo .env
nano .env

# 3. Instale dependências
npm install
pip install -r requirements.txt

# 4. Execute em desenvolvimento
npm run dev
```

### 2. Usando Docker
```bash
# Execute o script de deploy automatizado
python scripts/run_docker_and_follow.py
```

## Recursos Úteis

- [Painel do Supabase](https://app.supabase.com/) - Para configuração do banco
- [Documentação do Docker](https://docs.docker.com/) - Para containers
- [Express.js Docs](https://expressjs.com/) - Framework web

## Contribuição

Para contribuir com a documentação:
1. Mantenha os arquivos .md organizados nas pastas apropriadas
2. Use português para documentação interna
3. Inclua exemplos de código quando possível
4. Mantenha links relativos funcionando

## Suporte

Para dúvidas técnicas, consulte:
- [Solução de Problemas - Backend](backend/configuracao_variaveis_ambiente.md#solução-de-problemas)
- [Solução de Problemas - Scripts](scripts.md#solução-de-problemas) 