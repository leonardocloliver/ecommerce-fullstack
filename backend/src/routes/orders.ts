import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

// Criar um novo pedido
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.userId as string;  // Vem do middleware
  const { address, items } = req.body;

  // Validação de campos obrigatórios
  if (!userId || !address || !items || items.length === 0) {
    throw new AppError(400, 'userId, address e items são obrigatórios');
  }

  // Verificar se usuário existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'Usuário não encontrado');
  }

  // Validar stock de todos os produtos
  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product) {
      throw new AppError(404, `Produto com ID '${item.productId}' não encontrado`);
    }

    if (product.stock < item.quantity) {
      throw new AppError(400, `Estoque insuficiente para '${product.name}'. Disponível: ${product.stock}, Solicitado: ${item.quantity}`);
    }
  }

  // Calcular total do pedido
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }

  // Criar pedido
  const order = await prisma.order.create({
    data: {
      userId,
      address,
      total,
      status: 'PENDING',
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
    include: {
      items: true,
    },
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
  if (order.userId !== userId) {
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

  // CANCELLED é um status especial que pode ser acionado de qualquer estado
  if (status === 'CANCELLED') {
    // Se o pedido foi confirmado, retornar o stock
    if (order.status === 'CONFIRMED' || order.status === 'SHIPPED') {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: id },
      });

      //Retornar stock de cada item
      for (const item of orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
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

  //Ao confirmar pedido, decrementar stock
  if (status === 'CONFIRMED' && order.status === 'PENDING') {
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: id },
    });

    //Decrementar stock de cada item
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }
  }

  //Atualizar pedido
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status },
  });

  return res.status(200).json(updatedOrder);
}));

export default router;
