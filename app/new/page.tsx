'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ModelOption = { id: string; name: string; provider?: string };

export default function NewAgentPage() {
  const router = useRouter();
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    display_name: '',
    description: '',
    model: '',
    instructions: '',
    is_active: true,
  });

  useEffect(() => {
    async function loadModels() {
      setLoadingModels(true);
      try {
        const res = await fetch('/api/models');
        const data = await res.json();
        // Handle OpenAI-compatible format: { data: [...], object: "list" }
        const list = Array.isArray(data) ? data : (data.data || data.models || []);
        setModels(list);
        if (list.length > 0) {
          setForm((prev) => ({ ...prev, model: prev.model || String(list[0].id) }));
        }
      } catch {
        setModels([]);
      } finally {
        setLoadingModels(false);
      }
    }
    loadModels();
  }, []);

  const canSubmit = useMemo(() => {
    return Boolean(form.name.trim() && form.model.trim() && form.instructions.trim());
  }, [form.instructions, form.model, form.name]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/resources/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          display_name: form.display_name.trim() || undefined,
          description: form.description.trim() || undefined,
          model: form.model,
          instructions: form.instructions,
          is_active: form.is_active,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Failed to create agent (${res.status})`);
      }
      router.push(`/agent/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to create agent');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Agent</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create a personal agent definition.</p>
        </div>
        <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
          ← Back
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="my-agent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Unique identifier (kebab-case recommended).</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display name</label>
          <input
            value={form.display_name}
            onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="My Agent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="What this agent does…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model *</label>
          <select
            value={form.model}
            onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            disabled={loadingModels}
          >
            {loadingModels ? (
              <option value="">Loading…</option>
            ) : models.length === 0 ? (
              <option value="">No models available</option>
            ) : (
              models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.provider ? `(${m.provider})` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instructions *</label>
          <textarea
            value={form.instructions}
            onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 min-h-[180px]"
            placeholder="System prompt / instructions for the agent…"
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

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/" className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="px-6 py-2 rounded-lg bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating…' : 'Create Agent'}
          </button>
        </div>
      </form>
    </div>
  );
}



