# Diretório de Scripts

Este diretório contém scripts utilitários para gerenciar o projeto backend.

## run_docker_and_follow.py

Um script abrangente de gerenciamento Docker que lida com o ciclo de vida completo dos containers Docker para este projeto.

### O que ele faz:

1. **Verifica status do Docker** - Verifica se o Docker está em execução
2. **Para containers existentes** - Para graciosamente qualquer container do projeto em execução
3. **Limpa** - Remove containers parados para evitar conflitos
4. **Constrói containers novos** - Constrói novas imagens Docker com flag `--no-cache`
5. **Inicia containers** - Executa os novos containers em modo detached
6. **Verificação de saúde** - Verifica se os containers estão funcionando adequadamente
7. **Segue logs** - Exibe logs em tempo real de todos os containers

### Uso:

```bash
# Do diretório raiz do projeto:
python scripts/run_docker_and_follow.py

# Ou torne executável e execute diretamente:
chmod +x scripts/run_docker_and_follow.py
./scripts/run_docker_and_follow.py
```

### Funcionalidades:

- **Limpeza automática** - Lida com parada e remoção de containers antigos
- **Tratamento de erros** - Fornece mensagens de erro claras e tratamento gracioso de falhas
- **Logs em tempo real** - Transmite logs de todos os containers com formatação adequada
- **Desligamento gracioso** - Lida com interrupções Ctrl+C adequadamente
- **Monitoramento de saúde** - Verifica status dos containers após inicialização
- **Detecção inteligente** - Afeta apenas containers específicos do projeto (`projeto-backend`, `projeto-nginx`)

### Exemplo de saída:

```
🚀 Docker Management Script for Backend Project
============================================================
📂 Working directory: /path/to/project
🐳 Checking if Docker is running...
✅ Docker is running
🛑 Stopping project containers...
✅ Successfully stopped containers using docker-compose
🧹 Cleaning up stopped containers...
✅ Removed container: projeto-backend
✅ Removed container: projeto-nginx
🔨 Building Docker containers...
✅ Successfully built containers
🚀 Starting Docker containers...
✅ Successfully started containers
🏥 Checking container health...
📊 Container status:
    Name                Command               State           Ports
----------------------------------------------------------------
projeto-backend    /bin/bash ./docker-entryp...   Up      4852/tcp, 4652/tcp
projeto-nginx      /docker-entrypoint.sh ngin...   Up      0.0.0.0:80->80/tcp, 0.0.0.0:4852->4852/tcp, 0.0.0.0:4652->4652/tcp

📋 Following container logs... (Press Ctrl+C to stop)
============================================================
[logs stream here...]
```

### Requisitos:

- Python 3.6+
- Docker e Docker Compose instalados
- Arquivo `docker-compose.yml` na raiz do projeto
- Permissões adequadas para executar comandos Docker

### Códigos de saída:

- `0` - Sucesso
- `1` - Erro ou interrupção do usuário

### Solução de Problemas:

Se o script falhar:
1. Certifique-se de que o Docker está em execução
2. Verifique se você está no diretório raiz do projeto
3. Verifique se `docker-compose.yml` existe
4. Certifique-se de ter permissão para executar comandos Docker
5. Verifique os logs do Docker para mensagens de erro específicas 