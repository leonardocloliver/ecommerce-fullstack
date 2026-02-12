# 🛒 ShopHub — E-Commerce Fullstack

Aplicação fullstack de e-commerce construída do zero com fins de **aprendizado e portfólio**. O projeto abrange desde a modelagem do banco de dados até a interface do usuário, passando por autenticação, carrinho de compras, gerenciamento de pedidos e painel administrativo.

> **Objetivo:** Consolidar conhecimentos em desenvolvimento web fullstack, boas práticas de arquitetura, Docker e fluxos reais de uma aplicação e-commerce.

---

## 📸 Visão Geral

| Vitrine de Produtos | Carrinho | Painel Admin |
|:---:|:---:|:---:|
| Listagem com busca e filtro | Checkout com endereço salvo | Dashboard + gestão de pedidos |

---

## 🧰 Tecnologias

### Backend
| Tecnologia | Uso |
|---|---|
| **Node.js + Express** | API REST |
| **TypeScript** | Tipagem estática |
| **Prisma ORM** | Modelagem e acesso ao banco |
| **PostgreSQL** | Banco de dados relacional |
| **JWT** | Autenticação e autorização |
| **bcrypt** | Hash de senhas |
| **Swagger** | Documentação da API |
| **Jest + Supertest** | Testes automatizados |

### Frontend
| Tecnologia | Uso |
|---|---|
| **React 19** | Interface de usuário |
| **TypeScript** | Tipagem estática |
| **React Router v7** | Roteamento SPA |
| **Axios** | Requisições HTTP |
| **Vite** | Build e dev server |
| **CSS puro** | Estilização sem framework |

### Infraestrutura
| Tecnologia | Uso |
|---|---|
| **Docker & Docker Compose** | Containerização e orquestração |
| **Multi-stage builds** | Imagens otimizadas para produção |

---

## 🏗️ Arquitetura

```
ecommerce-fullstack/
├── backend/
│   ├── prisma/              # Schema, migrations e seed
│   └── src/
│       ├── middleware/       # Auth JWT, admin guard, error handler
│       ├── routes/           # auth, products, orders
│       ├── config/           # Swagger
│       └── __tests__/        # 37 testes (auth, products, orders, stock)
├── frontend/
│   └── src/
│       ├── components/       # ProtectedRoute, AdminRoute
│       ├── contexts/         # AuthContext, CartContext
│       ├── pages/            # Home, Cart, Orders, Profile, Admin/*
│       └── services/         # api, auth, products
└── docker-compose.yml        # PostgreSQL + Backend + Frontend
```

---

## ✨ Funcionalidades

### Cliente
- ✅ Cadastro e login com JWT
- ✅ Vitrine de produtos com busca por nome, descrição e categoria
- ✅ Carrinho de compras persistente (localStorage por usuário)
- ✅ Merge automático do carrinho guest → usuário logado
- ✅ Checkout com endereço salvo no perfil
- ✅ Histórico de pedidos com detalhes expansíveis
- ✅ Página de perfil com edição de nome e endereço estruturado

### Admin
- ✅ Dashboard com estatísticas (produtos, pedidos, receita, estoque baixo)
- ✅ CRUD completo de produtos
- ✅ Gestão de pedidos com transição de status (PENDING → CONFIRMED → SHIPPED → DELIVERED)
- ✅ Cancelamento de pedidos com restauração de estoque

### Técnico
- ✅ Controle de estoque automático (desconta na criação, restaura no cancelamento)
- ✅ Validação de sequência de status (impede pular etapas ou retroceder)
- ✅ Middleware de autenticação e autorização por role (client e admin)
- ✅ Error handler centralizado com mensagens contextuais
- ✅ testes automatizados cobrindo auth, produtos, pedidos e estoque
- ✅ Documentação Swagger da API

---

## 🚀 Como Rodar

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/)

### Subir o projeto

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/ecommerce-fullstack.git
cd ecommerce-fullstack

# Subir todos os serviços
docker compose up -d --build

# Rodar migrations e seed (admin padrão)
docker exec ecommerce-backend npx prisma migrate deploy
docker exec ecommerce-backend npx prisma db seed
```

### Acessar

| Serviço | URL |
|---|---|
| Frontend | http://localhost |
| API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api-docs |

### Credenciais padrão (admin)

```
Email: admin@ecommerce.com
Senha: admin123
```

---

## 🧪 Testes

```bash
cd backend
npm test
```

autenticação, middleware, CRUD de produtos, criação/status de pedidos e gerenciamento de estoque.

---

## 📊 Modelo de Dados

```
User          Product         Order           OrderItem
─────         ───────         ─────           ─────────
id            id              id              id
email (unique)name            userId → User   orderId → Order
password      description     total           productId → Product
name          price           status          quantity
address?      stock           address         price
role          imageUrl?       createdAt
createdAt     category        updatedAt
updatedAt     createdAt
              updatedAt

Status do Pedido: PENDING → CONFIRMED → SHIPPED → DELIVERED
                                                   ↘ CANCELLED (de qualquer estado, exceto DELIVERED)
```

---

## 📚 Aprendizados

Este projeto me permitiu praticar:

- **Arquitetura fullstack** — separação clara entre frontend e backend com comunicação via API REST
- **TypeScript end-to-end** — tipagem estática tanto no servidor quanto no cliente
- **ORM e banco relacional** — modelagem com Prisma, migrations versionadas
- **Autenticação e autorização** — JWT, refresh de sessão, middleware de roles
- **Gerenciamento de estado** — Context API do React para auth e carrinho
- **Docker** — containerização
- **Testes automatizados** — Jest + Supertest para garantir que as regras de negócio funcionam
- **UX/UI** — design responsivo e acessível sem frameworks CSS

---
