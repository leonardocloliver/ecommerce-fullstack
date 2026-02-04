/// <reference types="jest" />

import request from 'supertest';
import app from '../app.js';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper para gerar token JWT
function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
}

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
    const token = generateToken(user.id);
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
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
    const token = generateToken(user.id);
    
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        address: 'Rua 1, 123',
        items: [{ productId: product1.id, quantity: 1, price: 3000.00 }],
      });

    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        address: 'Rua 2, 456',
        items: [{ productId: product2.id, quantity: 2, price: 150.00 }],
      });

    //Buscar pedidos do usuário
    const response = await request(app)
      .get(`/api/orders`)
      .set('Authorization', `Bearer ${token}`);

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
    const token = generateToken(user.id);
    const createResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
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
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);

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
