'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Agent } from '@/lib/types';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps?: any[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/workflows');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to load workflows (${res.status})`);
        
        // Handle both array and object responses
        let workflowsList: Workflow[] = [];
        if (Array.isArray(data)) {
          workflowsList = data;
        } else if (data && typeof data === 'object') {
          workflowsList = Object.entries(data).map(([key, value]: [string, any]) => ({
            id: key,
            name: key,
            description: value.description || value.name || '',
            steps: value.steps || [],
            is_active: value.is_active !== false,
            created_at: value.created_at || new Date().toISOString(),
            updated_at: value.updated_at,
          }));
        }
        setWorkflows(workflowsList);
      } catch (e: any) {
        setError(e?.message || 'Failed to load workflows');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete workflow');
      setWorkflows(workflows.filter(w => w.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Failed to delete workflow');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Workflows</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your workflow automations</p>
        </div>
        <Link
          href="/workflows/new"
          className="px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          Create Workflow
        </Link>
      </div>

      {loading && <div className="text-gray-600 dark:text-gray-400">Loading…</div>}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {workflows.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No workflows found</p>
              <Link
                href="/workflows/new"
                className="px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                Create Your First Workflow
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {workflow.name}
                      </h3>
                      {workflow.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {workflow.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>
                      {Array.isArray(workflow.steps) ? workflow.steps.length : Object.keys(workflow.steps || {}).length} steps
                    </span>
                    {workflow.is_active !== false && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/workflows/${workflow.id}`}
                      className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-center"
                    >
                      View
                    </Link>
                    <Link
                      href={`/workflows/${workflow.id}/edit`}
                      className="flex-1 px-3 py-2 text-sm rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-center"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      className="px-3 py-2 text-sm rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
