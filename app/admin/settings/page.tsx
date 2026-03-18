'use client';

import { useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);

  const handleReset = async () => {
    if (!confirm('This will delete all conversations, leads, and usage data and reseed with demo data. Continue?')) {
      return;
    }

    setResetting(true);
    setResetResult(null);

    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setResetResult(
          `Reset complete: ${data.seeded.conversations} conversations, ${data.seeded.leads} leads seeded.`
        );
      } else {
        const err = await res.json();
        setResetResult(`Error: ${err.error || 'Reset failed'}`);
      }
    } catch {
      setResetResult('Error: Connection failed');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Environment Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-medium text-slate-700 mb-3">Environment</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">LLM Provider</dt>
              <dd className="text-slate-900 font-medium">
                {process.env.NEXT_PUBLIC_LLM_PROVIDER || 'gemini'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Daily Request Limit</dt>
              <dd className="text-slate-900 font-medium">
                {process.env.NEXT_PUBLIC_DAILY_LIMIT || '100'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Session Message Limit</dt>
              <dd className="text-slate-900 font-medium">20</dd>
            </div>
          </dl>
        </div>

        {/* Demo Reset */}
        <div className="rounded-xl border border-red-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-medium text-red-700">Demo Reset</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Delete all data and reseed with demo conversations and leads. This action cannot be undone.
          </p>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white
              hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetting...' : 'Reset Demo Data'}
          </button>

          {resetResult && (
            <p className={`mt-3 text-sm ${resetResult.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
              {resetResult}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
