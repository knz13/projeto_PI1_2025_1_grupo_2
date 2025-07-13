# Dockerização do Backend com SSL Automático

Este projeto foi configurado para ser executado em Docker com SSL automático usando nginx e Let's Encrypt.

## 📁 Estrutura dos Arquivos Docker

```
projeto/
├── docker-compose.yml          # Configuração principal do Docker Compose
├── deploy.ps1                  # Script de deployment para Windows
├── .env.example               # Template de variáveis de ambiente globais
├── backend/
│   ├── Dockerfile             # Imagem Docker do backend
│   ├── .dockerignore         # Arquivos ignorados no build
│   └── .env.example          # Template de variáveis do backend
└── nginx/
    └── nginx.conf            # Configuração do nginx com SSL
```

## 🚀 Como usar

### 1. Configuração inicial

1. **Copie os arquivos de exemplo:**
   ```powershell
   Copy-Item .env.example .env
   Copy-Item backend\.env.example backend\.env
   ```

2. **Edite os arquivos .env:**
   - `.env`: Configure seu domínio e email para SSL
   - `backend\.env`: Configure as variáveis do backend (Supabase, JWT, etc.)

### 2. Deployment

**Opção 1: Usando o script de deployment (recomendado)**
```powershell
.\deploy.ps1
```

**Opção 2: Comandos manuais**
```powershell
# Parar containers existentes
docker-compose down

# Construir e iniciar
docker-compose up --build -d

# Verificar status
docker-compose ps
```

### 3. Verificação

Após o deployment, sua aplicação estará disponível em:
- **HTTPS na porta 4665**: `https://seu-dominio.com:4665`
- **HTTP será redirecionado automaticamente para HTTPS**

## 🔧 Configurações

### Porta 4665
A aplicação é exposta na porta 4665 externamente, mas roda internamente na porta 5875 do container do backend.

### SSL Automático
O Let's Encrypt configurará automaticamente certificados SSL para seu domínio. Certifique-se de:
1. Ter um domínio válido apontando para seu servidor
2. As portas 80 e 443 estarem acessíveis para validação
3. Configurar corretamente o email no arquivo `.env`

### Variáveis de Ambiente

**Principais variáveis em `.env`:**
- `LETSENCRYPT_EMAIL`: Email para certificados SSL
- `VIRTUAL_HOST`: Seu domínio
- `LETSENCRYPT_HOST`: Seu domínio (mesmo valor)

**Principais variáveis em `backend\.env`:**
- `NODE_ENV`: Ambiente (production recomendado)
- `PORT`: Porta interna (5875)
- `SUPABASE_URL` e `SUPABASE_ANON_KEY`: Configurações do Supabase
- `JWT_SECRET`: Chave secreta para JWT

## 🛠️ Comandos Úteis

```powershell
# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f nginx

# Reiniciar um serviço
docker-compose restart backend

# Parar tudo
docker-compose down

# Remover volumes (cuidado: remove dados persistentes)
docker-compose down -v

# Forçar rebuild
docker-compose up --build --force-recreate -d
```

## 🔒 Segurança

O nginx está configurado com:
- Redirecionamento automático HTTP → HTTPS
- Headers de segurança (HSTS, X-Frame-Options, etc.)
- Rate limiting
- Suporte a WebSocket
- Compressão gzip

## 🐛 Troubleshooting

1. **Certificado SSL não funciona:**
   - Verifique se o domínio aponta para o servidor
   - Verifique se as portas 80 e 443 estão abertas
   - Aguarde alguns minutos para a validação do Let's Encrypt

2. **Backend não responde:**
   - Verifique logs: `docker-compose logs backend`
   - Verifique se as variáveis de ambiente estão corretas
   - Verifique se o backend compila: `docker-compose exec backend npm run build`

3. **Portas em uso:**
   - Pare outros serviços nas portas 80, 443, 4665
   - Use `netstat -ano | findstr :4665` para verificar

## 📝 Notas

- O SSL pode levar alguns minutos para ser configurado na primeira vez
- Os certificados são renovados automaticamente
- Os logs são mantidos nos containers e podem ser acessados via `docker-compose logs`
