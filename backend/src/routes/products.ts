import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

// Listar todos os produtos
router.get('/', asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      stock: true,
      category: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  return res.status(200).json(products);
}));

// Obter um produto específico
router.get('/:id', asyncHandler(async (req, res) => {
  const id = (req.params.id ?? '') as string;
  if (!id) {
    throw new AppError(400, 'ID é obrigatório');
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      stock: true,
      category: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  if (!product) {
    throw new AppError(404, 'Produto não encontrado');
  }

  return res.status(200).json(product);
}));

// Criar um novo produto
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { name, description, price, stock, category, imageUrl } = req.body;

  // Validação de campos obrigatórios
  if (!name || !description || price === undefined || stock === undefined || !category) {
    throw new AppError(400, 'Nome, descrição, preço, estoque e categoria são obrigatórios');
  }

  // Validação de preço
  if (price < 0) {
    throw new AppError(400, 'O preço não pode ser negativo');
  }

  // Validação de estoque
  if (stock < 0) {
    throw new AppError(400, 'O estoque não pode ser negativo');
  }

  // Criar produto
  const product = await prisma.product.create({
    data: {
      name,
      description,
      price,
      stock,
      category,
      imageUrl: imageUrl || null,
    },
  });

  return res.status(201).json(product);
}));

// Atualizar um produto
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const id = (req.params.id ?? '') as string;
  if (!id) {
    throw new AppError(400, 'ID é obrigatório');
  }
  const { name, description, price, stock, category, imageUrl } = req.body;

  // Verificar se produto existe
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new AppError(404, 'Produto não encontrado');
  }

  // Validações
  if (price !== undefined && price < 0) {
    throw new AppError(400, 'O preço não pode ser negativo');
  }

  if (stock !== undefined && stock < 0) {
    throw new AppError(400, 'O estoque não pode ser negativo');
  }

  // Atualizar produto
  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(price !== undefined && { price }),
      ...(stock !== undefined && { stock }),
      ...(category && { category }),
      ...(imageUrl && { imageUrl }),
    },
  });

  return res.status(200).json(updatedProduct);
}));

// Deletar um produto
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const id = (req.params.id ?? '') as string;
  if (!id) {
    throw new AppError(400, 'ID é obrigatório');
  }

  // Verificar se produto existe
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new AppError(404, 'Produto não encontrado');
  }

  // Deletar produto
  await prisma.product.delete({
    where: { id },
  });

  return res.status(200).json({
    message: 'Produto deletado com sucesso',
  });
}));

export default router;
