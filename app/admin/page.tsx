'use client';

import { useState, useEffect, useMemo } from 'react';
import ClientManagement from '../../components/admin/ClientManagement';
import AgentManagement from '../../components/admin/AgentManagement';
import WorkflowManagement from '../../components/admin/WorkflowManagement';
import ToolManagement from '../../components/admin/ToolManagement';
import RAGManagement from '../../components/admin/RAGManagement';
import ApplicationManagement from '../../components/admin/ApplicationManagement';
import ScorerManagement from '../../components/admin/ScorerManagement';
import Dashboard from '../../components/admin/Dashboard';
import { getAdminHeaders } from '@/lib/admin-auth';
import { withBasePath } from '@/lib/base-path';
import Link from 'next/link';

type Tab = 'dashboard' | 'applications' | 'agents' | 'workflows' | 'tools' | 'scorers' | 'rag';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clientId, setClientId] = useState<string | undefined>();
  const [scopes, setScopes] = useState<string[]>([]);

  useEffect(() => {
    getAdminHeaders()
      .then((headers: any) => {
        const auth = headers?.Authorization || '';
        if (auth.startsWith('Bearer ')) {
          setClientId(process.env.ADMIN_CLIENT_ID || 'admin-client');
          const rawScopes =
            process.env.ADMIN_CLIENT_SCOPES ||
            'admin.read admin.write client.read client.write rag.read rag.write';
          setScopes(rawScopes.split(/\s+/).filter(Boolean));
        }
      })
      .catch(() => {
        setClientId(process.env.ADMIN_CLIENT_ID || 'admin-client');
      });
  }, []);

  const scopeText = useMemo(() => (scopes.length ? scopes.join(', ') : 'admin client'), [scopes]);

  const tabs = [
    { 
      id: 'dashboard' as Tab, 
      label: 'Dashboard', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      description: 'Overview and analytics' 
    },
    { 
      id: 'applications' as Tab, 
      label: 'Applications', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ), 
      description: 'Application collections & access' 
    },
    { 
      id: 'agents' as Tab, 
      label: 'Agents', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ), 
      description: 'AI agent definitions' 
    },
    { 
      id: 'workflows' as Tab, 
      label: 'Workflows', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ), 
      description: 'Automation workflows' 
    },
    { 
      id: 'tools' as Tab, 
      label: 'Tools', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ), 
      description: 'Custom tool functions' 
    },
    { 
      id: 'scorers' as Tab, 
      label: 'Scorers', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      description: 'Evaluation & scoring metrics' 
    },
    { 
      id: 'rag' as Tab, 
      label: 'Knowledge', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ), 
      description: 'RAG databases & documents' 
    },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'applications':
        return <ApplicationManagement />;
      case 'agents':
        return <AgentManagement />;
      case 'workflows':
        return <WorkflowManagement />;
      case 'tools':
        return <ToolManagement />;
      case 'scorers':
        return <ScorerManagement />;
      case 'rag':
        return <RAGManagement />;
      default:
        return <Dashboard />;
    }
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed left-0 z-40 w-64 bg-white/90 backdrop-blur-xl border-r border-gray-200/50 shadow-xl transition-transform duration-300 top-14 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo & Brand */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Mastra Admin</h1>
              <p className="text-xs text-gray-500">Agent Management</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className={`transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'scale-110' : ''}`}>
                {tab.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${activeTab === tab.id ? 'text-blue-700' : ''}`}>
                  {tab.label}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {tab.description}
                </p>
              </div>
              {activeTab === tab.id && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </nav>

        {/* Status Footer */}
        <div className="px-4 py-4 border-t border-gray-200/50">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>System Online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Page toolbar */}
        <div className="bg-white/80 backdrop-blur border-b border-gray-200/60 shadow-sm sticky top-14 z-30">
          <div className="flex items-center justify-between h-14 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  {activeTabData?.icon}
                  <span>{activeTabData?.label}</span>
                </h2>
                <p className="text-sm text-gray-500">{activeTabData?.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/weather"
                className="bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm flex items-center space-x-2"
              >
                <span className="text-sm">🌤️</span>
                <span>Weather Demo</span>
              </Link>
              <Link
                href="/simulator"
                className="bg-indigo-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm flex items-center space-x-2"
              >
                <span className="text-sm">🎭</span>
                <span>Client Simulator</span>
              </Link>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">
                  {clientId ? clientId.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                    {clientId || 'Agent Client'}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[220px]">{scopeText}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content with Animation */}
        <main className="p-6 pt-4">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderActiveTab()}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 lg:hidden top-14"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
