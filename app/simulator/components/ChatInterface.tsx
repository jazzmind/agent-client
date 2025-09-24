'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: {
    agentId?: string;
    processingTime?: number;
    error?: boolean;
  };
}

interface Agent {
  id: string;
  name: string;
  displayName: string;
  description: string;
  scopes: string[];
}

interface ClientSession {
  clientId: string;
  clientSecret: string;
  isAuthenticated: boolean;
  accessToken?: string;
  scopes?: string[];
  selectedAgent?: string;
}

interface ChatInterfaceProps {
  session: ClientSession;
  agents: Agent[];
  onBackToAgents: () => void;
}

export default function ChatInterface({ session, agents, onBackToAgents }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedAgent = agents.find(agent => agent.id === session.selectedAgent);

  useEffect(() => {
    setIsMounted(true);
    // Add welcome message from the selected agent
    if (selectedAgent) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Hello! I'm ${selectedAgent.displayName}. ${selectedAgent.description} How can I help you today?`,
        role: 'assistant',
        timestamp: new Date(),
        metadata: { agentId: selectedAgent.id }
      };
      setMessages([welcomeMessage]);
    }
  }, [selectedAgent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !selectedAgent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const startTime = Date.now();

    try {
      const response = await fetch('/api/simulator/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          messages: [{ role: 'user', content: input.trim() }],
        }),
      });

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.text || 'Sorry, I couldn\'t process that request.',
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          agentId: selectedAgent.id,
          processingTime,
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, there was an error processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          agentId: selectedAgent?.id,
          error: true,
          processingTime: Date.now() - startTime
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (selectedAgent) {
      const welcomeMessage: Message = {
        id: 'welcome-' + Date.now(),
        content: `Hello! I'm ${selectedAgent.displayName}. ${selectedAgent.description} How can I help you today?`,
        role: 'assistant',
        timestamp: new Date(),
        metadata: { agentId: selectedAgent.id }
      };
      setMessages([welcomeMessage]);
    }
  };

  if (!selectedAgent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No agent selected</p>
        <button
          onClick={onBackToAgents}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Select Agent
        </button>
      </div>
    );
  }

  const suggestions = [
    'What can you help me with?',
    'Tell me about your capabilities',
    'How do you work?',
    'Show me an example'
  ];

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToAgents}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🤖</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{selectedAgent.displayName}</h2>
              <p className="text-sm text-gray-500">{selectedAgent.name}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Clear Chat
          </button>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Connected</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  : message.metadata?.error
                  ? 'bg-red-50 text-red-900 border border-red-200'
                  : 'bg-gray-50 text-gray-900 border border-gray-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span
                  className={`${
                    message.role === 'user'
                      ? 'text-blue-100'
                      : message.metadata?.error
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}
                >
                  {isMounted ? message.timestamp.toLocaleTimeString() : ''}
                </span>
                {message.metadata?.processingTime && (
                  <span
                    className={`ml-2 ${
                      message.role === 'user'
                        ? 'text-blue-100'
                        : message.metadata?.error
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {message.metadata.processingTime}ms
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 text-gray-900 border border-gray-200 rounded-lg px-4 py-3 max-w-[75%]">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
                <span className="text-gray-500">{selectedAgent.displayName} is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200/50 px-6 py-4">
        <form onSubmit={sendMessage} className="space-y-3">
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${selectedAgent.displayName} anything...`}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              <span>{isLoading ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
          
          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => !isLoading && setInput(suggestion)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                  disabled={isLoading}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
