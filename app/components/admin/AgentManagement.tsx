'use client';

import { useState, useEffect } from 'react';
import { MODELS } from '@/lib/models';
import { listAgents, deleteAgent, updateAgent } from '../../../lib/admin-client';

interface Agent {
  id: string;
  name: string;
  display_name?: string;
  description?: string;
  model: string;
  instructions: string;
  tools: string[];
  scopes: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export default function AgentManagement() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  // Check for component parameter in URL to auto-select agent
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const componentId = urlParams.get('component');
    if (componentId && agents.length > 0) {
      const agent = agents.find(a => a.id === componentId || a.name === componentId);
      if (agent) {
        setSelectedAgent(agent);
        // Clear the URL parameter
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [agents]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await listAgents();
      console.log('Agents data received:', data);
      // The data is coming back as an object with agent properties, not an array
      if (data && typeof data === 'object') {
        const agentsList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          name: key,
          display_name: value.name || key,
          description: value.instructions?.substring(0, 200) + '...' || 'No description available',
          model: value.modelId || value.model || 'unknown',
          instructions: value.instructions || '',
          tools: Object.keys(value.tools || {}),
          scopes: [], // This would need to come from somewhere else
          is_active: true, // Default to active
          created_at: new Date().toISOString(), // Default to now
          updated_at: new Date().toISOString()
        }));
        setAgents(agentsList);
      } else {
        setAgents([]);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      await deleteAgent(agentId);
      await loadAgents(); // Reload the list
    } catch (err) {
      console.error('Failed to delete agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    }
  };

  const handleSaveAgent = async () => {
    if (!selectedAgent) return;
    
    try {
      await updateAgent(selectedAgent.id, {
        name: selectedAgent.name,
        displayName: selectedAgent.display_name,
        instructions: selectedAgent.instructions,
        model: selectedAgent.model,
        tools: selectedAgent.tools,
        scopes: selectedAgent.scopes,
        isActive: selectedAgent.is_active
      });
      setIsEditing(false);
      await loadAgents(); // Reload the list
    } catch (err) {
      console.error('Failed to update agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to update agent');
    }
  };

  const AgentCard = ({ agent }: { agent: Agent }) => (
    <div
      onClick={() => setSelectedAgent(agent)}
      className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200/50 group hover:scale-[1.02]"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {agent.display_name || agent.name}
            </h3>
            <p className="text-sm text-gray-500">{agent.model}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteAgent(agent.id);
          }}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      {agent.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{agent.description}</p>
      )}
      
      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
        <span>{agent.tools?.length || 0} tools</span>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          agent.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {agent.is_active ? 'Active' : 'Inactive'}
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        <span>Created {new Date(agent.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );

  const AgentEditor = () => {
    if (!selectedAgent) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedAgent(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedAgent.display_name || selectedAgent.name}
                </h2>
                <p className="text-sm text-gray-500">Agent Configuration</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={isEditing ? handleSaveAgent : () => setIsEditing(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isEditing 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isEditing ? 'Save Changes' : 'Edit Agent'}
              </button>
              <button 
                onClick={() => handleDeleteAgent(selectedAgent.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
          <div className="p-6 border-b border-gray-200/50">
            <h3 className="text-lg font-semibold text-gray-900">Agent Configuration</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
                <input
                  type="text"
                  value={selectedAgent.name}
                  onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, name: e.target.value } : null)}
                  disabled={!isEditing}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <input
                  type="text"
                  value={selectedAgent.display_name || ''}
                  onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, display_name: e.target.value } : null)}
                  disabled={!isEditing}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <select
                  value={selectedAgent.model}
                  onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, model: e.target.value } : null)}
                  disabled={!isEditing}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value={MODELS.default.model}>Default ({MODELS.default.model})</option>
                  <option value={MODELS.fast.model}>Fast ({MODELS.fast.model})</option>
                  <option value={MODELS.best.model}>Best ({MODELS.best.model})</option>
                  <option value={MODELS.smartest.model}>Smartest ({MODELS.smartest.model})</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex items-center space-x-3 pt-2">
                  <input
                    type="checkbox"
                    checked={selectedAgent.is_active}
                    onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, is_active: e.target.checked } : null)}
                    disabled={!isEditing}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Active Agent</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={selectedAgent.description || ''}
                onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, description: e.target.value } : null)}
                disabled={!isEditing}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Brief description of what this agent does..."
              />
            </div>

            {/* System Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">System Instructions</label>
              <textarea
                value={selectedAgent.instructions}
                onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, instructions: e.target.value } : null)}
                disabled={!isEditing}
                rows={12}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-50 disabled:text-gray-500 font-mono text-sm"
                placeholder="Enter detailed system instructions for the agent..."
              />
            </div>

            {/* Tools */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Tools</label>
              <div className="min-h-[2.5rem] p-3 border border-gray-200 rounded-lg bg-gray-50">
                {selectedAgent.tools && selectedAgent.tools.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.tools.map((tool, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {tool}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">No tools assigned</span>
                )}
              </div>
            </div>

            {/* Scopes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permission Scopes</label>
              <div className="min-h-[2.5rem] p-3 border border-gray-200 rounded-lg bg-gray-50">
                {selectedAgent.scopes && selectedAgent.scopes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.scopes.map((scope, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.5-4.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        {scope}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">No scopes assigned</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (selectedAgent) {
    return <AgentEditor />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
            <p className="text-gray-600">Manage your intelligent agents and their configurations</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button 
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors text-sm"
            onClick={loadAgents}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-gray-600">Manage your intelligent agents and their configurations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create Agent</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{agents.filter(a => a.is_active).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">{agents.filter(a => !a.is_active).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tools</p>
              <p className="text-2xl font-bold text-gray-900">{agents.reduce((sum, agent) => sum + (agent.tools?.length || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/80 rounded-xl p-6 shadow-lg animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first agent</p>
          <button 
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            onClick={() => setShowCreateModal(true)}
          >
            Create Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}