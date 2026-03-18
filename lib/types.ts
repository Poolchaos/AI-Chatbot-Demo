import { ObjectId } from 'mongodb';

// ─── Conversation Collection ────────────────────────────────────────────────

export interface MessageTokens {
  prompt: number;
  completion: number;
  total: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens: MessageTokens | null;
}

export interface ConversationTotalTokens {
  prompt: number;
  completion: number;
  total: number;
}

export interface ConversationMetadata {
  userAgent: string;
  ip: string;
  startedAt: Date;
  lastMessageAt: Date;
  provider: 'gemini' | 'claude';
}

export interface ConversationDocument {
  _id?: ObjectId;
  sessionId: string;
  messages: ConversationMessage[];
  totalTokens: ConversationTotalTokens;
  messageCount: number;
  leadCaptured: boolean;
  leadId: ObjectId | null;
  status: 'active' | 'completed' | 'limit_reached';
  metadata: ConversationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Leads Collection ───────────────────────────────────────────────────────

export interface LeadDocument {
  _id?: ObjectId;
  sessionId: string;
  email: string;
  name: string | null;
  companyName: string | null;
  estimatedHeadcount: number | null;
  budgetRange: string | null;
  eventType: string | null;
  notes: string | null;
  source: 'chatbot';
  status: 'new' | 'contacted' | 'qualified';
  createdAt: Date;
}

// ─── Token Usage Collection ─────────────────────────────────────────────────

export interface TokenUsageDocument {
  _id?: ObjectId;
  date: string; // YYYY-MM-DD
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  requestsByHour: Record<string, number>;
  updatedAt: Date;
}

// ─── Content Collection ─────────────────────────────────────────────────────

export interface ContentDocument {
  _id?: ObjectId;
  key: string;
  content: string;
  tokenCount: number;
  version: number;
  updatedAt: Date;
}

// ─── SSE Chunk Types ────────────────────────────────────────────────────────

export interface TextChunk {
  type: 'text';
  content: string;
}

export interface LeadSavedChunk {
  type: 'lead_saved';
  leadId: string;
}

export interface DoneChunk {
  type: 'done';
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  sessionMessageCount: number;
}

export interface ErrorChunk {
  type: 'error';
  message: string;
  code: 'LLM_TIMEOUT' | 'LLM_ERROR' | 'RATE_LIMITED' | 'SESSION_LIMIT' | 'DAILY_LIMIT';
}

export interface LimitWarningChunk {
  type: 'limit_warning';
  kind: 'daily' | 'session';
  percentUsed: number;
}

export type SSEChunk =
  | TextChunk
  | LeadSavedChunk
  | DoneChunk
  | ErrorChunk
  | LimitWarningChunk;

// ─── LLM Provider Interface ────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface StreamChunk {
  type: 'text' | 'tool_call';
  content?: string;
  toolCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface LLMProvider {
  streamChat(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    tools: ToolDefinition[];
  }): AsyncGenerator<StreamChunk>;

  getTokenUsage(): TokenUsage | null;
}

// ─── Chat Request / Response ────────────────────────────────────────────────

export interface ChatRequest {
  sessionId: string;
  message: string;
}
