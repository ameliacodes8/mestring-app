import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const family = await prisma.family.upsert({
    where: { id: 'demo-family' },
    update: {},
    create: { id: 'demo-family', name: 'Demo Family' }
  });

  console.log('Seeded family:', family);
}

main().finally(async () => prisma.$disconnect());