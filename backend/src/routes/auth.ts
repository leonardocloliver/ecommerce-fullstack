import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  //Validação de campos obrigatórios
  if (!email || !password || !name) {
    throw new AppError(400, 'Email, senha e nome são obrigatórios');
  }

  //Validação de força de senha (mínimo 6 caracteres)
  if (password.length < 6) {
    throw new AppError(400, 'A senha deve ter no mínimo 6 caracteres');
  }

  //Verificar se email já existe
  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    throw new AppError(400, 'Email já cadastrado');
  }

  //Criar novo usuário
  const user = await prisma.user.create({
    data: {
      email,
      password,
      name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return res.status(201).json({
    message: 'Usuário criado com sucesso',
    user,
  });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //Validação de campos obrigatórios
  if (!email || !password) {
    throw new AppError(400, 'Email e senha são obrigatórios');
  }

  //Buscar usuário
  const user = await prisma.user.findUnique({
    where: { email },
  });

  //Verificar se usuário existe e se a senha é correta
  if (!user || user.password !== password) {
    throw new AppError(401, 'Email ou senha inválidos');
  }

  //Gerar token JWT
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'seu_secret_key',
    { expiresIn: '24h' }
  );

  return res.status(200).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      },
    });
}));

export default router;
