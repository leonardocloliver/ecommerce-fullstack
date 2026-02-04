/// <reference types="jest" />

import request from 'supertest';
import app from '../app.js';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

beforeEach(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Authentication Middleware', () => {

  it('deve rejeitar requisição sem token', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({
        address: 'Rua Exemplo',
        items: [],
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('Token não fornecido');
  });

  it('deve rejeitar requisição com token inválido', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer invalid-token')
      .send({
        address: 'Rua Exemplo',
        items: [],
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('Token inválido');
  });

  it('deve rejeitar requisição com formato de header incorreto', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', 'InvalidFormat token123')
      .send({
        address: 'Rua Exemplo',
        items: [],
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('Formato inválido');
  });

  it('deve rejeitar requisição com token expirado', async () => {
    // Cria um token expirado
    const expiredToken = jwt.sign(
      { id: 'user-123' },
      process.env.JWT_SECRET || 'seu_secret_key',
      { expiresIn: '-1h' }  // Expira 1 hora atrás
    );

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({
        address: 'Rua Exemplo',
        items: [],
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('expirado');
  });

  it('deve aceitar requisição com token válido', async () => {
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: 'teste@email.com',
        password: 'senha123',
        name: 'Teste',
      },
    });

    // Criar token válido
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'seu_secret_key',
      { expiresIn: '24h' }
    );

    // Criar produto
    const product = await prisma.product.create({
      data: {
        name: 'Produto',
        description: 'Descrição',
        price: 100,
        stock: 10,
        category: 'Categoria',
      },
    });

    // Requisição COM token válido deve passar do middleware
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        address: 'Rua Exemplo',
        items: [
          {
            productId: product.id,
            quantity: 1,
            price: 100,
          },
        ],
      });

    // Não deve retornar 401 de autenticação
    expect(response.status).not.toBe(401);
    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });

  it('deve extrair userId do token corretamente', async () => {
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: 'teste@email.com',
        password: 'senha123',
        name: 'Teste',
      },
    });

    // Criar token com userId do usuário
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'seu_secret_key',
      { expiresIn: '24h' }
    );

    // Criar produto
    const product = await prisma.product.create({
      data: {
        name: 'Produto',
        description: 'Descrição',
        price: 100,
        stock: 10,
        category: 'Categoria',
      },
    });

    // Criar pedido com token
    const createResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        address: 'Rua Exemplo',
        items: [
          {
            productId: product.id,
            quantity: 1,
            price: 100,
          },
        ],
      });

    expect(createResponse.status).toBe(201);

    // Listar pedidos do usuário (agora com middleware)
    const listResponse = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.length).toBe(1);
    expect(listResponse.body[0].userId).toBe(user.id);
  });

  it('deve impedir usuário de acessar pedidos de outro usuário', async () => {
    // Criar dois usuários
    const user1 = await prisma.user.create({
      data: {
        email: 'user1@email.com',
        password: 'senha123',
        name: 'User 1',
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'user2@email.com',
        password: 'senha123',
        name: 'User 2',
      },
    });

    // Criar produto
    const product = await prisma.product.create({
      data: {
        name: 'Produto',
        description: 'Descrição',
        price: 100,
        stock: 10,
        category: 'Categoria',
      },
    });

    // User1 cria um pedido
    const token1 = jwt.sign(
      { id: user1.id },
      process.env.JWT_SECRET || 'seu_secret_key',
      { expiresIn: '24h' }
    );

    const createResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        address: 'Rua Exemplo',
        items: [
          {
            productId: product.id,
            quantity: 1,
            price: 100,
          },
        ],
      });

    const orderId = createResponse.body.id;

    // User2 tenta atualizar o pedido
    const token2 = jwt.sign(
      { id: user2.id },
      process.env.JWT_SECRET || 'seu_secret_key',
      { expiresIn: '24h' }
    );

    const updateResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({
        status: 'CONFIRMED',
      });

    // Deve retornar 403 Forbidden
    expect(updateResponse.status).toBe(403);
    expect(updateResponse.body.error).toBeDefined();
    expect(updateResponse.body.error).toContain('permissão');
  });

});
