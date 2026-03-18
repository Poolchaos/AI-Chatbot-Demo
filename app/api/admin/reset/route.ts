import { getDb } from '@/lib/db';
import { seedDemoData } from '@/scripts/seed';

export async function POST() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.DEMO_MODE !== 'true'
  ) {
    return Response.json({ error: 'Reset disabled' }, { status: 403 });
  }

  const db = await getDb();

  await Promise.all([
    db.collection('conversations').deleteMany({}),
    db.collection('leads').deleteMany({}),
    db.collection('token_usage').deleteMany({}),
  ]);

  const result = await seedDemoData(db);

  return Response.json({
    success: true,
    seeded: result,
  });
}
