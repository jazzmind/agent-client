'use client';

/**
 * Simple Workflows List Page
 * Uses the new workflow API endpoints
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  trigger: {
    type: string;
    config: any;
  };
  steps: any[];
  created_at: string;
  updated_at: string;
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: string;
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

const getStatusColor = (active: boolean) => {
  return active
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

const getExecutionStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'awaiting_human': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

export default function WorkflowsListPage() {
  const { isReady, refreshKey } = useAuth();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Record<string, WorkflowExecution[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  // Wait for auth to be ready before fetching data
  useEffect(() => {
    if (!isReady) {
      return;
    }
    loadWorkflows();
  }, [isReady, refreshKey]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workflows');
      if (!response.ok) throw new Error('Failed to load workflows');
      const data = await response.json();
      setWorkflows(data);

      // Load recent executions for each workflow
      const executionsData: Record<string, WorkflowExecution[]> = {};
      await Promise.all(
        data.map(async (workflow: Workflow) => {
          try {
            const execRes = await fetch(`/api/workflows/${workflow.id}/executions?limit=1`);
            if (execRes.ok) {
              const execs = await execRes.json();
              executionsData[workflow.id] = execs;
            }
          } catch (e) {
            console.error(`Failed to load executions for ${workflow.id}:`, e);
          }
        })
      );
      setExecutions(executionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (workflowId: string) => {
    if (executing) return;
    
    setExecuting(workflowId);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_data: {} }),
      });

      if (!response.ok) throw new Error('Failed to execute workflow');

      const execution = await response.json();
      alert(`Workflow executed! Execution ID: ${execution.id}\nStatus: ${execution.status}`);
      
      // Reload workflows to show updated execution
      await loadWorkflows();
    } catch (err) {
      alert(`Failed to execute workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExecuting(null);
    }
  };

  const handleDelete = async (workflowId: string, workflowName: string) => {
    if (!confirm(`Delete workflow "${workflowName}"?`)) return;

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete workflow');

      await loadWorkflows();
    } catch (err) {
      alert(`Failed to delete workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Workflows</h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={loadWorkflows}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Workflows</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and execute multi-step agent workflows
          </p>
        </div>
        <Link
          href="/workflows/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Create Workflow
        </Link>
      </div>

      {/* Empty State */}
      {workflows.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Workflows Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first workflow to automate multi-step agent tasks.
          </p>
          <Link
            href="/workflows/new"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create Your First Workflow
          </Link>
        </div>
      )}

      {/* Workflow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => {
          const lastExecution = executions[workflow.id]?.[0];

          return (
            <div
              key={workflow.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {workflow.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {workflow.description || 'No description'}
                </p>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(workflow.active)}`}>
                  {workflow.active ? 'Active' : 'Inactive'}
                </span>
                {workflow.trigger && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {getTriggerIcon(workflow.trigger.type)} {workflow.trigger.type}
                  </span>
                )}
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {workflow.steps?.length || 0} steps
                </span>
              </div>

              {/* Last Execution */}
              {lastExecution && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Last Execution:</p>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getExecutionStatusColor(lastExecution.status)}`}>
                      {lastExecution.status}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(lastExecution.started_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {lastExecution.usage_requests} requests • ${lastExecution.estimated_cost_dollars.toFixed(4)}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/workflows/${workflow.id}`}
                  className="flex-1 px-3 py-2 text-sm text-center bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  View
                </Link>
                {workflow.active && (
                  <button
                    onClick={() => handleExecute(workflow.id)}
                    disabled={executing === workflow.id}
                    className="flex-1 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                  >
                    {executing === workflow.id ? 'Running...' : 'Execute'}
                  </button>
                )}
                <Link
                  href={`/workflows/${workflow.id}/edit`}
                  className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(workflow.id, workflow.name)}
                  className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
