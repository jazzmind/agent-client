/**
 * ChatMessage Component
 * 
 * Displays a single chat message with:
 * - User/assistant/system role styling
 * - Markdown rendering
 * - File attachments
 * - Routing decisions (for dispatcher)
 * - Tool calls
 * - Timestamps
 */

'use client';

import React from 'react';
import { Message, RoutingDecision, ToolCall, Attachment } from '@/lib/types';

interface ChatMessageProps {
  message: Message;
  showRoutingDecision?: boolean;
  showToolCalls?: boolean;
  className?: string;
}

export function ChatMessage({ 
  message, 
  showRoutingDecision = true,
  showToolCalls = true,
  className = '' 
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${className}`}
      data-message-id={message.id}
    >
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white'
              : isSystem
              ? 'bg-gray-200 text-gray-800 italic'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {/* Role indicator for non-user messages */}
          {!isUser && (
            <div className="text-xs font-semibold mb-1 opacity-70">
              {message.role === 'assistant' ? 'Assistant' : 'System'}
            </div>
          )}
          
          {/* Message content */}
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment) => (
                <AttachmentDisplay key={attachment.id} attachment={attachment} />
              ))}
            </div>
          )}
          
          {/* Timestamp */}
          <div className={`text-xs mt-2 ${isUser ? 'text-blue-200' : 'text-gray-500'}`}>
            {new Date(message.created_at).toLocaleTimeString()}
          </div>
        </div>
        
        {/* Routing decision (for dispatcher) */}
        {showRoutingDecision && message.routing_decision && (
          <RoutingDecisionDisplay decision={message.routing_decision} />
        )}
        
        {/* Tool calls */}
        {showToolCalls && message.tool_calls && message.tool_calls.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.tool_calls.map((toolCall) => (
              <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Attachment Display Component
 */
function AttachmentDisplay({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.type.startsWith('image/');
  
  return (
    <div className="flex items-center space-x-2 text-sm bg-white bg-opacity-20 rounded px-2 py-1">
      <span className="text-xs">📎</span>
      <a 
        href={attachment.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="hover:underline truncate"
      >
        {attachment.name}
      </a>
      <span className="text-xs opacity-70">
        ({formatFileSize(attachment.size)})
      </span>
    </div>
  );
}

/**
 * Routing Decision Display Component
 */
function RoutingDecisionDisplay({ decision }: { decision: RoutingDecision }) {
  const confidenceColor = 
    decision.confidence >= 0.8 ? 'text-green-600' :
    decision.confidence >= 0.5 ? 'text-yellow-600' :
    'text-red-600';
  
  return (
    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
      <div className="font-semibold text-blue-900 mb-2">
        🎯 Routing Decision
        {decision.user_override && (
          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
            User Override
          </span>
        )}
      </div>
      
      <div className="space-y-1 text-gray-700">
        {decision.selected_tools.length > 0 && (
          <div>
            <span className="font-medium">Tools:</span> {decision.selected_tools.join(', ')}
          </div>
        )}
        
        {decision.selected_agents.length > 0 && (
          <div>
            <span className="font-medium">Agents:</span> {decision.selected_agents.join(', ')}
          </div>
        )}
        
        <div>
          <span className="font-medium">Confidence:</span>{' '}
          <span className={confidenceColor}>
            {(decision.confidence * 100).toFixed(0)}%
          </span>
        </div>
        
        {decision.reasoning && (
          <div className="mt-2 text-xs italic text-gray-600">
            {decision.reasoning}
          </div>
        )}
        
        {decision.alternatives.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs cursor-pointer text-blue-600 hover:text-blue-800">
              View alternatives
            </summary>
            <div className="mt-1 text-xs text-gray-600">
              {decision.alternatives.join(', ')}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Tool Call Display Component
 */
function ToolCallDisplay({ toolCall }: { toolCall: ToolCall }) {
  const statusColors = {
    pending: 'bg-gray-100 text-gray-700',
    running: 'bg-blue-100 text-blue-700',
    succeeded: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };
  
  const statusIcons = {
    pending: '⏳',
    running: '⚙️',
    succeeded: '✅',
    failed: '❌',
  };
  
  return (
    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-gray-900">
          🔧 {toolCall.tool_name}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${statusColors[toolCall.status]}`}>
          {statusIcons[toolCall.status]} {toolCall.status}
        </span>
      </div>
      
      {toolCall.status === 'failed' && toolCall.error && (
        <div className="text-xs text-red-600 mb-2">
          Error: {toolCall.error}
        </div>
      )}
      
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
          View details
        </summary>
        <div className="mt-2 space-y-2">
          <div>
            <div className="font-medium text-gray-700">Input:</div>
            <pre className="mt-1 p-2 bg-white rounded overflow-x-auto">
              {JSON.stringify(toolCall.input, null, 2)}
            </pre>
          </div>
          
          {toolCall.output && (
            <div>
              <div className="font-medium text-gray-700">Output:</div>
              <pre className="mt-1 p-2 bg-white rounded overflow-x-auto">
                {JSON.stringify(toolCall.output, null, 2)}
              </pre>
            </div>
          )}
          
          {toolCall.started_at && (
            <div className="text-gray-600">
              Started: {new Date(toolCall.started_at).toLocaleString()}
            </div>
          )}
          
          {toolCall.completed_at && (
            <div className="text-gray-600">
              Completed: {new Date(toolCall.completed_at).toLocaleString()}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
