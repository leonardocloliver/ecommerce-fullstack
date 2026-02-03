import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validação de campos obrigatórios
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, senha e nome são obrigatórios' 
      });
    }

    // Validação de força de senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'A senha deve ter no mínimo 6 caracteres'
      });
    }

    // Verificar se email já existe
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({ 
        error: 'Email já cadastrado' 
      });
    }

    // Criar novo usuário
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
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return res.status(500).json({ 
      error: 'Erro ao registrar usuário' 
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação de campos obrigatórios
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Verificar se usuário existe e se a senha é correta
    if (!user || user.password !== password) {
      return res.status(401).json({ 
        error: 'Email ou senha inválidos' 
      });
    }

    // Gerar token JWT
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
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return res.status(500).json({ 
      error: 'Erro ao fazer login' 
    });
  }
});

export default router;
