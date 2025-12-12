/**
 * ChatWindow Component
 * 
 * Main chat interface that combines all chat components:
 * - Message list
 * - Input area
 * - Settings panel
 * - Header with controls
 */

'use client';

import React, { useState } from 'react';
import { Message, ChatSettings as ChatSettingsType } from '@/lib/types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatSettings } from './ChatSettings';

interface ChatWindowProps {
  conversationId?: string;
  messages: Message[];
  settings: ChatSettingsType;
  availableTools: Array<{ id: string; name: string; description?: string }>;
  availableAgents: Array<{ id: string; name: string; display_name?: string }>;
  availableModels: Array<{ id: string; name: string; provider: string }>;
  onSendMessage: (message: string, attachments: File[]) => void | Promise<void>;
  onUpdateSettings: (settings: ChatSettingsType) => void | Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function ChatWindow({
  conversationId,
  messages,
  settings,
  availableTools,
  availableAgents,
  availableModels,
  onSendMessage,
  onUpdateSettings,
  isLoading = false,
  className = '',
}: ChatWindowProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showRoutingDecisions, setShowRoutingDecisions] = useState(true);
  const [showToolCalls, setShowToolCalls] = useState(true);

  const handleSaveSettings = async (newSettings: ChatSettingsType) => {
    await onUpdateSettings(newSettings);
    setShowSettings(false);
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
            {conversationId && (
              <p className="text-xs text-gray-500">ID: {conversationId}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* View options */}
            <div className="flex items-center space-x-2 mr-4">
              <label className="flex items-center space-x-1 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRoutingDecisions}
                  onChange={(e) => setShowRoutingDecisions(e.target.checked)}
                  className="rounded"
                />
                <span>Routing</span>
              </label>
              
              <label className="flex items-center space-x-1 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showToolCalls}
                  onChange={(e) => setShowToolCalls(e.target.checked)}
                  className="rounded"
                />
                <span>Tools</span>
              </label>
            </div>

            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Chat settings"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* New conversation button */}
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="New conversation"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Active settings summary */}
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {settings.model && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
              Model: {settings.model}
            </span>
          )}
          {settings.enabled_tools.length > 0 && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
              {settings.enabled_tools.length} tools
            </span>
          )}
          {settings.enabled_agents.length > 0 && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
              {settings.enabled_agents.length} agents
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        showRoutingDecisions={showRoutingDecisions}
        showToolCalls={showToolCalls}
      />

      {/* Input */}
      <ChatInput
        onSend={onSendMessage}
        disabled={isLoading}
      />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ChatSettings
            settings={settings}
            availableTools={availableTools}
            availableAgents={availableAgents}
            availableModels={availableModels}
            onSave={handleSaveSettings}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}
    </div>
  );
}
