import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

//Criar um novo pedido
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.userId as string;  // Vem do middleware
  const { address, items } = req.body;

  if (!userId || !address || !items || items.length === 0) {
    throw new AppError(400, 'userId, address e items são obrigatórios');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'Usuário não encontrado');
  }

  // Criar pedido com transação para garantir consistência do estoque
  const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let total = 0;
    const itemsData: { productId: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new AppError(404, `Produto com ID '${item.productId}' não encontrado`);
      }

      if (product.stock < item.quantity) {
        throw new AppError(400, `Estoque insuficiente para '${product.name}'. Disponível: ${product.stock}, Solicitado: ${item.quantity}`);
      }

      const price = Number(product.price);
      total += price * item.quantity;
      itemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price,
      });

      // Descontar estoque imediatamente
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const createdOrder = await tx.order.create({
      data: {
        userId,
        address,
        total,
        status: 'PENDING',
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });

    return createdOrder;
  });

  return res.status(201).json(order);
}));

// Listar pedidos do usuário
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.userId as string;  // Vem do middleware

  // Buscar pedidos do usuário
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
  });

  return res.status(200).json(orders);
}));

// Listar todos os pedidos (apenas ADMIN)
router.get('/admin', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json(orders);
}));

// Obter um pedido específico
router.get('/:id', asyncHandler(async (req, res) => {
  const id = (req.params.id ?? '') as string;
  if (!id) {
    throw new AppError(400, 'ID é obrigatório');
  }

  // Buscar pedido pelo id
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError(404, 'Pedido não encontrado');
  }

  return res.status(200).json(order);
}));

// Atualizar status do pedido
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const id = (req.params.id ?? '') as string;
  if (!id) {
    throw new AppError(400, 'ID é obrigatório');
  }
  const userId = req.userId as string;  // Vem do middleware
  const { status } = req.body;

  // Buscar o pedido
  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    throw new AppError(404, 'Pedido não encontrado');
  }

  // Verificar permissão
  const requester = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!requester) {
    throw new AppError(404, 'Usuário não encontrado');
  }

  if (requester.role !== 'ADMIN' && order.userId !== userId) {
    throw new AppError(403, 'Você não tem permissão para atualizar este pedido');
  }

  // Validar status
  if (!status) {
    throw new AppError(400, 'Status é obrigatório');
  }

  const allowedStatus = [
    'PENDING',
    'CONFIRMED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
  ];

  if (!allowedStatus.includes(status)) {
    throw new AppError(400, 'Status inválido');
  }

  // Cancelamento: restaurar estoque (de qualquer status exceto DELIVERED e já CANCELLED)
  if (status === 'CANCELLED') {
    if (order.status === 'CANCELLED') {
      throw new AppError(400, 'Pedido já está cancelado');
    }

    if (order.status === 'DELIVERED') {
      throw new AppError(400, 'Pedido já entregue não pode ser cancelado');
    }

    // Restaurar estoque de cada item
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: id },
    });

    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
        },
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });
    return res.status(200).json(updatedOrder);
  }

  //Validar sequência para os demais status
  const statusSequence = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
  const currentStatusIndex = statusSequence.indexOf(order.status);
  const newStatusIndex = statusSequence.indexOf(status);

  //Se o novo status não está na sequência, rejeitar
  if (newStatusIndex === -1) {
    throw new AppError(400, `Status '${status}' inválido. Status permitidos: ${statusSequence.join(' → ')} ou CANCELLED`);
  }

  //Se o status atual não está na sequência, rejeitar
  if (currentStatusIndex === -1) {
    throw new AppError(400, `Pedido com status '${order.status}' não pode ser atualizado. Apenas pedidos PENDING, CONFIRMED, SHIPPED ou DELIVERED podem ser modificados.`);
  }

  //Se o novo status é anterior ao status atual, rejeitar
  if (newStatusIndex < currentStatusIndex) {
    const currentStatus = statusSequence[currentStatusIndex];
    throw new AppError(400, `Transição inválida: não é possível voltar de '${currentStatus}' para '${status}'. O pedido só pode avançar na sequência de status.`);
  }

  // Se o novo status pula etapas, rejeitar
  if (newStatusIndex - currentStatusIndex > 1) {
    const currentStatus = statusSequence[currentStatusIndex];
    const nextStatus = statusSequence[currentStatusIndex + 1];
    throw new AppError(400, `Transição inválida: não é permitido pular de '${currentStatus}' para '${status}'. O próximo status deve ser '${nextStatus}'.`);
  }

  // Estoque já descontado na criação — não precisa descontar na confirmação

  //Atualizar pedido
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status },
  });

  return res.status(200).json(updatedOrder);
}));

export default router;
