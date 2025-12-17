'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { WorkflowEditor } from '@/components/workflow';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: any[];
  trigger?: { type: string; config: any };
  guardrails?: any;
  active?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Execution {
  id: string;
  status: string;
  trigger_source: string;
  started_at: string;
  completed_at?: string;
  usage_requests: number;
  estimated_cost_dollars: number;
}

const getTriggerIcon = (type: string) => {
  switch (type) {
    case 'manual': return '👆';
    case 'cron': return '⏰';
    case 'webhook': return '🔗';
    case 'event': return '📡';
    default: return '❓';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'awaiting_human': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

export default function WorkflowDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const workflowId = params.id;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'visual' | 'executions'>('overview');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Load workflow
        const res = await fetch(`/api/workflows/${workflowId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to load workflow (${res.status})`);
        setWorkflow(data);

        // Load executions
        const execRes = await fetch(`/api/workflows/${workflowId}/executions?limit=10`);
        if (execRes.ok) {
          const execData = await execRes.json();
          setExecutions(execData);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load workflow');
      } finally {
        setLoading(false);
      }
    }
    if (workflowId) load();
  }, [workflowId]);

  const handleExecute = async () => {
    if (executing || !workflow) return;
    setExecuting(true);

    try {
      const res = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_data: {} }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to execute');

      // Navigate to execution detail
      router.push(`/workflows/executions/${data.id}`);
    } catch (e: any) {
      alert(`Execution failed: ${e.message}`);
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error</h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <Link
            href="/workflows"
            className="mt-4 inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Back to Workflows
          </Link>
        </div>
      </div>
    );
  }

  const isActive = workflow.active ?? workflow.is_active ?? true;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/workflows" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
          ← Back to Workflows
        </Link>
        <div className="flex items-center gap-3">
          {isActive && (
            <button
              onClick={handleExecute}
              disabled={executing}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {executing ? 'Executing...' : '▶ Execute'}
            </button>
          )}
          <Link
            href={`/workflows/${workflow.id}/edit`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            ✏️ Edit
          </Link>
        </div>
      </div>

      {/* Title Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">{workflow.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
              {isActive ? '● Active' : '○ Inactive'}
            </span>
            {workflow.trigger && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {getTriggerIcon(workflow.trigger.type)} {workflow.trigger.type}
              </span>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">ID</span>
            <p className="font-mono text-gray-900 dark:text-gray-100 truncate">{workflow.id}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Steps</span>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{workflow.steps?.length || 0}</p>
          </div>
          {workflow.created_at && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Created</span>
              <p className="text-gray-900 dark:text-gray-100">{new Date(workflow.created_at).toLocaleDateString()}</p>
            </div>
          )}
          {workflow.updated_at && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Updated</span>
              <p className="text-gray-900 dark:text-gray-100">{new Date(workflow.updated_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* Guardrails */}
        {workflow.guardrails && Object.keys(workflow.guardrails).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🛡️ Guardrails</h3>
            <div className="flex flex-wrap gap-2">
              {workflow.guardrails.request_limit && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                  Max {workflow.guardrails.request_limit} requests
                </span>
              )}
              {workflow.guardrails.total_tokens_limit && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                  Max {workflow.guardrails.total_tokens_limit.toLocaleString()} tokens
                </span>
              )}
              {workflow.guardrails.timeout_seconds && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                  {workflow.guardrails.timeout_seconds}s timeout
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            📋 Overview
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'visual'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            🎨 Visual Flow
          </button>
          <button
            onClick={() => setActiveTab('executions')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'executions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            📊 Executions ({executions.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Workflow Steps</h2>
          {workflow.steps && workflow.steps.length > 0 ? (
            <div className="space-y-3">
              {workflow.steps.map((step: any, index: number) => (
                <div
                  key={step.id || index}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-medium"
                    style={{
                      backgroundColor: {
                        agent: '#3b82f6',
                        tool: '#f97316',
                        condition: '#a855f7',
                        human: '#22c55e',
                        parallel: '#eab308',
                        loop: '#ec4899',
                      }[step.type] || '#6b7280'
                    }}
                  >
                    {step.type === 'agent' && '🤖'}
                    {step.type === 'tool' && '🔧'}
                    {step.type === 'condition' && '🔀'}
                    {step.type === 'human' && '👤'}
                    {step.type === 'parallel' && '⚡'}
                    {step.type === 'loop' && '🔁'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {step.name || step.id}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">
                        {step.type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {step.type === 'agent' && (step.agent_id || 'Agent not configured')}
                      {step.type === 'tool' && (step.tool || 'Tool not configured')}
                      {step.type === 'condition' && step.condition && `${step.condition.field} ${step.condition.operator} ${step.condition.value}`}
                      {step.type === 'human' && (step.human_config?.notification || 'Awaits approval')}
                      {step.type === 'loop' && (step.loop_config?.items_path || 'Loop configuration')}
                    </div>
                  </div>
                  {step.next_step && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      → {step.next_step}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No steps defined yet.</p>
              <Link
                href={`/workflows/${workflow.id}/edit`}
                className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Add Steps in Visual Editor
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'visual' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <WorkflowEditor
            workflow={workflow}
            readOnly={true}
          />
        </div>
      )}

      {activeTab === 'executions' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          {executions.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {executions.map((exec) => (
                <Link
                  key={exec.id}
                  href={`/workflows/executions/${exec.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(exec.status)}`}>
                      {exec.status}
                    </span>
                    <div>
                      <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{exec.id.slice(0, 8)}...</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {exec.trigger_source} • {new Date(exec.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-900 dark:text-gray-100">{exec.usage_requests} requests</p>
                    <p className="text-gray-500 dark:text-gray-400">${exec.estimated_cost_dollars.toFixed(4)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-4xl mb-4">📭</p>
              <p>No executions yet.</p>
              {isActive && (
                <button
                  onClick={handleExecute}
                  disabled={executing}
                  className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                >
                  Execute Now
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
