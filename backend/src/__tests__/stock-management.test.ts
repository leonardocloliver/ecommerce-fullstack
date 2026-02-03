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

describe('Stock Management', () => {

  it('deve rejeitar pedido se não houver stock suficiente', async () => {
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: 'cliente@email.com',
        password: 'senha123',
        name: 'Cliente Teste',
      },
    });

    // Criar produto com stock limitado
    const product = await prisma.product.create({
      data: {
        name: 'Notebook',
        description: 'Notebook de alta performance',
        price: 3000.00,
        stock: 2,  // Apenas 2 em stock
        category: 'Eletrônicos',
      },
    });

    // Tentar criar pedido com mais itens do que stock disponível
    const response = await request(app)
      .post('/api/orders')
      .send({
        userId: user.id,
        address: 'Rua Exemplo, 123',
        items: [
          {
            productId: product.id,
            quantity: 5,  // Solicita 5, mas só há 2
            price: 3000.00,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('Estoque insuficiente');
    expect(response.body.error).toContain('Disponível: 2');
    expect(response.body.error).toContain('Solicitado: 5');
  });

  it('deve criar pedido com sucesso quando há stock suficiente', async () => {
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: 'cliente@email.com',
        password: 'senha123',
        name: 'Cliente Teste',
      },
    });

    // Criar produto com stock
    const product = await prisma.product.create({
      data: {
        name: 'Mouse',
        description: 'Mouse sem fio',
        price: 150.00,
        stock: 10,
        category: 'Acessórios',
      },
    });

    // Criar pedido válido
    const response = await request(app)
      .post('/api/orders')
      .send({
        userId: user.id,
        address: 'Rua Exemplo, 123',
        items: [
          {
            productId: product.id,
            quantity: 3,
            price: 150.00,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();

    // Verificar que o stock NÃO foi decrementado na criação (apenas em CONFIRMED)
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(updatedProduct?.stock).toBe(10);
  });

  it('deve decrementar stock ao confirmar pedido', async () => {
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
        name: 'Teclado',
        description: 'Teclado mecânico',
        price: 500.00,
        stock: 10,
        category: 'Periféricos',
      },
    });

    // Criar pedido
    const orderResponse = await request(app)
      .post('/api/orders')
      .send({
        userId: user.id,
        address: 'Rua Exemplo, 123',
        items: [
          {
            productId: product.id,
            quantity: 3,
            price: 500.00,
          },
        ],
      });

    const orderId = orderResponse.body.id;

    // Confirmar pedido
    const confirmResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .send({
        userId: user.id,
        status: 'CONFIRMED',
      });

    expect(confirmResponse.status).toBe(200);

    // Verificar que o stock foi decrementado
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(updatedProduct?.stock).toBe(7); // 10 - 3
  });

  it('deve retornar stock ao cancelar pedido confirmado', async () => {
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
        name: 'Monitor',
        description: 'Monitor 4K',
        price: 2000.00,
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
        items: [
          {
            productId: product.id,
            quantity: 2,
            price: 2000.00,
          },
        ],
      });

    const orderId = orderResponse.body.id;

    // Confirmar pedido
    await request(app)
      .put(`/api/orders/${orderId}`)
      .send({
        userId: user.id,
        status: 'CONFIRMED',
      });

    // Verificar stock após confirmação
    let updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(updatedProduct?.stock).toBe(3); // 5 - 2

    // Cancelar pedido
    await request(app)
      .put(`/api/orders/${orderId}`)
      .send({
        userId: user.id,
        status: 'CANCELLED',
      });

    // Verificar que o stock foi retornado
    updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(updatedProduct?.stock).toBe(5); // 3 + 2
  });

  it('deve rejeitar pedido se um dos produtos não existe', async () => {
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: 'cliente@email.com',
        password: 'senha123',
        name: 'Cliente Teste',
      },
    });

    // Tentar criar pedido com produto inexistente
    const response = await request(app)
      .post('/api/orders')
      .send({
        userId: user.id,
        address: 'Rua Exemplo, 123',
        items: [
          {
            productId: 'produto-inexistente',
            quantity: 1,
            price: 100.00,
          },
        ],
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('não encontrado');
  });

});
