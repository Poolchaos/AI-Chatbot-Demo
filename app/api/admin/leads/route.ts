import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = await getDb();
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    db
      .collection('leads')
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection('leads').countDocuments(),
  ]);

  return Response.json({ leads, total, page });
}
