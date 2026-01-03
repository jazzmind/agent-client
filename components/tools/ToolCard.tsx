/**
 * ToolCard Component
 * 
 * Displays a single tool with its information and configuration status
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Tool } from '@/lib/types';

interface ToolCardProps {
  tool: Tool;
  onConfigure?: (tool: Tool) => void;
  className?: string;
}

export function ToolCard({ tool, onConfigure, className = '' }: ToolCardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {tool.name}
          </h3>
          {tool.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {tool.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
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
      <div className="space-y-2 mb-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">Entrypoint:</span> <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">{tool.entrypoint}</code>
        </div>
        {tool.scopes && tool.scopes.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">Scopes:</span>{' '}
            {tool.scopes.join(', ')}
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">Version:</span> {tool.version}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        {onConfigure && (
          <button
            onClick={() => onConfigure(tool)}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Configure
          </button>
        )}
        <Link
          href={`/tools/${tool.id}`}
          className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          View details →
        </Link>
      </div>
    </div>
  );
}
