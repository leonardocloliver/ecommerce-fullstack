# Build stage
FROM node:20 AS builder

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci

# Copiar código source
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Instalar OpenSSL
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Instalar apenas dependências de produção
COPY package.json package-lock.json ./

RUN npm ci --only=production && \
    npm cache clean --force

# Copiar prisma schema
COPY prisma ./prisma/

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código compilado do build stage
COPY --from=builder /app/dist ./dist

# Expor porta
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Comando para iniciar
CMD ["node", "dist/server.js"]
