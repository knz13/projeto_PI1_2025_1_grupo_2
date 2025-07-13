# Configuração de Variáveis de Ambiente

Este servidor backend usa variáveis de ambiente para configuração. Este guia irá ajudá-lo a configurar seu ambiente adequadamente.

## Configuração Rápida

1. **Copie o arquivo de exemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Edite o arquivo .env com seus valores reais:**
   ```bash
   nano .env  # ou use seu editor preferido
   ```

## Variáveis Obrigatórias

### Configuração do Supabase
Você **deve** configurar estas variáveis para que a aplicação funcione:

- `SUPABASE_URL` - URL do seu projeto Supabase
- `SUPABASE_ANON_KEY` - Chave anônima/pública do Supabase

**Como obter estes valores:**
1. Vá para o [Painel do Supabase](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em Configurações → API
4. Copie a "Project URL" e a chave "anon/public"

### Exemplo de Configuração do Supabase:
```env
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Variáveis Opcionais

### Configuração do Servidor
- `NODE_ENV` - Modo do ambiente (`development`, `production`, `test`)
- `PORT` - Porta do servidor (padrão: 4852)
- `HOST` - Host do servidor (padrão: 0.0.0.0)

### Segurança e Performance
- `CORS_ORIGIN` - Origens permitidas pelo CORS (padrão: "*")
- `MAX_FILE_SIZE` - Tamanho máximo de upload de arquivo em bytes (padrão: 524288000 = 500MB)
- `MAX_BODY_SIZE` - Tamanho máximo do corpo da requisição (padrão: "500mb")

### Configuração do WebSocket
- `WS_PATH` - Caminho do endpoint WebSocket (padrão: "/ws")
- `WS_LOGGING` - Habilitar logging do WebSocket (padrão: true em desenvolvimento)

### Configuração Docker/Git
- `GIT_BRANCH` - Branch do Git para auto-atualizações (padrão: "main")
- `PYTHONUNBUFFERED` - Buffering de saída do Python (Docker)
- `PYTHONIOENCODING` - Codificação do Python (Docker)
- `GIT_DISCOVERY_ACROSS_FILESYSTEM` - Descoberta de filesystem do Git (Docker)

## Desenvolvimento vs Produção

### Desenvolvimento (.env)
```env
NODE_ENV=development
PORT=4852
CORS_ORIGIN=*
WS_LOGGING=true
```

### Produção (.env)
```env
NODE_ENV=production
PORT=4852
CORS_ORIGIN=https://seu-dominio-frontend.com
WS_LOGGING=false
MAX_FILE_SIZE=104857600  # 100MB ao invés de 500MB
```

## Ambiente Docker

Quando executando no Docker, o container usará automaticamente:
- Variáveis de ambiente do seu arquivo `.env` (via `env_file` no docker-compose.yml)
- Variáveis específicas do Docker para operação adequada do git e python

## Solução de Problemas

### Problemas Comuns:

1. **"Missing required Supabase environment variables"**
   - Certifique-se de ter criado um arquivo `.env`
   - Verifique se `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão configurados corretamente

2. **"Erros de CORS do frontend"**
   - Atualize `CORS_ORIGIN` para incluir a URL do seu frontend
   - Para desenvolvimento: `CORS_ORIGIN=http://localhost:3000`
   - Para produção: `CORS_ORIGIN=https://seudominio.com`

3. **"Upload de arquivo muito grande"**
   - Aumente o valor de `MAX_FILE_SIZE`
   - Também aumente `MAX_BODY_SIZE` proporcionalmente

4. **Problemas de conexão WebSocket**
   - Verifique se `WS_PATH` corresponde à conexão WebSocket do seu frontend
   - Verifique se o servidor WebSocket está iniciando (procure por "🔌 WebSocket server starting" nos logs)

## Notas de Segurança

- **Nunca faça commit do seu arquivo `.env` no controle de versão**
- Use valores únicos e fortes para produção
- Rotacione regularmente suas chaves do Supabase
- Use origens CORS específicas em produção (não "*")
- Considere usar projetos Supabase específicos por ambiente para desenvolvimento/staging/produção 