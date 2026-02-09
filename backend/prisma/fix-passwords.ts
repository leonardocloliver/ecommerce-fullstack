import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function fixPasswords() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // Se não começa com $2b$, é senha em texto puro
    if (!user.password.startsWith('$2b$')) {
      const hashed = await bcrypt.hash(user.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed }
      });
      console.log('✅ Senha atualizada:', user.email);
    } else {
      console.log('⏭️  Já hasheada:', user.email);
    }
  }
  console.log('\n🎉 Todas as senhas foram atualizadas!');
}

fixPasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
