# 📚 Swagger/OpenAPI - Documentação da API

### 🔗 Acessar Documentação

```
http://localhost:3000/api-docs
```

---

## 📖 O que está documentado

### ✅ **Auth Routes**
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login

### ✅ **Products Routes**
- `GET /api/products` - Listar todos os produtos
- `GET /api/products/{id}` - Obter produto por ID
- `POST /api/products` - Criar produto (apenas ADMIN)

### 📝 Documentação Parcial
- `PUT /api/products/{id}` - Atualizar produto (apenas ADMIN)
- `DELETE /api/products/{id}` - Deletar produto (apenas ADMIN)
- `POST /api/orders` - Criar novo pedido
- `GET /api/orders`  - Listar pedidos do usuário autenticado
- `GET /api/orders/{id}` - Obter Detalhes de um pedido
- `PATCH /api/orders/{id}/status` - Atualizar status do pedido

---

## 🎯 Recursos da Documentação

✅ **Descrição** de cada endpoint
✅ **Parâmetros** com tipos (path, query, body)
✅ **Exemplos** de requisição
✅ **Schemas** com tipos de resposta
✅ **Status codes** (200, 201, 400, 403, 404, etc)
✅ **Autenticação** JWT (Bearer Token)
✅ **Try it out** - Testar diretamente na UI
✅ **Persistir autorização** - Salvar token entre testes

---

## 💡 Como Usar

### 1️⃣ **Abrir Documentação**
```
http://localhost:3000/api-docs
```

### 2️⃣ **Autenticar (para rotas protegidas)**
- Clique no botão **"Authorize"** (cadeado)
- Cole seu token JWT: `seu-token-aqui`
- Clique em "Authorize"

### 3️⃣ **Testar Endpoint**
- Clique no endpoint desejado
- Clique em "Try it out"
- Preencha os parâmetros
- Clique em "Execute"

### 4️⃣ **Ver Resposta**
- Response body aparece abaixo
- Ver status code, headers, etc

---

## 📚 Estrutura da Documentação

```yaml
OpenAPI 3.0.0
├── Info
│   ├── title: E-Commerce API
│   ├── version: 1.0.0
│   └── description: API RESTful...
│
├── Servers
│   ├── Development (localhost:3000)
│   └── Production (api.example.com)
│
├── Components
│   ├── Security (Bearer Auth)
│   └── Schemas (User, Product, Order, Error)
│
└── Paths (Endpoints)
    ├── /api/auth/register (POST)
    ├── /api/auth/login (POST)
    ├── /api/products (GET, POST)
    ├── /api/products/{id} (GET, PUT, DELETE)
    └── /api/orders (...)
```

---

## 🔒 Segurança

- ✅ JWT Bearer Token configurado
- ✅ Endpoints públicos marcados com `security: []`
- ✅ Endpoints protegidos com `security: [{ bearerAuth: [] }]`
- ✅ Schemas com validação de tipos

---

## 🚀 Próximos Passos

Para completar a documentação:

1. **Documentar rotas de Orders:**
   ```
   
   ```

2. **Adicionar mais detalhes:**
   - Validações de entrada
   - Exemplos de erro
   - Rate limiting
   - Paginação

3. **Exportar para Postman:**
   - Usar `/api-docs.json` para importar

---

## 📥 Endpoint JSON

```
http://localhost:3000/api-docs.json
```