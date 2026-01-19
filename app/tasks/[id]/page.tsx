'use client';

/**
 * Task Detail Page
 * Shows task details, execution history, and insights.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';

interface Task {
  id: string;
  name: string;
  description?: string;
  agent_id: string;
  prompt: string;
  trigger_type: string;
  trigger_config: {
    cron?: string;
    run_at?: string;
  };
  notification_config: {
    enabled?: boolean;
    channel?: string;
    recipient?: string;
    include_summary?: boolean;
  };
  insights_config: {
    enabled?: boolean;
    max_insights?: number;
    purge_after_days?: number;
  };
  delegation_scopes: string[];
  delegation_expires_at?: string;
  status: string;
  last_run_at?: string;
  last_run_id?: string;
  next_run_at?: string;
  run_count: number;
  error_count: number;
  last_error?: string;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
}

interface TaskExecution {
  id: string;
  task_id: string;
  run_id?: string;
  trigger_source: string;
  status: string;
  output_summary?: string;
  notification_sent: boolean;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  error?: string;
  created_at: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getTriggerIcon = (type: string) => {
  switch (type) {
    case 'cron': return '⏰';
    case 'webhook': return '🔗';
    case 'manual': return '👆';
    default: return '📅';
  }
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const { isReady } = useAuth();
  
  const [task, setTask] = useState<Task | null>(null);
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    loadTask();
    loadExecutions();
  }, [isReady, taskId]);

  const loadTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) throw new Error('Failed to load task');
      const data = await response.json();
      setTask(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/executions?limit=10`);
      if (!response.ok) return;
      const data = await response.json();
      setExecutions(data);
    } catch (err) {
      console.error('Failed to load executions:', err);
    }
  };

  const handlePause = async () => {
    setActionLoading('pause');
    try {
      const response = await fetch(`/api/tasks/${taskId}/pause`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to pause task');
      await loadTask();
    } catch (err) {
      alert(`Failed to pause task: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async () => {
    setActionLoading('resume');
    try {
      const response = await fetch(`/api/tasks/${taskId}/resume`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to resume task');
      await loadTask();
    } catch (err) {
      alert(`Failed to resume task: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRun = async () => {
    setActionLoading('run');
    try {
      const response = await fetch(`/api/tasks/${taskId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('Failed to run task');
      const result = await response.json();
      alert(`Task execution started! Execution ID: ${result.execution_id}`);
      await loadTask();
      await loadExecutions();
    } catch (err) {
      alert(`Failed to run task: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm(`Delete task "${task.name}"? This cannot be undone.`)) return;

    setActionLoading('delete');
    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete task');
      router.push('/tasks');
    } catch (err) {
      alert(`Failed to delete task: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error</h3>
          <p className="text-red-600 dark:text-red-300">{error || 'Task not found'}</p>
          <Link
            href="/tasks"
            className="mt-4 inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/tasks"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              ← Back to Tasks
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{task.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {task.description || 'No description'}
          </p>
        </div>
        <div className="flex gap-2">
          {task.status === 'active' ? (
            <>
              <button
                onClick={handleRun}
                disabled={!!actionLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === 'run' ? 'Running...' : 'Run Now'}
              </button>
              <button
                onClick={handlePause}
                disabled={!!actionLoading}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Pause
              </button>
            </>
          ) : task.status === 'paused' ? (
            <button
              onClick={handleResume}
              disabled={!!actionLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Resume
            </button>
          ) : null}
          <button
            onClick={handleDelete}
            disabled={!!actionLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex gap-2 mb-6">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          {getTriggerIcon(task.trigger_type)} {task.trigger_type}
        </span>
      </div>

      {/* Task Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Configuration */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Prompt</label>
              <p className="text-gray-900 dark:text-gray-100 mt-1 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                {task.prompt}
              </p>
            </div>

            {task.trigger_type === 'cron' && task.trigger_config.cron && (
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Schedule</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1 font-mono">
                  {task.trigger_config.cron}
                </p>
              </div>
            )}

            {task.next_run_at && (
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Next Run</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {new Date(task.next_run_at).toLocaleString()}
                </p>
              </div>
            )}

            {task.trigger_type === 'webhook' && task.webhook_url && (
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Webhook URL</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                    {task.webhook_url}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(task.webhook_url!)}
                    className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Notifications</h2>
          
          {task.notification_config?.enabled ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Channel</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1 capitalize">
                  {task.notification_config.channel}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Recipient</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {task.notification_config.recipient}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${task.notification_config.include_summary ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {task.notification_config.include_summary ? 'Includes summary' : 'No summary'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Notifications disabled</p>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Statistics</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Total Runs</label>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{task.run_count}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Errors</label>
              <p className={`text-2xl font-bold ${task.error_count > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {task.error_count}
              </p>
            </div>
            {task.last_run_at && (
              <div className="col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Last Run</label>
                <p className="text-gray-900 dark:text-gray-100">
                  {new Date(task.last_run_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {task.last_error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <label className="text-sm text-red-600 dark:text-red-400">Last Error</label>
              <p className="text-red-800 dark:text-red-200 text-sm mt-1">{task.last_error}</p>
            </div>
          )}
        </div>

        {/* Insights Config */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Task Memory</h2>
          
          {task.insights_config?.enabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Memory enabled</span>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Max Insights</label>
                <p className="text-gray-900 dark:text-gray-100">{task.insights_config.max_insights}</p>
              </div>
              {task.insights_config.purge_after_days && (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Auto-purge</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    After {task.insights_config.purge_after_days} days
                  </p>
                </div>
              )}
              <Link
                href={`/tasks/${task.id}/insights`}
                className="inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
              >
                View Task Insights →
              </Link>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Task memory disabled</p>
          )}
        </div>
      </div>

      {/* Recent Executions */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Executions</h2>
        
        {executions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No executions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">Time</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">Trigger</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">Duration</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">Notified</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((exec) => (
                  <tr key={exec.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 text-gray-900 dark:text-gray-100">
                      {new Date(exec.created_at).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className="text-gray-600 dark:text-gray-400">
                        {getTriggerIcon(exec.trigger_source)} {exec.trigger_source}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(exec.status)}`}>
                        {exec.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {exec.duration_seconds ? `${exec.duration_seconds.toFixed(1)}s` : '-'}
                    </td>
                    <td className="py-3">
                      {exec.notification_sent ? (
                        <span className="text-green-600 dark:text-green-400">✓</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        <p>Created: {new Date(task.created_at).toLocaleString()}</p>
        <p>Updated: {new Date(task.updated_at).toLocaleString()}</p>
        <p>ID: {task.id}</p>
      </div>
    </div>
  );
}
