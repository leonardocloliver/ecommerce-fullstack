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
    //Criar um usuário
    const user = await prisma.user.create({
      data: {
        email: 'cliente@email.com',
        password: 'senha123',
        name: 'Cliente Teste',
      },
    });

    //Criar produtos
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

    //Criar pedidos para o usuário
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

describe('GET /api/orders/:id', () => {

  it('deve retornar um pedido específico pelo id', async () => {
    // 1. Criar usuário
    const user = await prisma.user.create({
      data: {
        email: 'cliente@email.com',
        password: 'senha123',
        name: 'Cliente Teste',
      },
    });

    // 2. Criar produto
    const product = await prisma.product.create({
      data: {
        name: 'Notebook',
        description: 'Notebook de alta performance',
        price: 3000.00,
        stock: 5,
        category: 'Eletrônicos',
      },
    });

    // 3. Criar pedido
    const createResponse = await request(app)
      .post('/api/orders')
      .send({
        userId: user.id,
        address: 'Rua Exemplo, 123',
        items: [
          {
            productId: product.id,
            quantity: 2,
            price: 3000.00,
          },
        ],
      });

    expect(createResponse.status).toBe(201);

    const orderId = createResponse.body.id;

    //Buscar pedido pelo id
    const response = await request(app)
      .get(`/api/orders/${orderId}`);

    //Validações
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', orderId);
    expect(response.body).toHaveProperty('userId', user.id);
    expect(response.body).toHaveProperty('address', 'Rua Exemplo, 123');
    expect(response.body).toHaveProperty('status', 'PENDING');
    expect(response.body).toHaveProperty('items');
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toHaveProperty('productId', product.id);
    expect(response.body.items[0]).toHaveProperty('quantity', 2);
    expect(response.body).toHaveProperty('total', '6000');
  });

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
        status: 'CONFIRMED',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', orderId);
    expect(response.body).toHaveProperty('status', 'CONFIRMED');
  });

  it('deve retornar erro 404 ao tentar atualizar pedido inexistente', async () => {
    const response = await request(app)
      .put('/api/orders/id-inexistente')
      .send({
        status: 'CONFIRMED',
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
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
  expect(response.body).toHaveProperty('error');
});


});
