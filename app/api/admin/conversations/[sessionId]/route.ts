import { getDb } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string } }
) {
  const db = await getDb();
  const conversation = await db
    .collection('conversations')
    .findOne({ sessionId: params.sessionId });

  if (!conversation) {
    return Response.json({ error: 'Conversation not found' }, { status: 404 });
  }

  return Response.json(conversation);
}
