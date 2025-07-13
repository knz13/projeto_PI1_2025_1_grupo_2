# Use a imagem oficial do Node.js
FROM node:18-alpine

# Instalar dependências do sistema necessárias para algumas dependências npm
# Descomente se encontrar erros de compilação de dependências nativas:
# RUN apk add --no-cache python3 make g++

# Defina o diretório de trabalho no container
WORKDIR /app

# Copie o package.json e package-lock.json (se disponível)
COPY package*.json ./

# Instale as dependências
RUN npm ci --only=production

# Copie o código fonte
COPY . .

# Compile o TypeScript
RUN npm run build

# Exponha a porta que o backend usa internamente
EXPOSE 5875

# Comando para iniciar o servidor
CMD ["npm", "start"]
