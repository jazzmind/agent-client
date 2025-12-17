'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ToolSelector, Tool } from '@jazzmind/busibox-app/components';
import type { Agent } from '@/lib/types';

// Available tools from agent-server TOOL_REGISTRY
const AVAILABLE_TOOLS: Tool[] = [
  { id: 'search', name: 'Web Search', description: 'Search the internet', icon: '🌐', enabled: true },
  { id: 'rag', name: 'Document Search', description: 'Search documents', icon: '📄', enabled: true },
  { id: 'ingest', name: 'Document Ingestion', description: 'Process documents', icon: '📥', enabled: true },
];

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
    tools: [] as string[],
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
          tools: normalized.tools?.names || [],
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
    if (!agent || saving) return false;
    // For built-in agents, only tools can be edited
    if (agent.is_builtin) return true;
    // For personal agents, instructions must be present
    return Boolean(form.instructions.trim());
  }, [agent, form.instructions, saving]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      const updatePayload: any = {};
      
      // For built-in agents, only allow tool updates
      if (agent.is_builtin) {
        updatePayload.tools = form.tools.length > 0 ? { names: form.tools } : { names: [] };
      } else {
        // For personal agents, allow all fields
        updatePayload.display_name = form.display_name.trim() || undefined;
        updatePayload.description = form.description.trim() || undefined;
        updatePayload.instructions = form.instructions;
        updatePayload.is_active = form.is_active;
        if (form.tools.length > 0) {
          updatePayload.tools = { names: form.tools };
        }
      }

      const res = await fetch(`/api/admin/resources/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
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
        <Link href={agent ? `/agent/${agent.id}` : '/'} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
          ← Back
        </Link>
      </div>

      {loading && <div className="text-gray-600 dark:text-gray-400">Loading…</div>}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {agent && (
        <form onSubmit={onSave} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Agent</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{agent.display_name || agent.name}</p>
            {agent.is_builtin && (
              <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                Built-in Agent
              </span>
            )}
          </div>

          {agent.is_builtin && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-300">
              <p className="font-medium mb-1">Built-in Agent</p>
              <p className="text-sm">For built-in agents, you can only edit tools. Instructions and model are read-only.</p>
            </div>
          )}

          {!agent.is_builtin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display name</label>
                <input
                  value={form.display_name}
                  onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instructions *</label>
                <textarea
                  value={form.instructions}
                  onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-[180px]"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                Active
              </label>
            </>
          )}

          {agent.is_builtin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions (Read-only)</label>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto text-gray-900 dark:text-gray-100">
                {form.instructions}
              </pre>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Model: {agent.model}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tools</label>
            <ToolSelector
              selectedTools={form.tools}
              onToolsChange={(tools) => setForm((p) => ({ ...p, tools }))}
              availableTools={AVAILABLE_TOOLS}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select tools this agent can use.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href={agent ? `/agent/${agent.id}` : '/'} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSave}
              className="px-6 py-2 rounded-lg bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
