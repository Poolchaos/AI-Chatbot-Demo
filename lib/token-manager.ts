import { getDb } from '@/lib/db';
import type { TokenUsageDocument } from '@/lib/types';

const DAILY_REQUEST_LIMIT = parseInt(
  process.env.DAILY_REQUEST_LIMIT || '1500',
  10
);

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentHour(): string {
  return new Date().getHours().toString().padStart(2, '0');
}

export interface DailyUsageStatus {
  totalRequests: number;
  limit: number;
  percentUsed: number;
  tier: 'normal' | 'warning' | 'degraded' | 'blocked';
}

export async function getDailyUsageStatus(): Promise<DailyUsageStatus> {
  const db = await getDb();
  const doc = await db
    .collection<TokenUsageDocument>('token_usage')
    .findOne({ date: todayString() });

  const totalRequests = doc?.totalRequests || 0;
  const percentUsed = (totalRequests / DAILY_REQUEST_LIMIT) * 100;

  let tier: DailyUsageStatus['tier'] = 'normal';
  if (percentUsed >= 100) tier = 'blocked';
  else if (percentUsed >= 95) tier = 'degraded';
  else if (percentUsed >= 80) tier = 'warning';

  return { totalRequests, limit: DAILY_REQUEST_LIMIT, percentUsed, tier };
}

export async function incrementDailyUsage(
  promptTokens: number,
  completionTokens: number,
  totalTokens: number
): Promise<void> {
  const db = await getDb();
  await db.collection('token_usage').updateOne(
    { date: todayString() },
    {
      $inc: {
        totalRequests: 1,
        totalInputTokens: promptTokens,
        totalOutputTokens: completionTokens,
        totalTokens: totalTokens,
        [`requestsByHour.${currentHour()}`]: 1,
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true }
  );
}
