# Docker Setup - E-Commerce Fullstack

## Pré-requisitos

- Docker (versão 20.10+)
- Docker Compose (versão 2.0+)

## Estrutura do Projeto

```
ecommerce-fullstack/
├── backend/              # Node.js/Express API
├── frontend/             # React/Vite Frontend
├── docker-compose.yml    # Orquestração dos containers
└── .env.example          # Variáveis de ambiente
```

## Configuração Inicial

1. **Copiar arquivo de ambiente:**
```bash
cp .env.example .env
```

2. **Ajustar variáveis de ambiente conforme necessário** (no arquivo `.env`)

## Comandos Docker

### Iniciar todos os serviços
```bash
docker-compose up -d
```

### Parar todos os serviços
```bash
docker-compose down
```

### Ver logs
```bash
docker-compose logs -f
```

### Ver logs de um serviço específico
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuildar imagens
```bash
docker-compose up -d --build
```

### Executar prisma migrations
```bash
docker-compose exec backend npx prisma migrate deploy
```

### Acessar terminal do container
```bash
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec postgres psql -U postgres -d ecommerce
```

## Acesso aos Serviços

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost | Aplicação React |
| Backend API | http://localhost:3000 | API REST |
| Database | localhost:5433 | PostgreSQL |
| API Health | http://localhost:3000/api/health | Status da API |

## Variáveis de Ambiente

```env
# Database
DB_USER=postgres              # Usuário do PostgreSQL
DB_PASSWORD=postgres          # Senha do PostgreSQL
DB_NAME=ecommerce            # Nome do banco de dados

# Backend
NODE_ENV=development         # development, production, test
JWT_SECRET=seu-secret-key    # ⚠️ Mudar em produção!
PORT=3000                    # Porta do backend

# Frontend
VITE_API_URL=http://localhost:3000  # URL da API
```

## Serviços Docker

### 1. PostgreSQL (postgres)
- Image: `postgres:15-alpine`
- Container: `ecommerce-db`
- Porta: `5433:5432`
- Volume: `postgres_data` (persistente)
- Healthcheck: Verificação a cada 10 segundos

### 2. Backend (backend)
- Build: `./backend/Dockerfile`
- Container: `ecommerce-backend`
- Porta: `3000:3000`
- Dependências: Aguarda PostgreSQL estar saudável
- Healthcheck: Ping em `/api/health` a cada 30 segundos

### 3. Frontend (frontend)
- Build: `./frontend/Dockerfile`
- Container: `ecommerce-frontend`
- Porta: `80:3000`
- Dependências: Aguarda Backend

## Network

Todos os containers comunicam através da rede `ecommerce-network`:
- Backend → Database: `postgresql://postgres:5432/ecommerce`
- Frontend → Backend: `http://backend:3000`

## Volumes

- `postgres_data`: Persiste dados do banco de dados entre reinicializações

## Troubleshooting

### Porta já em uso
```bash
# Mudar porta no docker-compose.yml ou
docker-compose down -v
docker-compose up -d
```

### Database connection refused
```bash
# Verificar saúde do PostgreSQL
docker-compose logs postgres
docker-compose ps
```

### Limpar tudo (reset completo)
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

## Produção

Para produção:
1. Mudar `JWT_SECRET` para uma chave segura
2. Usar `NODE_ENV=production`
3. Configurar variáveis de ambiente seguras
4. Usar volumes nomeados para persistência
5. Configurar backups do banco de dados
6. Usar imagens com tags específicas

## Estrutura do Dockerfile

### Backend
- Multi-stage build para reduzir tamanho
- Instalação apenas de dependências de produção
- Prisma schema incluído
- Healthcheck configurado

### Frontend
- Build otimizado com TypeScript
- Serve usando `serve` npm package
- Compactado para produção

