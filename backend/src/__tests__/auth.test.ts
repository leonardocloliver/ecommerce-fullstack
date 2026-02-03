/// <reference types="jest" />

import request from 'supertest';
import app from '../app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Limpar banco antes de cada teste

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

describe('POST /api/auth/register', () => {
  
  it('deve criar um novo usuário com sucesso', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'teste@email.com',
        password: 'senha123',
        name: 'Maria Teste',
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Usuário criado com sucesso');
    expect(response.body.user.email).toBe('teste@email.com');
    expect(response.body.user.name).toBe('Maria Teste');
    expect(response.body.user.password).toBeUndefined();
  });

  it('deve retornar erro se email já existir', async () => {
    // Criar primeiro usuário
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'teste@email.com',
        password: 'senha123',
        name: 'Maria',
      });

    // Tentar criar outro com mesmo email
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'teste@email.com',
        password: 'outra_senha_123',  // Senha com mínimo 6 caracteres
        name: 'João',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email já cadastrado');
  });

  it('deve retornar erro se faltar campos obrigatórios', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'teste@email.com',
        // Faltando password e name
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('obrigatórios');
  });

  it('deve retornar erro se a senha for muito fraca', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'teste@email.com',
        password: '123',  // Senha muito curta
        name: 'Maria Teste',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('senha');
  });
});

describe('POST /api/auth/login', () => {
  
  beforeEach(async () => {
    // Criar um usuário para os testes de login
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'login@email.com',
        password: 'senha123',
        name: 'Usuário Teste',
      });
  });

  it('deve fazer login com credenciais corretas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@email.com',
        password: 'senha123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe('login@email.com');
    expect(response.body.user.password).toBeUndefined();
  });

  it('deve retornar erro com email incorreto', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'email_errado@email.com',
        password: 'senha123',
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Email ou senha inválidos');
  });

  it('deve retornar erro com senha incorreta', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@email.com',
        password: 'senha_errada',
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Email ou senha inválidos');
  });
});
