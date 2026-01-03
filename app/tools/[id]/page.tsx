/**
 * Tool Detail Page
 * 
 * View detailed information about a specific tool
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tool } from '@/lib/types';

export default function ToolDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTool();
  }, [params.id]);

  async function loadTool() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tools');
      if (!res.ok) {
        throw new Error('Failed to load tools');
      }
      const tools = await res.json();
      const foundTool = tools.find((t: Tool) => t.id === params.id);
      
      if (!foundTool) {
        throw new Error('Tool not found');
      }
      
      setTool(foundTool);
    } catch (e: any) {
      console.error('[ToolDetail] Failed to load tool:', e);
      setError(e?.message || 'Failed to load tool');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          <div className="font-medium">Error</div>
          <div className="text-sm mt-1">{error || 'Tool not found'}</div>
        </div>
        <button
          onClick={() => router.push('/tools')}
          className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          ← Back to tools
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/tools')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-2"
          >
            ← Back to tools
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{tool.name}</h1>
          {tool.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {tool.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {tool.is_builtin && (
            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              Built-in
            </span>
          )}
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              tool.is_active
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {tool.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tool ID</h2>
          <p className="text-gray-900 dark:text-gray-100 font-mono text-sm">{tool.id}</p>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Entrypoint</h2>
          <code className="text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-sm">
            {tool.entrypoint}
          </code>
        </div>

        {tool.scopes && tool.scopes.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Scopes</h2>
            <div className="flex flex-wrap gap-2">
              {tool.scopes.map((scope) => (
                <span
                  key={scope}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  {scope}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Version</h2>
            <p className="text-gray-900 dark:text-gray-100">{tool.version}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created</h2>
            <p className="text-gray-900 dark:text-gray-100">
              {new Date(tool.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Schema */}
      {tool.schema && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Schema</h2>
          
          {/* Input Schema */}
          {tool.schema.input && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Input</h3>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(tool.schema.input, null, 2)}
              </pre>
            </div>
          )}

          {/* Output Schema */}
          {tool.schema.output && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output</h3>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(tool.schema.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
