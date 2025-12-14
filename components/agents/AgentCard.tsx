/**
 * AgentCard Component
 * 
 * Card display for an agent in list view with:
 * - Agent name and description
 * - Status indicator (active/inactive)
 * - Model and tool count
 * - Quick actions (view, edit, test, delete)
 */

'use client';

import React from 'react';
import { Agent } from '@/lib/types';
import Link from 'next/link';

interface AgentCardProps {
  agent: Agent;
  onTest?: (agent: Agent) => void;
  onDelete?: (agent: Agent) => void;
  className?: string;
}

export function AgentCard({ agent, onTest, onDelete, className = '' }: AgentCardProps) {
  const toolCount = Object.keys(agent.tools || {}).length;
  const isPersonal = agent.is_personal;
  const isBuiltin = agent.is_builtin;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {agent.display_name || agent.name}
            </h3>
            
            {/* Status badge */}
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              agent.is_active 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {agent.is_active ? 'Active' : 'Inactive'}
            </span>

            {/* Type badges */}
            {isBuiltin && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                Built-in
              </span>
            )}
            {isPersonal && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                Personal
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-2">
            {agent.description || 'No description'}
          </p>

          {/* Metadata */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Model: {agent.model}</span>
            <span>Tools: {toolCount}</span>
            {agent.workflow && <span>Has Workflow</span>}
            <span>v{agent.version}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <Link
            href={`/agent/${agent.id}`}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="View details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>

          {!isBuiltin && (
            <Link
              href={`/agent/${agent.id}/edit`}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Edit agent"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
          )}

          {onTest && (
            <button
              onClick={() => onTest(agent)}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
              title="Test agent"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          {!isBuiltin && onDelete && (
            <button
              onClick={() => {
                if (confirm(`Delete agent "${agent.display_name || agent.name}"?`)) {
                  onDelete(agent);
                }
              }}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete agent"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Scopes */}
      {agent.scopes && agent.scopes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Required Scopes:</div>
          <div className="flex flex-wrap gap-1">
            {agent.scopes.map((scope) => (
              <span
                key={scope}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {scope}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
        <div>Created: {new Date(agent.created_at).toLocaleDateString()}</div>
        {agent.updated_at !== agent.created_at && (
          <div>Updated: {new Date(agent.updated_at).toLocaleDateString()}</div>
        )}
      </div>
    </div>
  );
}
