import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Database seeding started...\n');

  // ============================================
  // Super Admin Creation
  // ============================================

  const adminPassword = await bcrypt.hash('admin123', 12);

  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: 'admin@erp-saas.com' },
    update: {},
    create: {
      email: 'admin@erp-saas.com',
      password: adminPassword,
      name: 'Super Admin',
      role: 'super_admin',
      is_active: true,
    },
  });

  console.log('✅ Super Admin created:', superAdmin.email);

  // ============================================
  // Plan Creation
  // ============================================

  const plans = [
    {
      id: 'plan-starter',
      name: 'Başlangıç',
      slug: 'starter',
      description: 'Küçük işletmeler için temel ERP özellikleri',
      price_monthly: 499,
      price_yearly: 4999,
      max_users: 5,
      max_storage_gb: 10,
      max_api_calls: 10000,
      included_modules: ['CRM', 'INVENTORY', 'SALES'],
      sort_order: 1,
    },
    {
      id: 'plan-professional',
      name: 'Profesyonel',
      slug: 'professional',
      description: 'Büyümekte olan işletmeler için tüm temel özellikler',
      price_monthly: 1499,
      price_yearly: 14999,
      max_users: 25,
      max_storage_gb: 50,
      max_api_calls: 50000,
      included_modules: ['CRM', 'INVENTORY', 'PROJECT', 'HR', 'SALES', 'POS', 'ACCOUNTING', 'BANKING', 'CALENDAR', 'ANALYTICS'],
      sort_order: 2,
    },
    {
      id: 'plan-enterprise',
      name: 'Kurumsal',
      slug: 'enterprise',
      description: 'Büyük işletmeler için sınırsız özellikler ve destek',
      price_monthly: 4999,
      price_yearly: 49999,
      max_users: 999999,
      max_storage_gb: 1000,
      max_api_calls: null,
      included_modules: ['CRM', 'INVENTORY', 'PROJECT', 'HR', 'SALES', 'POS', 'ECOMMERCE', 'ACCOUNTING', 'BANKING', 'CALENDAR', 'WEBHOOKS', 'API_ACCESS', 'ANALYTICS', 'REPORTING', 'INTEGRATION'],
      sort_order: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    });
    console.log('✅ Plan created:', plan.name);
  }

  // ============================================
  // Demo Firm Creation
  // ============================================

  const demoFirmPassword = await bcrypt.hash('demo123', 12);

  const demoFirm = await prisma.firm.upsert({
    where: { email: 'demo@ornekfirma.com' },
    update: {},
    create: {
      name: 'Örnek Firma A.Ş.',
      short_name: 'ornekfirma',
      email: 'demo@ornekfirma.com',
      phone: '+90 212 555 0001',
      tax_id: '1234567890',
      address: 'İstanbul, Türkiye',
      dolibarr_url: 'https://demo.dolibarr.org',
      dolibarr_api_key: 'demo_api_key_placeholder',
      plan: 'PROFESSIONAL',
      status: 'TRIAL',
      subdomain: 'demo',
      max_users: 25,
      max_storage_gb: 50,
      trial_starts_at: new Date(),
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Demo firm created:', demoFirm.name);

  // Demo kullanıcı
  const demoUser = await prisma.user.upsert({
    where: { firm_id_email: { firm_id: demoFirm.id, email: 'admin@ornekfirma.com' } },
    update: {},
    create: {
      firm_id: demoFirm.id,
      email: 'admin@ornekfirma.com',
      password: demoFirmPassword,
      name: 'Firma Admin',
      surname: 'Yönetici',
      phone: '+90 212 555 0002',
      role: 'ADMIN',
    },
  });

  console.log('✅ Demo user created:', demoUser.email);

  // Demo firm modüllerini aktive et
  const modules = ['CRM', 'INVENTORY', 'PROJECT', 'HR', 'SALES', 'POS', 'ACCOUNTING', 'BANKING', 'CALENDAR', 'ANALYTICS'];

  for (const module of modules) {
    await prisma.modulePermission.upsert({
      where: {
        firm_id_module: {
          firm_id: demoFirm.id,
          module: module as any,
        },
      },
      update: { is_active: true },
      create: {
        firm_id: demoFirm.id,
        module: module as any,
        is_active: true,
        is_trial: true,
        trial_ends_at: demoFirm.trial_ends_at,
      },
    });
  }

  console.log('✅ Demo firm modules activated');

  // ============================================
  // Admin Log
  // ============================================

  await prisma.adminLog.create({
    data: {
      admin_id: superAdmin.id,
      action: 'SYSTEM_INIT',
      details: { message: 'Database seeded successfully' },
    },
  });

  console.log('\n🎉 Database seeding completed!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Demo Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin:');
  console.log('  Email: admin@erp-saas.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('Demo Firm:');
  console.log('  Email: admin@ornekfirma.com');
  console.log('  Password: demo123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });