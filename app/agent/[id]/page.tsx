'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { SimpleChatInterface } from '@jazzmind/busibox-app/components';
import { ConversationsList, RunsList, RunDetailPanel } from '@/components/conversations';
import { ToolBadgeList } from '@/components/tools';
import { useAuth } from '@/components/auth/AuthContext';
import type { Agent } from '@/lib/types';

type TabType = 'details' | 'chat' | 'conversations' | 'workflow';

interface Run {
  id: string;
  agent_id: string;
  workflow_id?: string | null;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'timeout';
  input: Record<string, any>;
  output?: Record<string, any> | null;
  events: any[];
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export default function AgentDetailPage() {
  const { isReady, refreshKey } = useAuth();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const agentId = params.id;
  const chatParam = searchParams.get('chat');
  const tabParam = searchParams.get('tab');

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Determine if agent supports attachments
  const supportsAttachments = useMemo(() => {
    if (!agent) return false;
    return agent.tools?.names?.some((t: string) => ['ingest', 'rag'].includes(t)) || false;
  }, [agent]);

  // Determine enabled tools for chat
  const enableWebSearch = useMemo(() => {
    return agent?.tools?.names?.includes('search') || false;
  }, [agent]);

  const enableDocSearch = useMemo(() => {
    return agent?.tools?.names?.includes('rag') || false;
  }, [agent]);

  // Wait for auth to be ready before fetching data
  useEffect(() => {
    if (!isReady || !agentId) {
      return;
    }
    
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
          setTokenError(null);
        } else if (tokenRes.status === 401) {
          setTokenError('not_authenticated');
        } else {
          setTokenError('token_fetch_failed');
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load agent');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isReady, refreshKey, agentId]);

  // Sync activeTab with URL params
  useEffect(() => {
    if (chatParam === 'true') {
      setActiveTab('chat');
    } else if (tabParam) {
      setActiveTab(tabParam as TabType);
    } else {
      setActiveTab('details');
    }
  }, [chatParam, tabParam]);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedRunId(null); // Clear selected run when switching tabs
    const newUrl = tab === 'details' 
      ? `/agent/${agentId}` 
      : `/agent/${agentId}?tab=${tab}`;
    router.push(newUrl, { scroll: false });
  };

  // Handle run selection
  const handleSelectRun = (run: Run) => {
    setSelectedRunId(run.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
          ← Back to Agents
        </Link>
        <div className="flex items-center gap-3">
          {agent && !agent.is_builtin && (
            <Link
              href={`/agent/${agent.id}/edit`}
              className="px-4 py-2 rounded-lg bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600"
            >
              Edit Agent
            </Link>
          )}
        </div>
      </div>

      {loading && <div className="text-gray-600 dark:text-gray-400">Loading…</div>}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {agent && (
        <div className="space-y-6">
          {/* Header - Only show on details tab */}
          {activeTab === 'details' && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{agent.display_name || agent.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{agent.description || 'No description'}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => handleTabChange('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => handleTabChange('chat')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => handleTabChange('conversations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'conversations'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Conversations
              </button>
              {agent.workflow && (
                <button
                  onClick={() => handleTabChange('workflow')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'workflow'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Workflow
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400">ID:</span> {agent.id}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400">Model:</span> {agent.model}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400">Type:</span> {agent.is_builtin ? 'Built-in' : 'Personal'}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400">Status:</span> {agent.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Tools */}
              {agent.tools && Object.keys(agent.tools).length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Available Tools</div>
                  <ToolBadgeList
                    tools={(agent.tools.names || []).map((toolName: string) => ({
                      name: toolName,
                      is_builtin: true, // Assume built-in for now; could be enhanced with actual tool lookup
                    }))}
                    size="md"
                    interactive={true}
                  />
                </div>
              )}

              {/* Scopes */}
              {agent.scopes && agent.scopes.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Required Scopes</div>
                  <div className="flex flex-wrap gap-2">
                    {agent.scopes.map((scope: string) => (
                      <span
                        key={scope}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions</div>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto text-gray-900 dark:text-gray-100">
                  {agent.instructions}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
              {tokenError === 'not_authenticated' ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md px-6">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Authentication Required
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      You need to be authenticated to use the chat feature. Please log in through the AI Portal first.
                    </p>
                    <a
                      href={process.env.NEXT_PUBLIC_AI_PORTAL_URL || 'http://localhost:3000'}
                      className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Go to AI Portal
                    </a>
                  </div>
                </div>
              ) : tokenError === 'token_fetch_failed' ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md px-6">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Unable to Load Chat
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Failed to retrieve authentication token. Please try refreshing the page.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Refresh Page
                    </button>
                  </div>
                </div>
              ) : !token ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
                  </div>
                </div>
              ) : (
                <SimpleChatInterface
                  token={token}
                  agentUrl={process.env.NEXT_PUBLIC_AGENT_API_URL}
                  agentId={agent.id}
                  model={agent.model}
                  enableWebSearch={enableWebSearch}
                  enableDocSearch={enableDocSearch}
                  allowAttachments={supportsAttachments}
                  placeholder={`Chat with ${agent.display_name || agent.name}...`}
                  welcomeMessage={`Hi! I'm **${agent.display_name || agent.name}**.\n\n${agent.description || 'How can I help you today?'}`}
                />
              )}
            </div>
          )}

          {activeTab === 'conversations' && (
            <div className="space-y-6">
              {!token ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center max-w-md px-6">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Authentication Required
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      You need to be authenticated to view conversation history.
                    </p>
                  </div>
                </div>
              ) : selectedRunId ? (
                <RunDetailPanel 
                  runId={selectedRunId}
                  token={token}
                  onClose={() => setSelectedRunId(null)} 
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chat Conversations Section */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <span>💬</span>
                      Chat Conversations
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Conversations where this agent was used via chat routing.
                    </p>
                    <ConversationsList 
                      agentId={agent.id}
                      token={token}
                      onSelectConversation={(id) => {
                        // Could navigate to conversation detail or expand inline
                        console.log('Selected conversation:', id);
                      }}
                    />
                  </div>

                  {/* API Runs Section */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <span>🚀</span>
                      API Runs
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Direct executions of this agent via the API.
                    </p>
                    <RunsList 
                      agentId={agent.id}
                      token={token}
                      onSelectRun={handleSelectRun}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'workflow' && agent.workflow && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="text-gray-600 dark:text-gray-400">
                Workflow view coming soon. Workflow ID: {typeof agent.workflow === 'object' ? JSON.stringify(agent.workflow) : agent.workflow}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



