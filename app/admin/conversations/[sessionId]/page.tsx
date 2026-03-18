'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokens: { prompt: number; completion: number; total: number } | null;
}

interface ConversationDetail {
  sessionId: string;
  messages: Message[];
  totalTokens: { prompt: number; completion: number; total: number };
  messageCount: number;
  leadCaptured: boolean;
  status: string;
  metadata: {
    userAgent: string;
    startedAt: string;
    lastMessageAt: string;
    provider: string;
  };
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [convo, setConvo] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/conversations/${sessionId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(setConvo)
      .catch(() => setConvo(null))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!convo) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Conversation not found.</p>
        <button onClick={() => router.back()} className="mt-2 text-sm text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Session {convo.sessionId.slice(0, 8)}...
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {convo.messageCount} messages &middot;{' '}
            {convo.totalTokens.total.toLocaleString()} tokens &middot;{' '}
            {convo.metadata.provider} &middot;{' '}
            <span className={convo.leadCaptured ? 'text-emerald-600' : 'text-slate-400'}>
              {convo.leadCaptured ? 'Lead captured' : 'No lead'}
            </span>
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            convo.status === 'active'
              ? 'bg-green-50 text-green-700'
              : convo.status === 'completed'
              ? 'bg-slate-100 text-slate-600'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {convo.status}
        </span>
      </div>

      {/* Message thread */}
      <div className="space-y-4">
        {convo.messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                msg.role === 'user' ? 'bg-blue-100' : 'bg-slate-100'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="h-4 w-4 text-blue-600" />
              ) : (
                <Bot className="h-4 w-4 text-slate-600" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-slate-100 text-slate-800 rounded-bl-md'
              }`}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-0.5">{children}</li>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
              <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
                {msg.tokens && ` · ${msg.tokens.total} tokens`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
