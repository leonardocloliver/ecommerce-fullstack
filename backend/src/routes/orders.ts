import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Criar um novo pedido
router.post('/', async (req, res) => {
  try {
    const { userId, address, items } = req.body;

    // Validação de campos obrigatórios
    if (!userId || !address || !items || items.length === 0) {
      return res.status(400).json({ 
        error: 'userId, address e items são obrigatórios' 
      });
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado' 
      });
    }

    // Validar stock de todos os produtos
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(404).json({ 
          error: `Produto com ID '${item.productId}' não encontrado` 
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Estoque insuficiente para '${product.name}'. Disponível: ${product.stock}, Solicitado: ${item.quantity}` 
        });
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
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return res.status(500).json({ 
      error: 'Erro ao criar pedido' 
    });
  }
});

// Listar pedidos do usuário
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    // Validação
    if (!userId) {
      return res.status(400).json({ 
        error: 'userId é obrigatório' 
      });
    }

    // Buscar pedidos do usuário
    const orders = await prisma.order.findMany({
      where: { userId: userId as string },
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
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    return res.status(500).json({ 
      error: 'Erro ao listar pedidos' 
    });
  }
});

// Obter um pedido específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

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
      return res.status(404).json({ 
        error: 'Pedido não encontrado' 
      });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar pedido' 
    });
  }
});

// Atualizar status do pedido
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId } = req.body;

    // Buscar o pedido
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({
        error: 'Pedido não encontrado',
      });
    }

    // Validar userId
    if (!userId) {
      return res.status(400).json({
        error: 'userId é obrigatório',
      });
    }

    // Verificar permissão
    if (order.userId !== userId) {
      return res.status(403).json({
        error: 'Você não tem permissão para atualizar este pedido',
      });
    }

    // Validar status
    if (!status) {
      return res.status(400).json({
        error: 'Status é obrigatório',
      });
    }

    const allowedStatus = [
      'PENDING',
      'CONFIRMED',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        error: 'Status inválido',
      });
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

    // Validar sequência para os demais status
    const statusSequence = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    const currentStatusIndex = statusSequence.indexOf(order.status);
    const newStatusIndex = statusSequence.indexOf(status);

    // Se o novo status não está na sequência, rejeitar
    if (newStatusIndex === -1) {
      return res.status(400).json({
        error: `Status '${status}' inválido. Status permitidos: ${statusSequence.join(' → ')} ou CANCELLED`,
      });
    }

    // Se o status atual não está na sequência, rejeitar
    if (currentStatusIndex === -1) {
      return res.status(400).json({
        error: `Pedido com status '${order.status}' não pode ser atualizado. Apenas pedidos PENDING, CONFIRMED, SHIPPED ou DELIVERED podem ser modificados.`,
      });
    }

    // Se o novo status é anterior ao status atual, rejeitar
    if (newStatusIndex < currentStatusIndex) {
      const currentStatus = statusSequence[currentStatusIndex];
      return res.status(400).json({
        error: `Transição inválida: não é possível voltar de '${currentStatus}' para '${status}'. O pedido só pode avançar na sequência de status.`,
      });
    }

    // Se o novo status pula etapas, rejeitar
    if (newStatusIndex - currentStatusIndex > 1) {
      const currentStatus = statusSequence[currentStatusIndex];
      const nextStatus = statusSequence[currentStatusIndex + 1];
      return res.status(400).json({
        error: `Transição inválida: não é permitido pular de '${currentStatus}' para '${status}'. O próximo status deve ser '${nextStatus}'.`,
      });
    }

    //Ao confirmar pedido, decrementar stock
    if (status === 'CONFIRMED' && order.status === 'PENDING') {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: id },
      });

      // Decrementar stock de cada item
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

    // Atualizar pedido
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return res.status(500).json({
      error: 'Erro ao atualizar status do pedido',
    });
  }
});

export default router;
