'use client';

/**
 * Task Execution Output Page
 * 
 * Renders ONLY the output content with clean formatting.
 * - Removes JSON wrappers
 * - Renders markdown as HTML
 * - Minimal chrome for clean viewing/printing
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { formatDateTime } from '@/lib/date-utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TaskExecution {
  id: string;
  task_id: string;
  status: string;
  output_summary?: string;
  output_data?: Record<string, any>;
  completed_at?: string;
  created_at: string;
}

interface Task {
  id: string;
  name: string;
}

/**
 * Extract clean content from various output formats.
 * Handles JSON wrappers, markdown fences, and nested structures.
 */
function extractContent(output: string | undefined | null): string {
  if (!output) return '';
  
  let content = output.trim();
  
  // Try to parse if it looks like JSON
  if (content.startsWith('{') || content.startsWith('[')) {
    try {
      const parsed = JSON.parse(content);
      
      // Handle common wrapper patterns
      if (typeof parsed === 'object' && parsed !== null) {
        // Check for common output fields
        const possibleFields = ['result', 'summary', 'output', 'content', 'response', 'text', 'message', 'data'];
        for (const field of possibleFields) {
          if (parsed[field] !== undefined) {
            const value = parsed[field];
            if (typeof value === 'string') {
              content = value;
              break;
            } else if (typeof value === 'object') {
              // Recursively extract from nested object
              content = extractContent(JSON.stringify(value));
              break;
            }
          }
        }
      }
    } catch {
      // Not valid JSON, continue with original content
    }
  }
  
  // Strip markdown code fences if the entire content is wrapped in them
  content = content.trim();
  if (content.startsWith('```')) {
    const lines = content.split('\n');
    if (lines.length > 1) {
      // Remove first line (```language or ```)
      lines.shift();
      // Remove last line if it's just closing fence
      if (lines[lines.length - 1]?.trim() === '```') {
        lines.pop();
      }
      content = lines.join('\n');
    }
  }
  
  // Handle escaped newlines
  content = content.replace(/\\n/g, '\n');
  
  // Handle escaped quotes
  content = content.replace(/\\"/g, '"');
  
  return content.trim();
}

export default function ExecutionOutputPage() {
  const params = useParams();
  const router = useRouter();
  const { isReady } = useAuth();
  
  const taskId = params.id as string;
  const execId = params.execId as string;
  
  const [execution, setExecution] = useState<TaskExecution | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    loadData();
  }, [isReady, taskId, execId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch execution and task in parallel
      const [execResponse, taskResponse] = await Promise.all([
        fetch(`/api/tasks/${taskId}/executions/${execId}`),
        fetch(`/api/tasks/${taskId}`),
      ]);
      
      if (!execResponse.ok) {
        const errData = await execResponse.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to load execution');
      }
      
      const execData = await execResponse.json();
      setExecution(execData);
      
      if (taskResponse.ok) {
        const taskData = await taskResponse.json();
        setTask(taskData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load execution');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error</h3>
          <p className="text-red-600 dark:text-red-300">{error || 'Execution not found'}</p>
          <Link
            href={`/tasks/${taskId}`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to Task
          </Link>
        </div>
      </div>
    );
  }

  const outputContent = extractContent(execution.output_summary);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 print:py-4 print:px-0">
      {/* Minimal Header - hidden when printing */}
      <div className="mb-6 print:mb-4">
        <div className="flex items-center justify-between mb-3 print:hidden">
          <Link
            href={`/tasks/${taskId}/executions/${execId}`}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Full Details
          </Link>
          <button
            onClick={() => window.print()}
            className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
          >
            Print / Save PDF
          </button>
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {task?.name || 'Task Output'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {formatDateTime(execution.completed_at || execution.created_at)}
          {execution.status === 'succeeded' && (
            <span className="ml-2 text-green-600 dark:text-green-400">✓ Completed</span>
          )}
          {execution.status === 'failed' && (
            <span className="ml-2 text-red-600 dark:text-red-400">✗ Failed</span>
          )}
        </p>
      </div>

      {/* Output Content */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 print:border-0 print:p-0 print:shadow-none">
        {outputContent ? (
          <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:text-gray-100">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {outputContent}
            </ReactMarkdown>
          </article>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 italic">
              No output available for this execution.
            </p>
            {execution.status === 'failed' && (
              <Link
                href={`/tasks/${taskId}/executions/${execId}`}
                className="mt-4 inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                View error details →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Footer - hidden when printing */}
      <div className="mt-6 text-xs text-gray-400 dark:text-gray-500 print:hidden">
        Execution ID: {execution.id}
      </div>
    </div>
  );
}
