'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Agent } from '@/lib/types';

export default function EditAgentPage() {
  const params = useParams<{ id: string }>();
  const agentId = params.id;
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    display_name: '',
    description: '',
    instructions: '',
    is_active: true,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Failed to load agent (${res.status})`);
        const normalized: Agent = {
          ...(data as Agent),
          is_builtin: Boolean((data as any).is_builtin),
          is_personal: !Boolean((data as any).is_builtin),
        };
        setAgent(normalized);
        setForm({
          display_name: normalized.display_name || '',
          description: normalized.description || '',
          instructions: normalized.instructions || '',
          is_active: normalized.is_active,
        });
      } catch (e: any) {
        setError(e?.message || 'Failed to load agent');
      } finally {
        setLoading(false);
      }
    }
    if (agentId) load();
  }, [agentId]);

  const canSave = useMemo(() => {
    return Boolean(form.instructions.trim()) && !saving && Boolean(agent) && !agent?.is_builtin;
  }, [agent, form.instructions, saving]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent || agent.is_builtin || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/resources/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // keep immutable fields on server side; only send updates
          display_name: form.display_name.trim() || undefined,
          description: form.description.trim() || undefined,
          instructions: form.instructions,
          is_active: form.is_active,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to update agent (${res.status})`);
      router.push(`/agent/${agent.id}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to update agent');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href={agent ? `/agent/${agent.id}` : '/'} className="text-sm text-gray-600 hover:text-blue-600">
          ← Back
        </Link>
      </div>

      {loading && <div className="text-gray-600">Loading…</div>}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {agent && (
        <form onSubmit={onSave} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Agent</h1>
            <p className="text-sm text-gray-600 mt-1">{agent.display_name || agent.name}</p>
          </div>

          {agent.is_builtin && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              Built-in agents can’t be edited here.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
            <input
              value={form.display_name}
              onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              disabled={agent.is_builtin}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              disabled={agent.is_builtin}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions *</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[180px]"
              disabled={agent.is_builtin}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              disabled={agent.is_builtin}
            />
            Active
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href={agent ? `/agent/${agent.id}` : '/'} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSave}
              className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}



