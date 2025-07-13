
# Documentação de Endpoints - Backend

## Configuração do Servidor

- **Porta padrão**: 4852
- **Host**: 0.0.0.0 (configurável via variável de ambiente)
- **Protocolo**: HTTP/HTTPS
- **Base URL**: `http://localhost:4852` (desenvolvimento) ou `https://seu-dominio.com:4852` (produção)

## Endpoints Disponíveis

### Endpoints de Sistema

| Método | Endpoint | Descrição                                |
| ------ | -------- | ---------------------------------------- |
| GET    | /        | Informações do processo e servidor       |
| GET    | /health  | Verificação de saúde (usado pelo Docker) |

#### GET /
Retorna informações sobre o processo do servidor:
```json
{
  "pid": 12345,
  "platform": "darwin",
  "version": "v18.17.0",
  "memory": {...},
  "uptime": 1234.56,
  "env": "development"
}
```

#### GET /health
Endpoint de verificação de saúde para monitoramento:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 1234.56,
  "memory": {...},
  "supabase": "connected",
  "env": "development"
}
```

### Endpoints de Dados

| Método | Endpoint                | Descrição                          |
| ------ | ----------------------- | ---------------------------------- |
| GET    | /dados/dados-lancamento | Lista todos os dados de lançamento |

#### GET /dados/dados-lancamento
Retorna todos os dados de lançamento organizados por tipo:

**Resposta de Sucesso (200):**
```json
[
  {
    "nome": "Tipo de Lançamento 1",
    "target": "alvo_especifico",
    "data": [
      {
        "id_lancamento": 1,
        "created_at": "2024-01-01T12:00:00.000Z",
        "angulo_lancamento": 45.0,
        "peso": 2.5,
        "pressao": 100.0,
        "altura": [0, 1.2, 2.8, 4.1, ...],
        "aceleracao": [0, 9.8, 8.5, 7.2, ...],
        "velocidade": [0, 5.2, 10.1, 14.8, ...]
      }
    ]
  }
]
```

**Resposta de Erro (404):**
```json
{
  "error": "Nenhum dado de lançamento encontrado"
}
```

**Resposta de Erro (500):**
```json
{
  "error": "Erro ao buscar dados de lançamento"
}
```

## WebSocket

### Configuração
- **Endpoint padrão**: `/ws`
- **URL completa**: `ws://localhost:4852/ws` (desenvolvimento)

### Tipos de Mensagem

#### Conexão
Ao conectar, o cliente recebe uma mensagem de boas-vindas:
```json
{
  "type": "welcome",
  "data": {
    "clientId": "abc123",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "message": "Welcome to the WebSocket server!"
  }
}
```

#### Envio de Dados
O cliente pode enviar dados nos seguintes formatos:

**Dados Gerais:**
```json
{
  "type": "dados_geral",
  "data": {
    "aceleracao": [10, 10, 10],
    "altura": [10, 10, 10]
  }
}
```

**Dados de Aceleração:**
```json
{
  "type": "dados_aceleracao",
  "data": [10.5, 9.8, 8.2, ...]
}
```

**Dados de Altura:**
```json
{
  "type": "dados_altura", 
  "data": [0, 1.2, 2.8, 4.1, ...]
}
```

## Observações sobre os Dados

### Estrutura dos Arrays
- Todos os arrays de dados devem estar sincronizados por índice temporal
- Os dados devem estar ordenados em ordem crescente de tempo
- Arrays podem ser enviados como strings JSON ou arrays nativos

### Unidades de Medida
- **Distância/Altura**: metros (m)
- **Tempo**: segundos (s) 
- **Velocidade**: metros por segundo (m/s)
- **Aceleração**: metros por segundo ao quadrado (m/s²)
- **Ângulo**: graus (°)
- **Peso**: quilogramas (kg)
- **Pressão**: Pascal (Pa)

## Configuração e Ambiente

Para informações sobre configuração de variáveis de ambiente, consulte:
[Configuração de Variáveis de Ambiente](configuracao_variaveis_ambiente.md)
