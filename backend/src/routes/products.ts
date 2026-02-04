import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listar todos os produtos
 *     tags: [Products]
 *     security: []
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
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

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obter um produto por ID
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Criar um novo produto (apenas ADMIN)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - stock
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: decimal
 *               stock:
 *                 type: integer
 *               category:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 format: url
 *           example:
 *             name: Notebook Dell
 *             description: Notebook para desenvolvimento
 *             price: 3500.00
 *             stock: 10
 *             category: Eletrônicos
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       403:
 *         description: Sem permissão (requer ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Criar um novo produto (apenas ADMIN)
router.post('/', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
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
router.put('/:id', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
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

// Deletar um produto (apenas ADMIN)
router.delete('/:id', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
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
