'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps?: any;
  stepGraph?: any[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function WorkflowDetailPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params.id;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/workflows/${workflowId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to load workflow (${res.status})`);
        setWorkflow(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load workflow');
      } finally {
        setLoading(false);
      }
    }
    if (workflowId) load();
  }, [workflowId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/workflows" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
          ← Back to Workflows
        </Link>
        {workflow && (
          <Link
            href={`/workflows/${workflow.id}/edit`}
            className="px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Edit
          </Link>
        )}
      </div>

      {loading && <div className="text-gray-600 dark:text-gray-400">Loading…</div>}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {workflow && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">{workflow.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="text-gray-700 dark:text-gray-300">
              <span className="text-gray-500 dark:text-gray-400">ID:</span> {workflow.id}
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              <span className="text-gray-500 dark:text-gray-400">Status:</span>{' '}
              {workflow.is_active !== false ? (
                <span className="text-green-600 dark:text-green-400">Active</span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">Inactive</span>
              )}
            </div>
            {workflow.created_at && (
              <div className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400">Created:</span>{' '}
                {new Date(workflow.created_at).toLocaleDateString()}
              </div>
            )}
            {workflow.updated_at && (
              <div className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400">Updated:</span>{' '}
                {new Date(workflow.updated_at).toLocaleDateString()}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Workflow Steps</h2>
            {workflow.stepGraph && Array.isArray(workflow.stepGraph) && workflow.stepGraph.length > 0 ? (
              <div className="space-y-4">
                {workflow.stepGraph.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{item.step?.id || `Step ${index + 1}`}</div>
                      {item.step?.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.step.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : workflow.steps && Object.keys(workflow.steps).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(workflow.steps).map(([stepId, step]: [string, any]) => (
                  <div
                    key={stepId}
                    className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">{stepId}</div>
                    {step.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{step.description}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No steps defined
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
