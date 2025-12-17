'use client';

/**
 * Workflow Execution Detail Page
 * Shows detailed execution progress, steps, usage metrics
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: string;
  trigger_source: string;
  input_data: any;
  step_outputs: any;
  usage_requests: number;
  usage_input_tokens: number;
  usage_output_tokens: number;
  usage_tool_calls: number;
  estimated_cost_dollars: number;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  error?: string;
}

interface StepExecution {
  id: string;
  step_id: string;
  status: string;
  output_data?: any;
  usage_requests: number;
  usage_input_tokens: number;
  usage_output_tokens: number;
  estimated_cost_dollars: number;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  error?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'awaiting_human': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return '✅';
    case 'running': return '🔄';
    case 'failed': return '❌';
    case 'pending': return '⏳';
    case 'awaiting_human': return '👤';
    default: return '❓';
  }
};

export default function ExecutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const executionId = params.id as string;

  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [steps, setSteps] = useState<StepExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExecution();
    loadSteps();

    // Poll for updates if execution is running
    const interval = setInterval(() => {
      if (execution?.status === 'running' || execution?.status === 'awaiting_human') {
        loadExecution();
        loadSteps();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [executionId, execution?.status]);

  const loadExecution = async () => {
    try {
      const response = await fetch(`/api/workflows/executions/${executionId}`);
      if (!response.ok) throw new Error('Failed to load execution');
      const data = await response.json();
      setExecution(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load execution');
    } finally {
      setLoading(false);
    }
  };

  const loadSteps = async () => {
    try {
      const response = await fetch(`/api/workflows/executions/${executionId}/steps`);
      if (!response.ok) throw new Error('Failed to load steps');
      const data = await response.json();
      setSteps(data);
    } catch (err) {
      console.error('Failed to load steps:', err);
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

  if (error || !execution) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Execution</h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/workflows"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← Back to Workflows
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Workflow Execution
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Execution ID: {execution.id}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(execution.status)}`}>
              {getStatusIcon(execution.status)} {execution.status}
            </span>
          </div>
        </div>
      </div>

      {/* Execution Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Trigger</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{execution.trigger_source}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Requests</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{execution.usage_requests}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tokens</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {(execution.usage_input_tokens + execution.usage_output_tokens).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {execution.usage_input_tokens.toLocaleString()} in • {execution.usage_output_tokens.toLocaleString()} out
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Cost</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${execution.estimated_cost_dollars.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Timing */}
      {execution.duration_seconds && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Timing</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Started</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {new Date(execution.started_at).toLocaleString()}
              </p>
            </div>
            {execution.completed_at && (
              <>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(execution.completed_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {execution.duration_seconds.toFixed(2)}s
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {execution.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Execution Error</h3>
          <pre className="text-sm text-red-600 dark:text-red-300 whitespace-pre-wrap">
            {execution.error}
          </pre>
        </div>
      )}

      {/* Step Executions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Step Executions ({steps.length})
        </h2>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">
                      {index + 1}.
                    </span>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      {step.step_id}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(step.status)}`}>
                      {getStatusIcon(step.status)} {step.status}
                    </span>
                  </div>
                </div>
                {step.duration_seconds && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {step.duration_seconds.toFixed(2)}s
                  </span>
                )}
              </div>

              {/* Step Metrics */}
              <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Requests</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{step.usage_requests}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Tokens</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {(step.usage_input_tokens + step.usage_output_tokens).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Cost</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    ${step.estimated_cost_dollars.toFixed(4)}
                  </p>
                </div>
              </div>

              {/* Step Output */}
              {step.output_data && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    View Output
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                    {JSON.stringify(step.output_data, null, 2)}
                  </pre>
                </details>
              )}

              {/* Step Error */}
              {step.error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  <p className="text-sm text-red-600 dark:text-red-300">{step.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
