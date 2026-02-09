import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Credenciais do admin padrão (em produção, use variáveis de ambiente)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ecommerce.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || 'Administrador';

  // Verificar se já existe um admin
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log('✅ Admin já existe:', existingAdmin.email);
    return;
  }

  // Criar o admin
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'ADMIN',
    },
  });

  console.log('🚀 Admin criado com sucesso!');
  console.log('   Email:', admin.email);
  console.log('   Senha:', adminPassword);
  console.log('');
  console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
