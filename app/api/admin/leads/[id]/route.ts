import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const db = await getDb();

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const validStatuses = ['new', 'contacted', 'qualified'];
  if (!body.status || !validStatuses.includes(body.status)) {
    return Response.json(
      { error: 'Invalid status. Must be one of: new, contacted, qualified' },
      { status: 400 }
    );
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(params.id);
  } catch {
    return Response.json({ error: 'Invalid lead ID' }, { status: 400 });
  }

  const result = await db
    .collection('leads')
    .findOneAndUpdate(
      { _id: objectId },
      { $set: { status: body.status } },
      { returnDocument: 'after' }
    );

  if (!result) {
    return Response.json({ error: 'Lead not found' }, { status: 404 });
  }

  return Response.json(result);
}
