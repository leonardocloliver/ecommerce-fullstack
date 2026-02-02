/// <reference types="jest" />

import request from 'supertest';
import app from '../server.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeEach(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
});

// Fechar conexão após todos os testes
afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/orders', () => {
  
  it('deve criar um novo pedido com sucesso', async () => {
    //Criar um usuário
    const user = await prisma.user.create({
      data: {
        email: 'cliente@email.com',
        password: 'senha123',
        name: 'Cliente Teste',
      },
    });

    //Criar um produto
    const product = await prisma.product.create({
      data: {
        name: 'Notebook',
        description: 'Notebook de alta performance',
        price: 3000.00,
        stock: 5,
        category: 'Eletrônicos',
      },
    });

    //Criar um pedido
    const response = await request(app)
      .post('/api/orders')
      .send({
        userId: user.id,
        address: 'Rua Exemplo, 123 - São Paulo, SP',
        items: [
          {
            productId: product.id,
            quantity: 1,
            price: 3000.00,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('userId', user.id);
    expect(response.body).toHaveProperty('address', 'Rua Exemplo, 123 - São Paulo, SP');
    expect(response.body).toHaveProperty('status', 'PENDING');
    expect(response.body).toHaveProperty('total', '3000');
  });

});

describe('GET /api/orders', () => {
  
  it('deve retornar os pedidos do usuário', async () => {
    // 1. Criar um usuário
    const user = await prisma.user.create({
      data: {
        email: 'cliente@email.com',
        password: 'senha123',
        name: 'Cliente Teste',
      },
    });

    // 2. Criar produtos
    const product1 = await prisma.product.create({
      data: {
        name: 'Notebook',
        description: 'Notebook de alta performance',
        price: 3000.00,
        stock: 5,
        category: 'Eletrônicos',
      },
    });

    const product2 = await prisma.product.create({
      data: {
        name: 'Mouse',
        description: 'Mouse sem fio',
        price: 150.00,
        stock: 20,
        category: 'Acessórios',
      },
    });

    // 3. Criar pedidos para o usuário
    await request(app)
      .post('/api/orders')
      .send({
        userId: user.id,
        address: 'Rua 1, 123',
        items: [{ productId: product1.id, quantity: 1, price: 3000.00 }],
      });

    await request(app)
      .post('/api/orders')
      .send({
        userId: user.id,
        address: 'Rua 2, 456',
        items: [{ productId: product2.id, quantity: 2, price: 150.00 }],
      });

    //Buscar pedidos do usuário
    const response = await request(app)
      .get(`/api/orders?userId=${user.id}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toHaveProperty('userId', user.id);
    expect(response.body[1]).toHaveProperty('userId', user.id);
  });

});
