import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

//Estender tipo do Request para incluir userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 Middleware de autenticação JWT
 Valida o token e extrai o userId para usar nas rotas
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    //Pega o header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Token não fornecido. Use: Authorization: Bearer <token>' 
      });
    }

    //Valida formato "Bearer TOKEN"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ 
        error: 'Formato inválido. Use: Bearer <token>' 
      });
    }

    const token = parts[1]!;  //Garantido que existe após split length check

    //Verifica se o token é válido
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'seu_secret_key'
    ) as any;

    //Injeta o userId no request
    req.userId = decoded.id;

    //Passa para a próxima função
    next();

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado' 
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido' 
      });
    }

    return res.status(401).json({ 
      error: 'Erro ao validar token' 
    });
  }
};
