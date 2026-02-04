/// <reference types="jest" />

import request from 'supertest';
import app from '../app.js';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

//Helper para gerar token JWT
function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
}

// Limpar banco antes de cada teste
beforeEach(async () => {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()
})

// Fechar conexão após todos os testes
afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/products', () => {
  
  it('deve retornar a lista de produtos disponíveis', async () => {
    // Criar alguns produtos
    await prisma.product.create({
      data: {
        name: 'Produto 1',
        description: 'Descrição 1',
        price: 100.00,
        stock: 10,
        category: 'Eletrônicos',
      },
    });

    await prisma.product.create({
      data: {
        name: 'Produto 2',
        description: 'Descrição 2',
        price: 200.00,
        stock: 5,
        category: 'Roupas',
      },
    });

    const response = await request(app)
      .get('/api/products');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toHaveProperty('name', 'Produto 1');
    expect(response.body[1]).toHaveProperty('name', 'Produto 2');
  });
});

describe('GET /api/products/:id', () => {
  
  it('deve retornar um produto específico', async () => {
    // Criar um produto
    const product = await prisma.product.create({
      data: {
        name: 'Produto Teste',
        description: 'Descrição Teste',
        price: 150.00,
        stock: 8,
        category: 'Eletrônicos',
      },
    });

    const response = await request(app)
      .get(`/api/products/${product.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', product.id);
    expect(response.body).toHaveProperty('name', 'Produto Teste');
    expect(response.body.price).toBe('150');
  });

  it('deve retornar erro 404 quando o produto não existir', async () => {
    const response = await request(app)
      .get('/api/products/id-inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});

describe('POST /api/products', () => {
  
  it('deve criar um novo produto com sucesso', async () => {
    // Criar usuário para gerar token
    const user = await prisma.user.create({
      data: {
        email: 'admin@email.com',
        password: 'admin123',
        name: 'Admin',
      },
    });

    const token = generateToken(user.id);
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Novo Produto',
        description: 'Descrição do novo produto',
        price: 299.99,
        stock: 50,
        category: 'Eletrônicos',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'Novo Produto');
    expect(response.body).toHaveProperty('price', '299.99');
    expect(response.body).toHaveProperty('stock', 50);
  });

  it('deve retornar erro se faltar campos obrigatórios', async () => {
    // Criar usuário para gerar token
    const user = await prisma.user.create({
      data: {
        email: 'admin@email.com',
        password: 'admin123',
        name: 'Admin',
      },
    });

    const token = generateToken(user.id);
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Produto Incompleto',
        // Faltando description, price, stock, category
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('deve retornar erro se preço for negativo', async () => {
    // Criar usuário para gerar token
    const user = await prisma.user.create({
      data: {
        email: 'admin@email.com',
        password: 'admin123',
        name: 'Admin',
      },
    });

    const token = generateToken(user.id);
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Produto',
        description: 'Descrição',
        price: -50,
        stock: 10,
        category: 'Eletrônicos',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('preço');
  });
});

describe('PUT /api/products/:id', () => {
  
  it('deve atualizar um produto com sucesso', async () => {
    // Criar um produto
    const product = await prisma.product.create({
      data: {
        name: 'Produto Original',
        description: 'Descrição Original',
        price: 100.00,
        stock: 10,
        category: 'Eletrônicos',
      },
    });

    // Criar usuário para gerar token
    const user = await prisma.user.create({
      data: {
        email: 'admin@email.com',
        password: 'admin123',
        name: 'Admin',
      },
    });

    const token = generateToken(user.id);

    // Atualizar
    const response = await request(app)
      .put(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Produto Atualizado',
        description: 'Descrição Atualizada',
        price: 150.00,
        stock: 20,
        category: 'Informática',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', 'Produto Atualizado');
    expect(response.body).toHaveProperty('price', '150');
    expect(response.body).toHaveProperty('stock', 20);
  });

  it('deve retornar erro 404 ao atualizar produto inexistente', async () => {
    // Criar usuário para gerar token
    const user = await prisma.user.create({
      data: {
        email: 'admin@email.com',
        password: 'admin123',
        name: 'Admin',
      },
    });

    const token = generateToken(user.id);
    const response = await request(app)
      .put('/api/products/id-inexistente')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Produto',
        price: 100,
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});

describe('DELETE /api/products/:id', () => {
  
  it('deve deletar um produto com sucesso', async () => {
    // Criar um produto
    const product = await prisma.product.create({
      data: {
        name: 'Produto a Deletar',
        description: 'Descrição',
        price: 100.00,
        stock: 10,
        category: 'Eletrônicos',
      },
    });

    // Criar usuário para gerar token
    const user = await prisma.user.create({
      data: {
        email: 'admin@email.com',
        password: 'admin123',
        name: 'Admin',
      },
    });

    const token = generateToken(user.id);

    // Deletar
    const response = await request(app)
      .delete(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Produto deletado com sucesso');

    // Verificar se foi deletado
    const getResponse = await request(app)
      .get(`/api/products/${product.id}`);

    expect(getResponse.status).toBe(404);
  });

  it('deve retornar erro 404 ao deletar produto inexistente', async () => {
    // Criar usuário para gerar token
    const user = await prisma.user.create({
      data: {
        email: 'admin@email.com',
        password: 'admin123',
        name: 'Admin',
      },
    });

    const token = generateToken(user.id);
    const response = await request(app)
      .delete('/api/products/id-inexistente')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});
