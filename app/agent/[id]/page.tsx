'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Agent } from '@/lib/types';

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const agentId = params.id;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Failed to load agent (${res.status})`);
        setAgent({
          ...(data as Agent),
          is_builtin: Boolean((data as any).is_builtin),
          is_personal: !Boolean((data as any).is_builtin),
        });
      } catch (e: any) {
        setError(e?.message || 'Failed to load agent');
      } finally {
        setLoading(false);
      }
    }
    if (agentId) load();
  }, [agentId]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-gray-600 hover:text-blue-600">
          ← Back
        </Link>
        {agent && !agent.is_builtin && (
          <Link
            href={`/agent/${agent.id}/edit`}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Edit
          </Link>
        )}
      </div>

      {loading && <div className="text-gray-600">Loading…</div>}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {agent && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{agent.display_name || agent.name}</h1>
            <div className="text-sm text-gray-600 mt-1">{agent.description || 'No description'}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="text-gray-700">
              <span className="text-gray-500">ID:</span> {agent.id}
            </div>
            <div className="text-gray-700">
              <span className="text-gray-500">Model:</span> {agent.model}
            </div>
            <div className="text-gray-700">
              <span className="text-gray-500">Type:</span> {agent.is_builtin ? 'Built-in' : 'Personal'}
            </div>
            <div className="text-gray-700">
              <span className="text-gray-500">Status:</span> {agent.is_active ? 'Active' : 'Inactive'}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Instructions</div>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 border border-gray-200 rounded-lg p-4">
              {agent.instructions}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

