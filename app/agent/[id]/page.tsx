'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { SimpleChatInterface } from '@jazzmind/busibox-app/components';
import type { Agent } from '@/lib/types';

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const agentId = params.id;
  const chatParam = searchParams.get('chat');

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(chatParam === 'true');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Load agent details
        const res = await fetch(`/api/agents/${agentId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Failed to load agent (${res.status})`);
        setAgent({
          ...(data as Agent),
          is_builtin: Boolean((data as any).is_builtin),
          is_personal: !Boolean((data as any).is_builtin),
        });

        // Get auth token for chat
        const tokenRes = await fetch('/api/auth/token');
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          setToken(tokenData.token);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load agent');
      } finally {
        setLoading(false);
      }
    }
    if (agentId) load();
  }, [agentId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-gray-600 hover:text-blue-600">
          ← Back to Agents
        </Link>
        <div className="flex items-center gap-3">
          {agent && !agent.is_builtin && (
            <Link
              href={`/agent/${agent.id}/edit`}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              Edit Agent
            </Link>
          )}
          {agent && token && (
            <button
              onClick={() => setShowChat(!showChat)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              {showChat ? 'Hide Chat' : 'Test Agent'}
            </button>
          )}
        </div>
      </div>

      {loading && <div className="text-gray-600">Loading…</div>}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {agent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Details */}
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

            {/* Tools */}
            {agent.tools && Object.keys(agent.tools).length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Available Tools</div>
                <div className="flex flex-wrap gap-2">
                  {(agent.tools.names || []).map((tool: string) => (
                    <span
                      key={tool}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Scopes */}
            {agent.scopes && agent.scopes.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Required Scopes</div>
                <div className="flex flex-wrap gap-2">
                  {agent.scopes.map((scope: string) => (
                    <span
                      key={scope}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Instructions</div>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                {agent.instructions}
              </pre>
            </div>
          </div>

          {/* Chat Interface */}
          {showChat && token && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <h2 className="text-lg font-semibold text-gray-900">Test Agent</h2>
                <p className="text-sm text-gray-600">Chat with {agent.display_name || agent.name}</p>
              </div>
              <div className="h-[600px]">
                <SimpleChatInterface
                  token={token}
                  agentUrl={process.env.NEXT_PUBLIC_AGENT_API_URL}
                  enableWebSearch={false}
                  enableDocSearch={false}
                  allowAttachments={false}
                  placeholder={`Ask ${agent.display_name || agent.name}...`}
                  welcomeMessage={`Hi! I'm ${agent.display_name || agent.name}. ${agent.description || 'How can I help you?'}`}
                  model="auto"
                  useStreaming={true}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



