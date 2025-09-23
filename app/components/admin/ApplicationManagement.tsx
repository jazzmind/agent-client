'use client';

import { useState, useEffect } from 'react';

interface Application {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  components?: ApplicationComponent[];
  clientPermissions?: ApplicationClientPermission[];
}

interface ApplicationComponent {
  id: string;
  application_id: string;
  component_type: 'agent' | 'workflow' | 'tool' | 'rag_database';
  component_id: string;
  component_name: string;
  scopes: string[];
  created_at: string;
}

interface ApplicationClientPermission {
  id: string;
  client_id: string;
  application_id: string;
  component_scopes: string[];
  granted_by?: string;
  created_at: string;
  updated_at: string;
}

interface Client {
  serverId: string;
  name: string;
  scopes: string[];
  createdAt: string;
  registeredBy: string;
}

const COMPONENT_TYPES = [
  { 
    value: 'agent', 
    label: 'Agent', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
  { 
    value: 'workflow', 
    label: 'Workflow', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  { 
    value: 'tool', 
    label: 'Tool', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  { 
    value: 'rag_database', 
    label: 'RAG Database', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    )
  }
];

const SCOPES_BY_COMPONENT_TYPE = {
  agent: ['agent.read', 'agent.write', 'agent.execute'],
  workflow: ['workflow.read', 'workflow.write', 'workflow.execute'],
  tool: ['tool.read', 'tool.write', 'tool.execute'],
  rag_database: ['rag.read', 'rag.write', 'rag.search']
};

const ALL_SCOPES = [
  ...SCOPES_BY_COMPONENT_TYPE.agent,
  ...SCOPES_BY_COMPONENT_TYPE.workflow,
  ...SCOPES_BY_COMPONENT_TYPE.tool,
  ...SCOPES_BY_COMPONENT_TYPE.rag_database,
  'admin.read', 'admin.write'
];

export default function ApplicationManagement() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'components' | 'clients' | 'testing'>('overview');

  // Navigation handler for component clicks
  const handleComponentNavigation = (componentType: string, componentId: string) => {
    // Create URL based on component type
    const routeMap = {
      'agent': '/admin/agents',
      'workflow': '/admin/workflows', 
      'tool': '/admin/tools',
      'rag_database': '/admin/rag'
    };
    
    const baseRoute = routeMap[componentType as keyof typeof routeMap];
    if (baseRoute) {
      // Navigate to the component with the specific ID in a way that the management component can handle
      // For now, we'll use window.location but this could be enhanced with proper router
      window.location.href = `${baseRoute}?component=${encodeURIComponent(componentId)}`;
    }
  };

  // Form states
  const [newApplication, setNewApplication] = useState({
    name: '',
    display_name: '',
    description: ''
  });

  const [newComponent, setNewComponent] = useState({
    component_type: 'agent' as const,
    component_id: '',
    component_name: '',
    scopes: [] as string[]
  });
  
  const [availableComponents, setAvailableComponents] = useState<{
    id: string;
    name: string;
    display_name: string;
    component_type: string;
  }[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);

  const [newPermission, setNewPermission] = useState({
    client_id: '',
    component_scopes: [] as string[]
  });

  useEffect(() => {
    fetchApplications();
    fetchClients();
  }, []);

  // Fetch available components when component type changes
  useEffect(() => {
    if (showComponentModal) {
      fetchAvailableComponents(newComponent.component_type);
    }
  }, [showComponentModal, newComponent.component_type]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/applications');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch applications');
      }
      
      const data = await response.json();
      setApplications(data.applications || []);
      setError(null);
    } catch (error: any) {
      setError(error.message);
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch clients');
      }
      
      const data = await response.json();
      setClients(data.servers || []);
    } catch (error: any) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchApplicationDetails = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch application details');
      }
      
      const data = await response.json();
      setSelectedApplication(data.application);
    } catch (error: any) {
      setError(error.message);
      console.error('Failed to fetch application details:', error);
    }
  };

  const fetchAvailableComponents = async (componentType?: string) => {
    setLoadingComponents(true);
    try {
      const queryString = componentType ? `?type=${encodeURIComponent(componentType)}` : '';
      const response = await fetch(`/api/admin/components/available${queryString}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch available components');
      }
      
      const data = await response.json();
      setAvailableComponents(data.components || []);
    } catch (error: any) {
      console.error('Failed to fetch available components:', error);
      setAvailableComponents([]);
    } finally {
      setLoadingComponents(false);
    }
  };

  const createApplication = async () => {
    try {
      const response = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newApplication),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create application');
      }

      setNewApplication({ name: '', display_name: '', description: '' });
      setShowCreateModal(false);
      await fetchApplications();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const deleteApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application? This will remove all associated components and permissions.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete application');
      }

      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(null);
      }
      await fetchApplications();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleComponentSelection = (componentId: string) => {
    const selectedComponent = availableComponents.find(c => c.id === componentId);
    if (selectedComponent) {
      setNewComponent(prev => ({
        ...prev,
        component_id: selectedComponent.name,
        component_name: selectedComponent.display_name,
        scopes: [] // Reset scopes when component changes
      }));
    }
  };

  const getAvailableScopes = (componentType: string) => {
    return SCOPES_BY_COMPONENT_TYPE[componentType as keyof typeof SCOPES_BY_COMPONENT_TYPE] || [];
  };

  const addComponent = async () => {
    if (!selectedApplication) return;

    try {
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}/components`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newComponent),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add component');
      }

      setNewComponent({
        component_type: 'agent',
        component_id: '',
        component_name: '',
        scopes: []
      });
      setShowComponentModal(false);
      await fetchApplicationDetails(selectedApplication.id);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const grantPermission = async () => {
    if (!selectedApplication) return;

    try {
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPermission),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to grant permission');
      }

      setNewPermission({
        client_id: '',
        component_scopes: []
      });
      setShowPermissionModal(false);
      await fetchApplicationDetails(selectedApplication.id);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleScopeToggle = (scope: string, currentScopes: string[], setter: (scopes: string[]) => void) => {
    if (currentScopes.includes(scope)) {
      setter(currentScopes.filter(s => s !== scope));
    } else {
      setter([...currentScopes, scope]);
    }
  };

  const ApplicationCard = ({ application }: { application: Application }) => (
    <div
      onClick={() => fetchApplicationDetails(application.id)}
      className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200/50 group hover:scale-[1.02]"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {application.display_name}
            </h3>
            <p className="text-sm text-gray-500">{application.name}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteApplication(application.id);
          }}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      {application.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{application.description}</p>
      )}
      
      <div className="text-sm text-gray-500">
        <span>Created {new Date(application.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );

  if (selectedApplication) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedApplication(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedApplication.display_name}</h2>
                <p className="text-sm text-gray-500">{selectedApplication.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {activeDetailTab === 'components' && (
                <button
                  onClick={() => setShowComponentModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Add Component
                </button>
              )}
              {activeDetailTab === 'clients' && (
                <button
                  onClick={() => setShowPermissionModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Grant Permission
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-4">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { 
                  id: 'overview', 
                  label: 'Overview', 
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )
                },
                { 
                  id: 'components', 
                  label: 'Components', 
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  )
                },
                { 
                  id: 'clients', 
                  label: 'Clients', 
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  )
                },
                { 
                  id: 'testing', 
                  label: 'Testing', 
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id as any)}
                  className={`${
                    activeDetailTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {selectedApplication.description && activeDetailTab === 'overview' && (
            <div className="p-6 border-b border-gray-200/50">
              <p className="text-gray-700">{selectedApplication.description}</p>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeDetailTab === 'overview' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
            <div className="p-6 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">Application Overview</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Components</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedApplication.components?.length || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Clients</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedApplication.clientPermissions?.length || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-9 4h10M5 11h14l-1 7a1 1 0 01-1 1H7a1 1 0 01-1-1l-1-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="text-lg font-bold text-gray-900">{new Date(selectedApplication.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              {selectedApplication.description && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedApplication.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeDetailTab === 'components' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
            <div className="p-6 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">Application Components</h3>
            </div>
          <div className="p-6">
            {selectedApplication.components && selectedApplication.components.length > 0 ? (
              <div className="space-y-3">
                {selectedApplication.components.map((component) => {
                  const typeInfo = COMPONENT_TYPES.find(t => t.value === component.component_type);
                  return (
                    <div 
                      key={component.id} 
                      onClick={() => handleComponentNavigation(component.component_type, component.component_id)}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center text-gray-600 group-hover:text-blue-600 transition-colors">
                          {typeInfo?.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{component.component_name}</p>
                          <p className="text-sm text-gray-500">{typeInfo?.label} • {component.component_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-wrap gap-1">
                          {component.scopes.map((scope) => (
                            <span
                              key={scope}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No components added yet. Click "Add Component" to get started.
              </div>
            )}
          </div>
          </div>
        )}

        {activeDetailTab === 'clients' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
            <div className="p-6 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">Client Permissions</h3>
            </div>
          <div className="p-6">
            {selectedApplication.clientPermissions && selectedApplication.clientPermissions.length > 0 ? (
              <div className="space-y-3">
                {selectedApplication.clientPermissions.map((permission) => {
                  const client = clients.find(c => c.serverId === permission.client_id);
                  return (
                    <div key={permission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{client?.name || permission.client_id}</p>
                        <p className="text-sm text-gray-500">Client ID: {permission.client_id}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {permission.component_scopes.map((scope) => (
                          <span
                            key={scope}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No client permissions granted yet. Click "Grant Permission" to assign access.
              </div>
            )}
          </div>
          </div>
        )}

        {activeDetailTab === 'testing' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
            <div className="p-6 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">Application Testing</h3>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Test Application Access</span>
                </h4>
                <p className="text-gray-600 mb-4">
                  Select a client to test their access to this application's components. This will open a new window where you can interact with agents, run workflows, and test permissions.
                </p>
                
                {selectedApplication.clientPermissions && selectedApplication.clientPermissions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedApplication.clientPermissions.map((permission) => {
                      const client = clients.find(c => c.serverId === permission.client_id);
                      return (
                        <div key={permission.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{client?.name || permission.client_id}</p>
                              <p className="text-sm text-gray-500">
                                {permission.component_scopes.length} scope{permission.component_scopes.length !== 1 ? 's' : ''}: {permission.component_scopes.join(', ')}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              // This will open a testing interface for this client and application
                              const url = `/test/${selectedApplication.name}?client=${permission.client_id}`;
                              window.open(url, '_blank');
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            Test Access
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-4">No clients have access to this application yet.</p>
                    <button
                      onClick={() => {
                        setActiveDetailTab('clients');
                        setShowPermissionModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Grant Client Access
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Component Modal */}
        {showComponentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Component</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Component Type</label>
                  <select
                    value={newComponent.component_type}
                    onChange={(e) => setNewComponent(prev => ({ 
                      ...prev, 
                      component_type: e.target.value as any,
                      component_id: '',
                      component_name: '',
                      scopes: [] // Reset scopes when type changes
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {COMPONENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Component</label>
                  <select
                    value={availableComponents.find(c => c.name === newComponent.component_id)?.id || ''}
                    onChange={(e) => handleComponentSelection(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    disabled={loadingComponents}
                  >
                    <option value="">
                      {loadingComponents ? 'Loading components...' : 'Select a component'}
                    </option>
                    {availableComponents
                      .filter(c => c.component_type === newComponent.component_type)
                      .map((component) => (
                        <option key={component.id} value={component.id}>
                          {component.display_name} ({component.name})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Component Name</label>
                  <input
                    type="text"
                    value={newComponent.component_name}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                    placeholder="Auto-populated from selection"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Required Scopes</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {getAvailableScopes(newComponent.component_type).map(scope => (
                      <label key={scope} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newComponent.scopes.includes(scope)}
                          onChange={() => handleScopeToggle(scope, newComponent.scopes, 
                            (scopes) => setNewComponent(prev => ({ ...prev, scopes })))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{scope}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={addComponent}
                  disabled={!newComponent.component_id || !newComponent.component_name}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Add Component
                </button>
                <button
                  onClick={() => setShowComponentModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grant Permission Modal */}
        {showPermissionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Grant Client Permission</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select
                    value={newPermission.client_id}
                    onChange={(e) => setNewPermission(prev => ({ ...prev, client_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select a client...</option>
                    {clients.map(client => (
                      <option key={client.serverId} value={client.serverId}>
                        {client.name} ({client.serverId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Component Scopes</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {ALL_SCOPES.map(scope => (
                      <label key={scope} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPermission.component_scopes.includes(scope)}
                          onChange={() => handleScopeToggle(scope, newPermission.component_scopes, 
                            (scopes) => setNewPermission(prev => ({ ...prev, component_scopes: scopes })))}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{scope}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={grantPermission}
                  disabled={!newPermission.client_id || newPermission.component_scopes.length === 0}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Grant Permission
                </button>
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Applications</h1>
          <p className="text-base-content/60">Manage application collections and client access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create Application</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Applications Grid */}
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
      ) : applications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📦</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-600 mb-4">Create your first application to group agents, workflows, and tools.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Create Application
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}

      {/* Create Application Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Application</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Name</label>
                <input
                  type="text"
                  value={newApplication.name}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., weather-app"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newApplication.display_name}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, display_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Weather Application"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={newApplication.description}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Describe what this application does..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={createApplication}
                disabled={!newApplication.name || !newApplication.display_name}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Create Application
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
