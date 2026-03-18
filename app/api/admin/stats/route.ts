import { getDb } from '@/lib/db';

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const db = await getDb();
  const today = todayString();

  const startOfDay = new Date(today + 'T00:00:00.000Z');
  const endOfDay = new Date(today + 'T23:59:59.999Z');
  const dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };

  const [totalConversations, totalLeads, avgResult, tokenDoc] =
    await Promise.all([
      db.collection('conversations').countDocuments(dateFilter),
      db.collection('leads').countDocuments(dateFilter),
      db
        .collection('conversations')
        .aggregate([
          { $match: dateFilter },
          { $group: { _id: null, avg: { $avg: '$messageCount' } } },
        ])
        .toArray(),
      db.collection('token_usage').findOne({ date: today }),
    ]);

  const averageMessagesPerSession = avgResult[0]?.avg
    ? Math.round(avgResult[0].avg * 10) / 10
    : 0;

  const requestsToday = tokenDoc?.totalRequests || 0;
  const dailyLimit = parseInt(process.env.DAILY_REQUEST_LIMIT || '1500', 10);
  const conversionRate =
    totalConversations > 0
      ? ((totalLeads / totalConversations) * 100).toFixed(1) + '%'
      : '0%';

  return Response.json({
    totalConversations,
    totalLeads,
    conversionRate,
    averageMessagesPerSession,
    requestsToday,
    dailyLimit,
  });
}
