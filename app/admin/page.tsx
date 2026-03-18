'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Users, BarChart3, Zap } from 'lucide-react';

interface Stats {
  totalConversations: number;
  totalLeads: number;
  conversionRate: string;
  averageMessagesPerSession: number;
  requestsToday: number;
  dailyLimit: number;
}

interface TokenUsage {
  today: {
    date: string;
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
  };
  history: Array<{ date: string; totalRequests: number; totalTokens: number }>;
  dailyLimit: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function UsageGauge({ requests, limit }: { requests: number; limit: number }) {
  const pct = limit > 0 ? Math.min((requests / limit) * 100, 100) : 0;
  const color = pct < 80 ? 'bg-green-500' : pct < 95 ? 'bg-yellow-400' : 'bg-red-500';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-700">Daily Token Usage</p>
        <span className="text-xs text-slate-500">{requests} / {limit} requests</span>
      </div>
      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">{pct.toFixed(1)}% used today</p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => r.json()),
      fetch('/api/admin/token-usage').then((r) => r.json()),
    ])
      .then(([s, t]) => {
        setStats(s);
        setTokenUsage(t);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Overview</h1>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Conversations"
            value={stats.totalConversations}
            icon={MessageSquare}
            accent="bg-blue-600"
          />
          <StatCard
            label="Leads Captured"
            value={stats.totalLeads}
            icon={Users}
            accent="bg-emerald-500"
          />
          <StatCard
            label="Conversion Rate"
            value={stats.conversionRate}
            icon={BarChart3}
            accent="bg-amber-500"
          />
          <StatCard
            label="Avg Messages/Session"
            value={stats.averageMessagesPerSession}
            icon={Zap}
            accent="bg-purple-500"
          />
        </div>
      )}

      {tokenUsage && (
        <UsageGauge requests={tokenUsage.today.totalRequests} limit={tokenUsage.dailyLimit} />
      )}

      {/* 7-day history */}
      {tokenUsage && tokenUsage.history.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-700 mb-4">7-Day Request History</p>
          <div className="flex items-end gap-2 h-32">
            {tokenUsage.history.map((day) => {
              const maxReqs = Math.max(...tokenUsage.history.map((d) => d.totalRequests), 1);
              const heightPct = (day.totalRequests / maxReqs) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-500">{day.totalRequests}</span>
                  <div
                    className="w-full rounded-t bg-blue-500 min-h-[2px] transition-all"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-xs text-slate-400">{day.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
