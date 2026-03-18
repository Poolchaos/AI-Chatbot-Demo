'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';

interface ConversationSummary {
  sessionId: string;
  messageCount: number;
  totalTokens: number;
  leadCaptured: boolean;
  status: string;
  metadata: { startedAt: string; provider: string };
  createdAt: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/conversations?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        setConversations(data.conversations);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Conversations</h1>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Session</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Messages</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Tokens</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Lead</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Started</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((c) => (
              <tr key={c.sessionId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/conversations/${c.sessionId}`}
                    className="text-blue-600 hover:underline font-mono text-xs"
                  >
                    {c.sessionId.slice(0, 8)}...
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{c.messageCount}</td>
                <td className="px-4 py-3 text-slate-700">{c.totalTokens.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {c.leadCaptured ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-300" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : c.status === 'completed'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {new Date(c.metadata.startedAt).toLocaleString()}
                </td>
              </tr>
            ))}

            {conversations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No conversations yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">{total} total conversations</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600
                hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="flex items-center text-sm text-slate-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600
                hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
