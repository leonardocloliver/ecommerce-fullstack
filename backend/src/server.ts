import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API rodando' });
});

app.post('/api/auth/register', async (req, res) => {
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

app.post('/api/auth/login', async (req, res) => {
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

//listar todos os produtos
app.get('/api/products', async (req, res) => {
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

//obter um produto específico
app.get('/api/products/:id', async (req, res) => {
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

//criar um novo produto
app.post('/api/products', async (req, res) => {
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

//atualizar um produto
app.put('/api/products/:id', async (req, res) => {
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

//deletar um produto
app.delete('/api/products/:id', async (req, res) => {
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

//criar um novo pedido
app.post('/api/orders', async (req, res) => {
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

//listar pedidos do usuário
app.get('/api/orders', async (req, res) => {
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

//Iniciando o servidor
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse em: http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}
    
export default app;