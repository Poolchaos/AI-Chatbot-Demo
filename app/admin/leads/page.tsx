'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Star } from 'lucide-react';

interface Lead {
  _id: string;
  sessionId: string;
  email: string;
  name: string | null;
  companyName: string | null;
  estimatedHeadcount: number | null;
  budgetRange: string | null;
  eventType: string | null;
  status: 'new' | 'contacted' | 'qualified';
  createdAt: string;
}

const statusConfig = {
  new: { label: 'New', icon: Clock, className: 'bg-blue-50 text-blue-700' },
  contacted: { label: 'Contacted', icon: CheckCircle, className: 'bg-amber-50 text-amber-700' },
  qualified: { label: 'Qualified', icon: Star, className: 'bg-emerald-50 text-emerald-700' },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/leads?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        setLeads(data.leads);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const updateStatus = async (id: string, status: Lead['status']) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l._id === id ? { ...l, status } : l)));
      }
    } catch {
      console.error('Failed to update lead status');
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Leads</h1>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Company</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Headcount</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Event Type</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const sc = statusConfig[lead.status];
              return (
                <tr key={lead._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {lead.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{lead.email}</td>
                  <td className="px-4 py-3 text-slate-700">{lead.companyName || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{lead.estimatedHeadcount ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{lead.eventType || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead._id, e.target.value as Lead['status'])}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 cursor-pointer ${sc.className}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}

            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No leads captured yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">{total} total leads</p>
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
