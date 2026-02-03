/// <reference types="jest" />

import request from 'supertest';
import app from '../app.js';
import { PrismaClient } from '@prisma/client';

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

describe('PUT /api/orders/:id', () => {

  it('deve atualizar o status do pedido com sucesso', async () => {
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: 'cliente@email.com',
        password: 'senha123',
        name: 'Cliente Teste',
      },
    });

    // Criar produto
    const product = await prisma.product.create({
      data: {
        name: 'Notebook',
        description: 'Notebook de alta performance',
        price: 3000,
        stock: 5,
        category: 'Eletrônicos',
      },
    });

    // Criar pedido
    const orderResponse = await request(app)
      .post('/api/orders')
      .send({
        userId: user.id,
        address: 'Rua Exemplo, 123',
        items: [{ productId: product.id, quantity: 1, price: 3000 }],
      });

    expect(orderResponse.status).toBe(201);

    const orderId = orderResponse.body.id;

    // Atualizar status
    const response = await request(app)
      .put(`/api/orders/${orderId}`)
      .send({
        userId: user.id,
        status: 'CONFIRMED',
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(orderId);
    expect(response.body.status).toBe('CONFIRMED');
  });

  it('deve retornar erro 404 ao tentar atualizar pedido inexistente', async () => {
    const response = await request(app)
      .put('/api/orders/id-inexistente')
      .send({
        status: 'CONFIRMED',
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('não encontrado');
  });
  
  it('deve retornar erro 403 ao tentar atualizar pedido de outro usuário', async () => {
    // Criar usuário dono do pedido
    const userA = await prisma.user.create({
      data: {
        email: 'usera@email.com',
        password: '123456',
        name: 'User A',
      },
    });

    // Criar outro usuário
    const userB = await prisma.user.create({
      data: {
        email: 'userb@email.com',
        password: '123456',
        name: 'User B',
      },
    });

    // Criar produto
    const product = await prisma.product.create({
      data: {
        name: 'Teclado',
        description: 'Teclado mecânico',
        price: 500,
        stock: 10,
        category: 'Periféricos',
      },
    });

    // Criar pedido do userA
    const orderResponse = await request(app)
      .post('/api/orders')
      .send({
        userId: userA.id,
        address: 'Rua A, 123',
        items: [
          {
            productId: product.id,
            quantity: 1,
            price: 500,
          },
        ],
      });

    const orderId = orderResponse.body.id;

    // UserB tenta atualizar o pedido
    const response = await request(app)
      .put(`/api/orders/${orderId}`)
      .send({
        userId: userB.id,
        status: 'CONFIRMED',
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('permissão');
  });

  it('deve retornar erro 400 ao tentar pular etapas de status', async () => {
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: 'cliente@email.com',
        password: 'senha123',
        name: 'Cliente Teste',
      },
    });

    // Criar produto
    const product = await prisma.product.create({
      data: {
        name: 'Notebook',
        description: 'Notebook de alta performance',
        price: 3000,
        stock: 5,
        category: 'Eletrônicos',
      },
    });

    // Criar pedido
    const orderResponse = await request(app)
      .post('/api/orders')
      .send({
        userId: user.id,
        address: 'Rua Exemplo, 123',
        items: [{ productId: product.id, quantity: 1, price: 3000 }],
      });

    const orderId = orderResponse.body.id;

    //Tentar pular de PENDING para DELIVERED (pulando CONFIRMED e SHIPPED)
    const response = await request(app)
      .put(`/api/orders/${orderId}`)
      .send({
        userId: user.id,
        status: 'DELIVERED',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('pular');
    expect(response.body.error).toContain('CONFIRMED');
  });

  it('deve permitir cancelar um pedido de qualquer estado', async () => {
    //Criar usuário
    const user = await prisma.user.create({
      data: {
        email: 'cliente@email.com',
        password: 'senha123',
        name: 'Cliente Teste',
      },
    });

    //Criar produto
    const product = await prisma.product.create({
      data: {
        name: 'Notebook',
        description: 'Notebook de alta performance',
        price: 3000,
        stock: 5,
        category: 'Eletrônicos',
      },
    });

    //Criar pedido
    const orderResponse = await request(app)
      .post('/api/orders')
      .send({
        userId: user.id,
        address: 'Rua Exemplo, 123',
        items: [{ productId: product.id, quantity: 1, price: 3000 }],
      });

    const orderId = orderResponse.body.id;

    //Cancelar pedido direto do PENDING (sem passar por CONFIRMED)
    const response = await request(app)
      .put(`/api/orders/${orderId}`)
      .send({
        userId: user.id,
        status: 'CANCELLED',
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('CANCELLED');
  });

});
