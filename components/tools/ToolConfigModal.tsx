/**
 * ToolConfigModal Component
 * 
 * Modal for configuring tool settings like API keys and provider activation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Tool } from '@/lib/types';

interface ToolConfig {
  providers?: {
    [key: string]: {
      enabled: boolean;
      api_key?: string;
      api_url?: string;
      [key: string]: any;
    };
  };
  settings?: {
    [key: string]: any;
  };
}

interface ToolConfigModalProps {
  tool: Tool | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (toolId: string, config: ToolConfig) => Promise<void>;
}

// Define provider configurations for different tool types
const PROVIDER_CONFIGS: Record<string, { name: string; requiresApiKey: boolean; fields: string[] }[]> = {
  web_search: [
    { name: 'duckduckgo', requiresApiKey: false, fields: [] },
    { name: 'tavily', requiresApiKey: true, fields: ['api_key'] },
    { name: 'perplexity', requiresApiKey: true, fields: ['api_key'] },
    { name: 'brave', requiresApiKey: true, fields: ['api_key'] },
  ],
};

export function ToolConfigModal({ tool, isOpen, onClose, onSave }: ToolConfigModalProps) {
  const [config, setConfig] = useState<ToolConfig>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load existing configuration when tool changes
  useEffect(() => {
    if (tool && isOpen) {
      loadConfig();
    }
  }, [tool?.id, isOpen]);

  async function loadConfig() {
    if (!tool) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/tools/${tool.id}/config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        // If no config exists, initialize with defaults
        const providers = getProvidersForTool(tool);
        const defaultConfig: ToolConfig = {
          providers: {},
        };
        
        providers.forEach(p => {
          if (defaultConfig.providers) {
            defaultConfig.providers[p.name] = {
              enabled: !p.requiresApiKey, // Enable free providers by default
            };
          }
        });
        
        setConfig(defaultConfig);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }

  function getProvidersForTool(tool: Tool) {
    // Check tool name to determine which providers to show
    if (tool.name.toLowerCase().includes('search') || tool.entrypoint.includes('web_search')) {
      return PROVIDER_CONFIGS.web_search || [];
    }
    return [];
  }

  async function handleSave() {
    if (!tool) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await onSave(tool.id, config);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  function updateProviderConfig(provider: string, field: string, value: any) {
    setConfig(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: {
          ...prev.providers?.[provider],
          [field]: value,
        },
      },
    }));
  }

  if (!isOpen || !tool) return null;

  const providers = getProvidersForTool(tool);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Configure {tool.name}
          </h2>
          {tool.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {tool.description}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : providers.length > 0 ? (
            <>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Search Providers
                </h3>
                <div className="space-y-4">
                  {providers.map(provider => {
                    const providerConfig = config.providers?.[provider.name] || { enabled: false };
                    
                    return (
                      <div
                        key={provider.name}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={providerConfig.enabled || false}
                              onChange={(e) => updateProviderConfig(provider.name, 'enabled', e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                              {provider.name}
                            </span>
                          </label>
                          {!provider.requiresApiKey && (
                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                              Free
                            </span>
                          )}
                        </div>
                        
                        {provider.requiresApiKey && providerConfig.enabled && (
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                              API Key
                            </label>
                            <input
                              type="password"
                              value={providerConfig.api_key || ''}
                              onChange={(e) => updateProviderConfig(provider.name, 'api_key', e.target.value)}
                              placeholder={`Enter ${provider.name} API key`}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> When multiple providers are enabled, the system will use them in priority order. 
                  Free providers (like DuckDuckGo) are tried first, followed by paid APIs.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No configurable options available for this tool.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          {providers.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              )}
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
