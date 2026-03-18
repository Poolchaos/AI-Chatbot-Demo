import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = await getDb();
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  const leadFilter = url.searchParams.get('leadCaptured');
  if (leadFilter === 'true') filter.leadCaptured = true;
  if (leadFilter === 'false') filter.leadCaptured = false;

  const [conversations, total] = await Promise.all([
    db
      .collection('conversations')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .project({
        sessionId: 1,
        messageCount: 1,
        totalTokens: 1,
        leadCaptured: 1,
        status: 1,
        'metadata.startedAt': 1,
        'metadata.provider': 1,
        createdAt: 1,
      })
      .toArray(),
    db.collection('conversations').countDocuments(filter),
  ]);

  return Response.json({ conversations, total, page });
}
