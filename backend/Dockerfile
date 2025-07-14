# Use a imagem oficial do Node.js
# FROM node:18-alpine
# Atualização: para mitigação de vulnerabilidades, usando uma versão mais recente (Sugerido pelo Docker Scout)
FROM node:24-alpine3.21

# Instalar dependências do sistema necessárias para algumas dependências npm
# Descomente se encontrar erros de compilação de dependências nativas:
# RUN apk add --no-cache python3 make g++

# Defina o diretório de trabalho no container
WORKDIR /app

# Copie o package.json e package-lock.json (se disponível)
COPY package*.json ./

# Instale todas as dependências (incluindo devDependencies para o build)
RUN npm ci

# Copie o código fonte
COPY . .

# Compile o TypeScript
RUN npm run build

# Remova as devDependencies após o build para otimizar a imagem
RUN npm prune --production

# Exponha a porta que o backend usa internamente
EXPOSE 5875

# Comando para iniciar o servidor
CMD ["npm", "start"]
