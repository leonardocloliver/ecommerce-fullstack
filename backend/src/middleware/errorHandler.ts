import type { Request, Response } from 'express';
import type { NextFunction } from 'express';

//Classe customizada para erros da aplicação
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

//Middleware de error handler
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //Se for um erro operacional (previsível)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  //Se for erro de Prisma (banco de dados)
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      error: 'Erro ao acessar o banco de dados',
      statusCode: 400,
    });
  }

  //Erros não previstos - log para debug
  console.error('Erro não tratado:', err);
  return res.status(500).json({
    error: 'Erro interno do servidor',
    statusCode: 500,
  });
};

//Wrapper para capturar erros em rotas assíncronas
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
