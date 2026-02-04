import type { Request, Response } from 'express';
import type { NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware de autorização para ADMIN
 * Verifica se o usuário tem role ADMIN
 * Deve ser usado DEPOIS de authMiddleware
 */
export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      throw new AppError(401, 'Usuário não autenticado');
    }

    // Buscar usuário para verificar role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    // Verificar se é ADMIN
    if (user.role !== 'ADMIN') {
      throw new AppError(
        403,
        'Acesso negado. Apenas administradores podem realizar esta ação.'
      );
    }

    // Usuário é ADMIN, permitir acesso
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, 'Erro ao verificar permissões');
  }
};
