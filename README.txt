README.txt - Projeto Pink Boom
==============================

Visão Geral
-----------
O Projeto Pink Boom é um sistema completo que une software e hardware para controlar, monitorar e analisar lançamentos de foguetes d’água com alta precisão e segurança. O objetivo é atingir distâncias de 10, 20 e 30 metros com margem de erro de até 0,5 metro, utilizando sensores embarcados, plataforma automatizada e software de análise.

Estrutura do Projeto
--------------------
/
├── backend/                 # Servidor backend TypeScript + Express.js
│   ├── src/
│   │   ├── index.ts        # Ponto de entrada principal do servidor
│   │   ├── interfaces.ts   # Interfaces e tipos TypeScript
│   │   └── utils.ts        # Funções utilitárias
│   ├── package.json        # Dependências e scripts Node.js
│   ├── tsconfig.json       # Configuração do TypeScript
│   └── nodemon.json        # Configuração para hot-reload
│
└── frontend/               # Interface Flutter (a ser implementada)

Configuração do Backend
------------------------
1. Acesse a pasta backend:
   cd backend

2. Instale as dependências:
   npm install

3. Crie um arquivo `.env` com o seguinte conteúdo:
   PORT=3000
   # Outras variáveis podem ser adicionadas conforme necessário

4. Comandos úteis:
   - npm run dev     # Inicia o servidor em modo desenvolvimento
   - npm run build   # Compila os arquivos TypeScript
   - npm run start   # Inicia o servidor em produção
   - npm run watch   # Observa alterações nos arquivos TS
   - npm run clean   # Remove diretório de build

Arquitetura Backend
-------------------
O backend segue uma arquitetura baseada em controladores:

1. Controladores:
   - Cada controlador implementa a interface EndpointController
   - As rotas são organizadas por método (GET, POST, PUT)

2. Estrutura das rotas:
   - Formato: /{nome_do_controlador}/{nome_da_rota}
   - Todas as rotas incluem tratamento de erros

3. Middleware:
   - CORS habilitado para todas as origens
   - Body parser com limite de 500MB
   - Suporte a upload de arquivos
   - Leitura de JSON

Fluxo de Desenvolvimento
------------------------
1. Inicie o servidor:
   npm run dev

2. O servidor estará disponível em http://localhost:3000 (ou porta definida no .env)

3. Arquivos TypeScript são recarregados automaticamente a cada modificação

4. Para adicionar novos endpoints:
   - Crie um novo controlador com a interface EndpointController
   - Defina as rotas necessárias
   - Registre o controlador no `controllers` do `index.ts`

Frontend
--------
A interface será desenvolvida em Flutter e integrará com o backend para exibir dados em tempo real, via dashboard local ou Google Colab.

Informações do Projeto
----------------------
Nome: Pink Boom  
Duração: 05/05/2025 a 16/07/2025  
Objetivo: Lançamento automatizado de foguetes d'água com sensores para registrar pressão, ângulo, velocidade, massa, etc.  
Equipe: Grupo 02, Turma 01 – FGA/UnB  
Orientador: Prof. Diogo Caetano Garcia  

Componentes Principais
----------------------
- Foguete PET reutilizável
- Plataforma automatizada de lançamento com sistema de segurança
- Sensores embarcados (pressão, aceleração, ângulo, volume, etc.)
- Microcontrolador para coleta e transmissão de dados
- Sistema de simulação e análise de desempenho do lançamento

Notas Finais
------------
- Projeto educacional e interdisciplinar
- Alia eletrônica, software, estruturas e desempenho
- Utiliza materiais acessíveis e práticas seguras
- Integra conceitos de engenharia e programação
