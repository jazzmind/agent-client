/**
 * ChatSettings Component
 * 
 * Advanced chat configuration panel with:
 * - Tool selection (enable/disable specific tools)
 * - Agent selection (enable/disable specific agents)
 * - Model selection
 * - Temperature and max tokens
 * - Save/load settings
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ChatSettings as ChatSettingsType } from '@/lib/types';

interface ChatSettingsProps {
  settings: ChatSettingsType;
  availableTools: Array<{ id: string; name: string; description?: string }>;
  availableAgents: Array<{ id: string; name: string; display_name?: string }>;
  availableModels: Array<{ id: string; name: string; provider: string }>;
  onSave: (settings: ChatSettingsType) => void | Promise<void>;
  onClose?: () => void;
  className?: string;
}

export function ChatSettings({
  settings,
  availableTools,
  availableAgents,
  availableModels,
  onSave,
  onClose,
  className = '',
}: ChatSettingsProps) {
  const [localSettings, setLocalSettings] = useState<ChatSettingsType>(settings);
  const [isSaving, setIsSaving] = useState(false);

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localSettings);
      onClose?.();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTool = (toolId: string) => {
    setLocalSettings(prev => ({
      ...prev,
      enabled_tools: prev.enabled_tools.includes(toolId)
        ? prev.enabled_tools.filter(id => id !== toolId)
        : [...prev.enabled_tools, toolId],
    }));
  };

  const toggleAgent = (agentId: string) => {
    setLocalSettings(prev => ({
      ...prev,
      enabled_agents: prev.enabled_agents.includes(agentId)
        ? prev.enabled_agents.filter(id => id !== agentId)
        : [...prev.enabled_agents, agentId],
    }));
  };

  const selectAllTools = () => {
    setLocalSettings(prev => ({
      ...prev,
      enabled_tools: availableTools.map(t => t.id),
    }));
  };

  const deselectAllTools = () => {
    setLocalSettings(prev => ({
      ...prev,
      enabled_tools: [],
    }));
  };

  const selectAllAgents = () => {
    setLocalSettings(prev => ({
      ...prev,
      enabled_agents: availableAgents.map(a => a.id),
    }));
  };

  const deselectAllAgents = () => {
    setLocalSettings(prev => ({
      ...prev,
      enabled_agents: [],
    }));
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Chat Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model
          </label>
          <select
            value={localSettings.model || ''}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, model: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Default</option>
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>

        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperature: {localSettings.temperature?.toFixed(2) || '0.70'}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={localSettings.temperature || 0.7}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Precise</span>
            <span>Balanced</span>
            <span>Creative</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Tokens
          </label>
          <input
            type="number"
            min="100"
            max="4000"
            step="100"
            value={localSettings.max_tokens || 2000}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tools */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Enabled Tools ({localSettings.enabled_tools.length}/{availableTools.length})
            </label>
            <div className="space-x-2">
              <button
                onClick={selectAllTools}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Select All
              </button>
              <button
                onClick={deselectAllTools}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {availableTools.map((tool) => (
              <label key={tool.id} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={localSettings.enabled_tools.includes(tool.id)}
                  onChange={() => toggleTool(tool.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                  {tool.description && (
                    <div className="text-xs text-gray-500">{tool.description}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Agents */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Enabled Agents ({localSettings.enabled_agents.length}/{availableAgents.length})
            </label>
            <div className="space-x-2">
              <button
                onClick={selectAllAgents}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Select All
              </button>
              <button
                onClick={deselectAllAgents}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {availableAgents.map((agent) => (
              <label key={agent.id} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={localSettings.enabled_agents.includes(agent.id)}
                  onChange={() => toggleAgent(agent.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {agent.display_name || agent.name}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
            disabled={isSaving}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
