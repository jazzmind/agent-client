'use client';

import { useState, useEffect } from 'react';
import ClientAuth from './components/ClientAuth';
import AgentSelector from './components/AgentSelector';
import ChatInterface from './components/ChatInterface';
import SessionInfo from './components/SessionInfo';

interface ClientSession {
  clientId: string;
  clientSecret: string;
  isAuthenticated: boolean;
  accessToken?: string;
  scopes?: string[];
  selectedAgent?: string;
}

interface Agent {
  id: string;
  name: string;
  displayName: string;
  description: string;
  scopes: string[];
}

export default function ClientSimulator() {
  const [session, setSession] = useState<ClientSession>({
    clientId: '',
    clientSecret: '',
    isAuthenticated: false
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthenticate = async (clientId: string, clientSecret: string) => {
    setLoading(true);
    setError(null);

    try {
      // Test authentication by trying to get a token
      const response = await fetch('/api/simulator/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          clientSecret,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Fetch available agents for this client
      const agentsResponse = await fetch('/api/simulator/agents', {
        headers: {
          'Authorization': `Bearer ${data.accessToken}`,
        },
      });

      const agentsData = await agentsResponse.json();

      if (!agentsResponse.ok) {
        throw new Error(agentsData.error || 'Failed to fetch agents');
      }

      setSession({
        clientId,
        clientSecret,
        isAuthenticated: true,
        accessToken: data.accessToken,
        scopes: data.scopes || []
      });

      setAgents(agentsData.agents || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgent = (agentId: string) => {
    setSession(prev => ({
      ...prev,
      selectedAgent: agentId
    }));
  };

  const handleDisconnect = () => {
    setSession({
      clientId: '',
      clientSecret: '',
      isAuthenticated: false
    });
    setAgents([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <span className="text-3xl">🎭</span>
                <span>Client Simulator</span>
              </h1>
              <p className="text-gray-600 mt-1">Test your agents by connecting as a client</p>
            </div>
            <div className="flex items-center space-x-4">
              {session.isAuthenticated && (
                <SessionInfo session={session} onDisconnect={handleDisconnect} />
              )}
              <a
                href="/admin"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Admin Panel
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {!session.isAuthenticated ? (
          <ClientAuth
            onAuthenticate={handleAuthenticate}
            loading={loading}
          />
        ) : !session.selectedAgent ? (
          <AgentSelector
            agents={agents}
            onSelectAgent={handleSelectAgent}
            session={session}
          />
        ) : (
          <ChatInterface
            session={session}
            agents={agents}
            onBackToAgents={() => handleSelectAgent('')}
          />
        )}
      </div>
    </div>
  );
}
