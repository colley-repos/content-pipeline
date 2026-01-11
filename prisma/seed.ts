import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Created admin user:', admin.email)

  // Create test user
  const testPassword = await bcrypt.hash('test123', 10)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: testPassword,
      role: 'USER',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Created test user:', testUser.email)

  // Create subscription for test user
  const subscription = await prisma.subscription.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      stripeCustomerId: 'cus_test_' + testUser.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  })

  console.log('✅ Created subscription for test user')

  // Create sample content
  const sampleContent = await prisma.content.create({
    data: {
      userId: testUser.id,
      type: 'SOCIAL_POST',
      prompt: 'Create a motivational post about starting a new week',
      output: 'Monday mornings are not obstacles—they are opportunities. 💪 Every new week brings a chance to level up, learn something new, and get closer to your goals. Start strong, stay focused, and make it count! 🚀 #MondayMotivation #NewWeekNewGoals',
      shared: true,
      shareToken: 'demo-share-token',
    },
  })

  console.log('✅ Created sample content')

  // Log seed event
  await prisma.analytics.create({
    data: {
      userId: admin.id,
      event: 'DATABASE_SEEDED',
      metadata: {
        timestamp: new Date().toISOString(),
      },
    },
  })

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
