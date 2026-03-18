import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getLLMProvider } from '@/lib/llm';
import { buildSystemPrompt, SAVE_LEAD_TOOL } from '@/lib/prompt';
import {
  getDailyUsageStatus,
  incrementDailyUsage,
} from '@/lib/token-manager';
import type {
  ChatRequest,
  ChatMessage,
  ConversationDocument,
  SSEChunk,
} from '@/lib/types';
import { createHash } from 'crypto';

const SESSION_MESSAGE_LIMIT = parseInt(
  process.env.SESSION_MESSAGE_LIMIT || '20',
  10
);

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

function sseEncode(chunk: SSEChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(
      sseEncode({ type: 'error', message: 'Invalid request.', code: 'LLM_ERROR' }),
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  const { sessionId, message } = body;
  if (!sessionId || !message) {
    return new Response(
      sseEncode({
        type: 'error',
        message: 'Session ID and message are required.',
        code: 'LLM_ERROR',
      }),
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  const db = await getDb();
  const conversationsCol = db.collection<ConversationDocument>('conversations');
  const providerName = (process.env.LLM_PROVIDER || 'gemini') as 'gemini' | 'claude';
  const isInit = message === '__INIT__';

  // ─── Get or create conversation ─────────────────────────────────────
  let conversation = await conversationsCol.findOne({ sessionId });

  if (!conversation) {
    const now = new Date();
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    const newConv: ConversationDocument = {
      sessionId,
      messages: [],
      totalTokens: { prompt: 0, completion: 0, total: 0 },
      messageCount: 0,
      leadCaptured: false,
      leadId: null,
      status: 'active',
      metadata: {
        userAgent: request.headers.get('user-agent') || 'unknown',
        ip: hashIp(ip),
        startedAt: now,
        lastMessageAt: now,
        provider: providerName,
      },
      createdAt: now,
      updatedAt: now,
    };
    const result = await conversationsCol.insertOne(newConv);
    conversation = { ...newConv, _id: result.insertedId };
  }

  // ─── Session limit check ───────────────────────────────────────────
  if (conversation.messageCount >= SESSION_MESSAGE_LIMIT && !isInit) {
    return new Response(
      sseEncode({
        type: 'error',
        message:
          "I've really enjoyed our conversation! To continue, let me connect you with our events team. What's the best email to reach you?",
        code: 'SESSION_LIMIT',
      }),
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  // ─── Daily limit check ─────────────────────────────────────────────
  const dailyStatus = await getDailyUsageStatus();

  if (dailyStatus.tier === 'blocked') {
    return new Response(
      sseEncode({
        type: 'error',
        message:
          'Our AI assistant is currently resting for the day. Please leave your name and email, and our events team will reach out within 24 hours.',
        code: 'DAILY_LIMIT',
      }),
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  // ─── Build LLM context ─────────────────────────────────────────────
  let systemPrompt = buildSystemPrompt();

  // Degraded mode: shorter responses
  if (dailyStatus.tier === 'degraded') {
    systemPrompt +=
      '\n\nIMPORTANT: Keep responses under 50 words. Prioritize directing users to leave contact info.';
  }

  // Build conversation history (last 20 messages = 10 exchange pairs)
  const historyMessages: ChatMessage[] = conversation.messages
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content }));

  // Add current user message (skip for __INIT__)
  if (!isInit) {
    historyMessages.push({ role: 'user', content: message });
  }

  // If no history at all (init), provide a nudge
  if (historyMessages.length === 0) {
    historyMessages.push({
      role: 'user',
      content: 'Hello',
    });
  }

  // ─── Stream response ───────────────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const provider = getLLMProvider();
        let fullText = '';
        let toolCallData: { name: string; arguments: Record<string, unknown> } | null = null;

        // Emit limit warning if applicable
        if (dailyStatus.tier === 'warning') {
          controller.enqueue(
            encoder.encode(
              sseEncode({
                type: 'limit_warning',
                kind: 'daily',
                percentUsed: dailyStatus.percentUsed,
              })
            )
          );
        }

        const gen = provider.streamChat({
          systemPrompt,
          messages: historyMessages,
          tools: [SAVE_LEAD_TOOL],
        });

        for await (const chunk of gen) {
          if (chunk.type === 'text' && chunk.content) {
            fullText += chunk.content;
            controller.enqueue(
              encoder.encode(
                sseEncode({ type: 'text', content: chunk.content })
              )
            );
          }

          if (chunk.type === 'tool_call' && chunk.toolCall) {
            toolCallData = chunk.toolCall;
          }
        }

        // Handle tool call with no text
        if (toolCallData && !fullText.trim()) {
          const fallbackText =
            "I've noted your details. Our events team will reach out within 24 hours.";
          fullText = fallbackText;
          controller.enqueue(
            encoder.encode(sseEncode({ type: 'text', content: fallbackText }))
          );
        }

        // Process lead save if tool was called
        if (toolCallData && toolCallData.name === 'save_lead') {
          const args = toolCallData.arguments;
          const email = args.email as string;

          if (email && isValidEmail(email)) {
            const leadsCol = db.collection('leads');
            const existing = await leadsCol.findOne({
              sessionId,
              email,
            });

            if (existing) {
              await leadsCol.updateOne(
                { _id: existing._id },
                {
                  $set: {
                    name: (args.name as string) || existing.name,
                    companyName:
                      (args.company_name as string) || existing.companyName,
                    estimatedHeadcount:
                      (args.estimated_headcount as number) ||
                      existing.estimatedHeadcount,
                    budgetRange:
                      (args.budget_range as string) || existing.budgetRange,
                    eventType:
                      (args.event_type as string) || existing.eventType,
                    notes: (args.notes as string) || existing.notes,
                  },
                }
              );
              controller.enqueue(
                encoder.encode(
                  sseEncode({
                    type: 'lead_saved',
                    leadId: existing._id!.toString(),
                  })
                )
              );
            } else {
              const result = await leadsCol.insertOne({
                sessionId,
                email,
                name: (args.name as string) || null,
                companyName: (args.company_name as string) || null,
                estimatedHeadcount: (args.estimated_headcount as number) || null,
                budgetRange: (args.budget_range as string) || null,
                eventType: (args.event_type as string) || null,
                notes: (args.notes as string) || null,
                source: 'chatbot',
                status: 'new',
                createdAt: new Date(),
              });

              // Update conversation to mark lead captured
              await conversationsCol.updateOne(
                { sessionId },
                {
                  $set: {
                    leadCaptured: true,
                    leadId: result.insertedId,
                  },
                }
              );

              controller.enqueue(
                encoder.encode(
                  sseEncode({
                    type: 'lead_saved',
                    leadId: result.insertedId.toString(),
                  })
                )
              );
            }
          }
        }

        // Get token usage
        const usage = provider.getTokenUsage() || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        };

        // Store the user message and assistant response
        const now = new Date();
        const updateOps: Record<string, unknown> = {
          $set: {
            'metadata.lastMessageAt': now,
            updatedAt: now,
          },
          $inc: {
            messageCount: isInit ? 1 : 2,
            'totalTokens.prompt': usage.prompt_tokens,
            'totalTokens.completion': usage.completion_tokens,
            'totalTokens.total': usage.total_tokens,
          },
        };

        const messagesToPush = [];
        if (!isInit) {
          messagesToPush.push({
            role: 'user' as const,
            content: message,
            timestamp: now,
            tokens: null,
          });
        }
        messagesToPush.push({
          role: 'assistant' as const,
          content: fullText,
          timestamp: now,
          tokens: {
            prompt: usage.prompt_tokens,
            completion: usage.completion_tokens,
            total: usage.total_tokens,
          },
        });

        const updateDoc = {
          ...updateOps,
          $push: {
            messages: { $each: messagesToPush },
          },
        };
        await conversationsCol.updateOne(
          { sessionId },
          updateDoc as Parameters<typeof conversationsCol.updateOne>[1]
        );

        // Increment daily usage
        await incrementDailyUsage(
          usage.prompt_tokens,
          usage.completion_tokens,
          usage.total_tokens
        );

        // Get updated message count
        const updatedConv = await conversationsCol.findOne(
          { sessionId },
          { projection: { messageCount: 1 } }
        );

        // Send done chunk
        controller.enqueue(
          encoder.encode(
            sseEncode({
              type: 'done',
              usage,
              sessionMessageCount: updatedConv?.messageCount || 0,
            })
          )
        );
      } catch (error) {
        const isTimeout =
          error instanceof Error &&
          (error.message.includes('timeout') || error.message.includes('ETIMEDOUT'));

        controller.enqueue(
          encoder.encode(
            sseEncode({
              type: 'error',
              message: 'I had a brief hiccup. Could you repeat that?',
              code: isTimeout ? 'LLM_TIMEOUT' : 'LLM_ERROR',
            })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
