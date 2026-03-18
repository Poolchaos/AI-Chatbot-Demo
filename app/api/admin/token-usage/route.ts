import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const db = await getDb();
  const today = new Date();

  // Get last 7 days of token usage
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const docs = await db
    .collection('token_usage')
    .find({ date: { $in: dates } })
    .sort({ date: 1 })
    .toArray();

  const dailyLimit = parseInt(process.env.DAILY_REQUEST_LIMIT || '1500', 10);
  const todayDoc = docs.find((d) => d.date === todayString());

  return Response.json({
    today: {
      date: todayString(),
      totalRequests: todayDoc?.totalRequests || 0,
      totalInputTokens: todayDoc?.totalInputTokens || 0,
      totalOutputTokens: todayDoc?.totalOutputTokens || 0,
      totalTokens: todayDoc?.totalTokens || 0,
      requestsByHour: todayDoc?.requestsByHour || {},
    },
    history: dates.map((date) => {
      const doc = docs.find((d) => d.date === date);
      return {
        date,
        totalRequests: doc?.totalRequests || 0,
        totalTokens: doc?.totalTokens || 0,
      };
    }),
    dailyLimit,
  });
}
