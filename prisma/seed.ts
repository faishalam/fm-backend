import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding started...');

  // ─── Users ───────────────────────────────────────────────────────────────

  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      username: 'Admin',
      phoneNumber: '081000000001',
      password: hashedPassword,
      role: 'admin',
    },
  });

  await prisma.financialProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@gmail.com' },
    update: {},
    create: {
      email: 'user@gmail.com',
      username: 'User',
      phoneNumber: '081000000002',
      password: hashedPassword,
      role: 'user',
    },
  });

  await prisma.financialProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  console.log(`✅ Users seeded — admin: ${admin.email}, user: ${user.email}`);

  // ─── Categories ──────────────────────────────────────────────────────────

  // NOTE: "investasi" menggunakan type INCOME karena enum TransactionType
  // hanya memiliki INCOME dan EXPENSE. Jika ingin type INVESTMENT tersendiri,
  // perlu menambahkan nilai baru ke enum dan menjalankan migration terlebih dahulu.

  const categoryData = [
    { name: 'Gaji', type: 'INCOME' as const },
    { name: 'Freelance', type: 'INCOME' as const },
    { name: 'Bonus', type: 'INCOME' as const },
    { name: 'Lainnya', type: 'INCOME' as const },
    { name: 'Makanan', type: 'EXPENSE' as const },
    { name: 'Transportasi', type: 'EXPENSE' as const },
    { name: 'Belanja', type: 'EXPENSE' as const },
    { name: 'Hiburan', type: 'EXPENSE' as const },
    { name: 'Tagihan', type: 'EXPENSE' as const },
    { name: 'Kesehatan', type: 'EXPENSE' as const },
    { name: 'Pendidikan', type: 'EXPENSE' as const },
    { name: 'Lainnya', type: 'EXPENSE' as const },
    { name: 'Investasi', type: 'INVESTMENT' as const },
    { name: 'Penjualan Investasi', type: 'INCOME' as const },
    { name: 'Bayar Hutang', type: 'EXPENSE' as const },
  ];

  // Seed kategori untuk kedua user
  for (const seedUser of [admin, user]) {
    for (const cat of categoryData) {
      await prisma.category.upsert({
        where: {
          userId_name_type: {
            userId: seedUser.id,
            name: cat.name,
            type: cat.type,
          },
        },
        update: {},
        create: {
          userId: seedUser.id,
          name: cat.name,
          type: cat.type,
          isSystem: true,
        },
      });
    }
  }

  console.log(`✅ Categories seeded for admin and user`);
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
