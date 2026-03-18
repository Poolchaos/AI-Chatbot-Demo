import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();

    // MongoDB ping
    let dbOk = false;
    try {
      await db.command({ ping: 1 });
      dbOk = true;
    } catch {
      dbOk = false;
    }

    // LLM reachability check (just verify env var exists, no actual API call)
    const provider = process.env.LLM_PROVIDER || 'gemini';
    const llmOk =
      (provider === 'gemini' && !!process.env.GEMINI_API_KEY) ||
      (provider === 'claude' && !!process.env.CLAUDE_API_KEY);

    const healthy = dbOk && llmOk;

    return Response.json(
      {
        status: healthy ? 'healthy' : 'degraded',
        checks: {
          database: dbOk,
          llm: llmOk,
        },
        timestamp: new Date().toISOString(),
      },
      { status: healthy ? 200 : 503 }
    );
  } catch {
    return Response.json(
      {
        status: 'degraded',
        checks: { database: false, llm: false },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
