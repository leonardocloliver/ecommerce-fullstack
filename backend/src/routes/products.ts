import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Listar todos os produtos
router.get('/', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return res.status(500).json({ 
      error: 'Erro ao listar produtos' 
    });
  }
});

// Obter um produto específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

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
      return res.status(404).json({ 
        error: 'Produto não encontrado' 
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar produto' 
    });
  }
});

// Criar um novo produto
router.post('/', async (req, res) => {
  try {
    const { name, description, price, stock, category, imageUrl } = req.body;

    // Validação de campos obrigatórios
    if (!name || !description || price === undefined || stock === undefined || !category) {
      return res.status(400).json({ 
        error: 'Nome, descrição, preço, estoque e categoria são obrigatórios' 
      });
    }

    // Validação de preço
    if (price < 0) {
      return res.status(400).json({ 
        error: 'O preço não pode ser negativo' 
      });
    }

    // Validação de estoque
    if (stock < 0) {
      return res.status(400).json({ 
        error: 'O estoque não pode ser negativo' 
      });
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
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return res.status(500).json({ 
      error: 'Erro ao criar produto' 
    });
  }
});

// Atualizar um produto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category, imageUrl } = req.body;

    // Verificar se produto existe
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Produto não encontrado' 
      });
    }

    // Validações
    if (price !== undefined && price < 0) {
      return res.status(400).json({ 
        error: 'O preço não pode ser negativo' 
      });
    }

    if (stock !== undefined && stock < 0) {
      return res.status(400).json({ 
        error: 'O estoque não pode ser negativo' 
      });
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
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({ 
      error: 'Erro ao atualizar produto' 
    });
  }
});

// Deletar um produto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se produto existe
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Produto não encontrado' 
      });
    }

    // Deletar produto
    await prisma.product.delete({
      where: { id },
    });

    return res.status(200).json({
      message: 'Produto deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    return res.status(500).json({ 
      error: 'Erro ao deletar produto' 
    });
  }
});

export default router;
