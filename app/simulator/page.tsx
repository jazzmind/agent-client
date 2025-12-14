'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Agent as AgentType } from '@/lib/types';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function SimulatorPage() {
  const [agents, setAgents] = useState<AgentType[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAgents() {
      setError(null);
      try {
        const res = await fetch('/api/agents');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Failed to load agents (${res.status})`);
        const list = (Array.isArray(data) ? data : []) as AgentType[];
        setAgents(
          list.map((a) => ({
            ...a,
            is_builtin: Boolean((a as any).is_builtin),
            is_personal: !Boolean((a as any).is_builtin),
          }))
        );
      } catch (e: any) {
        setError(e?.message || 'Failed to load agents');
      }
    }
    loadAgents();
  }, []);

  const selectedAgent = useMemo(() => agents.find((a) => a.id === selectedAgentId) || null, [agents, selectedAgentId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId || !input.trim() || isLoading) return;

    const content = input.trim();
    setInput('');
    setIsLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content }, { role: 'assistant', content: '' }]);

    try {
      const runRes = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgentId,
          input: { query: content },
        }),
      });
      const run = await runRes.json().catch(() => ({}));
      if (!runRes.ok) throw new Error(run.error || `Failed to start run (${runRes.status})`);

      // Stream output via SSE proxy (no headers required)
      const es = new EventSource(`/api/streams/runs/${run.id}`);
      let finalText = '';

      es.addEventListener('output', (evt: MessageEvent) => {
        try {
          const data = JSON.parse(String((evt as any).data));
          finalText = typeof data?.message === 'string' ? data.message : JSON.stringify(data);
        } catch {
          finalText = String((evt as any).data);
        }
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === 'assistant') last.content = finalText;
          return next;
        });
      });

      es.addEventListener('complete', () => {
        es.close();
        setIsLoading(false);
      });

      es.addEventListener('error', () => {
        es.close();
        setIsLoading(false);
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to run agent');
      setIsLoading(false);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') last.content = `❌ Error: ${e?.message || 'Failed to run agent'}`;
        return next;
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Simulator</h1>
        <p className="text-gray-600 mt-1">Run an agent using your current user credentials.</p>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Agent</label>
        <select
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select an agent…</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.display_name || a.name} {a.is_builtin ? '(Built-in)' : '(Personal)'}
            </option>
          ))}
        </select>
      </div>

      {selectedAgent && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="font-medium text-gray-900">{selectedAgent.display_name || selectedAgent.name}</div>
          <div className="text-sm text-gray-600 mt-1">{selectedAgent.description || 'No description'}</div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-sm">No messages yet.</div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                    m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={send} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            placeholder={selectedAgentId ? 'Type a message…' : 'Select an agent first…'}
            disabled={!selectedAgentId || isLoading}
          />
          <button
            type="submit"
            disabled={!selectedAgentId || !input.trim() || isLoading}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Running…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
